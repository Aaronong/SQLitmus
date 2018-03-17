import { QUERY_RESULTS_PATH, getPersistentStore } from './persistant-storage.js';

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
    await sequelize.query(query).spread((results, metadata) => {
      Command = metadata.command;
    });
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
  for (let i = 0; i < connInfo.length; i++) {
    const MaxConnPool = connInfo[i];
    sequelize.config.pool.max = MaxConnPool;
    for (let j = 0; j < queryList.length; j++) {
      const Query = queryList[j];
      const specificRecord = { Query, MaxConnPool, ...genericRecord };
      await testQuery(sequelize, Query, TestId, specificRecord, queryStore);
    }
  }
}

export default runQueries;
