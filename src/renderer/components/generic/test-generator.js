import bs from 'binarysearch';

function testGenerator(generator, nullable, nullRate) {
  const results = [];
  for (let i = 0; i < 10; i++) {
    results.push(testOnce(generator, nullable, nullRate));
  }
  return { ...generator, testResults: results };
}

function testOnce(generator, nullable, nullRate) {
  const output = generator.func(Math.random(), generator.inputs);
  if (nullable) {
    return Math.random() < nullRate ? null : output;
  }
  return output;
}

function testOnceRNG(generator, nullable, nullRate, RNG) {
  const output = generator.func(RNG.nextNumber(), generator.inputs);
  if (nullable) {
    return RNG.nextNumber() < nullRate ? null : output;
  }
  return output;
}

function generateNumVals(field, numToGen, RNG, uniq) {
  const results = [];
  let unique = uniq;
  if (
    field.dataType.includes('bool') ||
    field.dataType.includes('tiny') ||
    field.dataType.includes('time')
  ) {
    unique = false;
  }
  if (unique) {
    let numWastedTries = 0;
    let reachedThreshold = false;
    // We switch this to false after we generated a single null value
    let nullable = field.nullable;
    const charDict = {};
    while (results.length < numToGen) {
      if (reachedThreshold) {
        // Character type
        if (field.dataType.includes('char')) {
          const output = testOnceRNG(field.generator, nullable, field.nullRate, RNG);
          let charCount = charDict[output];
          if (charCount) {
            charDict[output] = charCount + 1;
          } else {
            charCount = 1;
            charDict[output] = charCount + 1;
          }
          bs.insert(results, `${output}-${charCount}`);
          // results.push(`${output}-${charCount}`);
        }
        // Numeric type
        if (
          field.dataType.includes('int') ||
          field.dataType.includes('numeric') ||
          field.dataType.includes('decimal')
        ) {
          // We use RNG to generate numeric instead
          let output = RNG.nextNumber() * Number.MAX_SAFE_INTEGER;
          if (field.dataType.includes('int')) {
            output = Math.round(output);
          }
          if (bs(results, output) === -1) {
            bs.insert(results, output);
          }
        }
      } else {
        const output = testOnceRNG(field.generator, nullable, field.nullRate, RNG);
        if (output === null) {
          nullable = false;
        }
        const isUniqOutput = bs(results, output) === -1;
        // const isUniqOutput = results.findIndex(elem => elem === output) === -1;
        if (isUniqOutput) {
          bs.insert(results, output);
          // results.push(output);
        } else {
          numWastedTries += 1;
        }
        if (numWastedTries >= 1000) {
          reachedThreshold = true;
        }
      }
    }
  } else {
    for (let i = 0; i < numToGen; i++) {
      // Not unique, no need for sorted array
      results.push(testOnceRNG(field.generator, field.nullable, field.nullRate, RNG));
    }
  }
  return results;
}

export { testGenerator, testOnce, generateNumVals };
