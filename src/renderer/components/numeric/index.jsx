import React, { Component, PropTypes } from 'react';
// import { Button, Overlay, Popover } from '@blueprintjs/core';
import { Modal } from 'react-bootstrap';
import { tableRelations } from '../test-tables-to-cards.jsx';
import CustomNumeric, { CUSTOM_NUMERIC, customNumericGenerator } from './custom-numeric.jsx';
import NormalDistribution, {
  NORMAL_DISTRIBUTION,
  normalDistributionGenerator,
} from './normal-distribution.jsx';
import UniformDistribution, {
  UNIFORM_DISTRIBUTION,
  uniformDistributionGenerator,
} from './uniform-distribution.jsx';

const numericOptions = [NORMAL_DISTRIBUTION, UNIFORM_DISTRIBUTION, CUSTOM_NUMERIC];
const numericGenerators = [
  normalDistributionGenerator,
  uniformDistributionGenerator,
  customNumericGenerator,
];

class Numeric extends Component {
  static propTypes = {
    schemaInfo: PropTypes.array,
    generatorName: PropTypes.string,
    onSetField: PropTypes.func.isRequired,
    tableIndex: PropTypes.number.isRequired,
    fieldIndex: PropTypes.number.isRequired,
    isInteger: PropTypes.bool.isRequired,
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
    const { schemaInfo, generatorName, onSetField, tableIndex, fieldIndex, isInteger } = this.props;
    switch (generatorName) {
      case NORMAL_DISTRIBUTION:
        return (
          <NormalDistribution
            schemaInfo={schemaInfo}
            onSetField={onSetField}
            tableIndex={tableIndex}
            fieldIndex={fieldIndex}
            handleClose={::this.handleClose}
            isInteger={isInteger}
          />
        );
      case UNIFORM_DISTRIBUTION:
        return (
          <UniformDistribution
            schemaInfo={schemaInfo}
            onSetField={onSetField}
            tableIndex={tableIndex}
            fieldIndex={fieldIndex}
            handleClose={::this.handleClose}
            isInteger={isInteger}
          />
        );
      case CUSTOM_NUMERIC:
        return (
          <CustomNumeric
            schemaInfo={schemaInfo}
            onSetField={onSetField}
            tableIndex={tableIndex}
            fieldIndex={fieldIndex}
            handleClose={::this.handleClose}
            isInteger={isInteger}
          />
        );
      default:
        return <div />;
    }
  }

  render() {
    const { schemaInfo, generatorName, onSetField, tableIndex, fieldIndex } = this.props;
    const { isOpen } = this.state;
    const relations = tableRelations(schemaInfo);

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

export default Numeric;
export { numericOptions, numericGenerators };
