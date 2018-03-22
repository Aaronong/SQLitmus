import React, { Component, PropTypes } from 'react';
import { Modal } from 'react-bootstrap';
import { jStat } from 'jStat';
import { toPrecisionScale } from './custom-numeric.jsx';

function uniformDistributionGenerator(
  randNum,
  [start, end, isInteger, precision, scale, min, max]
) {
  let result = toPrecisionScale(jStat.uniform.inv(randNum, start, end), precision, scale);
  result = isInteger ? parseInt(result, 10) : Number(result);
  if (result < min) {
    result = min;
  }
  if (result > max) {
    result = max;
  }
  return result;
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
    if (defaultInput.length !== 7) {
      const defaultScale = props.isInteger ? 0 : 2;
      defaultInput = [0, 1, isInteger, 10, defaultScale, -100, 100];
    }
    this.state = {
      inputs: defaultInput.slice(0, 3),
      precision: defaultInput[3],
      scale: defaultInput[4],
      min: defaultInput[5],
      max: defaultInput[6],
    };
  }

  setPrecision(precision) {
    this.setState({ precision });
  }

  setScale(scale) {
    this.setState({ scale });
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
    const { inputs, precision, scale, min, max } = this.state;
    const combinedInput = [...inputs, precision, scale, min, max];
    return (
      <div>
        <Modal.Body>
          <div className="pair-label-switch-container">
            <label className="pt-label">
              Set Min
              <input
                type="number"
                style={{ marginRight: '13px' }}
                className="pt-input pt-numeric-input"
                onChange={e => this.setMin(parseFloat(e.target.value, 10))}
                value={min}
              />
            </label>
            <label className="pt-label">
              Set Max
              <input
                type="number"
                style={{ marginRight: '13px' }}
                className="pt-input pt-numeric-input"
                onChange={e => this.setMax(parseFloat(e.target.value, 10))}
                value={max}
              />
            </label>
          </div>
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
              Set Start
              <input
                type="number"
                style={{ marginRight: '13px' }}
                className="pt-input pt-numeric-input"
                onChange={e => this.setStart(e.target.value)}
                value={inputs[0]}
              />
            </label>{' '}
            <label className="pt-label">
              Set End
              <input
                type="number"
                style={{ marginRight: '13px' }}
                className="pt-input pt-numeric-input"
                onChange={e => this.setEnd(e.target.value)}
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
                func: uniformDistributionGenerator,
                inputs: combinedInput,
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
export { UNIFORM_DISTRIBUTION, uniformDistributionGenerator };
