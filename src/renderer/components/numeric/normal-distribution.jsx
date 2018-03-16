import React, { Component, PropTypes } from 'react';
import { Modal } from 'react-bootstrap';
import { jStat } from 'jStat';
import { toPrecisionScale } from './custom-numeric.jsx';

function normalDistributionGenerator(randNum, [miu, sigma, isInteger, precision, scale]) {
  const ans = toPrecisionScale(jStat.normal.inv(randNum, miu, sigma), precision, scale);
  return isInteger ? parseInt(ans, 10) : Number(ans);
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
      precision: 10,
      scale: 2,
    };
  }

  setPrecision(precision) {
    this.setState({ precision });
  }

  setScale(scale) {
    this.setState({ scale });
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
    const { inputs, precision, scale } = this.state;
    const combinedInput = [...inputs, precision, scale];
    return (
      <div>
        <Modal.Body>
          <div className="pair-label-switch-container">
            <label className="pt-label">
              Set Precision
              <input
                type="number"
                style={{ marginRight: '13px' }}
                className="pt-input pt-numeric-input"
                onChange={e => this.setPrecision(parseInt(e.target.value, 10))}
                value={precision}
              />
            </label>
            <label className="pt-label">
              Set Scale
              <input
                type="number"
                style={{ marginRight: '13px' }}
                className="pt-input pt-numeric-input"
                onChange={e => this.setScale(parseInt(e.target.value, 10))}
                value={scale}
              />
            </label>
          </div>
          <div className="pair-label-switch-container">
            <label className="pt-label">
              Set Miu
              <input
                type="number"
                style={{ marginRight: '13px' }}
                className="pt-input pt-numeric-input"
                onChange={e => this.setMiu(e.target.value)}
                value={inputs[0]}
              />
            </label>
            <label className="pt-label">
              Set Sigma
              <input
                type="number"
                style={{ marginRight: '13px' }}
                className="pt-input pt-numeric-input"
                onChange={e => this.setSigma(e.target.value)}
                value={inputs[1]}
              />
            </label>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <button
            type="button"
            className="pt-button pt-intent-primary"
            onClick={() => {
              onSetField(tableIndex, fieldIndex, 'generator', {
                func: normalDistributionGenerator,
                inputs: combinedInput,
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
export { NORMAL_DISTRIBUTION, normalDistributionGenerator };
