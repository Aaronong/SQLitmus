import React, { Component, PropTypes } from 'react';
import { Modal } from 'react-bootstrap';
import runTest from './index.js';

class RunModal extends Component {
  static propTypes = {
    server: PropTypes.object.isRequired,
    schemaInfo: PropTypes.array,
    rowInfo: PropTypes.array,
    queries: PropTypes.object.isRequired,
    connInfo: PropTypes.array.isRequired,
    handleClose: PropTypes.func.isRequired,
  };

  constructor(props, context) {
    super(props, context);
    // runTest(server, schemaInfo, rowInfo, queries, connInfo)

    this.state = {
      testName: '',
      testDetails: '',
      dataSeed: 1025138,
      querySeed: 3948034,
    };
  }

  setTestName(testName) {
    this.setState({ testName });
  }

  setTestDetails(testDetails) {
    this.setState({ testDetails });
  }

  setDataSeed(dataSeed) {
    console.log(dataSeed);
    this.setState({ dataSeed });
  }

  setQuerySeed(querySeed) {
    console.log(querySeed);
    this.setState({ querySeed });
  }

  render() {
    const { server, schemaInfo, rowInfo, queries, connInfo, handleClose } = this.props;
    const { testName, testDetails, dataSeed, querySeed } = this.state;
    return (
      <div>
        <Modal.Header closeButton>
          <Modal.Title>RUN TEST</Modal.Title>
        </Modal.Header>
        <Modal.Body>
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
              />
            </label>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <button
            type="button"
            className="pt-button pt-intent-primary"
            onClick={() => {
              runTest(
                [testName, testDetails, Date.now()],
                server,
                schemaInfo,
                rowInfo,
                queries,
                connInfo,
                dataSeed,
                querySeed
              );
            }}
          >
            Save
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
