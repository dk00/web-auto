const {wait, click, delay} = require('./actions')
const startBrowser = require('./startBrowser')

const links = {
  start: 'https://apollo.mayohr.com/tube',
}

const selectors = {
  microsoftLogin: `a[href*="Microsoft"]`,
  apply: 'a[href*="applyform"]',
  leaveForm: '[data-formkind="KKC9.FORM.1004"]',
  startField: 'startdatetime_input',
  endField: 'enddatetime_input',
  leaveType: '#leavecode_input .k-input',
}

const locate = async client => {
  const url = await client.getUrl()
  return /mayohr/i.test(url) ? client.refresh() : client.url(links.start)
}

const ensureLoggedIn = async client => {
  const url = await client.getUrl()
  if (/login/i.test(url)) {
    return click(selectors.microsoftLogin)
  }
}

const pickDate = async (client, field, dateString) => {
  const date = new Date(dateString)
  // TODO endless recursion!
  const selector = `#fm_${field}datetime_dateview [data-value="${date.getFullYear()}/${date.getMonth()}/${date.getDate()}"]`
  if (await wait(client, selector, {time: 777})) {
    return click(client, selector)
  }
  await click(client, `#fm_${field}datetime_dateview .k-nav-next`)
  return pickDate(client, field, dateString)
}

const pickTime = async (client, time) => {
  const select = await client.$('[aria-hidden="false"]')
  console.log('Pick', time)
  await select.waitForExist(15000)
  const scrollPositions = {
    '09:00': 22150,
    '13:00': 32050,
    '14:00': 34515,
    '18:00': 44410,
  }
  await client.execute(
    `document.querySelectorAll('[aria-hidden="false"]')[0].scrollTop = ${scrollPositions[time]}`
  )
  const option = await select.$(`li*=${time}`)
  await option.click()
}

const pickDateTime = async (client, {field, date, time}) => {
  const fieldId = `${field}datetime_input`
  await wait(client, `#${fieldId} input`, {what: 'Clickable'})
  await click(client, `#${fieldId} input`)
  await pickDate(client, field, date)
  await delay()
  await wait(client, `[aria-controls="fm_${field}datetime_timeview"]`, {
    what: 'Clickable',
  })
  await click(client, `[aria-controls="fm_${field}datetime_timeview"]`)
  return pickTime(client, time)
}

const addDays = (date, days) => {
  const result = new Date(date)
  result.setDate(result.getDate() + days)
  return result
}

const leave = async (client, {startDate, startPeriod = 'AM', days = 1}) => {
  await wait(client, selectors.apply)
  await click(client, selectors.apply)
  await wait(client, selectors.leaveForm)
  await click(client, selectors.leaveForm)
  await delay(1500)
  await client.switchWindow('KKC9.FORM.1004')
  await wait(client, 'iframe#main')
  await client.switchToFrame(
    await client.findElement('css selector', 'iframe#main')
  )
  const periodStartTime = {AM: '09:00', PM: '14:00'}
  const periodEndTime = ['14:00', '18:00']
  console.log({startPeriod})
  await pickDateTime(client, {
    field: 'start',
    date: startDate,
    time: periodStartTime[startPeriod],
  })
  await pickDateTime(client, {
    field: 'end',
    date: addDays(
      startDate,
      Math.floor(days - 0.5 + (startPeriod === 'PM') * 0.5)
    ),
    time: periodEndTime[((startPeriod === 'AM') + days * 2) % 2],
  })
  await wait(client, selectors.leaveType, {what: 'Clickable'})
  await click(client, selectors.leaveType)
  const select = await client.$('#fm_leavecode-list [aria-hidden="false"]')
  await select.waitForExist(5000)
  const option = await select.$('li:nth-of-type(2)')
  await delay(1500)
  await option.click()
}

const main = async () => {
  const client = await startBrowser()
  locate(client)
  await ensureLoggedIn(client)
  const [, , startDate, startPeriod, days = startPeriod * 1 || 1] = process.argv
  leave(client, {
    startDate,
    startPeriod: /AM|PM/.test(startPeriod) ? startPeriod : undefined,
    days,
  })
}

main()
