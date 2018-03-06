import React, { Component, PropTypes } from 'react';
import vis from 'vis';
require('./test-schema-panel.css');
// require('../../../node_modules/vis/dist/vis');

function tablesToCards(tables) {
  if (!tables) {
    return <div />;
  }
  return tables.map(([key, value]) => (
    <div key={key} className="pt-card pt-elevation-1" style={{ margin: '10px' }}>
      <h4>
        <b>{key}</b>
      </h4>
      <hr />
      <div className="content">
        {value.map(field => (
          <div key={field.name}>
            {field.name}---{field.dataType}
          </div>
        ))}
      </div>
    </div>
  ));
}

class TestSchemaPanel extends Component {
  static propTypes = {
    schemaInfo: PropTypes.array,
    onSetField: PropTypes.func.isRequired,
  };

  constructor(props, context) {
    super(props, context);
    this.state = {
      // {from:[tableName, fieldName], to: [tableName, fieldName]}
      foreignKeyMap: [],
    };
  }

  render() {
    const { schemaInfo } = this.props;

    return (
      <div className="schema-panel-container">
        <div className="schema-table-slider">{tablesToCards(schemaInfo)}</div>
      </div>
    );
  }
}

export default TestSchemaPanel;
