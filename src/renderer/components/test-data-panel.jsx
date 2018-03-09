import React, { Component, PropTypes } from 'react';
import { tablesToCards, tableRelations } from './test-tables-to-cards.jsx';
import NumericConfig, { numericOptions } from './numeric/index.jsx';
require('./test-schema-panel.css');

const DEFAULT_GENERATOR = { name: '', func: null, inputs: [], testResults: [] };

function typesToOptions(typeList) {
  return typeList.map(typ => (
    <option key={typ} value={typ}>
      {typ}
    </option>
  ));
}

function testGenerator(generator) {
  const results = [];
  for (let i = 0; i < 10; i++) {
    results.push(generator.func(Math.random(), generator.inputs));
  }
  return { ...generator, testResults: results };
}

function dataConfig(schemaInfo, onSetField, tableIndex, fieldIndex) {
  if (!schemaInfo) {
    return <div />;
  }
  const configuredField = schemaInfo[tableIndex][1][fieldIndex];
  const supportedTypes = ['integer', 'character', 'timestamp', 'numeric', 'json', 'boolean'];
  let currentType = supportedTypes.find(typ => configuredField.dataType.includes(typ))
    ? configuredField.dataType
    : configuredField.configuredType;
  //   const relations = tableRelations(schemaInfo);
  //   const currentTarget =
  //     configuredField.foreignTarget === null ? 'null' : JSON.stringify(configuredField.foreignTarget);
  return (
    <div key={JSON.stringify([tableIndex, fieldIndex])}>
      <h2>{`${schemaInfo[tableIndex][0]}.${configuredField.name}`}</h2>

      {supportedTypes.find(typ => configuredField.dataType.includes(typ)) ? (
        <div />
      ) : (
        <div className="pt-select" style={{ marginBottom: '5px' }}>
          <select
            defaultValue={currentType}
            onChange={e => onSetField(tableIndex, fieldIndex, 'configuredType', e.target.value)}
          >
            <option value="">Select Data Type...</option>
            {typesToOptions(supportedTypes)}
          </select>
        </div>
      )}

      <div />

      {currentType === '' ? (
        <div />
      ) : (
        <div key={currentType} className="pt-select" style={{ marginBottom: '5px' }}>
          <select
            defaultValue={configuredField.generator.name}
            onChange={e =>
              onSetField(tableIndex, fieldIndex, 'generator', {
                ...DEFAULT_GENERATOR,
                name: e.target.value,
              })
            }
          >
            <option value="">Select Data Generator...</option>
            {typesToOptions(numericOptions)}
          </select>
        </div>
      )}
      {configuredField.generator.name === '' ? (
        <div />
      ) : (
        <div>
          <NumericConfig
            schemaInfo={schemaInfo}
            onSetField={onSetField}
            generatorName={configuredField.generator.name}
            tableIndex={tableIndex}
            fieldIndex={fieldIndex}
            isInteger={currentType.includes('integer')}
          />
          {!configuredField.generator.func ? (
            <div />
          ) : (
            <button
              type="button"
              className="pt-button pt-icon-add"
              onClick={() =>
                onSetField(
                  tableIndex,
                  fieldIndex,
                  'generator',
                  testGenerator(configuredField.generator)
                )
              }
            >
              Test Generator
            </button>
          )}
          <div>{JSON.stringify(configuredField.generator.testResults)}</div>
        </div>
      )}
    </div>
  );
}

class TestDataPanel extends Component {
  static propTypes = {
    schemaInfo: PropTypes.array,
    onSetField: PropTypes.func.isRequired,
  };

  constructor(props, context) {
    super(props, context);
    this.state = {
      activeTableIndex: 0,
      activeFieldIndex: 0,
    };
  }

  setTableAndField(activeTableIndex, activeFieldIndex) {
    this.setState({ activeTableIndex, activeFieldIndex });
  }

  render() {
    const { schemaInfo, onSetField } = this.props;
    const { activeFieldIndex, activeTableIndex } = this.state;

    return (
      <div className="schema-panel-container">
        <div className="schema-table-slider">
          {tablesToCards(schemaInfo, activeTableIndex, activeFieldIndex, ::this.setTableAndField)}
        </div>
        <div className="schema-table-config">
          {dataConfig(schemaInfo, onSetField, activeTableIndex, activeFieldIndex)}
        </div>
      </div>
    );
  }
}

export default TestDataPanel;
