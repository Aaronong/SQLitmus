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
    };
  }

  setTestName(testName) {
    this.setState({ testName });
  }

  setTestDetails(testDetails) {
    this.setState({ testDetails });
  }

  render() {
    const { server, schemaInfo, rowInfo, queries, connInfo, handleClose } = this.props;
    const { testName, testDetails } = this.state;
    return (
      <div>
        <Modal.Header closeButton>
          <Modal.Title>RUN TEST</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="pair-label-switch-container">
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
                connInfo
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
