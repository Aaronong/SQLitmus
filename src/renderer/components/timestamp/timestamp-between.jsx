import React, { Component, PropTypes } from 'react';
import { Modal } from 'react-bootstrap';
import { DatePicker } from '@blueprintjs/datetime';
import faker from 'faker';
require('@blueprintjs/datetime/src/blueprint-datetime.scss');

function runGenerator(randNum, [from, to]) {
  const ans = faker.date.between(new Date(from), new Date(to));
  return Math.round(ans);
}

const TIMESTAMP_BETWEEN = 'Timestamp Between';

class TimestampBetween extends Component {
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
      defaultInput = [Date.now(), Date.now()];
    }
    this.state = {
      inputs: defaultInput,
    };
  }

  setFrom(from) {
    this.setState({ inputs: [from, this.state.inputs[1]].sort() });
  }

  setTo(to) {
    this.setState({ inputs: [this.state.inputs[0], to].sort() });
  }

  render() {
    const { onSetField, tableIndex, fieldIndex, handleClose } = this.props;
    const { inputs } = this.state;
    return (
      <div>
        <Modal.Body>
          <div className="pair-label-switch-container">
            <span style={{ marginRight: '100px' }}>{`From: ${new Date(
              inputs[0]
            ).toDateString()}`}</span>
            <span>{`To: ${new Date(inputs[1]).toDateString()}`}</span>
          </div>
          <div className="pair-label-switch-container">
            <DatePicker
              // modifiers={modifiers}
              onChange={newDate => ::this.setFrom(newDate.getTime())}
              value={new Date(inputs[0])}
            />
            <DatePicker
              // modifiers={modifiers}
              onChange={newDate => ::this.setTo(newDate.getTime())}
              value={new Date(inputs[1])}
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
                name: TIMESTAMP_BETWEEN,
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

export default TimestampBetween;
export { TIMESTAMP_BETWEEN };
