import debounce from 'lodash.debounce';
import cloneDeep from 'lodash.clonedeep';
// import union from 'lodash.union';
import React, { Component, PropTypes } from 'react';
import ReactDOM from 'react-dom';
import { withRouter } from 'react-router';
import { connect } from 'react-redux';
// import { ResizableBox } from 'react-resizable';
import { Tab as Tab2, Tabs as Tabs2 } from '@blueprintjs/core';
import { Tab, Tabs, TabList, TabPanel } from 'react-tabs';
import { Modal } from 'react-bootstrap';
import { sqlectron } from '../../browser/remote';
import * as ConnActions from '../actions/connections.js';
import * as QueryActions from '../actions/queries';
import * as DbAction from '../actions/databases';
import { fetchTablesIfNeeded } from '../actions/tables';
import { fetchSchemasIfNeeded } from '../actions/schemas';
import { fetchTableColumnsIfNeeded } from '../actions/columns';
import { fetchTableTriggersIfNeeded } from '../actions/triggers';
import { fetchTableIndexesIfNeeded } from '../actions/indexes';
import { fetchViewsIfNeeded } from '../actions/views';
import { fetchRoutinesIfNeeded } from '../actions/routines';
// import { getSQLScriptIfNeeded } from '../actions/sqlscripts';
// import { fetchTableKeysIfNeeded } from '../actions/keys';
// import DatabaseFilter from '../components/database-filter.jsx';
// import DatabaseList from '../components/database-list.jsx';
// import DatabaseDiagramModal from '../components/database-diagram-modal.jsx';
import Header from '../components/db-header.jsx';
import Footer from '../components/footer.jsx';
import Query from '../components/query.jsx';
import Loader from '../components/loader.jsx';
import PromptModal from '../components/prompt-modal.jsx';
import MenuHandler from '../menu-handler';
import HistoryDisplay from '../components/history/index.jsx';
import SchemaPanel from '../components/test-schema-panel.jsx';
import DataPanel from '../components/test-data-panel.jsx';
import rowPanel from '../components/test-row-panel.jsx';
import connPoolPanel from '../components/test-conn-panel.jsx';
import RunModal from '../components/run-test/run-modal.jsx';
import { requireLogos } from '../components/require-context';
import { parseQuery } from '../components/generic/parse-query.js';
import {
  localStoragePrefix,
  storeSchemaInfo,
  fillSchemaInfo,
  storeRowInfo,
  fillRowInfo,
  storeConnInfo,
  fillConnInfo,
  storeQueryInfo,
  fillQueryInfo,
} from '../components/generic/local-storage.js';

require('./db-browser.css');
require('react-tabs/style/react-tabs.css');

const STYLES = {
  wrapper: {},
  container: {
    display: 'flex',
    height: '100vh',
    boxSizing: 'border-box',
    padding: '50px 10px 40px 10px',
  },
  content: { flex: 1, overflow: 'auto', paddingLeft: '5px' },
  collapse: {
    position: 'fixed',
    color: '#fff',
    cursor: 'pointer',
    width: 10,
    left: 0,
    height: '100vh',
    backgroundColor: 'rgb(102,102,102)',
    zIndex: 1,
    MozUserSelect: 'none',
    WebkitUserSelect: 'none',
    msUserSelect: 'none',
  },
  resizeable: { width: 'auto', maxWidth: '100%' },
};

const CLIENTS = sqlectron.db.CLIENTS.reduce((clients, dbClient) => {
  /* eslint no-param-reassign:0 */
  clients[dbClient.key] = {
    title: dbClient.name,
    image: requireLogos(`./server-db-client-${dbClient.key}.png`),
  };
  return clients;
}, {});

const DEFAULT_GENERATOR = { name: '', func: null, inputs: [], testResults: [] };
const SUPPORTED_TYPES = [
  'boolean',
  'boolean',
  'character',
  'character',
  'character',
  'integer',
  'integer',
  'integer',
  'numeric',
  'numeric',
  'numeric',
  'numeric',
  'timestamp',
  'timestamp',
  'timestamp',
];
const POSTGRES_TYPES = [
  'bool',
  'bool',
  'char',
  'blob',
  'text',
  'int',
  'serial',
  'uuid',
  'float',
  'real',
  'numeric',
  'numeric',
  'time',
  'date',
  'interval',
];
const MYSQL_TYPES = [
  'tinyint',
  'bool',
  'char',
  'blob',
  'text',
  'int',
  'int',
  'int',
  'float',
  'dec',
  'numeric',
  'double',
  'time',
  'date',
  'year',
];

// Map all db types to a single generic type
function mapTypes(dataType, dbType) {
  if (dbType === 'mysql') {
    const foundIndex = MYSQL_TYPES.findIndex(item => dataType.toLowerCase().includes(item));
    if (foundIndex === -1) {
      return dataType;
    }
    return SUPPORTED_TYPES[foundIndex];
  }
  if (dbType === 'postgresql') {
    const foundIndex = POSTGRES_TYPES.findIndex(item => dataType.toLowerCase().includes(item));
    if (foundIndex === -1) {
      return dataType;
    }
    return SUPPORTED_TYPES[foundIndex];
  }
  return dataType;
}

class DbBrowserContainer extends Component {
  static propTypes = {
    connections: PropTypes.object.isRequired,
    status: PropTypes.string.isRequired,
    databases: PropTypes.object.isRequired,
    schemas: PropTypes.object.isRequired,
    tables: PropTypes.object.isRequired,
    columns: PropTypes.object.isRequired,
    triggers: PropTypes.object.isRequired,
    indexes: PropTypes.object.isRequired,
    views: PropTypes.object.isRequired,
    routines: PropTypes.object.isRequired,
    queries: PropTypes.object.isRequired,
    sqlscripts: PropTypes.object.isRequired,
    keys: PropTypes.object.isRequired,
    dispatch: PropTypes.func.isRequired,
    router: PropTypes.object.isRequired,
    params: PropTypes.object.isRequired,
    children: PropTypes.node,
  };

  constructor(props, context) {
    super(props, context);
    this.state = {
      tabNavPosition: 0,
      navBarPosition: 1,
      columnsFetched: false,
      schemaInfo: null,
      rowInfo: null,
      connPoolInfo: [5],
      runModalOpen: false,
      loadedQueries: false,
      isTesting: false,
      message: '',
      percentage: 0,
      trialNum: 0,
      log: [],
      logTimer: 0,
    };
    this.menuHandler = new MenuHandler();
  }

  componentWillMount() {
    const { dispatch, params } = this.props;
    dispatch(ConnActions.connect(params.id));
  }

  componentDidMount() {
    this.setMenus();
  }

  componentWillReceiveProps(nextProps) {
    const { dispatch, router, connections, columns, queries } = nextProps;

    if (
      connections.error ||
      (!connections.connecting && !connections.server && !connections.waitingSSHPassword)
    ) {
      router.push('/');
      return;
    }

    if (!connections.connected) {
      return;
    }

    // If connected for the first time, load query
    if (connections !== this.props.connections) {
      dispatch(QueryActions.setQueryState(fillQueryInfo(queries, connections.server)));
      this.setState({ loadedQueries: true });
    }

    const lastConnectedDB = connections.databases[connections.databases.length - 1];
    const filter = connections.server.filter;
    const dbName = connections.server.database;

    // When query changes, store query
    if (queries !== this.props.queries && this.state.loadedQueries) {
      storeQueryInfo(queries, connections.server);
    }
    dispatch(DbAction.fetchDatabasesIfNeeded(filter));
    dispatch(fetchSchemasIfNeeded(lastConnectedDB));
    dispatch(fetchTablesIfNeeded(lastConnectedDB, filter));
    dispatch(fetchViewsIfNeeded(lastConnectedDB, filter));
    dispatch(fetchRoutinesIfNeeded(lastConnectedDB, filter));
    if (this.props.tables.itemsByDatabase[dbName] && this.state.columnsFetched === false) {
      this.setState({ columnsFetched: true });
      const systemSchemas = ['pg_catalog', 'information_schema'];
      const userTables = this.props.tables.itemsByDatabase[dbName].filter(
        table => !systemSchemas.includes(table.schema)
      );
      userTables.forEach(table => this.onSelectTable(dbName, table));
    }

    // Generating schema and config information based on data retrieved
    if (columns !== this.props.columns) {
      console.log('REFRESH SCHEMAINFO');
      const tableInfo = columns.columnsByTable[dbName];
      let schemaInfo = null;
      let rowInfo = null;
      if (tableInfo) {
        const dbType = connections.server.client;
        schemaInfo = Object.entries(columns.columnsByTable[dbName]).map(([key, value]) => [
          key,
          value.map(field =>
            Object.assign({}, field, {
              index: false,
              pk: false,
              unique: false,
              fk: false,
              nullable: false,
              nullRate: 0,
              manyToOne: false,
              foreignTarget: null,
              configuredType: '',
              mappedType: mapTypes(field.dataType, dbType),
              generator: DEFAULT_GENERATOR,
              sorted: false,
            })
          ),
        ]);
        rowInfo = Object.entries(columns.columnsByTable[dbName]).map(key => [key[0], [1]]);
        this.setState({
          schemaInfo: fillSchemaInfo(schemaInfo, connections.server),
          rowInfo: fillRowInfo(rowInfo, connections.server),
          connPoolInfo: fillConnInfo(this.state.connPoolInfo, connections.server),
        });
      }
    }

    this.setMenus();
  }

  componentDidUpdate() {
    const elem = ReactDOM.findDOMNode(this.refs.tabList);
    if (!elem) {
      return;
    }

    this.tabListTotalWidth = elem.offsetWidth;
    this.tabListTotalWidthChildren = 0;
    for (const child of elem.children) {
      this.tabListTotalWidthChildren += child.offsetWidth;
    }
  }

  componentWillUnmount() {
    this.menuHandler.removeAllMenus();
  }

  onCloseConnectionClick() {
    const { dispatch, connections } = this.props;
    if (this.state.schemaInfo) {
      storeSchemaInfo(this.state.schemaInfo, connections.server);
    }
    dispatch(ConnActions.disconnect());
  }

  onReConnectionClick() {
    const { dispatch, params } = this.props;
    dispatch(ConnActions.reconnect(params.id, this.getCurrentQuery().database));
  }

  onRefreshDatabase(database) {
    const { dispatch } = this.props;
    dispatch(DbAction.refreshDatabase(database));
  }

  onPromptCancelClick() {
    const { dispatch } = this.props;
    dispatch(ConnActions.disconnect());
  }

  onPromptOKClick(password) {
    const { dispatch, params } = this.props;
    dispatch(ConnActions.connect(params.id, null, false, password));
  }

  onSelectTable(dbName, table) {
    const schema = table.schema || this.props.connections.server.schema;
    this.props.dispatch(fetchTableColumnsIfNeeded(dbName, table.name, schema));
    this.props.dispatch(fetchTableTriggersIfNeeded(dbName, table.name, schema));
    this.props.dispatch(fetchTableIndexesIfNeeded(dbName, table.name, schema));
  }

  // Functions for modifying schemaInfo
  onSetField(tableIndex, fieldIndex, attribute, value) {
    const schemaInfo = [...this.state.schemaInfo];
    // const prefix = localStoragePrefix(this.props.connections.server);
    if (schemaInfo && schemaInfo[tableIndex] && schemaInfo[tableIndex][1][fieldIndex]) {
      schemaInfo[tableIndex][1][fieldIndex][attribute] = value;
      // if we unToggle fk, foreign target must be reset to null
      if (attribute === 'fk' && value === false) {
        schemaInfo[tableIndex][1][fieldIndex].foreignTarget = null;
      }
      // if we change configuredType, generator must be reset to default
      if (attribute === 'configuredType') {
        schemaInfo[tableIndex][1][fieldIndex].generator = DEFAULT_GENERATOR;
      }
      storeSchemaInfo(schemaInfo, this.props.connections.server);
      this.setState({ schemaInfo });
    }
  }

  onSelectField(tableIndex, fieldIndex, attribute, value) {
    const schemaInfo = [...this.state.schemaInfo];
    if (schemaInfo && schemaInfo[tableIndex] && schemaInfo[tableIndex][1][fieldIndex]) {
      if (value === 'null') {
        value = null;
      } else {
        value = JSON.parse(value);
      }
      schemaInfo[tableIndex][1][fieldIndex][attribute] = value;
      storeSchemaInfo(schemaInfo, this.props.connections.server);
      this.setState({ schemaInfo });
    }
  }

  // Modifying rowInfo
  onSetRowItem(tableIndex, testIndex, value) {
    const rowInfo = cloneDeep(this.state.rowInfo);
    rowInfo[tableIndex][1][testIndex] = value;
    storeRowInfo(rowInfo, this.props.connections.server);
    this.setState({ rowInfo });
  }

  onAddRow() {
    let rowInfo = cloneDeep(this.state.rowInfo);
    rowInfo = rowInfo.map(([key, value]) => [key, [...value, value[value.length - 1]]]);
    storeRowInfo(rowInfo, this.props.connections.server);
    this.setState({ rowInfo });
  }

  onRemoveRow(rowIndex) {
    const rowInfo = cloneDeep(this.state.rowInfo);
    rowInfo.forEach(([key, value]) => value.splice(rowIndex, 1));
    storeRowInfo(rowInfo, this.props.connections.server);
    this.setState({ rowInfo });
  }

  // Modifying connPoolInfo
  onSetConnValue(index, value) {
    const connPoolInfo = [...this.state.connPoolInfo];
    connPoolInfo[index] = value;
    storeConnInfo(connPoolInfo, this.props.connections.server);
    this.setState({ connPoolInfo });
  }

  onAddConn() {
    const lastItem = this.state.connPoolInfo[this.state.connPoolInfo.length - 1];
    const connPoolInfo = [...this.state.connPoolInfo, lastItem];
    storeConnInfo(connPoolInfo, this.props.connections.server);
    this.setState({ connPoolInfo });
  }

  onRemoveConn(index) {
    const connPoolInfo = [...this.state.connPoolInfo];
    connPoolInfo.splice(index, 1);
    storeConnInfo(connPoolInfo, this.props.connections.server);
    this.setState({ connPoolInfo });
  }

  // FOR GENERIC FUNCTIONS
  setMenus() {
    this.menuHandler.setMenus({
      'sqlectron:query-execute': () => {
        const { queries: { queriesById, currentQueryId } } = this.props;
        const currentQuery = queriesById[currentQueryId];
        this.handleExecuteQuery(currentQuery.selectedQuery || currentQuery.query);
      },
      'sqlectron:new-tab': () => this.newTab(),
      'sqlectron:close-tab': () => this.closeTab(),
      'sqlectron:save-query': () => this.saveQuery(),
      'sqlectron:open-query': () => this.openQuery(),
      'sqlectron:query-focus': () => this.focusQuery(),
      'sqlectron:toggle-database-search': () => this.toggleDatabaseSearch(),
      'sqlectron:toggle-database-objects-search': () => this.toggleDatabaseObjectsSearch(),
    });
  }

  getCurrentQuery() {
    return this.props.queries.queriesById[this.props.queries.currentQueryId];
  }

  changeNavBarPosition(pos) {
    this.setState({ navBarPosition: pos });
  }

  print() {
    // console.log(this.state.schemaInfo);
    console.log(this.props.queries);
    // console.log(this.props.connections);
    // console.log(localStoragePrefix(this.props.connections.server));
  }

  // Stuff for queries
  onSQLChange(sqlQuery) {
    this.props.dispatch(QueryActions.updateQueryIfNeeded(sqlQuery));
  }

  onQuerySelectionChange(sqlQuery, selectedQuery) {
    this.props.dispatch(QueryActions.updateQueryIfNeeded(sqlQuery, selectedQuery));
  }

  copyToClipboard(rows, type) {
    this.props.dispatch(QueryActions.copyToClipboard(rows, type));
  }

  saveToFile(rows, type) {
    this.props.dispatch(QueryActions.saveToFile(rows, type));
  }

  handleExecuteQuery(sqlQuery, schemaInfo) {
    const currentQuery = this.getCurrentQuery();
    if (!currentQuery) {
      return;
    }
    const parsedQuery = parseQuery(sqlQuery, schemaInfo);
    this.props.dispatch(QueryActions.executeQueryIfNeeded(parsedQuery, currentQuery.id));
  }

  handleCancelQuery() {
    const currentQuery = this.getCurrentQuery();
    if (!currentQuery) {
      return;
    }

    this.props.dispatch(QueryActions.cancelQuery(currentQuery.id));
  }

  handleSelectTab(index) {
    const queryId = this.props.queries.queryIds[index];
    this.props.dispatch(QueryActions.selectQuery(queryId));
  }

  newTab() {
    this.props.dispatch(QueryActions.newQuery(this.getCurrentQuery().database));
  }

  closeTab() {
    this.removeQuery(this.props.queries.currentQueryId);
  }

  removeQuery(queryId) {
    this.props.dispatch(QueryActions.removeQuery(queryId));
  }

  onTabDoubleClick(queryId) {
    this.setState({ renamingTabQueryId: queryId });
  }

  // Display Run Modal
  hideRunModal() {
    this.setState({ runModalOpen: false });
  }

  showRunModal() {
    this.setState({ runModalOpen: true });
  }

  // Run Modal events
  setIsTesting(isTesting) {
    this.setState({ isTesting, logTimer: Date.now() });
  }

  setMessage(message) {
    // Also add to log [message, percentage, timeElapsed]
    const logTimer = this.state.logTimer === 0 ? Date.now() : this.state.logTimer;
    const newLog = [
      `Test ${this.state.trialNum}: ${message}`,
      this.state.percentage,
      Date.now() - logTimer,
    ];
    this.setState({ message, log: [...this.state.log, newLog] });
  }

  setPercentage(rawPercentage) {
    const percentage = Math.round(rawPercentage * 10000) / 100;
    this.setState({ percentage });
  }

  setTrialNum(trialNum) {
    this.setState({ trialNum });
  }

  // Render
  renderTabQueries() {
    const {
      dispatch,
      connections,
      queries,
      databases,
      schemas,
      tables,
      columns,
      triggers,
      indexes,
      views,
      routines,
    } = this.props;

    const currentDB = this.getCurrentQuery().database;

    const menu = queries.queryIds.map(queryId => {
      const isCurrentQuery = queryId === queries.currentQueryId;
      const buildContent = () => {
        const isRenaming = this.state.renamingTabQueryId === queryId;
        if (isRenaming) {
          return (
            <div className="ui input">
              <input
                className="pt-input pt-intent-primary"
                autoFocus
                type="text"
                ref={comp => {
                  this.tabInput = comp;
                }}
                onBlur={() => {
                  dispatch(QueryActions.renameQuery(this.tabInput.value));
                  this.setState({ renamingTabQueryId: null });
                }}
                onKeyDown={event => {
                  if (event.key !== 'Escape' && event.key !== 'Enter') {
                    return;
                  }

                  if (event.key === 'Enter') {
                    dispatch(QueryActions.renameQuery(this.tabInput.value));
                  }

                  this.setState({ renamingTabQueryId: null });
                }}
                defaultValue={queries.queriesById[queryId].name}
              />
            </div>
          );
        }

        return (
          <div>
            {queries.queriesById[queryId].name}
            <button
              className="pt-button pt-small pt-icon-cross pt-minimal"
              onClick={debounce(() => {
                this.removeQuery(queryId);
                const position = this.state.tabNavPosition + 200;
                this.setState({ tabNavPosition: position > 0 ? 0 : position });
              }, 200)}
            />
          </div>
        );
      };

      return (
        <Tab
          key={queryId}
          onDoubleClick={() => this.onTabDoubleClick(queryId)}
          className="pt-tab"
          aria-selected={
            isCurrentQuery && this.state.renamingTabQueryId === null ? 'true' : 'false'
          }
          style={{ position: 'relative', top: '2px', margin: '0px 5px' }}
        >
          {buildContent()}
        </Tab>
      );
    });

    const { disabledFeatures } = sqlectron.db.CLIENTS.find(
      dbClient => dbClient.key === connections.server.client
    );

    const allowCancel = !disabledFeatures || !~disabledFeatures.indexOf('cancelQuery');

    // const query = queries.queriesById[queries.currentQueryId];
    // const queryPanel = (<div key='only'><Query
    //   // ref={`queryBox_${queryId}`}
    //   editorName={'querybox'}
    //   client={connections.server.client}
    //   allowCancel={allowCancel}
    //   query={query}
    //   enabledAutoComplete={queries.enabledAutoComplete}
    //   enabledLiveAutoComplete={queries.enabledLiveAutoComplete}
    //   database={currentDB}
    //   databases={databases.items}
    //   schemas={schemas.itemsByDatabase[query.database]}
    //   tables={tables.itemsByDatabase[query.database]}
    //   columnsByTable={columns.columnsByTable[query.database]}
    //   triggersByTable={triggers.triggersByTable[query.database]}
    //   indexesByTable={indexes.indexesByTable[query.database]}
    //   views={views.viewsByDatabase[query.database]}
    //   functions={routines.functionsByDatabase[query.database]}
    //   procedures={routines.proceduresByDatabase[query.database]}
    //   widthOffset={0}
    //   onExecQueryClick={currQuery =>
    //     ::this.handleExecuteQuery(currQuery, this.state.schemaInfo)
    //   }
    //   onCancelQueryClick={::this.handleCancelQuery}
    //   onCopyToClipboardClick={::this.copyToClipboard}
    //   onSaveToFileClick={::this.saveToFile}
    //   onSQLChange={::this.onSQLChange}
    //   onSelectionChange={::this.onQuerySelectionChange}
    // /></div>);
    const panels = queries.queryIds.map(queryId => {
      const query = queries.queriesById[queryId];

      return (
        <TabPanel key={queryId}>
          <Query
            key={queryId}
            // ref={`queryBox_${queryId}`}
            editorName={`querybox${queryId}`}
            client={connections.server.client}
            allowCancel={allowCancel}
            query={query}
            enabledAutoComplete={queries.enabledAutoComplete}
            enabledLiveAutoComplete={queries.enabledLiveAutoComplete}
            database={currentDB}
            databases={databases.items}
            schemas={schemas.itemsByDatabase[query.database]}
            tables={tables.itemsByDatabase[query.database]}
            columnsByTable={columns.columnsByTable[query.database]}
            triggersByTable={triggers.triggersByTable[query.database]}
            indexesByTable={indexes.indexesByTable[query.database]}
            views={views.viewsByDatabase[query.database]}
            functions={routines.functionsByDatabase[query.database]}
            procedures={routines.proceduresByDatabase[query.database]}
            widthOffset={0}
            onExecQueryClick={currQuery =>
              ::this.handleExecuteQuery(currQuery, this.state.schemaInfo)
            }
            onCancelQueryClick={::this.handleCancelQuery}
            onCopyToClipboardClick={::this.copyToClipboard}
            onSaveToFileClick={::this.saveToFile}
            onSQLChange={::this.onSQLChange}
            onSelectionChange={::this.onQuerySelectionChange}
          />
        </TabPanel>
      );
    });

    // const isOnMaxPosition =
    //   this.tabListTotalWidthChildren - Math.abs(this.state.tabNavPosition) <=
    //   this.tabListTotalWidth;
    const selectedIndex = queries.queryIds.indexOf(queries.currentQueryId);
    // const isTabsFitOnScreen = this.tabListTotalWidthChildren >= this.tabListTotalWidth;
    return (
      <Tabs onSelect={::this.handleSelectTab} selectedIndex={selectedIndex} forceRenderTabPanel>
        <div id="tabs-nav-wrapper" className="ui pointing secondary menu">
          <div style={{ overflowX: 'auto' }}>
            <TabList
              ref="tabList"
              style={{
                border: 'none',
              }}
            >
              <div className="pair-label-switch-container">{menu}</div>
            </TabList>
          </div>
          <button
            className="pt-button pt-minimal pt-icon-plus pt-intent-primary"
            onClick={() => this.newTab()}
          />
        </div>
        {panels}
      </Tabs>
    );
  }

  render() {
    const {
      schemaInfo,
      rowInfo,
      connPoolInfo,
      runModalOpen,
      isTesting,
      message,
      percentage,
      trialNum,
      log,
    } = this.state;
    const { status, connections, queries } = this.props;

    if (connections.waitingPrivateKeyPassphrase) {
      return (
        <PromptModal
          type="password"
          title={'SSH Private Key Passphrase'}
          message="Enter the private key passphrase:"
          onCancelClick={::this.onPromptCancelClick}
          onOKClick={::this.onPromptOKClick}
        />
      );
    }

    const isLoading = !connections.connected;
    if (isLoading && (!connections.server || !this.getCurrentQuery())) {
      return <Loader message={status} type="page" />;
    }

    let MainDisplay = null;
    if (this.state.navBarPosition === 0) {
      MainDisplay = !connections.server ? <div /> : <HistoryDisplay server={connections.server} />;
    } else {
      MainDisplay = (
        <Tabs2 id="TabsExample" selectedTabId={this.testTabPosition}>
          <Tab2
            id="0"
            title="Schema"
            panel={
              <div className="bordered-area">
                <SchemaPanel
                  schemaInfo={schemaInfo}
                  onSetField={::this.onSetField}
                  onSelectField={::this.onSelectField}
                />
              </div>
            }
          />
          <Tab2
            id="1"
            title="Data"
            panel={
              <div className="bordered-area">
                <DataPanel
                  schemaInfo={schemaInfo}
                  onSetField={::this.onSetField}
                  onSelectField={::this.onSelectField}
                />
              </div>
            }
          />
          <Tab2
            id="2"
            title="Rows"
            panel={
              <div className="bordered-area">
                {rowPanel(
                  schemaInfo,
                  rowInfo,
                  ::this.onSetRowItem,
                  ::this.onAddRow,
                  ::this.onRemoveRow
                )}
              </div>
            }
          />
          <Tab2
            id="3"
            title="Queries"
            panel={<div className="query-container bordered-area">{this.renderTabQueries()} </div>}
          />
          <Tab2
            id="4"
            title="Connections"
            panel={
              <div className="bordered-area">
                {connPoolPanel(
                  connPoolInfo,
                  ::this.onSetConnValue,
                  ::this.onAddConn,
                  ::this.onRemoveConn
                )}
              </div>
            }
          />
          <Tabs2.Expander />
          <button
            className="pt-button pt-large pt-intent-primary"
            title="Run"
            onClick={::this.showRunModal}
          >
            Run
          </button>
        </Tabs2>
      );
    }

    return (
      <div style={STYLES.wrapper}>
        {isLoading && <Loader message={status} type="page" />}
        <div style={STYLES.header}>
          <Header
            imagePath={CLIENTS[connections.server.client].image}
            serverName={connections.server.name}
            dbName={this.getCurrentQuery().database}
            changeNavBarPosition={::this.changeNavBarPosition}
            navBarPosition={this.state.navBarPosition}
            onCloseConnectionClick={::this.onCloseConnectionClick}
            onReConnectionClick={::this.onReConnectionClick}
          />
        </div>
        <Modal show={runModalOpen} onHide={::this.hideRunModal} dialogClassName="full-screen-modal">
          <RunModal
            server={connections.server}
            schemaInfo={schemaInfo}
            rowInfo={rowInfo}
            queries={queries}
            connInfo={connPoolInfo}
            handleClose={::this.hideRunModal}
            isTesting={isTesting}
            message={message}
            percentage={percentage}
            trialNum={trialNum}
            log={log}
            setIsTesting={::this.setIsTesting}
            setMessage={::this.setMessage}
            setPercentage={::this.setPercentage}
            setTrialNum={::this.setTrialNum}
          />
        </Modal>
        <div style={{ padding: '100px' }}>{MainDisplay}</div>
        <div style={STYLES.footer}>
          <Footer status={status} />
        </div>
      </div>
    );
  }
}

function mapStateToProps(state) {
  const {
    connections,
    databases,
    schemas,
    tables,
    columns,
    triggers,
    indexes,
    views,
    routines,
    queries,
    sqlscripts,
    keys,
    status,
  } = state;

  return {
    connections,
    databases,
    schemas,
    tables,
    columns,
    triggers,
    indexes,
    views,
    routines,
    queries,
    sqlscripts,
    keys,
    status,
  };
}

export default connect(mapStateToProps)(withRouter(DbBrowserContainer));
