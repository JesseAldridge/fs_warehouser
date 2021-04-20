const fs_warehouser = require('./index')

fs_warehouser.run_loop({
  name: 'test scraper',
  main: async (is_test, write_to_scraper_dir) => {
    const page = fs_warehouser.launch_puppeteer()
    console.log("this is a fake scraper that doesn't do anything")
    write_to_scraper_dir('fake_scraper', [1,2,3])
  }
}, '~/fake_scraper_data', false, 5 * 1000)
