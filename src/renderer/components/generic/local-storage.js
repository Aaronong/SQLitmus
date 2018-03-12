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
      if (retrievedField) {
        if (retrievedField.foreignTarget !== null) {
          const targetTableIndex = schema.findIndex(
            ([k, v]) => k === retrievedField.foreignTarget[0]
          );
          const targetFields = schema[targetTableIndex][1];
          const targetFieldIndex = targetFields.findIndex(
            f => f.name === retrievedField.foreignTarget[1]
          );
          if (targetTableIndex !== 1 && targetFieldIndex !== 1) {
            retrievedField.foreignTarget = [targetTableIndex, targetFieldIndex];
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
        schema[tIndex][1][fIndex] = retrievedField;
      }
    });
  });
  return schema;
}

export { localStoragePrefix, fillSchemaInfo, storeSchemaInfo };
