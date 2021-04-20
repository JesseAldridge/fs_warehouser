const fs = require('fs')
const path = require('path')

const puppeteer = require('puppeteer')
const shell = require('shelljs')
const Papa = require('papaparse')
const glob = require('glob')
const moment = require('moment')
const expandHomeDir = require('expand-home-dir')


function timestamped_log() {
  console.log(`${new Date()}:`, Array.prototype.slice.call(arguments).join(' '))
}

async function run_loop(scraper, data_dir_path, is_test, sleep_time) {
  data_dir_path = expandHomeDir(data_dir_path)
  const date_str = moment(new Date()).local().format('YYYY-MM-DD_hh-mm')

  try {
    await run_once(scraper, is_test, date_str, data_dir_path)
  } catch(err) {
    timestamped_log('scraper error:', err);
    console.log(err.stack);
  }

  sleep_time = sleep_time || 24 * 60 * 60 * 1000
  timestamped_log(`${new Date()}, done scraping, sleeping for ${sleep_time / 1000 / 60 / 60} hours`)
  const original_arguments = arguments
  setTimeout(async () => {
    await run_loop(scraper, data_dir_path, is_test, sleep_time)
  }, sleep_time || 1000 * 60 * 60 * 24)
}

async function run_once(scraper, is_test, date_str, data_dir_path) {
  timestamped_log('running scraper')

  function write_to_scraper_dir(filename, obj) {
    const file_path = path.join(data_dir_path, date_str, filename)
    const file_path_with_exten = write_file(file_path, obj)
    timestamped_log('wrote results to:', file_path_with_exten)
  }

  await scraper.main(is_test, write_to_scraper_dir)
}

function write_file(file_path, obj) {
  const dir_path = path.dirname(file_path)
  if(!fs.existsSync(dir_path))
    // is sync
    shell.mkdir('-p', dir_path)

  let text = null, exten = null
  if(Array.isArray(obj) && (obj.length == 0 || Array.isArray(obj[0]))) {
    exten = '.csv'
    text = Papa.unparse(obj)
  }
  else {
    exten = '.json'
    text = JSON.stringify(obj, null, 2)
  }

  file_path += exten
  fs.writeFileSync(file_path, text)
  return file_path
}

function get_last_timestamped_dir_path(data_dir_path) {
  const glob_path = path.join(expandHomeDir(data_dir_path), '2*')
  const date_paths = glob.sync(glob_path)
  date_paths.sort()
  return date_paths[date_paths.length - 1] || null
}

if(typeof exports != 'undefined') {
  exports.write_file = write_file
  exports.get_last_timestamped_dir_path = get_last_timestamped_dir_path
  exports.run_loop = run_loop
}
