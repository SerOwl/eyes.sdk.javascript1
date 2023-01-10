import type {TestMetadata, SelfHealingReport} from '../types'

export function toSelfHealingReport(input: TestMetadata): SelfHealingReport {
  const result = {
    operations: []
  }
  input.forEach(item => {
    const date = new Date 
    result.operations.push({
      old: item?.originalSelector?.value,
      new: item?.successfulSelector?.value,
      timestamp: date.toISOString(),
    })
  })
  return result
}
