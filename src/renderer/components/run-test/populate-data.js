function fieldVal(val, fIndex, length, type, dialect) {
  let value = val;

  if (typeof val === 'string') {
    value = `'${val}'`;
  } else if (type.includes('time')) {
    if (dialect === 'mysql') {
      if (val) {
        value = `FROM_UNIXTIME(${Math.round(val / 1000)})`;
      }
    } else if (dialect === 'postgres') {
      if (val) {
        value = `to_timestamp(${Math.round(val / 1000)})`;
      }
    }
  }
  if (!val && dialect === 'mysql') {
    value = 'null';
  }
  if (fIndex < length - 1) {
    return `${value},`;
  }
  return value;
}

function tableInDialect(tableName, dialect) {
  if (dialect === 'postgres') {
    return `"${tableName}"`;
  }
  return tableName;
}

async function resetTableStr(sequelize, tableStr, dialect, tableName, tableNum) {
  if (dialect === 'postgres') {
    await sequelize.query(`DELETE FROM ${tableStr}`).spread((results, metadata) => {
      console.log(metadata);
    });
    await sequelize
      .query(`ALTER SEQUENCE "${tableName}_id_seq" RESTART WITH ${tableNum + 1};`)
      .spread((results, metadata) => {
        console.log(metadata);
      });
  } else {
    await sequelize.query(`DELETE FROM ${tableStr}`).spread((results, metadata) => {
      console.log(metadata);
    });
    await sequelize
      .query(`ALTER TABLE ${tableStr} AUTO_INCREMENT = 0`)
      .spread((results, metadata) => {
        console.log(metadata);
      });
  }
}

function recordIntoBatches(records) {
  const batchSize = 5000;
  const batches = [];
  for (let i = 0; i < records.length; i += batchSize) {
    if (records.length - i < batchSize) {
      batches.push(records.slice(i));
    } else {
      batches.push(records.slice(i, i + batchSize));
    }
  }
  return batches;
}

async function populateData(sortedSchema, sequelize, db, currRowInfo) {
  console.log(sequelize);
  const dialect = sequelize.dialect.connectionManager.dialectName;
  // Truncate tables first
  for (let i = sortedSchema.length - 1; i >= 0; i--) {
    const tableName = sortedSchema[i][0];
    const tableNum = currRowInfo.find(row => row[0] === tableName)[1];
    console.log(tableName);
    const tableStr = tableInDialect(tableName, dialect);
    await resetTableStr(sequelize, tableStr, dialect, tableName, tableNum);
  }
  for (let i = 0; i < sortedSchema.length; i++) {
    const [tableName, fields] = sortedSchema[i];
    console.log(tableName);
    const fieldNames = fields.map(field => field.name);
    const fieldTypes = fields.map(field => field.mappedType);
    console.log(fieldNames);
    const tableStr = tableInDialect(tableName, dialect);

    const retrievedRecords = await new Promise((resolve, reject) => {
      // Find all documents in the collection
      db[tableName].find({}, (err, docs) => {
        if (err) {
          reject(err);
        }
        resolve(docs);
      });
    });
    const recordBatches = recordIntoBatches(retrievedRecords);
    for (let j = 0; j < recordBatches.length; j++) {
      const currBatch = recordBatches[j];
      let insertStr = `INSERT INTO ${tableStr} VALUES `;
      currBatch.forEach((record, rIndex) => {
        insertStr += '(';
        fieldNames.forEach(
          (name, fIndex) =>
            (insertStr += fieldVal(
              record[name],
              fIndex,
              fieldNames.length,
              fieldTypes[fIndex],
              dialect
            ))
        );
        if (rIndex < currBatch.length - 1) {
          insertStr += '),';
        } else {
          insertStr += ');';
        }
      });
      await sequelize.query(insertStr).spread((results, metadata) => {
        console.log(metadata);
        // Results will be an empty array and metadata will contain the number of affected rows.
      });
    }
  }
}

// POSTGRES
// SELECT * FROM "Admins"
// TRUNCATE "Admins" RESTART IDENTITY
// INSERT INTO "Admins" VALUES
//     (1, 'Bananas', 'Password', current_timestamp, current_timestamp),
// (2, 'Bananas2', 'Password', current_timestamp, current_timestamp),
// (3, 'Bananas3', 'Password', current_timestamp, current_timestamp);

// MYSQL
// SELECT * FROM Admins
// TRUNCATE Admins
// ALTER TABLE Admins AUTO_INCREMENT = 1
// INSERT INTO Admins
// VALUES (1, 'Bananas', 'Password', current_timestamp, current_timestamp),
// (2, 'Bananas2', 'Password', current_timestamp, current_timestamp),
// (3, 'Bananas3', 'Password', current_timestamp, current_timestamp);

export default populateData;
