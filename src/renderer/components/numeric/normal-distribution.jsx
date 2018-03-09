import React, { Component, PropTypes } from 'react';
import { Modal } from 'react-bootstrap';
import { jStat } from 'jStat';

function runGenerator(randNum, [miu, sigma, isInteger]) {
  const ans = jStat.normal.inv(randNum, miu, sigma);
  return isInteger ? Math.round(ans) : ans;
}

const NORMAL_DISTRIBUTION = 'Normal Distribution';

class NormalDistribution extends Component {
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

  setMiu(miu) {
    const inputs = [...this.state.inputs];
    inputs[0] = Number(miu);
    this.setState({ inputs });
  }

  setSigma(sigma) {
    const inputs = [...this.state.inputs];
    inputs[1] = Number(sigma);
    this.setState({ inputs });
  }

  render() {
    const { onSetField, tableIndex, fieldIndex, handleClose } = this.props;
    const { inputs } = this.state;
    return (
      <div>
        <Modal.Body>
          <div className="pair-label-switch-container">
            <span className="modal-subheader">Miu</span>
            <span className="modal-subheader">Sigma</span>
          </div>
          <input
            type="number"
            style={{ marginRight: '13px' }}
            className="pt-input pt-numeric-input"
            onChange={e => this.setMiu(e.target.value)}
            value={inputs[0]}
          />
          <input
            type="number"
            style={{ marginRight: '13px' }}
            className="pt-input pt-numeric-input"
            onChange={e => this.setSigma(e.target.value)}
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
                name: NORMAL_DISTRIBUTION,
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

export default NormalDistribution;
export { NORMAL_DISTRIBUTION };
