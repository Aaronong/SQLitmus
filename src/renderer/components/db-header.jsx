import React, { PropTypes } from 'react';
import { shell } from 'electron'; // eslint-disable-line import/no-unresolved

require('./header.css');

const Header = ({
  imagePath,
  serverName,
  dbName,
  changeNavBarPosition,
  navBarPosition,
  onCloseConnectionClick,
  onReConnectionClick,
}) => {
  const visibilityButtons = onCloseConnectionClick ? 'visible' : 'hidden';
  return (
    <div id="header" className="ui top fixed menu borderless">
      <div className="item">
        <b>
          <i className={'server icon'} />
          {serverName} <br />
          <i className={'database icon'} />
          {dbName}
        </b>
        <img
          title={serverName}
          alt={serverName}
          style={{ width: '2.5em' }}
          className="ui mini left spaced image right"
          src={imagePath}
        />
      </div>

      <div style={{ margin: 'auto' }}>
        <button
          className={`pt-button pt-minimal pt-large pt-intent-primary ${
            navBarPosition === 0 ? 'pt-active' : ''
          }`}
          title="History"
          onClick={() => changeNavBarPosition(0)}
        >
          History
        </button>
        <button
          className={`pt-button pt-minimal pt-large pt-intent-primary ${
            navBarPosition === 1 ? 'pt-active' : ''
          }`}
          title="Test"
          onClick={() => changeNavBarPosition(1)}
        >
          Test
        </button>
      </div>

      <div style={{ visibility: visibilityButtons }} className="alignRight">
        <div className="item borderless">
          <div className="ui mini basic icon buttons">
            <button className="ui button" title="Reconnect" onClick={onReConnectionClick}>
              <i className="plug icon" />
            </button>
            <button
              className="ui icon button"
              title="Close connection"
              onClick={onCloseConnectionClick}
            >
              <i className="power icon" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

Header.propTypes = {
  imagePath: PropTypes.string.isRequired,
  serverName: PropTypes.string.isRequired,
  dbName: PropTypes.string.isRequired,
  changeNavBarPosition: PropTypes.func.isRequired,
  navBarPosition: PropTypes.number.isRequired,
  onCloseConnectionClick: PropTypes.func,
  onReConnectionClick: PropTypes.func,
};

export default Header;
