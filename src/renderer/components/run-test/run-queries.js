import { QUERY_RESULTS_PATH, getPersistentStore } from './persistant-storage.js';
import { SETUP_DELIMITER } from '../generic/parse-query.js';
import Sequelize from 'sequelize';

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

async function testQuery(sequelize, query, TestId, record, queryStore) {
  const setup = query.split(SETUP_DELIMITER);
  let testedQuery = query;
  let TimeTaken = 0;
  if (setup.length > 1) {
    // [?setup, test, ?setup]
    testedQuery = setup[1];
  }
  // console.log(`testing query - ${testedQuery}`);
  let Command = null;
  for (let j = 0; j < 5; j++) {
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
    TimeTaken += TimeEnd - TimeStart;
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
  }
  TimeTaken = Math.round(TimeTaken / 5);
  queryStore.insert({ ...record, Command, TimeTaken, Query: testedQuery });
}

async function runQueries(TestId, sequelize, queryList, connInfo, currRowInfo) {
  const genericRecord = {
    TestId,
    ...postfixObjName(currRowInfo, '-Rows'),
    TotalRows: sumVals(currRowInfo),
  };
  const queryStore = await getPersistentStore(`${QUERY_RESULTS_PATH}/${TestId}`);
  for (let i = 0; i < connInfo.length; i++) {
    const MaxConnPool = connInfo[i];
    sequelize.config.pool.max = MaxConnPool;
    for (let k = 0; k < 3; k++) {
      for (let j = 0; j < queryList.length; j++) {
        const Query = queryList[j];
        const specificRecord = { MaxConnPool, ...genericRecord };
        await testQuery(sequelize, Query, TestId, specificRecord, queryStore);
      }
    }
  }
}

export default runQueries;
