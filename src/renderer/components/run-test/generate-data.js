import Random from 'rng.js';
import shuffle from 'shuffle-array';
import { generateNumVals } from '../generic/test-generator.js';
import { getMemoryStore } from './persistant-storage.js';
let START_TIME = new Date().getTime();
let END_TIME = new Date().getTime();

// Persisting extensionData to a datastore with automatic loading
const db = {};

function unique(arr) {
  let uniq = arr.map(item => JSON.stringify(item));
  uniq = [...new Set(uniq)];
  return uniq.map(item => JSON.parse(item));
}

function cartesianProduct(arr) {
  return arr.reduce(
    (a, b) => a.map(x => b.map(y => x.concat(y))).reduce((c, d) => c.concat(d), []),
    [[]]
  );
}

function flattenCartesianProduct(arr) {
  return cartesianProduct(arr).map(product =>
    product.reduce((obj, item) => Object.assign(obj, item), {})
  );
}

function spawnRNG(parentRNG) {
  const lowSeed = Math.round(parentRNG.nextNumber() * Number.MAX_SAFE_INTEGER);
  const highSeed = Math.round(parentRNG.nextNumber() * Number.MAX_SAFE_INTEGER);
  // For good statistical properties, lowSeed must be odd
  return new Random(lowSeed % 2 ? lowSeed : lowSeed + 1, highSeed);
}

async function generateIndexes(tableName, indexFields, numRows) {
  if (indexFields.length === 0) {
    return;
  }
  // Update a record for each row we are required to generate
  for (let i = 0; i < numRows; i++) {
    const setObj = {};
    indexFields.forEach(field => {
      setObj[field.name] = i + 1;
    });
    await new Promise((resolve, reject) => {
      db[tableName].update({ _id: i + 1 }, { $set: setObj }, {}, (err, numReplaced) =>
        resolve(numReplaced)
      );
    });
  }
}

// output: [[coFK1,coFK2], [FK3], [coFK4,coFK5], ...]
function groupFKs(fkFields) {
  const groups = {};
  fkFields.forEach(field => {
    if (groups[field.foreignTarget[0]]) {
      groups[field.foreignTarget[0]] = [...groups[field.foreignTarget[0]], field];
    } else {
      groups[field.foreignTarget[0]] = [field];
    }
  });
  return Object.entries(groups).map(([k, v]) => v);
}

async function generateSingularFK(field, numRows, fieldRNG, tableName) {
  const results = [];
  const targetTable = field.foreignTarget[0];
  const targetField = field.foreignTarget[1];
  const retrievedRecords = await new Promise((resolve, reject) => {
    // Find all documents in the collection
    db[targetTable].find({}, (err, docs) => {
      if (err) {
        reject(err);
      }
      resolve(docs);
    });
  });

  for (let i = 0; i < numRows; i++) {
    // Sample - constraint, if one-to-one, and not nullable,
    //  targetNum must be greater or equals to sourceNum
    if (retrievedRecords.length === 0 && field.nullable) {
      results.push(null);
      continue;
    }
    if (retrievedRecords.length === 0 && !field.nullable) {
      const errorMsg = `${tableName}.${
        field.name
      } is a one-to-one and non-nullable foreign key. Thus, there must be more ${targetTable} rows as compared to ${tableName} rows.`;
      throw errorMsg;
    }
    if (field.nullable && field.nullRate && fieldRNG.nextNumber() < field.nullRate) {
      results.push(null);
    } else {
      const selectedIndex = Math.floor(fieldRNG.nextNumber() * retrievedRecords.length);
      results.push(retrievedRecords[selectedIndex][targetField]);

      if (!field.manyToOne) {
        // Remove from sample
        results.splice(selectedIndex, 1);
      }
    }
  }
  return results;
}

async function generateCompositeFK(fields, numRows, fieldRNG, tableName) {
  const results = [];
  const targetTable = fields[0].foreignTarget[0];
  const targetFields = fields.map(field => field.foreignTarget[1]);
  // check if all fields have the same manyToOne value
  if (!fields.reduce((a, b) => (a.manyToOne === b.manyToOne ? a : NaN))) {
    const errorMsg = `Check that fields in ${tableName} pointing towards ${targetTable} all have the same manyToOne value`;
    throw errorMsg;
  }
  // check if all fields have the same nullable value
  if (!fields.reduce((a, b) => (a.nullable === b.nullable ? a : NaN))) {
    const errorMsg = `Check that fields in ${tableName} pointing towards ${targetTable} all have the same nullable value`;
    throw errorMsg;
  }
  // check if all fields have the same nullRate
  if (!fields.reduce((a, b) => (a.nullRate === b.nullRate ? a : NaN))) {
    const errorMsg = `Check that fields in ${tableName} pointing towards ${targetTable} all have the same nullRate`;
    throw errorMsg;
  }
  const manyToOne = fields[0].manyToOne;
  const nullable = fields[0].nullable;
  const nullRate = fields[0].nullRate;
  const retrievedRecords = await new Promise((resolve, reject) => {
    // Find all documents in the collection
    db[targetTable].find({}, (err, docs) => {
      if (err) {
        reject(err);
      }
      resolve(docs);
    });
  });

  for (let i = 0; i < numRows; i++) {
    // Sample - constraint, if one-to-one, and not nullable,
    //  targetNum must be greater or equals to sourceNum
    if (retrievedRecords.length === 0 && nullable) {
      const setObj = {};
      for (let j = 0; j < fields.length; j++) {
        setObj[fields[j].name] = null;
      }
      results.push(setObj);
      continue;
    }
    if (retrievedRecords.length === 0 && !nullable) {
      const errorMsg = `${tableName} has a composite foreign key addressing ${targetTable}. 
      Since the composite foreign key is one-to-one and non-nullable, 
      there must be more ${targetTable} rows as compared to ${tableName} rows.`;
      throw errorMsg;
    }
    if (nullable && nullRate && fieldRNG.nextNumber() < nullRate) {
      const setObj = {};
      for (let j = 0; j < fields.length; j++) {
        setObj[fields[j].name] = null;
      }
      results.push(setObj);
    } else {
      const selectedIndex =
        Math.floor(fieldRNG.nextNumber() * Number.MAX_SAFE_INTEGER) % retrievedRecords.length;
      const selectedRecord = retrievedRecords[selectedIndex];
      const setObj = {};
      for (let j = 0; j < fields.length; j++) {
        setObj[fields[j].name] = selectedRecord[targetFields[j]];
      }
      results.push(setObj);

      if (!manyToOne) {
        // Remove from sample
        retrievedRecords.splice(selectedIndex, 1);
      }
    }
  }
  return results;
}

async function generateFKs(tableName, fkFields, numRows, fieldRNG) {
  if (fkFields.length === 0) {
    return;
  }
  // Deal with composite FKs
  if (fkFields.length > 1) {
    // Group foreign keys by the table they reference
    const groups = groupFKs(fkFields);
    for (let j = 0; j < groups.length; j++) {
      const fkGroup = groups[j];
      // Split groups up into composites or non-composites
      if (fkGroup.length === 1) {
        const field = fkGroup[0];
        const results = await Promise.resolve(
          generateSingularFK(field, numRows, fieldRNG, tableName)
        );
        for (let i = 0; i < numRows; i++) {
          const setObj = {};
          setObj[field.name] = results[i];
          await new Promise((resolve, reject) => {
            db[tableName].update({ _id: i + 1 }, { $set: setObj }, {}, (err, numReplaced) =>
              resolve(numReplaced)
            );
          });
        }
      } else {
        const results = await Promise.resolve(
          generateCompositeFK(fkGroup, numRows, fieldRNG, tableName)
        );
        for (let i = 0; i < numRows; i++) {
          await new Promise((resolve, reject) => {
            db[tableName].update({ _id: i + 1 }, { $set: results[i] }, {}, (err, numReplaced) =>
              resolve(numReplaced)
            );
          });
        }
      }
    }
  } else {
    const field = fkFields[0];
    const results = await Promise.resolve(generateSingularFK(field, numRows, fieldRNG, tableName));
    for (let i = 0; i < numRows; i++) {
      const setObj = {};
      setObj[field.name] = results[i];
      await new Promise((resolve, reject) => {
        db[tableName].update({ _id: i + 1 }, { $set: setObj }, {}, (err, numReplaced) =>
          resolve(numReplaced)
        );
      });
    }
  }
}

async function generatePKs(tableName, pkFields, numRows, fieldRNG) {
  if (pkFields.length === 0) {
    return;
  }
  // Deal with composite PKs
  if (pkFields.length > 1) {
    console.log(`${tableName} has a composite PK`);
    let startTime = new Date().getTime();
    const fkFields = pkFields.filter(field => field.fk && field.foreignTarget);
    const pkRemainder = pkFields.filter(field => !(field.fk && field.foreignTarget));
    // Group foreign keys by the table they reference
    let groups = groupFKs(fkFields);
    // if groups.length is 1, we have a composite PK comprised of one composite FK
    if (groups.length === 1) {
      console.log(`${tableName} has a composite PK of one group`);
      const results = await Promise.resolve(
        generateCompositeFK(groups[0], numRows, fieldRNG, tableName)
      );
      for (let i = 0; i < numRows; i++) {
        await new Promise((resolve, reject) => {
          db[tableName].update({ _id: i + 1 }, { $set: results[i] }, {}, (err, numReplaced) =>
            resolve(numReplaced)
          );
        });
      }
      return;
    }
    // for field in fkFields set to manyToOne - gets rid of conflict - make uniq ltr
    fkFields.forEach((field, fIndex) => (fkFields[fIndex].manyToOne = true));
    // we group again on updated fkFields
    groups = groupFKs(fkFields);
    const sortedResults = [];
    const genRows = Math.round(Math.sqrt(numRows)) * 2;
    console.log(`${tableName} has a composite PK of many groups`);
    for (let j = 0; j < groups.length; j++) {
      const fkGroup = groups[j];
      // Split groups up into composites or non-composites
      if (fkGroup.length === 1) {
        const field = fkGroup[0];
        const dupResults = await Promise.resolve(
          generateSingularFK(field, genRows, fieldRNG, tableName)
        );
        const results = unique(dupResults);
        console.log(`${tableName} has a composite PK with singular FK ${field.name}`);
        const tmp = [];
        for (let i = 0; i < results.length; i++) {
          const setObj = {};
          setObj[field.name] = results[i];
          tmp.push(setObj);
        }
        sortedResults.push([field.name, tmp]);
      } else {
        const dupResults = await Promise.resolve(
          generateCompositeFK(fkGroup, genRows, fieldRNG, tableName)
        );
        const results = unique(dupResults);
        console.log(
          `${tableName} has a composite PK with composite FK ${fkGroup[0].name} and ${
            fkGroup[1].name
          }`
        );
        // save results under the name of the first field in the group
        sortedResults.push([fkGroup[0].name, results]);
      }
    }

    pkRemainder.forEach(field => {
      const results = unique(generateNumVals(field, genRows, fieldRNG, false));
      const tmp = [];
      for (let i = 0; i < results.length; i++) {
        const setObj = {};
        setObj[field.name] = results[i];
        tmp.push(setObj);
      }
      sortedResults.push([field.name, tmp]);
    });
    let endTime = new Date().getTime();
    console.log(sortedResults);
    console.log(`Composite Key part 1: Generate genRows took ${endTime - startTime} miliseconds`);

    startTime = new Date().getTime();

    // Sort in descending
    sortedResults.sort((a, b) => b[1].length - a[1].length);
    // The first n tries we sort in decending order and generate unique values
    // The second n tries we sort in ascending order and generate non-unique values
    const tries = sortedResults.length * 2;
    for (let tryNum = 0; tryNum < tries; tryNum++) {
      const genNum = tryNum % sortedResults.length;
      // Sort in ascending
      if (tryNum === sortedResults.length) {
        sortedResults.sort((a, b) => a[1].length - b[1].length);
      }
      const combinations = sortedResults.reduce((sum, num) => num[1].length * sum, 1);
      console.log(`Num combinations = ${combinations}`);
      if (combinations >= numRows) {
        break;
      }
      let fieldToRegen = pkRemainder.find(field => field.name === sortedResults[genNum][0]);
      if (fieldToRegen) {
        let rowsToGen = numRows;
        if (tryNum >= sortedResults.length) {
          rowsToGen = Math.ceil(numRows / (combinations / sortedResults[1].length));
        }
        const uniqueness = tryNum >= sortedResults.length;
        const results = unique(generateNumVals(fieldToRegen, rowsToGen, fieldRNG, uniqueness));
        console.log(`Trial ${genNum} =  ${results}`);
        const tmp = [];
        for (let i = 0; i < results.length; i++) {
          const setObj = {};
          setObj[fieldToRegen.name] = results[i];
          tmp.push(setObj);
        }
        sortedResults[genNum][1] = tmp;
      } else {
        fieldToRegen = groups.find(fkGroup => fkGroup[0].name === sortedResults[genNum][0]);
        // Split groups up into composites or non-composites
        if (fieldToRegen.length === 1) {
          const field = fieldToRegen[0];
          const dupResults = await Promise.resolve(
            generateSingularFK(field, numRows, fieldRNG, tableName)
          );
          const results = unique(dupResults);
          const tmp = [];
          for (let i = 0; i < results.length; i++) {
            const setObj = {};
            setObj[field.name] = results[i];
            tmp.push(setObj);
          }
          sortedResults[genNum][1] = tmp;
        } else {
          const dupResults = await Promise.resolve(
            generateCompositeFK(fieldToRegen, numRows, fieldRNG, tableName)
          );
          const results = unique(dupResults);
          // save results under the name of the first field in the group
          sortedResults[genNum][1] = results;
        }
      }
    }
    endTime = new Date().getTime();
    console.log(
      `Composite Key part 2: Ensuring sufficient combinations took ${endTime -
        startTime} miliseconds`
    );

    startTime = new Date().getTime();
    // Here we have gotten the max amounts of combinations. Just generate cartesian products
    const combinations = flattenCartesianProduct(sortedResults.map(([k, v]) => v));
    endTime = new Date().getTime();
    console.log(
      `Composite Key part 3: Generating combinations took ${endTime - startTime} miliseconds`
    );

    startTime = new Date().getTime();
    shuffle(combinations, { rng: fieldRNG.nextNumber });
    console.log(`Combs = ${combinations.length}   numRows = ${numRows}`);
    if (combinations.length < numRows) {
      const errorMsg = `${tableName} has a primary key constraint that it is unable to fulfill.`;
      throw errorMsg;
    }
    for (let i = 0; i < numRows; i++) {
      await new Promise((resolve, reject) => {
        db[tableName].update({ _id: i + 1 }, { $set: combinations[i] }, {}, (err, numReplaced) =>
          resolve(numReplaced)
        );
      });
    }
    endTime = new Date().getTime();
    console.log(`Composite Key part 4: Shuffle and pick took ${endTime - startTime} miliseconds`);
  } else {
    const field = pkFields[0];
    if (field.fk) {
      const results = generateSingularFK(field, numRows, fieldRNG, tableName);
      for (let i = 0; i < numRows; i++) {
        const setObj = {};
        setObj[field.name] = results[i];
        await new Promise((resolve, reject) => {
          db[tableName].update({ _id: i + 1 }, { $set: setObj }, {}, (err, numReplaced) =>
            resolve(numReplaced)
          );
        });
      }
    } else {
      const results = generateNumVals(field, numRows, fieldRNG, true);
      shuffle(results, { rng: fieldRNG.nextNumber });
      for (let i = 0; i < numRows; i++) {
        const setObj = {};
        setObj[field.name] = results[i];
        await new Promise((resolve, reject) => {
          db[tableName].update({ _id: i + 1 }, { $set: setObj }, {}, (err, numReplaced) =>
            resolve(numReplaced)
          );
        });
      }
    }
  }
}

async function generateSelfReference(fields, numRows, fieldRNG, tableName) {
  for (let j = 0; j < fields.length; j++) {
    const field = fields[j];
    const sourceField = field.name;
    const targetField = field.foreignTarget[1];
    if (!field.manyToOne) {
      // THROW ERROR HERE
      const errorMsg = `${tableName}.${sourceField} self-references ${tableName}.${targetField}. Self referencing fields cannot have one to one relations.`;
      throw errorMsg;
    }
    const retrievedRecords = await new Promise((resolve, reject) => {
      // Find all documents in the collection
      db[tableName].find({}, (err, docs) => {
        if (err) {
          reject(err);
        }
        resolve(docs);
      });
    });
    for (let i = 0; i < numRows; i++) {
      if (field.nullable && field.nullRate && fieldRNG.nextNumber() < field.nullRate) {
        const setObj = {};
        setObj[sourceField] = null;
        await new Promise((resolve, reject) => {
          db[tableName].update({ _id: i + 1 }, { $set: { setObj } }, {}, (err, numReplaced) =>
            resolve(numReplaced)
          );
        });
      } else {
        const selectedIndex = Math.floor(fieldRNG.nextNumber() * i);
        const selectedRecord = retrievedRecords[selectedIndex];
        const setObj = {};
        setObj[sourceField] = selectedRecord[targetField];
        await new Promise((resolve, reject) => {
          db[tableName].update({ _id: i + 1 }, { $set: setObj }, {}, (err, numReplaced) =>
            resolve(numReplaced)
          );
        });
      }
    }
  }
}

async function generateTable(
  [tableName, fields],
  numRows,
  tableRNG,
  totalTasks,
  currentTasks,
  generateWeight,
  setMessage,
  setPercentage
) {
  setMessage(`Generating ${numRows} rows of ${tableName}`);
  db[tableName] = getMemoryStore();
  const totalFields = fields.length;
  let currTasks = currentTasks;
  // Insert a record for each row we are required to generate
  for (let i = 0; i < numRows; i++) {
    await new Promise((resolve, reject) => {
      db[tableName].insert({ _id: i + 1 }, (err, newDoc) => resolve(newDoc));
    });
  }
  // Filter out self referencing foreign keys
  const selfReferenceFields = fields.filter(
    field => field.fk && field.foreignTarget[0] === tableName
  );
  let filteredFields = fields.filter(field => !(field.fk && field.foreignTarget[0] === tableName));
  // Generate indexes
  const indexFields = filteredFields.filter(field => field.index);
  filteredFields = filteredFields.filter(field => !field.index);
  START_TIME = new Date().getTime();
  await generateIndexes(tableName, indexFields, numRows);
  END_TIME = new Date().getTime();
  setMessage(`Generating index rows for ${tableName} took ${END_TIME - START_TIME} miliseconds`);
  currTasks += numRows * generateWeight * indexFields.length / totalFields;
  setPercentage(currTasks / totalTasks);
  // if a PK element is found in index, we can skip processing PKs
  const skipPK = indexFields.findIndex(field => field.pk) !== -1;
  if (!skipPK) {
    // Generate Primary keys
    const pkFields = filteredFields.filter(field => field.pk);
    filteredFields = filteredFields.filter(field => !field.pk);
    START_TIME = new Date().getTime();
    await generatePKs(tableName, pkFields, numRows, spawnRNG(tableRNG));
    END_TIME = new Date().getTime();
    setMessage(
      `Generating Primary keys for ${tableName} took ${END_TIME - START_TIME} miliseconds`
    );
    currTasks += numRows * generateWeight * pkFields.length / totalFields;
    setPercentage(currTasks / totalTasks);
  }
  // Generate Foreign keys
  const fkFields = filteredFields.filter(field => field.fk && field.foreignTarget);
  filteredFields = filteredFields.filter(field => !(field.fk && field.foreignTarget));
  START_TIME = new Date().getTime();
  await generateFKs(tableName, fkFields, numRows, spawnRNG(tableRNG));
  END_TIME = new Date().getTime();
  setMessage(`Generating Foreign keys for ${tableName} took ${END_TIME - START_TIME} miliseconds`);
  currTasks += numRows * generateWeight * fkFields.length / totalFields;
  setPercentage(currTasks / totalTasks);
  // Generate remaining fields
  for (let j = 0; j < filteredFields.length; j++) {
    const field = filteredFields[j];
    START_TIME = new Date().getTime();
    let results = generateNumVals(field, numRows, spawnRNG(tableRNG), field.unique);
    if (field.unique === true && field.sorted === false) {
      results = shuffle(results, { rng: tableRNG.nextNumber });
    }
    if (field.sorted === true && field.unique === false) {
      results = results.sort();
    }
    for (let i = 0; i < numRows; i++) {
      const setObj = {};
      setObj[field.name] = results[i];
      await new Promise((resolve, reject) => {
        db[tableName].update({ _id: i + 1 }, { $set: setObj }, {}, (err, numReplaced) =>
          resolve(numReplaced)
        );
      });
    }
    END_TIME = new Date().getTime();
    setMessage(
      `Generating ${field.name} for ${tableName} took ${END_TIME - START_TIME} miliseconds`
    );
    currTasks += numRows * generateWeight / totalFields;
    setPercentage(currTasks / totalTasks);
  }
  // Generate self referencing fields
  if (selfReferenceFields.length > 0) {
    await generateSelfReference(selfReferenceFields, numRows, spawnRNG(tableRNG), tableName);
    setMessage(
      `Generating self-reference fields for ${tableName} took ${END_TIME - START_TIME} miliseconds`
    );
    currTasks += numRows * generateWeight * selfReferenceFields.length / totalFields;
    setPercentage(currTasks / totalTasks);
  }
}

async function generateData(
  schemaInfo,
  rowInfo,
  dataSeed,
  totalTasks,
  currentTasks,
  generateWeight,
  setMessage,
  setPercentage
) {
  const rootRNG = new Random(-23920393, dataSeed);
  let currTasks = currentTasks;
  for (let i = 0; i < schemaInfo.length; i++) {
    const table = schemaInfo[i];
    const tIndex = rowInfo.findIndex(row => row[0] === table[0]);
    await Promise.resolve(
      generateTable(
        table,
        rowInfo[tIndex][1],
        spawnRNG(rootRNG),
        totalTasks,
        currTasks,
        generateWeight,
        setMessage,
        setPercentage
      )
    );
    currTasks += rowInfo[tIndex][1] * generateWeight;
    setPercentage(currTasks / totalTasks);
  }
  return [db, currTasks];
}

export default generateData;
