import os, glob

def get_last_timestamped_dir_path(data_dir_path):
  glob_path = os.path.join(os.path.expanduser(data_dir_path), '2*')
  date_paths = glob.glob(glob_path)
  date_paths.sort()
  return date_paths[-1] if date_paths else None

if __name__ == '__main__':
  print(get_last_timestamped_dir_path('~/fake_scraper_data'))
