import cloneDeep from 'lodash.clonedeep';
import { booleanOptions, booleanGenerators } from '../boolean/index.jsx';
import { characterOptions, characterGenerators } from '../character/index.jsx';
import { jsonOptions, jsonGenerators } from '../json/index.jsx';
import { numericOptions, numericGenerators } from '../numeric/index.jsx';
import { timestampOptions, timestampGenerators } from '../timestamp/index.jsx';

const allOptions = [
  ...booleanOptions,
  ...characterOptions,
  ...jsonOptions,
  ...numericOptions,
  ...timestampOptions,
];
const allGenerators = [
  ...booleanGenerators,
  ...characterGenerators,
  ...jsonGenerators,
  ...numericGenerators,
  ...timestampGenerators,
];

function lengthenArray(arr, length) {
  let outArr = cloneDeep(arr);
  while (outArr.length < length) {
    outArr = [...outArr, outArr[outArr.length - 1]];
  }
  return outArr;
}

function localStoragePrefix(server) {
  return `${server.client}|>_<|${server.host}|>_<|${server.port}|>_<|${server.database}|>_<|`;
}

function storeSchemaInfo(schemaInfo, server) {
  const prefix = localStoragePrefix(server);
  const schema = cloneDeep(schemaInfo);
  schema.forEach(([tableName, value]) => {
    value.forEach(field => {
      if (field.foreignTarget !== null) {
        const targetTable = schema[field.foreignTarget[0]][0];
        const targetField = schema[field.foreignTarget[0]][1][field.foreignTarget[1]].name;
        field.foreignTarget = [targetTable, targetField];
      }
      localStorage.setItem(`${prefix}|>_<|${tableName}|>_<|${field.name}`, JSON.stringify(field));
    });
  });
}

function fillSchemaInfo(schemaInfo, server) {
  const prefix = localStoragePrefix(server);
  const schema = cloneDeep(schemaInfo);
  schema.forEach(([tableName, value], tIndex) => {
    value.forEach((field, fIndex) => {
      const retrievedField = JSON.parse(
        localStorage.getItem(`${prefix}|>_<|${tableName}|>_<|${field.name}`)
      );
      if (retrievedField && retrievedField.dataType === schema[tIndex][1][fIndex].dataType) {
        if (retrievedField.foreignTarget !== null) {
          const targetTableIndex = schema.findIndex(
            ([k, v]) => k === retrievedField.foreignTarget[0]
          );
          if (targetTableIndex !== -1) {
            const targetFields = schema[targetTableIndex][1];
            const targetFieldIndex = targetFields.findIndex(
              f => f.name === retrievedField.foreignTarget[1]
            );
            if (targetFieldIndex !== -1) {
              retrievedField.foreignTarget = [targetTableIndex, targetFieldIndex];
            } else {
              retrievedField.foreignTarget = null;
            }
          } else {
            retrievedField.foreignTarget = null;
          }
        }
        // REFRESH FUNCTIONS HERE
        if (retrievedField.generator.inputs !== null && retrievedField.generator.name !== '') {
          const nameIndex = allOptions.findIndex(
            option => option === retrievedField.generator.name
          );
          if (nameIndex !== -1) {
            retrievedField.generator.func = allGenerators[nameIndex];
          }
        }
        retrievedField.mappedType = schema[tIndex][1][fIndex].mappedType;
        schema[tIndex][1][fIndex] = retrievedField;
      }
    });
  });
  return schema;
}

function storeRowInfo(rowInfo, server) {
  const prefix = localStoragePrefix(server);
  rowInfo.forEach(([tableName, rows]) => {
    localStorage.setItem(`${prefix}|>_<|rowInfo|>_<|${tableName}`, JSON.stringify(rows));
  });
}

function fillRowInfo(rowInfo, server) {
  const prefix = localStoragePrefix(server);
  const clonedRow = cloneDeep(rowInfo);
  clonedRow.forEach(([tableName, rows], tIndex) => {
    const retrievedRow = JSON.parse(localStorage.getItem(`${prefix}|>_<|rowInfo|>_<|${tableName}`));
    if (retrievedRow !== null) {
      clonedRow[tIndex][1] = retrievedRow;
    }
  });
  const rowLengths = clonedRow.map(([tableName, rows]) => rows.length);
  const maxLength = Math.max(rowLengths);
  return clonedRow.map(([tableName, rows]) => [tableName, lengthenArray(rows, maxLength)]);
}

function storeConnInfo(connInfo, server) {
  const prefix = localStoragePrefix(server);
  localStorage.setItem(`${prefix}|>_<|connInfo`, JSON.stringify(connInfo));
}

function fillConnInfo(connInfo, server) {
  const prefix = localStoragePrefix(server);
  const retrievedConn = JSON.parse(localStorage.getItem(`${prefix}|>_<|connInfo`));
  return retrievedConn !== null ? retrievedConn : connInfo;
}

function storeQueryInfo(queryInfo, server) {
  const prefix = localStoragePrefix(server);
  const queryCopy = cloneDeep(queryInfo);
  const tmp = Object.entries(queryCopy.queriesById).map(([id, obj]) => [
    id,
    { ...obj, queryHistory: [], results: [] },
  ]);
  tmp.forEach(([id, obj]) => {
    queryCopy.queriesById[id] = obj;
  });
  localStorage.setItem(`${prefix}|>_<|queryInfo`, JSON.stringify(queryCopy));
}

function fillQueryInfo(queryInfo, server) {
  const prefix = localStoragePrefix(server);
  const retrievedQuery = JSON.parse(localStorage.getItem(`${prefix}|>_<|queryInfo`));
  retrievedQuery.currentQueryId = Math.min(...retrievedQuery.queryIds);
  return retrievedQuery !== null ? retrievedQuery : queryInfo;
}

export {
  localStoragePrefix,
  fillSchemaInfo,
  storeSchemaInfo,
  storeRowInfo,
  fillRowInfo,
  storeConnInfo,
  fillConnInfo,
  storeQueryInfo,
  fillQueryInfo,
};
