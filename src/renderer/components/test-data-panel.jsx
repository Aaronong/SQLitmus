import React, { Component, PropTypes } from 'react';
import { Switch } from '@blueprintjs/core';
import { tablesToCards, tableRelations } from './test-tables-to-cards.jsx';
require('./test-schema-panel.css');

function typesToOptions(typeList) {
  return typeList.map(typ => (
    <option key={typ} value={typ}>
      {typ}
    </option>
  ));
}

function dataConfig(schemaInfo, onSetField, tableIndex, fieldIndex) {
  if (!schemaInfo) {
    return <div />;
  }
  const configuredField = schemaInfo[tableIndex][1][fieldIndex];
  const supportedTypes = ['integer', 'character', 'timestamp', 'numeric', 'json', 'boolean'];
  const relations = tableRelations(schemaInfo);
  const currentTarget =
    configuredField.foreignTarget === null ? 'null' : JSON.stringify(configuredField.foreignTarget);
  return (
    <div>
      <h2>{`${schemaInfo[tableIndex][0]}.${configuredField.name}`}</h2>

      {supportedTypes.find(typ => configuredField.dataType.includes(typ)) ? (
        <div />
      ) : (
        <div className="pt-select" style={{ marginBottom: '5px' }}>
          <select
            //   defaultValue={currentTarget}
            onChange={e => console.log(e.target.value)}
          >
            <option value="null">Select Data Type...</option>
            {typesToOptions(supportedTypes)}
          </select>
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
