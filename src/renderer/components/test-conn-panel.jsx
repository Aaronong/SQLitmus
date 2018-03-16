import React from 'react';

function TestConnPanel(connPoolInfo, onSetConnValue, onAddConn, onRemoveConn) {
  const connPoolDisplay = connPoolInfo.map((connVal, index) => (
    <div className="pair-label-switch-container" key={index}>
      <div style={{ margin: '10px' }}>{`Connection Pool Max Size ${index}: `}</div>
      <input
        type="number"
        style={{ position: 'relative', top: '10px' }}
        className="pt-input pt-numeric-input"
        onChange={e => onSetConnValue(index, Number(e.target.value))}
        value={connVal}
      />
      <button
        className="pt-button pt-icon-cross pt-minimal pt-intent-danger"
        onClick={() => onRemoveConn(index)}
      />
    </div>
  ));
  return (
    <div className="query-container">
      <h4>
        The software will measure the speed of your database at these various connection pool
        configuarations.
      </h4>
      {connPoolDisplay}
      {connPoolInfo.length === 5 ? (
        <div />
      ) : (
        <button
          className="pt-button pt-icon-plus pt-minimal pt-intent-primary"
          onClick={() => onAddConn()}
        >
          Add Connection
        </button>
      )}
    </div>
  );
}

export default TestConnPanel;
