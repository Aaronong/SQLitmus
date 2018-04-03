import shuffle from 'shuffle-array';
import Sequelize from 'sequelize';
import { QUERY_RESULTS_PATH, getPersistentStore } from './persistant-storage.js';
import { SETUP_DELIMITER } from '../generic/parse-query.js';

function postfixObjName(obj, postfix) {
  const retObj = {};
  Object.entries(obj).forEach(([id, [dbName, length]]) => {
    retObj[`${dbName}${postfix}`] = length;
  });
  return retObj;
}

function sumVals(obj) {
  let sum = 0;
  Object.entries(obj).forEach(([key, value]) => {
    sum += value[1];
  });
  return sum;
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

async function controlQuery(sequelize) {
  const timeStart = Date.now();
  await sequelize.query('Select 1;').catch(err => console.log(err));
  const timeEnd = Date.now();
  return timeEnd - timeStart;
}

async function testQuery(sequelize, queryObj, TestId, record, queryStore) {
  const TemplateName = queryObj[0];
  const query = queryObj[1];
  const setup = query.split(SETUP_DELIMITER);
  let testedQuery = query;
  if (setup.length > 1) {
    // [?setup, test, ?setup]
    testedQuery = setup[1];
  }
  if (setup.length > 1) {
    const chunk1 = setup[0].split(';');
    for (let k = 0; k < chunk1.length; k++) {
      if (chunk1[k].trim() !== '') {
        await sequelize.query(chunk1[k]).catch(() => console.log('err'));
      }
    }
  }
  // Setup a control test to eliminate network instability
  let controlTime = await controlQuery(sequelize);
  const chunk2 = testedQuery.split(';');
  const TimeStart = Date.now();
  for (let k = 0; k < chunk2.length; k++) {
    if (chunk2[k].trim() !== '') {
      // Empty catch statement to speed up query processing
      await sequelize.query(chunk2[k]).catch(() => console.log('err'));
    }
  }
  const TimeEnd = Date.now();
  controlTime = (controlTime + (await controlQuery(sequelize))) / 2;
  const TimeTaken = Math.round(TimeEnd - TimeStart - controlTime);
  if (setup.length > 2) {
    // Last chunk is reset, speed not recorded
    const chunk3 = setup[2].split(';');
    for (let k = 0; k < chunk3.length; k++) {
      if (chunk3[k].trim() !== '') {
        await sequelize.query(chunk3[k]).catch(() => console.log('err'));
      }
    }
  }

  return queryStore.insert({ ...record, TemplateName, TimeTaken, Query: testedQuery });
}

async function runQueries(
  TestId,
  server,
  queryList,
  connInfo,
  currRowInfo,
  queryRNG,
  totalTasks,
  currentTasks,
  queryWeight,
  setMessage,
  setPercentage
) {
  const genericRecord = {
    TestId,
    ...postfixObjName(currRowInfo, '-Rows'),
    TotalRows: sumVals(currRowInfo),
  };
  let currTasks = currentTasks;
  const queryStore = await getPersistentStore(`${QUERY_RESULTS_PATH}/${TestId}`);
  for (let i = 0; i < connInfo.length; i++) {
    const MaxConnPool = connInfo[i];
    setMessage(`Measuring database performance with Max Connection Pool = ${MaxConnPool}`);
    const sequelize = createSequelizeConnection(server, MaxConnPool);
    // sequelize.config.pool.max = MaxConnPool;
    await new Promise((resolve, reject) => {
      setTimeout(() => {
        resolve('Sleep for one second');
      }, 1000);
    });
    const specificRecord = { MaxConnPool, ...genericRecord };
    const queryPromises = shuffle(queryList, { rng: queryRNG.nextNumber }).map(Query => {
      return testQuery(sequelize, Query, TestId, specificRecord, queryStore);
    });
    await Promise.all(queryPromises);
    sequelize.close();
    currTasks += queryList.length * queryWeight;
    setPercentage(currTasks / totalTasks);
  }
  // We re-calibrate each query ran in the particular test
  const retrievedRecords = await new Promise((resolve, reject) => {
    // Find all documents in the collection
    queryStore.find({ TotalRows: sumVals(currRowInfo) }, (err, docs) => {
      if (err) {
        reject(err);
      }
      resolve(docs);
    });
  });
  let minTime = 0;
  for (let i = 0; i < retrievedRecords.length; i++) {
    if (retrievedRecords[i].TimeTaken < minTime) {
      minTime = retrievedRecords[i].TimeTaken;
    }
  }
  await new Promise((resolve, reject) => {
    // Find all documents with same max conn pool
    queryStore.update(
      { TotalRows: sumVals(currRowInfo) },
      { $inc: { TimeTaken: -minTime + 50 } },
      { multi: true },
      (err, docs) => {
        if (err) {
          reject(err);
        }
        resolve(docs);
      }
    );
  });
  return currTasks;
}

export default runQueries;
