import cloneDeep from 'lodash.clonedeep';
import { testOnce, testOnceRNG } from './test-generator.js';
const SETUP_DELIMITER = '-- SETUPDELIMITER --';

const generateTemplateString = (function() {
  const cache = {};

  function generateTemplate(template) {
    let fn = cache[template];

    if (!fn) {
      // Replace ${expressions} (etc) with ${map.expressions}.

      const sanitized = template
        .replace(/\$\{([\s]*[^;\s\{]+[\s]*)\}/g, (_, match) => `\$\{map.${match.trim()}\}`)
        // Afterwards, replace anything that's not ${map.expressions}' (etc) with a blank string.
        .replace(/(\$\{(?!map\.)[^}]+\})/g, '');
      fn = Function('map', `return \`${sanitized}\``);
    }

    return fn;
  }

  return generateTemplate;
})();

function generateContext(schemaInfo, numRows, queryRNG) {
  const cloneSchema = cloneDeep(schemaInfo);
  const generatedValues = {};
  cloneSchema.forEach(([key, value]) => {
    generatedValues[key] = {};
    value.forEach(field => {
      if (field.generator.func) {
        let result;
        if (queryRNG) {
          result = testOnceRNG(field.generator, field.nullable, field.nullRate, queryRNG);
        } else {
          result = testOnce(field.generator, field.nullable, field.nullRate);
        }
        if (typeof result === 'string') {
          result = `'${result}'`;
        }
        generatedValues[key][field.name] = result;
      }
    });
    if (numRows) {
      generatedValues[key].NUMROWS = numRows.find(item => item[0] === key)[1];
      generatedValues[key].RANDROW = Math.ceil(
        generatedValues[key].NUMROWS * queryRNG.nextNumber()
      );
    } else {
      generatedValues[key].NUMROWS = 10;
      generatedValues[key].RANDROW = Math.ceil(Math.random() * 10);
    }
  });
  generatedValues.SETUP = { DELIMITER: SETUP_DELIMITER };
  generatedValues.BEGIN = { DELIMITER: SETUP_DELIMITER };
  generatedValues.END = { DELIMITER: SETUP_DELIMITER };
  return generatedValues;
}

function parseQuery(query, schemaInfo) {
  if (!schemaInfo) {
    return query;
  }
  const queryTemplate = generateTemplateString(query);
  const generatedValues = generateContext(schemaInfo, null);
  return queryTemplate(generatedValues);
}

function parseQueryList(queries, schemaInfo, numRows, queryRNG) {
  if (!schemaInfo) {
    return queries;
  }
  const generatedValues = generateContext(schemaInfo, numRows, queryRNG);
  return queries.map(query => {
    const queryTemplate = generateTemplateString(query);
    return queryTemplate(generatedValues);
  });
}

export { parseQuery, parseQueryList, SETUP_DELIMITER };
