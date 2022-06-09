import * as core from '@actions/core'
import {spawnSync} from 'child_process'

const workflow = core.getInput('workflow', {required: true})
const ref = core.getInput('ref')

console.log(workflow, ref)

async function main() {
  spawnSync('gh', ['workflow', 'run', workflow])
  const {stdout} = spawnSync('gh', ['run', 'list', '--json', 'databaseId', '--workflow', workflow, '--limit', '1'])

  console.log(stdout)

  const [{databaseId}] = JSON.parse(stdout)

  console.log(databaseId)

}

main()