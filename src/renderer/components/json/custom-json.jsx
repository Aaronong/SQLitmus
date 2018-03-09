import React, { Component, PropTypes } from 'react';
import { Modal, Popover } from 'react-bootstrap';
import { Slider } from '@blueprintjs/core';
import AceEditor from 'react-ace';

import 'brace/mode/json';
import 'brace/theme/solarized_light';

// input of form [ [val1, weight1], [val2, weight2], ... ]
function runGenerator(randNum, input) {
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

const CUSTOM_JSON = 'Custom Json';

function inputsToJsonInput(inputs, setValueAtRow, setWeightAtRow, deleteInputRow, setActiveIndex) {
  return inputs.map((input, index) => (
    <div key={index} className="schema-panel-container">
      <button
        type="button"
        style={{ marginRight: '20px' }}
        className="pt-button pt-icon-edit"
        onClick={() => setActiveIndex(index)}
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

class CustomJson extends Component {
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
    const defaultInput = schemaInfo[tableIndex][1][fieldIndex].generator.inputs;
    this.state = {
      inputs: defaultInput,
      activeIndex: -1,
    };
  }

  setActiveIndex(activeIndex) {
    this.setState({ activeIndex });
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
    inputs.push(['{}', 1]);
    this.setState({ inputs });
  }

  deleteInputRow(rowIndex) {
    this.setState({ inputs: this.state.inputs.slice(rowIndex) });
  }

  render() {
    const { onSetField, tableIndex, fieldIndex, handleClose } = this.props;
    const { inputs, activeIndex } = this.state;
    const jsonEditor = (
      <div className="jsonEditorContainer">
        <AceEditor
          mode="json"
          theme="solarized_light"
          name={'editor'}
          style={{ height: '100px', width: '100px' }}
          onChange={e => (activeIndex === -1 ? console.log(e) : this.setValueAtRow(activeIndex, e))}
          fontSize={14}
          showPrintMargin
          showGutter
          highlightActiveLine
          value={activeIndex === -1 ? 'No JSON SELECTED' : inputs[activeIndex][0]}
          setOptions={{
            showLineNumbers: true,
            tabSize: 2,
          }}
        />
      </div>
    );

    return (
      <div>
        <Modal.Body>
          <div className="pair-label-switch-container">
            <span className="modal-subheader">Value</span>
            <span className="modal-subheader">Weight</span>
          </div>
          {inputsToJsonInput(
            inputs,
            ::this.setValueAtRow,
            ::this.setWeightAtRow,
            ::this.deleteInputRow,
            ::this.setActiveIndex,
            jsonEditor
          )}
          <button type="button" className="pt-button pt-icon-add" onClick={::this.addInputRow}>
            Add New Row
          </button>
          <h4 style={{ marginTop: '10px' }}>JSON Editor</h4>
          {jsonEditor}
        </Modal.Body>
        <Modal.Footer>
          <button
            type="button"
            className="pt-button pt-intent-primary"
            onClick={() => {
              onSetField(tableIndex, fieldIndex, 'generator', {
                func: runGenerator,
                inputs,
                name: CUSTOM_JSON,
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

export default CustomJson;
export { CUSTOM_JSON };
