import React, { Component, PropTypes } from 'react';
import { Modal } from 'react-bootstrap';
import { Slider } from '@blueprintjs/core';

function runGenerator(randNum, [trueRate]) {
  return Math.random() < trueRate;
}

const CUSTOM_BOOLEAN = 'Custom Boolean';

class CustomBoolean extends Component {
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
    if (defaultInput.length === 0) {
      defaultInput = [0.5];
    }
    this.state = {
      inputs: defaultInput,
    };
  }

  setTrueRate(trueRate) {
    this.setState({ inputs: [trueRate] });
  }

  render() {
    const { onSetField, tableIndex, fieldIndex, handleClose } = this.props;
    const { inputs } = this.state;
    return (
      <div>
        <Modal.Body>
          <h4>Specify True Rate</h4>

          <div style={{ marginLeft: '20px', marginRight: '20px' }}>
            <Slider
              min={0}
              max={1}
              stepSize={0.01}
              labelStepSize={0.2}
              onChange={e => this.setTrueRate(e)}
              value={inputs[0]}
              vertical={false}
            />
          </div>
        </Modal.Body>
        <Modal.Footer>
          <button
            type="button"
            className="pt-button pt-intent-primary"
            onClick={() => {
              onSetField(tableIndex, fieldIndex, 'generator', {
                func: runGenerator,
                inputs,
                name: CUSTOM_BOOLEAN,
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

export default CustomBoolean;
export { CUSTOM_BOOLEAN };
