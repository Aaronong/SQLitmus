import React, { Component, PropTypes } from 'react';
// import { Button, Overlay, Popover } from '@blueprintjs/core';
import { Modal } from 'react-bootstrap';
import CustomBoolean, { CUSTOM_BOOLEAN, customBooleanGenerator } from './custom-boolean.jsx';

const booleanOptions = [CUSTOM_BOOLEAN];
const booleanGenerators = [customBooleanGenerator];

class Boolean extends Component {
  static propTypes = {
    schemaInfo: PropTypes.array,
    generatorName: PropTypes.string,
    onSetField: PropTypes.func.isRequired,
    tableIndex: PropTypes.number.isRequired,
    fieldIndex: PropTypes.number.isRequired,
  };

  constructor(props, context) {
    super(props, context);
    this.state = {
      isOpen: false,
    };
  }

  handleClose() {
    this.setState({ isOpen: false });
  }

  handleShow() {
    this.setState({ isOpen: true });
  }

  modalBody() {
    const { schemaInfo, generatorName, onSetField, tableIndex, fieldIndex } = this.props;
    switch (generatorName) {
      case CUSTOM_BOOLEAN:
        return (
          <CustomBoolean
            schemaInfo={schemaInfo}
            onSetField={onSetField}
            tableIndex={tableIndex}
            fieldIndex={fieldIndex}
            handleClose={::this.handleClose}
          />
        );
      default:
        return <div />;
    }
  }

  render() {
    const { generatorName } = this.props;
    const { isOpen } = this.state;

    return (
      <div style={{ display: 'inline' }}>
        <button type="button" className="pt-button pt-icon-cog" onClick={::this.handleShow}>
          Configure
        </button>

        <Modal show={isOpen} onHide={::this.handleClose}>
          <Modal.Header closeButton>
            <Modal.Title>{generatorName}</Modal.Title>
          </Modal.Header>
          {this.modalBody()}
        </Modal>
      </div>
    );
  }
}

export default Boolean;
export { booleanOptions, booleanGenerators };
