import {spawn, fork, ChildProcess} from 'child_process'
import fs from 'fs'

describe('works', () => {
  let bin
  if (process.platform === 'darwin') {
    bin = './bin/eyes-universal-macos'
  } else if (process.platform === 'win32') {
    bin = './bin/eyes-universal-win'
  } else if (process.platform === 'linux') {
    if (process.arch === 'arm64') {
      bin = './bin/eyes-universal-linux-arm64'
    } else {
      bin = `./bin/eyes-universal-${fs.existsSync('/etc/alpine-release') ? 'alpine' : 'linux'}`
    }
  }
  console.log(bin)
  let server: ChildProcess
  afterEach(() => {
    server?.kill()
  })

  it('works with ipc', async () => {
    server = fork(`./dist/cli.js`, {detached: true, stdio: 'ignore'})
    return new Promise<void>((resolve, reject) => {
      server.on('error', reject)

      const timeout = setTimeout(() => reject(new Error('No output from the server for 20 seconds')), 20000)
      server.on('message', (data: any) => {
        clearTimeout(timeout)
        if (data.name === 'port' && Number.isInteger(data.payload.port)) {
          resolve()
        } else {
          reject(new Error(`Server first message expected to be a port, but got "${JSON.stringify(data)}"`))
        }
      })
    })
  })

  it('works with stdout', async () => {
    server = spawn(process.platform === 'win32' ? bin : `chmod +x ${bin} && ${bin} --shutdown stdin`, {
      detached: true,
      shell: process.platform === 'win32' ? 'C:\\Program Files\\Git\\bin\\bash.exe' : '/bin/sh',
      stdio: ['ignore', 'pipe', 'inherit'],
    })
    return new Promise<void>((resolve, reject) => {
      server.on('error', reject)

      const timeout = setTimeout(() => reject(new Error('No output from the server for 20 seconds')), 20000)
      server.stdout.once('data', data => {
        clearTimeout(timeout)
        const [firstLine] = String(data).split('\n', 1)
        if (Number.isInteger(Number(firstLine))) {
          resolve()
        } else {
          reject(new Error(`Server first line of stdout output expected to be a port, but got "${firstLine}"`))
        }
      })
    })
  })

  it('ends with stdin', async () => {
    server = spawn(process.platform === 'win32' ? bin : `chmod +x ${bin} && ${bin} --shutdown stdin`, {
      detached: true,
      shell: process.platform === 'win32' ? 'C:\\Program Files\\Git\\bin\\bash.exe' : '/bin/sh',
      stdio: ['pipe', 'inherit', 'inherit'],
    })
    let timeoutId
    await new Promise<void>((resolve, reject) => {
      server.on('error', reject)

      timeoutId = setTimeout(() => reject(new Error('No output from the server for 20 seconds')), 20000)
      server.on('exit', resolve)
      server.on('close', resolve)

      server.stdin.end()
    })
    clearTimeout(timeoutId)
  })
})
