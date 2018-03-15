import { APP_DATA_PATH, QUERY_RESULTS_PATH, getPersistentStore } from './persistant-storage.js';
import MacPackager from 'electron-builder/out/macPackager';

const dbData = getPersistentStore(`${APP_DATA_PATH}/db`);
const testData = getPersistentStore(`${APP_DATA_PATH}/test`);

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
  console.log(`testing query - ${query}`);
  for (let j = 0; j < 5; j++) {
    const TimeStart = Date.now();
    let Command;
    for (let i = 0; i < 10; i++) {
      await sequelize.query(query).spread((results, metadata) => {
        Command = metadata.command;
      });
    }
    const TimeEnd = Date.now();
    const TimeTaken = TimeEnd - TimeStart;
    queryStore.insert({ ...record, Command, TimeTaken });
  }
}

async function runQueries(TestId, sequelize, queryList, connInfo, currRowInfo) {
  const genericRecord = {
    TestId,
    ...postfixObjName(currRowInfo, '-Rows'),
    TotalRows: sumVals(currRowInfo),
  };
  const queryStore = await getPersistentStore(`${QUERY_RESULTS_PATH}/${TestId}`);
  const promises = connInfo.map(MaxConnPool => {
    sequelize.config.pool.max = MaxConnPool;
    return Promise.all(
      queryList.map(Query => {
        const specificRecord = { Query, MaxConnPool, ...genericRecord };
        return testQuery(sequelize, Query, TestId, specificRecord, queryStore);
      })
    );
  });
  await Promise.all(promises);
}

export default runQueries;
