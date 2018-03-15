import cloneDeep from 'lodash.clonedeep';
import Sequelize from 'sequelize';
import { tableRelations } from '../test-tables-to-cards.jsx';
import generateData from './generate-data.js';
import populateData from './populate-data.js';

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

async function runTest(server, schemaInfo, rowInfo, queries, connInfo) {
  const sortedSchema = sortSchemaInfo(schemaInfo);
  const numTests = rowInfo[0][1].length;
  const maxPoolSize = Math.max(connInfo);
  const sequelize = createSequelizeConnection(server, maxPoolSize);

  for (let testNum = 0; testNum < numTests; testNum++) {
    const data = await generateData(sortedSchema, rowInfo, testNum);
    // const data = null;
    populateData(sortedSchema, sequelize, data);
  }
  //   console.log('ROW INFO');
  //   console.log(rowInfo);
  //   console.log('QUERIES');
  //   console.log(queries);
  //   console.log('CONN INFO');
  //   console.log(connInfo);
}

export default runTest;
