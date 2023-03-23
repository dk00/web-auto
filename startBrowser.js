const startBrowser = async ({
  port = +process.env.DRIVER_PORT || 9515,
  profilePath = './.profile',
} = {}) => {
  const {remote} = require('webdriverio')
  const ChromeDriver = require('chromedriver')
  await ChromeDriver.start([`--port=${port}`], true)

  return remote({
    port,
    path: '/',
    logLevel: 'error',
    capabilities: {
      browserName: 'chrome',
      'goog:chromeOptions': {
        args: [`user-data-dir=${profilePath}`],
      },
    },
  })
}

module.exports = startBrowser
