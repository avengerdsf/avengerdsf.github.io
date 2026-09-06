import assert from "node:assert/strict"
import test from "node:test"
import { buildTwoSumSteps } from "../src/steps"

test("two-sum demo probes before storing and stops on the first match", () => {
  const steps = buildTwoSumSteps([2, 7, 11, 15], 9)

  assert.deepEqual(steps.map((step) => step.type), ["probe", "store", "probe", "found"])
  const found = steps.at(-1)
  assert.equal(found?.type, "found")
  assert.equal(found?.index, 1)
  assert.equal(found?.matchIndex, 0)
  assert.equal(found?.complement, 2)
})
