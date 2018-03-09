import React, { Component, PropTypes } from 'react';
import { Switch } from '@blueprintjs/core';
import { tablesToCards, tableRelations } from './test-tables-to-cards.jsx';
import vis from 'vis';
require('./test-schema-panel.css');
// require('../../../node_modules/vis/dist/vis');

function typesToOptions(typeList) {
  return typeList.map(typ => (
    <option key={typ} value={typ}>
      {typ}
    </option>
  ));
}

function targetsToOptions(schemaInfo, targets) {
  return targets.map(indexes => (
    <option key={JSON.stringify(indexes)} value={JSON.stringify(indexes)}>
      {schemaInfo[indexes[0]][0]}.{schemaInfo[indexes[0]][1][indexes[1]].name}
    </option>
  ));
}

function schemaConfig(schemaInfo, onSetField, onSelectField, tableIndex, fieldIndex) {
  if (!schemaInfo) {
    return <div />;
  }
  const configuredField = schemaInfo[tableIndex][1][fieldIndex];
  const supportedTypes = ['integer', 'character', 'timestamp', 'numeric', 'json', 'boolean'];
  let currentType = supportedTypes.find(typ => configuredField.dataType.includes(typ))
    ? configuredField.dataType
    : configuredField.configuredType;
  const relations = tableRelations(schemaInfo);
  // TODO
  const foreignKeyTargets = [];
  // Push current foreign target if it exists
  if (configuredField.foreignTarget) {
    foreignKeyTargets.push(configuredField.foreignTarget);
  }
  schemaInfo.forEach((table, tIndex) =>
    table[1].forEach((field, fIndex) => {
      if (
        field.dataType === configuredField.dataType && // FK can only target fields of same type
        tableIndex !== tIndex && // FK can only target fields in other tables
        (field.index || field.unique || field.pk) && // FK can only target unique keys
        !relations[tableIndex].find(relation => relation[1][0] === tIndex) // FK can only target fields it has no relations with
      ) {
        foreignKeyTargets.push([tIndex, fIndex]);
      }
    })
  );
  const currentTarget =
    configuredField.foreignTarget === null ? 'null' : JSON.stringify(configuredField.foreignTarget);
  const isKeyWorthy =
    currentType.includes('integer') ||
    currentType.includes('numeric') ||
    currentType.includes('character');
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

      {!currentType.includes('integer') ? (
        <div />
      ) : (
        <Switch
          checked={configuredField.index}
          label="is Index Key"
          onChange={() => onSetField(tableIndex, fieldIndex, 'index', !configuredField.index)}
        />
      )}

      {!isKeyWorthy ? (
        <div />
      ) : (
        <Switch
          checked={configuredField.pk}
          label="is Primary Key"
          onChange={() => onSetField(tableIndex, fieldIndex, 'pk', !configuredField.pk)}
        />
      )}

      {configuredField.index || configuredField.pk ? (
        <div />
      ) : (
        <Switch
          checked={configuredField.nullable}
          label="is Nullable"
          onChange={() => onSetField(tableIndex, fieldIndex, 'nullable', !configuredField.nullable)}
        />
      )}

      {configuredField.index || !isKeyWorthy ? (
        <div />
      ) : (
        <Switch
          checked={configuredField.fk}
          label="is Foreign Key"
          onChange={() => onSetField(tableIndex, fieldIndex, 'fk', !configuredField.fk)}
        />
      )}
      {configuredField.index || !configuredField.fk ? (
        <div />
      ) : (
        <div>
          <div className="pt-select" style={{ marginBottom: '5px' }}>
            <select
              defaultValue={currentTarget}
              onChange={e => onSelectField(tableIndex, fieldIndex, 'foreignTarget', e.target.value)}
            >
              <option value="null">Select Target Field...</option>
              {targetsToOptions(schemaInfo, foreignKeyTargets)}
            </select>
          </div>
          <div className="pair-label-switch-container">
            <div className="float-label-up">One-to-One</div>
            <Switch
              checked={configuredField.manyToOne}
              label="Many-to-One"
              onChange={() =>
                onSetField(tableIndex, fieldIndex, 'manyToOne', !configuredField.manyToOne)
              }
            />
          </div>
        </div>
      )}
      {configuredField.pk || configuredField.fk || !currentType.includes('character') ? (
        <div />
      ) : (
        <Switch
          checked={configuredField.unique}
          label="is Unique Key"
          onChange={() => onSetField(tableIndex, fieldIndex, 'unique', !configuredField.unique)}
        />
      )}
    </div>
  );
}

class TestSchemaPanel extends Component {
  static propTypes = {
    schemaInfo: PropTypes.array,
    onSetField: PropTypes.func.isRequired,
    onSelectField: PropTypes.func.isRequired,
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
    const { schemaInfo, onSetField, onSelectField } = this.props;
    const { activeFieldIndex, activeTableIndex } = this.state;

    return (
      <div className="schema-panel-container">
        <div className="schema-table-slider">
          {tablesToCards(schemaInfo, activeTableIndex, activeFieldIndex, ::this.setTableAndField)}
        </div>
        <div className="schema-table-config">
          {schemaConfig(schemaInfo, onSetField, onSelectField, activeTableIndex, activeFieldIndex)}
        </div>
      </div>
    );
  }
}

export default TestSchemaPanel;
