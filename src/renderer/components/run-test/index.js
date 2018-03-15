import cloneDeep from 'lodash.clonedeep';
import { tableRelations } from '../test-tables-to-cards.jsx';
import generateData from './generate-data.js';

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

async function runTest(schemaInfo, rowInfo, queries, connInfo) {
  const sortedSchema = sortSchemaInfo(schemaInfo);
  console.log('SORTED SCHEMA INFO');
  console.log(sortedSchema);
  const numTests = rowInfo[0][1].length;

  for (let testNum = 0; testNum < numTests; testNum++) {
    await generateData(sortedSchema, rowInfo, testNum);
    // populateData(sortedSchema);
  }
  //   console.log('ROW INFO');
  //   console.log(rowInfo);
  //   console.log('QUERIES');
  //   console.log(queries);
  //   console.log('CONN INFO');
  //   console.log(connInfo);
}

export default runTest;
