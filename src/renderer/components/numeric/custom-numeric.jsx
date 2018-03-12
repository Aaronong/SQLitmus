import React, { Component, PropTypes } from 'react';
import { Modal } from 'react-bootstrap';
import { Slider } from '@blueprintjs/core';

// input of form [ [val1, weight1], [val2, weight2], ... ]
function customNumericGenerator(randNum, input) {
  const reducer = (accumulator, currentValue) => accumulator + currentValue[1];
  const totalWeight = input.reduce(reducer, 0);
  let counter = Math.round(randNum * totalWeight);
  let result = input[0][0];
  let found = false;
  input.forEach(([val, weight]) => {
    counter = counter - weight;
    if (counter < 0 && !found) {
      result = val;
      found = true;
    }
  });
  return result;
}

const CUSTOM_NUMERIC = 'Custom Numeric';

function inputsToNumericInput(inputs, setValueAtRow, setWeightAtRow, deleteInputRow) {
  return inputs.map((input, index) => (
    <div key={index} className="schema-panel-container">
      <input
        type="number"
        style={{ marginRight: '13px' }}
        className="pt-input pt-numeric-input"
        onChange={e => setValueAtRow(index, e.target.value)}
        value={input[0]}
      />
      <Slider
        min={1}
        max={1000}
        stepSize={1}
        labelStepSize={333}
        onChange={e => setWeightAtRow(index, e)}
        value={input[1]}
        vertical={false}
      />
      <button
        type="button"
        style={{ marginLeft: '20px' }}
        className="pt-button pt-icon-cross"
        onClick={() => deleteInputRow(index)}
      />
    </div>
  ));
}

class CustomNumeric extends Component {
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
    const { schemaInfo, tableIndex, fieldIndex } = props;
    const defaultInput = schemaInfo[tableIndex][1][fieldIndex].generator.inputs;
    this.state = {
      inputs: defaultInput,
    };
  }

  setValueAtRow(rowIndex, value) {
    const inputs = [...this.state.inputs];
    inputs[rowIndex][0] = this.props.isInteger ? parseInt(value, 10) : parseFloat(value);
    this.setState({ inputs });
  }

  setWeightAtRow(rowIndex, weight) {
    const inputs = [...this.state.inputs];
    inputs[rowIndex][1] = weight;
    this.setState({ inputs });
  }

  addInputRow() {
    const inputs = [...this.state.inputs];
    inputs.push([0, 1]);
    this.setState({ inputs });
  }

  deleteInputRow(rowIndex) {
    this.setState({ inputs: this.state.inputs.slice(rowIndex) });
  }

  render() {
    const { onSetField, tableIndex, fieldIndex, handleClose } = this.props;
    const { inputs } = this.state;
    return (
      <div>
        <Modal.Body>
          <div className="pair-label-switch-container">
            <span className="modal-subheader">Value</span>
            <span className="modal-subheader">Weight</span>
          </div>
          {inputsToNumericInput(
            inputs,
            ::this.setValueAtRow,
            ::this.setWeightAtRow,
            ::this.deleteInputRow
          )}
          <button type="button" className="pt-button pt-icon-add" onClick={::this.addInputRow}>
            Add New Row
          </button>
        </Modal.Body>
        <Modal.Footer>
          <button
            type="button"
            className="pt-button pt-intent-primary"
            onClick={() => {
              onSetField(tableIndex, fieldIndex, 'generator', {
                func: customNumericGenerator,
                inputs,
                name: CUSTOM_NUMERIC,
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

export default CustomNumeric;
export { CUSTOM_NUMERIC, customNumericGenerator };
