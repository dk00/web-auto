const delay = (timeMs = 500) =>
  new Promise(resolve => setTimeout(resolve, timeMs * (1 + Math.random())))

const wait = async (client, s, {time = 15000, what = 'Exist'} = {}) => {
  const element = await client.$(s)
  const result = await element[`waitFor${what}`](time).catch(error => {
    console.log(error)
  })
  return result && element
}

const getText = async (client, s) => {
  const element = await client.$(s)
  return element.getText()
}

const click = async (client, s) => {
  console.log(`Click ${s}`)

  const target = await client.$(s)
  const existing = await target.isExisting()
  if (existing) {
    const result = await target.click()
    await delay()
    return result
  }
}

const fillField = async (client, s, text) => {
  const target = await client.$(s)
  const existing = await target.isExisting()
  if (existing) {
    const result = await target.addValue(text)
    await delay()
    return result
  }
}

module.exports = {delay, wait, getText, click, fillField}
