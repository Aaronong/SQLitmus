import cloneDeep from 'lodash.clonedeep';
import { testOnce } from './test-generator.js';

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

export default function parseQuery(query, schemaInfo) {
  if (!schemaInfo) {
    return query;
  }
  const cloneSchema = cloneDeep(schemaInfo);
  const queryTemplate = generateTemplateString(query);
  const generatedValues = {};
  cloneSchema.forEach(([key, value]) => {
    generatedValues[key] = {};
    value.forEach(field => {
      if (field.generator.func) {
        let result = testOnce(field.generator, field.nullable, field.nullRate);
        if (typeof result === 'string') {
          result = `'${result}'`;
        }
        generatedValues[key][field.name] = result;
      }
    });
  });
  // console.log(generatedValues);
  // console.log(queryTemplate(generatedValues));
  return queryTemplate(generatedValues);
}
