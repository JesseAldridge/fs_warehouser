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

function load_scrapers(scraper_paths) {
  const scrapers = []
  timestamped_log('loading scrapers:', scraper_paths)
  scraper_paths.forEach(function(scraper_path) {
    const name = path.basename(scraper_path)
    if(name[0] == '_') {
      timestamped_log('ignoring:', scraper_path)
      return
    }
    scrapers.push({
      module: require(scraper_path),
      name: name,
      path: scraper_path,
    })
  })
  return scrapers
}

async function run_scrapers(scraper_paths, headless, data_dir_path, is_test) {
  headless = !!headless
  const scrapers = load_scrapers(scraper_paths)
  timestamped_log('running scrapers')
  const browser = await puppeteer.launch({
    headless: headless,
  });
  const page = (await browser.pages())[0] || (await browser.newPage());
  await page.setUserAgent(
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) ' +
    'Chrome/61.0.3163.100 Safari/537.36'
  );
  const date_str = moment(new Date()).local().format('YYYY-MM-DD_hh-mm')
  const original_dir = process.cwd()
  try {
    for(let i = 0; i < scrapers.length; i++) {
      const scraper = scrapers[i]
      const scrapers_dir_path = path.dirname(scraper.path)
      process.chdir(scrapers_dir_path)
      try_scraper(scraper, page, is_test, date_str, data_dir_path)
    }
  } finally {
    timestamped_log('chdir')
    process.chdir(original_dir)
  }
  timestamped_log('browser close')
  browser.close()
}

async function try_scraper(scraper, page, is_test, date_str, data_dir_path) {
  try {
    await run_single_scraper(scraper, page, is_test, date_str, data_dir_path)
  } catch(err) {
    timestamped_log('scraper error:', scraper.name, err);
    console.log(err.stack);
  }
}

async function run_loop(scraper_paths, headless, data_dir_path, is_test) {
  data_dir_path = expandHomeDir(data_dir_path)
  await run_scrapers(scraper_paths, headless, data_dir_path, is_test)
  timestamped_log(`${new Date()}, done scraping, sleeping for 24 hours`)
  setTimeout(() => { run_loop(Array.prototype.slice.call(arguments)) }, 1000 * 60 * 60 * 24)
}

async function run_vanilla_scraper(scraper, data_dir_path, is_test) {
  data_dir_path = expandHomeDir(data_dir_path)
  const date_str = moment(new Date()).local().format('YYYY-MM-DD_hh-mm')
  await try_scraper(scraper, null, is_test, date_str, data_dir_path)
  timestamped_log(`${new Date()}, done scraping, sleeping for 24 hours`)
  setTimeout(async () => {
    await run_vanilla_scraper(Array.prototype.slice.call(arguments))
  }, 1000 * 60 * 60 * 24)
}

async function run_single_scraper(scraper, page, is_test, date_str, data_dir_path) {
  timestamped_log('running scraper:', scraper.name)

  function write_to_scraper_dir(filename, obj) {
    const file_path = path.join(data_dir_path, date_str, scraper.name, filename)
    const file_path_with_exten = write_file(file_path, obj)
    timestamped_log('wrote results to:', file_path_with_exten)
  }

  await scraper.module.main(page, is_test, write_to_scraper_dir)
}

async function main() {
  timestamped_log('main, process.argv:', process.argv)
  const headless = false;
  if(process.argv.length <= 2) {
    const scrapers_dir_path = expand_home_dir('~/Dropbox/puppet_warehouse_scrapers')
    const scraper_paths = glob.sync(path.join(scrapers_dir_path, '*.js'))
    await run_loop(scrapers_glob_path, headless, '~/puppet_warehouse_data');
  }
  else {
    await run_loop(process.argv[process.argv.length - 1], headless)
    timestamped_log('done')
  }
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

function get_last_timestamped_dir_path(data_dir_path, scraper_name) {
  const glob_path = path.join(expandHomeDir(data_dir_path), '2*', scraper_name)
  const date_paths = glob.sync(glob_path)
  date_paths.sort()
  return date_paths[date_paths.length - 1] || null
}

if(typeof exports != 'undefined') {
  exports.write_file = write_file
  exports.run_loop = run_loop
  exports.get_last_timestamped_dir_path = get_last_timestamped_dir_path
  exports.run_vanilla_scraper = run_vanilla_scraper
}
