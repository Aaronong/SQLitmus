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

export { testGenerator, testOnce };
