import React, { Component, PropTypes } from 'react';
import { Table } from 'react-bootstrap';
import { Tab, Tabs } from '@blueprintjs/core';
import ReactTable from 'react-table';
import matchSorter from 'match-sorter';
import { ScatterplotChart, Legend } from 'react-easy-chart';

import {
  APP_DATA_PATH,
  QUERY_RESULTS_PATH,
  getPersistentStore,
} from '../run-test/persistant-storage.js';
import 'react-table/react-table.css';

const dbData = getPersistentStore(`${APP_DATA_PATH}/db`);
const testData = getPersistentStore(`${APP_DATA_PATH}/test`);

function selectColor(colorNum, colors) {
  if (colors < 1) colors = 1; // defaults to one color - avoid divide by zero
  return 'hsl(' + (colorNum * (360 / colors)) % 360 + ',100%,50%)';
}

function numberSearcher(rawSearchStr, val) {
  const searchStr = rawSearchStr.trim();
  if (searchStr.includes('&&')) {
    const index = searchStr.indexOf('&&');
    return (
      numberSearcher(searchStr.slice(0, index), val) &&
      numberSearcher(searchStr.slice(index + 2), val)
    );
  }
  if (searchStr.includes('||')) {
    const index = searchStr.indexOf('||');
    return (
      numberSearcher(searchStr.slice(0, index), val) ||
      numberSearcher(searchStr.slice(index + 2), val)
    );
  }
  if (searchStr.startsWith('>=')) {
    const searchNum = Number(searchStr.slice(2));
    return val >= searchNum;
  }
  if (searchStr.startsWith('<=')) {
    const searchNum = Number(searchStr.slice(2));
    return val <= searchNum;
  }
  if (searchStr.startsWith('>')) {
    const searchNum = Number(searchStr.slice(1));
    return val > searchNum;
  }
  if (searchStr.startsWith('<')) {
    const searchNum = Number(searchStr.slice(1));
    return val < searchNum;
  }
  if (searchStr.startsWith('=')) {
    const searchNum = Number(searchStr.slice(1));
    return val === searchNum;
  }
  return val.toString().includes(searchStr);
}

function testRecordsToRows(tests, setCurrentTest) {
  return tests.map(test => (
    <tr key={test._id} className="clickableRow" onClick={() => setCurrentTest(test._id)}>
      <td>{test.testName}</td>
      <td>{new Date(test.testDate).toString()}</td>
      <td>{test.testDetails}</td>
    </tr>
  ));
}

function queriesToKeys(queries) {
  const tmp = Object.entries(queries[0]).map(([k, v]) => k);
  return tmp.filter(k => k !== '_id' && k !== 'TestId' && k !== 'TimeTaken');
}

function keysToOptions(keys) {
  return keys.map(key => (
    <option key={key} value={key}>
      {key}
    </option>
  ));
}

function queriesToColumns(queries) {
  const arr = [];
  Object.entries(queries[0]).forEach(([key, val]) => {
    if (key !== '_id' && key !== 'TestId') {
      if (key === 'Query' || key === 'TemplateName') {
        arr.push({
          Header: key,
          accessor: key,
          filterMethod: (filter, rows) => matchSorter(rows, filter.value, { keys: [key] }),
          filterAll: true,
        });
      } else {
        arr.push({
          Header: key,
          accessor: key,
          filterMethod: (filter, row) => numberSearcher(filter.value, row[filter.id]),
        });
      }
    }
  });
  return arr;
}

function getCurrentQueries(queries, filters) {
  if (!filters) {
    return queries;
  }
  let currentQueries = queries;
  filters.forEach(({ id, value }) => {
    if (id === 'Query' || id === 'TemplateName') {
      currentQueries = matchSorter(currentQueries, value, { keys: [id] });
    } else {
      currentQueries = currentQueries.filter(query => numberSearcher(value, query[id]));
    }
  });
  return currentQueries;
}

function queriesToDatapoints(queries, typeKey, xAxisKey) {
  let totalColors = 0;
  let colorConfig = {};
  const datapoints = queries.map(query => {
    const datapoint = {};
    datapoint.y = query.TimeTaken;
    datapoint.type = query[typeKey] ? query[typeKey].toString() : 'unclassified';
    datapoint.x = query[xAxisKey] + Math.random();
    if (!colorConfig[datapoint.type]) {
      colorConfig[datapoint.type] = totalColors;
      totalColors += 1;
    }
    return datapoint;
  });
  colorConfig = Object.entries(colorConfig).map(([type, color]) => {
    return { type, color: selectColor(color, totalColors) };
  });
  return [datapoints, colorConfig];
}

class HistoryDisplay extends Component {
  static propTypes = {
    server: PropTypes.object.isRequired,
  };

  constructor(props, context) {
    super(props, context);
    this.state = {
      dbId: '',
      currTestId: '',
      tests: [],
      queries: [],
      filters: [],
      xAxisKey: 'TotalRows',
      groupBy: 'TemplateName',
    };
  }

  componentDidMount() {
    const { server } = this.props;

    // Pulling Test data from nedb
    const dbRecord = {
      client: server.client,
      host: server.host,
      port: server.port,
      database: server.database,
    };
    dbData.findOne(dbRecord, (err, dbDoc) => {
      if (dbDoc) {
        testData.find({ dbId: dbDoc._id }, (err, testDocs) => {
          testDocs.sort((a, b) => b.testDate - a.testDate);
          this.setState({
            dbId: dbDoc._id,
            tests: testDocs,
          });
        });
      }
    });
  }

  setXAxis(xAxisKey) {
    this.setState({ xAxisKey });
  }

  setGroupings(groupBy) {
    this.setState({ groupBy });
  }

  setCurrentTest(currTestId) {
    if (currTestId === '') {
      this.setState({ queries: [] });
    } else {
      const queryData = getPersistentStore(`${QUERY_RESULTS_PATH}/${currTestId}`);
      queryData.find({}, (err, queries) => this.setState({ queries }));
    }
    this.setState({ currTestId });
  }

  render() {
    const { tests, queries, filters, currTestId, xAxisKey, groupBy } = this.state;
    if (currTestId === '' || queries.length === 0) {
      return (
        <Table striped bordered condensed>
          <thead>
            <tr>
              <th>Test Name</th>
              <th>Test Date</th>
              <th>Test Details</th>
            </tr>
          </thead>
          <tbody>{testRecordsToRows(tests, ::this.setCurrentTest)}</tbody>
        </Table>
      );
    }
    const filteredQueries = getCurrentQueries(queries, filters);
    const groupOptions = keysToOptions(queriesToKeys(queries));
    const xOptions = keysToOptions(
      queriesToKeys(queries).filter(k => typeof queries[0][k] === 'number')
    );
    const [data, config] = queriesToDatapoints(filteredQueries, groupBy, xAxisKey);
    console.log(data);
    console.log(config);

    return (
      <Tabs id="TabsExample">
        <Tab
          id="0"
          title="Graph"
          panel={
            <div className="bordered-area">
              <div className="table-container">
                <div className="pair-label-switch-container" style={{ padding: '10px' }}>
                  <div className="pair-label-switch-container">
                    <h5 className="vertical-text">Miliseconds taken to execute the query</h5>
                    <div>
                      <ScatterplotChart
                        data={data}
                        axes
                        axisLabels={{ x: 'My x Axis', y: 'My y Axis' }}
                        grid
                        width={500}
                        height={400}
                        config={config}
                      />
                      <h5
                        style={{
                          position: 'relative',
                          top: '-100px',
                          left: '-100px',
                          float: 'right',
                        }}
                      >
                        {xAxisKey}
                      </h5>
                    </div>
                  </div>
                  <div style={{ marginRight: '20px' }}>
                    <h2>Grouped by:</h2>
                    <h4>{groupBy}</h4>
                    <Legend data={data} dataId={'type'} config={config} />
                  </div>
                  <div>
                    <h2>Configurations</h2>
                    <label className="pt-label">
                      Select X Axis
                      <div className="pt-select" style={{ marginBottom: '5px' }}>
                        <select
                          defaultValue={xAxisKey}
                          onChange={e => this.setXAxis(e.target.value)}
                        >
                          <option value="">Select Data Type...</option>
                          {xOptions}
                        </select>
                      </div>
                    </label>
                    <label className="pt-label">
                      Groupings
                      <div className="pt-select" style={{ marginBottom: '5px' }}>
                        <select
                          defaultValue={groupBy}
                          onChange={e => this.setGroupings(e.target.value)}
                        >
                          <option value="">Select Groupings...</option>
                          {groupOptions}
                        </select>
                      </div>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          }
        />
        <Tab
          id="1"
          title="Data"
          panel={
            <div className="bordered-area">
              <div className="table-container">
                <ReactTable
                  filterable
                  data={queries}
                  columns={queriesToColumns(queries)}
                  onFilteredChange={filters => this.setState({ filters })}
                />
              </div>
            </div>
          }
        />
        <Tabs.Expander />
        <button
          className="pt-button pt-large pt-intent-primary"
          title="Back"
          onClick={() => ::this.setCurrentTest('')}
        >
          Back
        </button>
      </Tabs>
    );
  }
}

export default HistoryDisplay;
