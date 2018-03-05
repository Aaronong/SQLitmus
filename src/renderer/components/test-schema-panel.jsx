import React, { Component, PropTypes } from 'react';
import vis from 'vis';
require('./test-schema-panel.css');
// require('../../../node_modules/vis/dist/vis');

function tablesToCards(tables) {
  if (!tables) {
    return <div />;
  }
  console.log(Object.entries(tables));
  return Object.entries(tables).map(([key, value]) => (
    <div className="pt-card pt-elevation-1" style={{ margin: '10px' }}>
      <h4>
        <b>{key}</b>
      </h4>
      <hr />
      <div className="content">
        {value.map(field => (
          <div>
            {field.name}---{field.dataType}
          </div>
        ))}
      </div>
    </div>
  ));
}

class TestSchemaPanel extends Component {
  static propTypes = {
    tables: PropTypes.object.isRequired,
    columns: PropTypes.object.isRequired,
    dbName: PropTypes.string.isRequired,
  };

  constructor(props, context) {
    super(props, context);
    this.state = {
      // {from:[tableName, fieldName], to: [tableName, fieldName]}
      foreignKeyMap: [],
    };
  }

  render() {
    const { tables, columns, dbName } = this.props;
    const tableInfo = columns.columnsByTable[dbName];
    // console.log(columns.columnsByTable[dbName]);
    // if (columns.columnsByTable[dbName]) {
    //   Object.entries(columns.columnsByTable[dbName]).forEach(([key, value]) => console.log(key));
    // }

    return (
      <div className="schema-panel-container">
        <div className="schema-table-slider">{tablesToCards(tableInfo)}</div>
      </div>
    );
  }
}

export default TestSchemaPanel;
