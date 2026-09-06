export type TwoSumStepType = "probe" | "store" | "found"

export interface TwoSumStep {
  type: TwoSumStepType
  index: number
  value: number
  complement: number
  matchIndex?: number
  hash: Array<[number, number]>
}

export function buildTwoSumSteps(nums: number[], target: number): TwoSumStep[] {
  const table = new Map<number, number>()
  const steps: TwoSumStep[] = []

  for (let index = 0; index < nums.length; index += 1) {
    const value = nums[index]
    if (value === undefined) continue

    const complement = target - value
    const matchIndex = table.get(complement)

    steps.push({
      type: "probe",
      index,
      value,
      complement,
      matchIndex,
      hash: [...table.entries()],
    })

    if (matchIndex !== undefined) {
      steps.push({
        type: "found",
        index,
        value,
        complement,
        matchIndex,
        hash: [...table.entries()],
      })
      break
    }

    table.set(value, index)
    steps.push({
      type: "store",
      index,
      value,
      complement,
      hash: [...table.entries()],
    })
  }

  return steps
}
