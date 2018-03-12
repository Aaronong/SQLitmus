import React from 'react';
import { Table } from 'react-bootstrap';
import { tableRelations } from './test-tables-to-cards.jsx';

function fill5(arr) {
  const out = [null, null, null, null, null];
  arr.forEach((item, index) => {
    out[index] = item;
  });
  return out;
}

function createHeaders(index, numTests, onAddRow, onRemoveRow) {
  if (index === numTests) {
    return (
      <button className="pt-button pt-icon-plus pt-minimal pt-intent-primary" onClick={onAddRow}>
        Add Test
      </button>
    );
  } else if (index < numTests) {
    return (
      <div>
        {`Test ${index + 1}`}
        {numTests === 1 ? (
          <div />
        ) : (
          <button
            className="pt-button pt-icon-cross pt-minimal pt-intent-danger"
            onClick={() => onRemoveRow(index)}
          />
        )}
      </div>
    );
  }
  return <div />;
}

function TestSchemaPanel(schemaInfo, rowInfo, onSetRowItem, onAddRow, onRemoveRow) {
  if (!schemaInfo) {
    return <div>ROW PANEL</div>;
  }
  //   const relations = tableRelations(schemaInfo);
  //   console.log(relations);
  const numTests = rowInfo[0][1].length;
  const headerDisplay = Array.apply(null, Array(5)).map((item, index) => (
    <th key={index}>{createHeaders(index, numTests, onAddRow, onRemoveRow)}</th>
  ));
  const rowDisplay = rowInfo.map(([key, value], tIndex) => (
    <tr key={key}>
      <th>{key}</th>
      {fill5(value).map((rowCount, rIndex) => (
        <td key={rIndex}>
          {rowCount === null ? (
            <div />
          ) : (
            <input
              type="number"
              className="pt-input pt-numeric-input"
              onChange={e => onSetRowItem(tIndex, rIndex, e.target.value)}
              value={rowCount}
            />
          )}
        </td>
      ))}
    </tr>
  ));
  return (
    <Table striped bordered condensed style={{ tableLayout: 'fixed' }}>
      <thead>
        <tr>
          <th />
          {headerDisplay}
        </tr>
      </thead>
      <tbody>{rowDisplay}</tbody>
    </Table>
  );
}

export default TestSchemaPanel;
