import React, { Component, PropTypes } from 'react';
// import { Button, Overlay, Popover } from '@blueprintjs/core';
import { Modal } from 'react-bootstrap';
import ColorRgb, { COLOR_RGB, colorRgbGenerator } from './color-rgb.jsx';
import ColorString, { COLOR_STRING, colorStringGenerator } from './color-string.jsx';
import CompanyName, { COMPANY_NAME, companyNameGenerator } from './company-name.jsx';
import CountryName, { COUNTRY_NAME, countryNameGenerator } from './country-name.jsx';
import Email, { EMAIL, emailGenerator } from './email.jsx';
import FileName, { FILE_NAME, fileNameGenerator } from './file-name.jsx';
import FirstName, { FIRST_NAME, firstNameGenerator } from './first-name.jsx';
import FullName, { FULL_NAME, fullNameGenerator } from './full-name.jsx';
import JobTitle, { JOB_TITLE, jobTitleGenerator } from './job-title.jsx';
import LastName, { LAST_NAME, lastNameGenerator } from './last-name.jsx';
import Password, { PASSWORD, passwordGenerator } from './password.jsx';
import PhoneNumber, { PHONE_NUMBER, phoneNumberGenerator } from './phone-number.jsx';
import ProductName, { PRODUCT_NAME, productNameGenerator } from './product-name.jsx';
import RandomEssay, { RANDOM_ESSAY, randomEssayGenerator } from './random-essay.jsx';
import RandomParagraph, {
  RANDOM_PARAGRAPH,
  randomParagraphGenerator,
} from './random-paragraph.jsx';
import RandomSentence, { RANDOM_SENTENCE, randomSentenceGenerator } from './random-sentence.jsx';
import RandomWord, { RANDOM_WORD, randomWordGenerator } from './random-word.jsx';
import StreetAddress, { STREET_ADDRESS, streetAddressGenerator } from './street-address.jsx';
import Url, { URL, urlGenerator } from './url.jsx';
import UserName, { USER_NAME, userNameGenerator } from './user-name.jsx';
import CustomCharacter, {
  CUSTOM_CHARACTER,
  customCharacterGenerator,
} from './custom-character.jsx';

const characterOptions = [
  COLOR_RGB,
  COLOR_STRING,
  COMPANY_NAME,
  COUNTRY_NAME,
  EMAIL,
  FILE_NAME,
  FIRST_NAME,
  FULL_NAME,
  JOB_TITLE,
  LAST_NAME,
  PASSWORD,
  PHONE_NUMBER,
  PRODUCT_NAME,
  RANDOM_ESSAY,
  RANDOM_PARAGRAPH,
  RANDOM_SENTENCE,
  RANDOM_WORD,
  STREET_ADDRESS,
  URL,
  USER_NAME,
  CUSTOM_CHARACTER,
];
const characterGenerators = [
  colorRgbGenerator,
  colorStringGenerator,
  companyNameGenerator,
  countryNameGenerator,
  emailGenerator,
  fileNameGenerator,
  firstNameGenerator,
  fullNameGenerator,
  jobTitleGenerator,
  lastNameGenerator,
  passwordGenerator,
  phoneNumberGenerator,
  productNameGenerator,
  randomEssayGenerator,
  randomParagraphGenerator,
  randomSentenceGenerator,
  randomWordGenerator,
  streetAddressGenerator,
  urlGenerator,
  userNameGenerator,
  customCharacterGenerator,
];

class Character extends Component {
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
      case COLOR_RGB:
        return (
          <ColorRgb
            schemaInfo={schemaInfo}
            onSetField={onSetField}
            tableIndex={tableIndex}
            fieldIndex={fieldIndex}
            handleClose={::this.handleClose}
          />
        );
      case COLOR_STRING:
        return (
          <ColorString
            schemaInfo={schemaInfo}
            onSetField={onSetField}
            tableIndex={tableIndex}
            fieldIndex={fieldIndex}
            handleClose={::this.handleClose}
          />
        );
      case COMPANY_NAME:
        return (
          <CompanyName
            schemaInfo={schemaInfo}
            onSetField={onSetField}
            tableIndex={tableIndex}
            fieldIndex={fieldIndex}
            handleClose={::this.handleClose}
          />
        );
      case COUNTRY_NAME:
        return (
          <CountryName
            schemaInfo={schemaInfo}
            onSetField={onSetField}
            tableIndex={tableIndex}
            fieldIndex={fieldIndex}
            handleClose={::this.handleClose}
          />
        );
      case EMAIL:
        return (
          <Email
            schemaInfo={schemaInfo}
            onSetField={onSetField}
            tableIndex={tableIndex}
            fieldIndex={fieldIndex}
            handleClose={::this.handleClose}
          />
        );
      case FILE_NAME:
        return (
          <FileName
            schemaInfo={schemaInfo}
            onSetField={onSetField}
            tableIndex={tableIndex}
            fieldIndex={fieldIndex}
            handleClose={::this.handleClose}
          />
        );
      case FIRST_NAME:
        return (
          <FirstName
            schemaInfo={schemaInfo}
            onSetField={onSetField}
            tableIndex={tableIndex}
            fieldIndex={fieldIndex}
            handleClose={::this.handleClose}
          />
        );
      case FULL_NAME:
        return (
          <FullName
            schemaInfo={schemaInfo}
            onSetField={onSetField}
            tableIndex={tableIndex}
            fieldIndex={fieldIndex}
            handleClose={::this.handleClose}
          />
        );
      case JOB_TITLE:
        return (
          <JobTitle
            schemaInfo={schemaInfo}
            onSetField={onSetField}
            tableIndex={tableIndex}
            fieldIndex={fieldIndex}
            handleClose={::this.handleClose}
          />
        );
      case LAST_NAME:
        return (
          <LastName
            schemaInfo={schemaInfo}
            onSetField={onSetField}
            tableIndex={tableIndex}
            fieldIndex={fieldIndex}
            handleClose={::this.handleClose}
          />
        );
      case PASSWORD:
        return (
          <Password
            schemaInfo={schemaInfo}
            onSetField={onSetField}
            tableIndex={tableIndex}
            fieldIndex={fieldIndex}
            handleClose={::this.handleClose}
          />
        );
      case PHONE_NUMBER:
        return (
          <PhoneNumber
            schemaInfo={schemaInfo}
            onSetField={onSetField}
            tableIndex={tableIndex}
            fieldIndex={fieldIndex}
            handleClose={::this.handleClose}
          />
        );
      case PRODUCT_NAME:
        return (
          <ProductName
            schemaInfo={schemaInfo}
            onSetField={onSetField}
            tableIndex={tableIndex}
            fieldIndex={fieldIndex}
            handleClose={::this.handleClose}
          />
        );
      case RANDOM_ESSAY:
        return (
          <RandomEssay
            schemaInfo={schemaInfo}
            onSetField={onSetField}
            tableIndex={tableIndex}
            fieldIndex={fieldIndex}
            handleClose={::this.handleClose}
          />
        );
      case RANDOM_PARAGRAPH:
        return (
          <RandomParagraph
            schemaInfo={schemaInfo}
            onSetField={onSetField}
            tableIndex={tableIndex}
            fieldIndex={fieldIndex}
            handleClose={::this.handleClose}
          />
        );
      case RANDOM_SENTENCE:
        return (
          <RandomSentence
            schemaInfo={schemaInfo}
            onSetField={onSetField}
            tableIndex={tableIndex}
            fieldIndex={fieldIndex}
            handleClose={::this.handleClose}
          />
        );
      case RANDOM_WORD:
        return (
          <RandomWord
            schemaInfo={schemaInfo}
            onSetField={onSetField}
            tableIndex={tableIndex}
            fieldIndex={fieldIndex}
            handleClose={::this.handleClose}
          />
        );
      case STREET_ADDRESS:
        return (
          <StreetAddress
            schemaInfo={schemaInfo}
            onSetField={onSetField}
            tableIndex={tableIndex}
            fieldIndex={fieldIndex}
            handleClose={::this.handleClose}
          />
        );
      case URL:
        return (
          <Url
            schemaInfo={schemaInfo}
            onSetField={onSetField}
            tableIndex={tableIndex}
            fieldIndex={fieldIndex}
            handleClose={::this.handleClose}
          />
        );
      case USER_NAME:
        return (
          <UserName
            schemaInfo={schemaInfo}
            onSetField={onSetField}
            tableIndex={tableIndex}
            fieldIndex={fieldIndex}
            handleClose={::this.handleClose}
          />
        );
      case CUSTOM_CHARACTER:
        return (
          <CustomCharacter
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

export default Character;
export { characterOptions, characterGenerators };
