import React, { Component, PropTypes } from 'react';
import { Modal } from 'react-bootstrap';
import faker from 'faker';
import { doubleQuote } from './custom-character.jsx';

function phoneNumberGenerator(randNum, [maxLength, numberFormat]) {
  const seed = randNum * Number.MAX_SAFE_INTEGER;
  faker.seed(seed);
  const result = faker.phone.phoneNumber(numberFormat);
  return doubleQuote(result.length > maxLength ? result.slice(0, maxLength) : result);
}

const PHONE_NUMBER = 'Phone Number';

class PhoneNumber extends Component {
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
      defaultInput = [255, '1.###-(##) ##_##'];
    }
    this.state = {
      maxLength: defaultInput[0],
      numberFormat: defaultInput[1],
    };
  }

  setMaxLength(maxLength) {
    this.setState({ maxLength });
  }

  setFormat(numberFormat) {
    this.setState({ numberFormat });
  }

  render() {
    const { onSetField, tableIndex, fieldIndex, handleClose } = this.props;
    const { maxLength, numberFormat } = this.state;
    const compressedInput = [maxLength, numberFormat];
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
          <label className="pt-label">
            Select Format - (hashes replaced with number)
            <input
              style={{ marginRight: '13px' }}
              className="pt-input"
              onChange={e => this.setFormat(e.target.value)}
              value={numberFormat}
            />
          </label>
        </Modal.Body>
        <Modal.Footer>
          <button
            type="button"
            className="pt-button pt-intent-primary"
            onClick={() => {
              onSetField(tableIndex, fieldIndex, 'generator', {
                func: phoneNumberGenerator,
                inputs: compressedInput,
                name: PHONE_NUMBER,
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

export default PhoneNumber;
export { PHONE_NUMBER, phoneNumberGenerator };
