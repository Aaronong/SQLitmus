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

async function testQuery(sequelize, queryObj, TestId, record, queryStore) {
  const TemplateName = queryObj[0];
  const query = queryObj[1];
  const setup = query.split(SETUP_DELIMITER);
  let testedQuery = query;
  if (setup.length > 1) {
    // [?setup, test, ?setup]
    testedQuery = setup[1];
  }
  // console.log(`testing query - ${testedQuery}`);
  let Command = null;
  if (setup.length > 1) {
    // First chunk is setup, speed not recorded
    const chunk1 = setup[0].split(';');
    for (let k = 0; k < chunk1.length; k++) {
      if (chunk1[k].trim() !== '') {
        await sequelize.query(chunk1[k]).catch(err => {
          console.log(err);
        });
      }
    }
  }
  const chunk2 = testedQuery.split(';');
  const TimeStart = Date.now();
  for (let k = 0; k < chunk2.length; k++) {
    if (chunk2[k].trim() !== '') {
      await sequelize
        .query(chunk2[k])
        .spread((results, metadata) => {
          console.log(metadata);
          if (metadata && metadata.command) {
            Command = metadata.command;
          }
        })
        .catch(err => {
          console.log(err);
        });
    }
  }
  const TimeEnd = Date.now();
  const TimeTaken = Math.round(TimeEnd - TimeStart);
  if (setup.length > 2) {
    // Last chunk is reset, speed not recorded
    const chunk3 = setup[2].split(';');
    for (let k = 0; k < chunk3.length; k++) {
      if (chunk3[k].trim() !== '') {
        await sequelize.query(chunk3[k]).catch(err => {
          console.log(err);
        });
      }
    }
  }

  return queryStore.insert({ ...record, TemplateName, TimeTaken, Query: testedQuery });
}

async function runQueries(TestId, server, queryList, connInfo, currRowInfo, queryRNG) {
  const genericRecord = {
    TestId,
    ...postfixObjName(currRowInfo, '-Rows'),
    TotalRows: sumVals(currRowInfo),
  };
  const queryStore = await getPersistentStore(`${QUERY_RESULTS_PATH}/${TestId}`);
  for (let i = 0; i < connInfo.length; i++) {
    const MaxConnPool = connInfo[i];
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
    // for (let j = 0; j < queryList.length; j++) {
    //   const Query = queryList[j];
    //   const specificRecord = { MaxConnPool, ...genericRecord };
    //   await testQuery(sequelize, Query, TestId, specificRecord, queryStore);
    // }
  }
}

export default runQueries;
