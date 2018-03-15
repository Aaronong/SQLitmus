import electron from 'electron';
import fs from 'fs';
const Datastore = require('nedb');
const loadedDBs = {};

// Selecting storage path and ensuring that it exists
const BASE_PATH = `${electron.remote.app.getPath('userData')}/SpeedTest`;
const GENERATED_DATA_PATH = `${BASE_PATH}/generatedData`;
const APP_DATA_PATH = `${BASE_PATH}/appData`;
const QUERY_RESULTS_PATH = `${APP_DATA_PATH}/queries`;

if (!fs.existsSync(BASE_PATH)) {
  fs.mkdirSync(BASE_PATH);
  fs.mkdirSync(GENERATED_DATA_PATH);
  fs.mkdirSync(APP_DATA_PATH);
  fs.mkdirSync(QUERY_RESULTS_PATH);
}

function getPersistentStore(path) {
  if (!loadedDBs[path]) {
    loadedDBs[path] = new Datastore({ filename: path, autoload: true });
  }
  return loadedDBs[path];
}

export { BASE_PATH, GENERATED_DATA_PATH, APP_DATA_PATH, QUERY_RESULTS_PATH, getPersistentStore };
