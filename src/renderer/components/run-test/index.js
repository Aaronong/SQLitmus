import Random from 'rng.js';
import cloneDeep from 'lodash.clonedeep';
import Sequelize from 'sequelize';
import { tableRelations } from '../test-tables-to-cards.jsx';
import generateData from './generate-data.js';
import populateData from './populate-data.js';
import runQueries from './run-queries.js';
import { APP_DATA_PATH, getPersistentStore } from './persistant-storage.js';
import { parseQueryList } from '../generic/parse-query';

const dbData = getPersistentStore(`${APP_DATA_PATH}/db`);
const testData = getPersistentStore(`${APP_DATA_PATH}/test`);

// Sorts schemaInfo according to the order of data generation
function sortSchemaInfo(schemaInfo) {
  if (schemaInfo) {
    const relations = tableRelations(schemaInfo);
    console.log(relations);
    const tableNames = schemaInfo.map(table => table[0]);
    const orderingRules = [];
    const sortedSchema = cloneDeep(schemaInfo);

    // Populate ordering rules
    relations.forEach((relationsOfTable, tIndex) => {
      relationsOfTable.forEach(([relType, relTarget]) => {
        if (relType === 'belongsTo') {
          orderingRules.push([tableNames[relTarget[0]], tableNames[tIndex]]);
        }
      });
    });

    // Transform foreign Key indexes to foreign Key names
    sortedSchema.forEach(([tableName, value], tIndex) => {
      value.forEach((field, fIndex) => {
        if (field.foreignTarget !== null) {
          const targetTable = sortedSchema[field.foreignTarget[0]][0];
          const targetField = sortedSchema[field.foreignTarget[0]][1][field.foreignTarget[1]].name;
          field.foreignTarget = [targetTable, targetField];
        }
        sortedSchema[tIndex][1][fIndex] = field;
      });
    });

    // Do the switcheroo
    let switchesMade = true;
    while (switchesMade) {
      switchesMade = false;
      orderingRules.forEach(([before, after]) => {
        const beforeIndex = sortedSchema.findIndex(table => table[0] === before);
        const afterIndex = sortedSchema.findIndex(table => table[0] === after);
        if (beforeIndex > afterIndex) {
          // Swap positions
          const tmp = sortedSchema[beforeIndex];
          sortedSchema[beforeIndex] = sortedSchema[afterIndex];
          sortedSchema[afterIndex] = tmp;
          switchesMade = true;
        }
      });
    }
    return sortedSchema;
  }
  return schemaInfo;
}

function createSequelizeConnection(s, maxPoolSize) {
  const client = s.client === 'postgresql' ? 'postgres' : s.client;
  const connString = `${client}://${s.user}:${s.password}@${s.host}:${s.port}/${s.database}`;
  console.log(connString);

  const sequelize = new Sequelize(connString, {
    pool: {
      max: maxPoolSize,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
  });
  sequelize
    .authenticate()
    .then(() => {
      console.log('Connection has been established successfully.');
    })
    .catch(err => {
      console.error('Unable to connect to the database:', err);
    });
  return sequelize;
}

async function runTest(
  testConfig,
  server,
  schemaInfo,
  rowInfo,
  queries,
  connInfo,
  dataSeed,
  querySeed
) {
  const TEST_START = new Date().getTime();
  const sortedSchema = sortSchemaInfo(schemaInfo);
  const numTests = rowInfo[0][1].length;
  const maxPoolSize = Math.max(connInfo);
  const queryRNG = new Random(0xf02385, querySeed);

  //   Perform upsert operation.
  //   Find if a record of the current database already exists, if not create
  const dbRecord = {
    client: server.client,
    host: server.host,
    port: server.port,
    database: server.database,
  };
  const dbId = await new Promise((resolve, reject) => {
    dbData.update(dbRecord, dbRecord, { upsert: true }, (err, numReplaced, upsert) => {
      if (err) {
        reject(err);
      }
      dbData.findOne(dbRecord, (err, doc) => resolve(doc._id));
    });
  });

  // Perform insert operation. Insert a record of the current test
  const testRecord = {
    dbId,
    testName: testConfig[0],
    testDetails: testConfig[1],
    testDate: testConfig[2],
  };
  const testId = await new Promise((resolve, reject) => {
    testData.insert(testRecord, err => {
      if (err) {
        reject(err);
      }
      testData.findOne(testRecord, (err, doc) => resolve(doc._id));
    });
  });

  const nameQueryMap = {};
  const rawQueryNames = Object.entries(queries.queriesById).map(qObj => qObj[1].name);
  let rawQueryList = Object.entries(queries.queriesById).map(qObj => qObj[1].query);
  rawQueryList = rawQueryList.map(q => q.replace(/\n/gi, ' '));
  for (let testNum = 0; testNum < numTests; testNum++) {
    const currRowInfo = rowInfo.map(([tName, rows]) => [tName, rows[testNum]]);
    // Generate list of queries we will use
    let queryList = [];
    for (let i = 0; i < 30; i++) {
      const generatedQueries = parseQueryList(rawQueryList, schemaInfo, currRowInfo, queryRNG);
      generatedQueries.forEach((genQ, i) => (nameQueryMap[genQ] = rawQueryNames[i]));
      queryList = [...queryList, ...generatedQueries];
    }
    queryList = [...new Set(queryList)];
    queryList = queryList.map(q => [nameQueryMap[q], q]);
    // Create sequelize connection

    const data = await generateData(sortedSchema, currRowInfo, dataSeed);
    const sequelize = createSequelizeConnection(server, maxPoolSize);
    await populateData(sortedSchema, sequelize, data, currRowInfo);
    sequelize.close();
    await runQueries(testId, server, queryList, connInfo, currRowInfo, queryRNG);
  }
  const TEST_END = new Date().getTime();
  console.log(`The test took ${TEST_END - TEST_START} miliseconds`);
}

export default runTest;
