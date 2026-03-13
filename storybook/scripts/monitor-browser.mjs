import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { chromium } from 'playwright'

const DEFAULT_URL = process.env.STORYBOOK_URL || 'http://127.0.0.1:6006'
const DEFAULT_STORY_ID = process.env.STORYBOOK_STORY_ID || 'maps-maplibre-triangle-multi-pass--default'
const POLL_INTERVAL_MS = 1000
const STARTUP_TIMEOUT_MS = 30000

function formatText(value) {
  if (typeof value === 'string') {
    return value
  }

  if (value instanceof Error) {
    return `${value.name}: ${value.message}`
  }

  try {
    return JSON.stringify(value)
  } catch {
    return String(value)
  }
}

function writeLog(stream, level, message) {
  const line = `[${new Date().toISOString()}] [${level}] ${message}`
  stream.write(`${line}\n`)
  process.stdout.write(`${line}\n`)
}

async function waitForStorybook(url) {
  const startedAt = Date.now()

  const probe = async () => {
    try {
      const response = await fetch(url)
      if (response.ok) {
        return
      }
    } catch {
      // Storybook dev server is not ready yet.
    }

    if (Date.now() - startedAt >= STARTUP_TIMEOUT_MS) {
      throw new Error(`Storybook is not reachable at ${url} within ${STARTUP_TIMEOUT_MS}ms`)
    }

    await new Promise((resolve) => {
      setTimeout(resolve, POLL_INTERVAL_MS)
    })

    await probe()
  }

  await probe()
}

async function main() {
  const storybookDir = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..')
  const runtimeDir = path.resolve(storybookDir, '.runtime')
  fs.mkdirSync(runtimeDir, { recursive: true })

  const logFile = path.resolve(runtimeDir, 'browser-monitor.log')
  const logStream = fs.createWriteStream(logFile, { flags: 'a' })

  writeLog(logStream, 'info', `waiting for Storybook at ${DEFAULT_URL}`)
  await waitForStorybook(DEFAULT_URL)

  let browser

  try {
    browser = await chromium.launch({
      channel: 'chrome',
      headless: process.env.HEADLESS !== 'false',
    })
    writeLog(logStream, 'info', 'launched browser monitor with local Chrome channel')
  } catch (chromeError) {
    writeLog(logStream, 'warn', `failed to launch local Chrome channel: ${chromeError.message}`)
    browser = await chromium.launch({
      headless: process.env.HEADLESS !== 'false',
    })
    writeLog(logStream, 'info', 'launched browser monitor with Playwright bundled Chromium')
  }

  const page = await browser.newPage()
  const targetUrl = `${DEFAULT_URL}/iframe.html?id=${DEFAULT_STORY_ID}&viewMode=story`

  page.on('console', (message) => {
    const location = message.location()
    const suffix = location.url ? ` (${location.url}:${location.lineNumber || 0})` : ''
    writeLog(logStream, `console.${message.type()}`, `${message.text()}${suffix}`)
  })

  page.on('pageerror', (error) => {
    writeLog(logStream, 'pageerror', `${error.message}\n${error.stack || ''}`)
  })

  page.on('requestfailed', (request) => {
    const failure = request.failure()
    writeLog(logStream, 'requestfailed', `${request.method()} ${request.url()} ${failure?.errorText || ''}`)
  })

  page.on('response', (response) => {
    if (response.status() >= 400) {
      writeLog(logStream, 'http', `${response.status()} ${response.url()}`)
    }
  })

  page.on('websocket', (socket) => {
    writeLog(logStream, 'websocket', `connected ${socket.url()}`)
    socket.on('framesent', (payload) => {
      if (process.env.WS_TRACE === 'true') {
        writeLog(logStream, 'ws.sent', formatText(payload.payload))
      }
    })
    socket.on('framereceived', (payload) => {
      if (process.env.WS_TRACE === 'true') {
        writeLog(logStream, 'ws.recv', formatText(payload.payload))
      }
    })
  })

  await page.goto(targetUrl, { waitUntil: 'domcontentloaded' })
  await page.waitForLoadState('networkidle')

  const pageTitle = await page.title()
  writeLog(logStream, 'info', `opened ${targetUrl}`)
  writeLog(logStream, 'info', `page title: ${pageTitle}`)

  const storyError = await page.evaluate(() => {
    const bodyText = document.body?.innerText || ''
    if (bodyText.includes('There was an error while loading')) {
      return bodyText
    }
    return null
  })

  if (storyError) {
    writeLog(logStream, 'story-error', storyError)
  }

  process.on('SIGINT', async () => {
    writeLog(logStream, 'info', 'received SIGINT, closing browser monitor')
    await browser.close()
    logStream.end()
    process.exit(0)
  })

  writeLog(logStream, 'info', `browser monitor is running, log file: ${logFile}`)

  await new Promise(() => {})
}

main().catch((error) => {
  process.stderr.write(`${error.stack || error.message}\n`)
  process.exit(1)
})
