import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { spawn } from 'node:child_process'

const command = process.env.STORYBOOK_COMMAND || process.argv[2] || 'dev'
const storybookDir = path.resolve('storybook')
const configDir = path.resolve(storybookDir, '.storybook')
const storybookHome = path.resolve(storybookDir, '.storybook-home')
const outputDir = path.resolve(storybookDir, 'storybook-static')

fs.mkdirSync(storybookHome, { recursive: true })

const env = {
  ...process.env,
  HOME: storybookHome,
  XDG_CONFIG_HOME: storybookHome,
  STORYBOOK_DISABLE_TELEMETRY: '1',
}

const argsByCommand = {
  dev: ['dev', '-c', configDir, '--port', '6006', '--exact-port'],
  build: ['build', '-c', configDir, '-o', outputDir],
}

const args = argsByCommand[command]

if (!args) {
  process.stderr.write(`Unsupported Storybook command: ${command}\n`)
  process.exit(1)
}

const executable = process.platform === 'win32' ? 'storybook.cmd' : 'storybook'

const child = spawn(executable, args, {
  stdio: 'inherit',
  env,
})

child.on('exit', (code) => {
  process.exit(code ?? 1)
})
