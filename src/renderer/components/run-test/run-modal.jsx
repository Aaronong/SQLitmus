import React, { Component, PropTypes } from 'react';
import { Modal, Table } from 'react-bootstrap';
import runTest from './index.js';

function logToRows(log) {
  return log.map((entry, index) => (
    <tr key={index}>
      <td>{entry[0]}</td>
      <td>{entry[1]}</td>
      <td>{entry[2]}</td>
    </tr>
  ));
}

class RunModal extends Component {
  static propTypes = {
    server: PropTypes.object.isRequired,
    schemaInfo: PropTypes.array,
    rowInfo: PropTypes.array,
    queries: PropTypes.object.isRequired,
    connInfo: PropTypes.array.isRequired,
    handleClose: PropTypes.func.isRequired,
    isTesting: PropTypes.bool.isRequired,
    message: PropTypes.string.isRequired,
    percentage: PropTypes.number.isRequired,
    trialNum: PropTypes.number.isRequired,
    log: PropTypes.array.isRequired,
    setIsTesting: PropTypes.func.isRequired,
    setMessage: PropTypes.func.isRequired,
    setPercentage: PropTypes.func.isRequired,
    setTrialNum: PropTypes.func.isRequired,
  };

  constructor(props, context) {
    super(props, context);
    // runTest(server, schemaInfo, rowInfo, queries, connInfo)

    this.state = {
      testName: '',
      testDetails: '',
      dataSeed: 1025138,
      querySeed: 3948034,
      isLogOpen: false,
    };
  }

  setTestName(testName) {
    this.setState({ testName });
  }

  setTestDetails(testDetails) {
    this.setState({ testDetails });
  }

  setDataSeed(dataSeed) {
    this.setState({ dataSeed });
  }

  setQuerySeed(querySeed) {
    this.setState({ querySeed });
  }

  toggleLog() {
    this.setState({ isLogOpen: !this.state.isLogOpen });
  }

  render() {
    const {
      server,
      schemaInfo,
      rowInfo,
      queries,
      connInfo,
      handleClose,
      isTesting,
      message,
      percentage,
      log,
      trialNum,
      setIsTesting,
      setMessage,
      setPercentage,
      setTrialNum,
    } = this.props;
    const { testName, testDetails, dataSeed, querySeed, isLogOpen } = this.state;
    // const isTesting = localStorage.getItem('isTesting');
    // const progressPercentage = localStorage.getItem('progressPercentage');
    // const progressMessage = localStorage.getItem('progressMessage');
    return (
      <div>
        <Modal.Header closeButton>
          <Modal.Title>RUN TEST</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div style={{ overflowY: 'auto' }}>
            <div className="pair-label-switch-container">
              <div>
                <label className="pt-label">
                  Test Name
                  <span className="pt-text-muted">(required)</span>
                  <input
                    type="text"
                    style={{ marginRight: '13px' }}
                    className="pt-input"
                    onChange={e => ::this.setTestName(e.target.value)}
                    value={testName}
                    disabled={isTesting}
                  />
                </label>
              </div>
              <div>
                <label className="pt-label">
                  Test Details
                  <span className="pt-text-muted">(required)</span>
                  <textarea
                    type="text"
                    style={{ marginRight: '13px' }}
                    className="pt-input"
                    onChange={e => ::this.setTestDetails(e.target.value)}
                    value={testDetails}
                    disabled={isTesting}
                  />
                </label>
              </div>
              <div>
                <label className="pt-label">
                  Data Generation Seed
                  <input
                    type="number"
                    style={{ marginRight: '13px' }}
                    className="pt-input pt-numeric-input"
                    onChange={e => ::this.setDataSeed(Math.round(e.target.value))}
                    value={dataSeed}
                    disabled={isTesting}
                  />
                </label>
              </div>
              <div>
                <label className="pt-label">
                  Query Generation Seed
                  <input
                    type="number"
                    style={{ marginRight: '13px' }}
                    className="pt-input pt-numeric-input"
                    onChange={e => ::this.setQuerySeed(Math.round(e.target.value))}
                    value={querySeed}
                    disabled={isTesting}
                  />
                </label>
              </div>
            </div>
            <div>
              <div style={{ width: '100%', textAlign: 'center' }}>
                {percentage > 0 ? `${percentage}%` : 'Test has not started'}
              </div>
              <div className="pt-progress-bar">
                <div className="pt-progress-meter" style={{ width: `${percentage}%` }} />
              </div>
              <div>{percentage > 0 ? `Test ${trialNum}: ${message}` : ''}</div>
            </div>
            <button type="button" className="pt-button" onClick={::this.toggleLog}>
              {isLogOpen ? 'Hide Log' : 'Show Log'}
            </button>
            {!isLogOpen ? (
              <div />
            ) : (
              <Table striped bordered condensed>
                <thead>
                  <tr>
                    <th>Message</th>
                    <th>Percentage</th>
                    <th>Time Elapsed</th>
                  </tr>
                </thead>
                <tbody>{logToRows(log)}</tbody>
              </Table>
            )}
          </div>
        </Modal.Body>
        <Modal.Footer>
          <button
            type="button"
            className="pt-button pt-intent-primary"
            onClick={() => {
              setIsTesting(true);
              runTest(
                [testName, testDetails, Date.now()],
                server,
                schemaInfo,
                rowInfo,
                queries,
                connInfo,
                dataSeed,
                querySeed,
                setIsTesting,
                setMessage,
                setPercentage,
                setTrialNum
              );
            }}
            disabled={isTesting}
          >
            Run Test
          </button>

          <button type="button" className="pt-button" onClick={handleClose}>
            Close
          </button>
        </Modal.Footer>
      </div>
    );
  }
}

export default RunModal;
