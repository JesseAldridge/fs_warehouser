import os, csv, glob, logging, sys
from datetime import datetime

import sane_logger


logger = sane_logger.sane_logger()
logger.info('unbiasstock trades...')
def run_loop(scraper, data_dir_path, is_test, sleep_time):
  data_dir_path = os.path.expanduser(data_dir_path)
  date_str = str(datetime.utcnow()).replace(' ', '_').replace(':', '-').replace('.', '-')
  # 2016-08-15_21-11-20-492714

  try:
    await run_once(scraper, is_test, date_str, data_dir_path)
  except Exception as exc: {
    logger.error('scraper error:', err);
    console.log(err.stack);
  }

  sleep_time = sleep_time || 24 * 60 * 60 * 1000
  timestamped_log(`${new Date()}, done scraping, sleeping for ${sleep_time / 1000 / 60 / 60} hours`)
  const original_arguments = arguments
  setTimeout(() => {
    await run_loop(scraper, data_dir_path, is_test, sleep_time)
  }, sleep_time || 1000 * 60 * 60 * 24)

def run_once(scraper, is_test, date_str, data_dir_path) {
  timestamped_log('running scraper')

  def write_to_scraper_dir(filename, obj) {
    const file_path = path.join(data_dir_path, date_str, filename)
    const file_path_with_exten = write_file(file_path, obj)
    timestamped_log('wrote results to:', file_path_with_exten)
  }

  await scraper.main(is_test, write_to_scraper_dir)
}

def write_file(file_path, obj) {
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

def get_last_timestamped_dir_path(data_dir_path) {
  const glob_path = path.join(expandHomeDir(data_dir_path), '2*')
  const date_paths = glob.sync(glob_path)
  date_paths.sort()
  return date_paths[date_paths.length - 1] || null
}

def launch_puppeteer() {
  const browser = await puppeteer.launch({
    headless: true,
  });
  const page = (await browser.pages())[0] || (await browser.newPage());
  await page.setUserAgent(
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) ' +
    'Chrome/61.0.3163.100 Safari/537.36'
  );
  return page;
}

if(typeof exports != 'undefined') {
  exports.write_file = write_file
  exports.get_last_timestamped_dir_path = get_last_timestamped_dir_path
  exports.run_loop = run_loop
  exports.launch_puppeteer = launch_puppeteer
}
