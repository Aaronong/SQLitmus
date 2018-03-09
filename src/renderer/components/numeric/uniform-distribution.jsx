import React, { Component, PropTypes } from 'react';
import { Modal } from 'react-bootstrap';
import { jStat } from 'jStat';

function runGenerator(randNum, [start, end, isInteger]) {
  const ans = jStat.uniform.inv(randNum, start, end);
  return isInteger ? Math.round(ans) : ans;
}

const UNIFORM_DISTRIBUTION = 'Uniform Distribution';

class UniformDistribution extends Component {
  static propTypes = {
    schemaInfo: PropTypes.array.isRequired,
    onSetField: PropTypes.func.isRequired,
    tableIndex: PropTypes.number.isRequired,
    fieldIndex: PropTypes.number.isRequired,
    handleClose: PropTypes.func.isRequired,
    isInteger: PropTypes.bool.isRequired,
  };

  constructor(props, context) {
    super(props, context);
    const { schemaInfo, tableIndex, fieldIndex, isInteger } = props;
    let defaultInput = schemaInfo[tableIndex][1][fieldIndex].generator.inputs;
    if (defaultInput.length !== 3) {
      defaultInput = [0, 1, isInteger];
    }
    this.state = {
      inputs: defaultInput,
    };
  }

  setStart(start) {
    const inputs = [...this.state.inputs];
    inputs[0] = Number(start);
    this.setState({ inputs });
  }

  setEnd(end) {
    const inputs = [...this.state.inputs];
    inputs[1] = Number(end);
    this.setState({ inputs });
  }

  render() {
    const { onSetField, tableIndex, fieldIndex, handleClose } = this.props;
    const { inputs } = this.state;
    return (
      <div>
        <Modal.Body>
          <div className="pair-label-switch-container">
            <span className="modal-subheader">Start</span>
            <span className="modal-subheader">End</span>
          </div>
          <input
            type="number"
            style={{ marginRight: '13px' }}
            className="pt-input pt-numeric-input"
            onChange={e => this.setStart(e.target.value)}
            value={inputs[0]}
          />
          <input
            type="number"
            style={{ marginRight: '13px' }}
            className="pt-input pt-numeric-input"
            onChange={e => this.setEnd(e.target.value)}
            value={inputs[1]}
          />
        </Modal.Body>
        <Modal.Footer>
          <button
            type="button"
            className="pt-button pt-intent-primary"
            onClick={() => {
              onSetField(tableIndex, fieldIndex, 'generator', {
                func: runGenerator,
                inputs,
                name: UNIFORM_DISTRIBUTION,
              });
              handleClose();
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

export default UniformDistribution;
export { UNIFORM_DISTRIBUTION };
