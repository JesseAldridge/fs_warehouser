import os, csv, glob, logging, sys, traceback, time, json
from textwrap import indent
from datetime import datetime

import sane_logger


logger = sane_logger.sane_logger()

def run_loop(scraper_func, data_dir_path, is_test, sleep_ms):
  data_dir_path = os.path.expanduser(data_dir_path)

  while True:
    date_str = str(datetime.utcnow()).replace(' ', '_').replace(':', '-').replace('.', '-')
    # 2016-08-15_21-11-20-492714

    try:
      run_once(scraper_func, is_test, date_str, data_dir_path)
    except Exception as exc:
      logger.error(f"Scraper error: {exc}, {exc.args}")
      traceback.print_exc()

    sleep_ms = sleep_ms or (24 * 60 * 60 * 1000)
    logger.info(f'done scraping, sleeping for {sleep_ms / 1000 / 60 / 6:0.4f} hours')
    time.sleep(sleep_ms / 1000 or 60 * 60 * 24)

def run_once(scraper_func, is_test, date_str, data_dir_path):
  logger.info('running scraper')

  def write_to_scraper_dir(filename, obj):
    file_path = os.path.join(data_dir_path, date_str, filename)
    file_path_with_exten = write_file(file_path, obj)
    logger.info(f'wrote results to: {file_path_with_exten}')

  scraper_func(is_test, write_to_scraper_dir)

def write_file(file_path, obj):
  file_path = os.path.expanduser(file_path)
  dir_path = os.path.dirname(file_path)
  if not os.path.exists(dir_path):
    os.makedirs(dir_path)

  text, exten = None, None
  if isinstance(obj, str) or isinstance(obj, bytes):
    with open(file_path, 'w') as f:
      f.write(str(obj))
  elif file_path.endswith('csv'):
    with open(file_path, 'w') as f:
      csv.writer(f).writerows(obj)
  else:
    text = json.dumps(obj, indent=2)
    with open(file_path, 'w') as f:
      f.write(text)
  return file_path

def get_last_timestamped_dir_path(data_dir_path):
  glob_path = os.path.join(os.path.expanduser(data_dir_path), '2*')
  date_paths = glob.glob(glob_path)
  date_paths.sort()
  return date_paths[-1] if date_paths else None

def test():
  import requests

  print(get_last_timestamped_dir_path('~/fake_scraper_data'))

  write_file('~/fake_scraper_data/test.json', {'x': 1})

  def test_scraper_func(is_test, write_to_scraper_dir):
    resp = requests.get('https://google.com')
    write_to_scraper_dir('google.html', resp.content)

  run_once(
    scraper_func=test_scraper_func,
    is_test=True,
    date_str='3000_01_01',
    data_dir_path='~/fake_scraper_data',
  )

  run_loop(test_scraper_func, '~/fake_scraper_data', is_test=True, sleep_ms=1000)

if __name__ == '__main__':
  test()
