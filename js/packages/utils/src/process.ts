import {exec, ExecOptions, spawn, SpawnOptions} from 'child_process'
import {existsSync} from 'fs'

function makeError(error: string | Error, properties: Record<string, any>) {
  if (typeof error === 'string') {
    error = new Error(error)
  }
  if (!properties) return error

  return Object.assign(error, properties)
}

export function executeAndControlProcess(
  command: string,
  args: any[] = [],
  options?: {spawnOptions?: SpawnOptions; timeout?: number},
) {
  const subProcess = spawn(command, args, {
    stdio: 'pipe',
    ...options?.spawnOptions,
  })

  const exitPromise = new Promise((resolve, reject) => {
    subProcess.on('error', reject).on('close', (exitCode, signal) =>
      exitCode === 0
        ? resolve({exitCode, stdout, stderr})
        : signal
        ? reject(
            makeError(
              new Error(
                `process exited due to signal ${signal} executing process ${command} with args ${JSON.stringify(args)}`,
              ),
              {
                signal,
                stdout,
                stderr,
              },
            ),
          )
        : reject(
            makeError(
              new Error(
                `non-zero exit code (${exitCode}) executing process ${command} with args ${JSON.stringify(args)}`,
              ),
              {
                exitCode,
                stdout,
                stderr,
              },
            ),
          ),
    )

    let stdout = subProcess.stdout ? '' : undefined
    let stderr = subProcess.stderr ? '' : undefined
    subProcess.stdout && subProcess.stdout.on('data', data => (stdout += data.toString()))
    subProcess.stderr && subProcess.stderr.on('data', data => (stderr += data.toString()))

    if (options?.timeout) {
      setTimeout(() => subProcess.kill(), options.timeout)
    }
    return {stdout, stderr}
  })

  return {subProcess, exitPromise}
}

export async function executeProcess(
  command: string,
  args: any[] = [],
  options?: {spawnOptions?: SpawnOptions; timeout?: number},
) {
  return await executeAndControlProcess(command, args, options).exitPromise
}

export async function sh(command: string, options?: {spawnOptions?: SpawnOptions; timeout?: number}) {
  let shell
  if (process.platform === 'win32') {
    shell = 'C:\\Program Files\\Git\\bin\\bash.exe'
  } else if (existsSync('/bin/bash')) {
    shell = '/bin/bash'
  } else {
    shell = '/bin/sh'
  }
  return await executeProcess(command, [], {
    ...options,
    spawnOptions: {
      stdio: 'inherit',
      shell,
      ...options?.spawnOptions,
    },
  })
}

export async function execute(
  command: string,
  options?: ExecOptions,
): Promise<{stdout: string; stderr: string; code: number}> {
  return new Promise(resolve => {
    exec(command, options, (error, stdout, stderr) => {
      if (error) resolve({stdout, stderr, code: error.code})
      resolve({stdout, stderr, code: 0})
    })
  })
}
