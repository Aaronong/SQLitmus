import React, { Component, PropTypes } from 'react';
import { Modal } from 'react-bootstrap';
import { Slider } from '@blueprintjs/core';

function doubleQuote(str) {
  return str.replace("'", "''");
}

// input of form [ [val1, weight1], [val2, weight2], ... ]
function customCharacterGenerator(randNum, [maxLength, input]) {
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
  return doubleQuote(result.length > maxLength ? result.slice(0, maxLength) : result);
}

const CUSTOM_CHARACTER = 'Custom Character';

function inputsToCharacterInput(inputs, setValueAtRow, setWeightAtRow, deleteInputRow) {
  return inputs.map((input, index) => (
    <div key={index} className="schema-panel-container">
      <input
        type="text"
        style={{ marginRight: '13px' }}
        className="pt-input"
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

class CustomCharacter extends Component {
  static propTypes = {
    schemaInfo: PropTypes.array.isRequired,
    onSetField: PropTypes.func.isRequired,
    tableIndex: PropTypes.number.isRequired,
    fieldIndex: PropTypes.number.isRequired,
    handleClose: PropTypes.func.isRequired,
  };

  constructor(props, context) {
    super(props, context);
    const { schemaInfo, tableIndex, fieldIndex } = props;
    let defaultInput = schemaInfo[tableIndex][1][fieldIndex].generator.inputs;
    if (defaultInput.length !== 2) {
      defaultInput = [255, []];
    }
    this.state = {
      inputs: defaultInput[1],
      maxLength: defaultInput[0],
    };
  }

  setMaxLength(maxLength) {
    this.setState({ maxLength });
  }

  setValueAtRow(rowIndex, value) {
    const inputs = [...this.state.inputs];
    inputs[rowIndex][0] = value;
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
    const { inputs, maxLength } = this.state;
    const compressedInput = [maxLength, inputs];
    return (
      <div>
        <Modal.Body>
          <label className="pt-label">
            Select Max String Length
            <input
              type="number"
              style={{ marginRight: '13px' }}
              className="pt-input pt-numeric-input"
              onChange={e => this.setMaxLength(parseInt(e.target.value, 10))}
              value={maxLength}
            />
          </label>
          <div className="pair-label-switch-container">
            <span className="modal-subheader">Value</span>
            <span className="modal-subheader">Weight</span>
          </div>
          {inputsToCharacterInput(
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
                func: customCharacterGenerator,
                inputs: compressedInput,
                name: CUSTOM_CHARACTER,
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

export default CustomCharacter;
export { CUSTOM_CHARACTER, customCharacterGenerator, doubleQuote };
