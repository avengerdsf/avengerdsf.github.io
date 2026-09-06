import { buildTwoSumSteps, type TwoSumStep } from "../steps"

function parseNumbers(value: string | null): number[] {
  return (value ?? "")
    .split(",")
    .map((item) => Number(item.trim()))
    .filter((item) => Number.isFinite(item))
}

function mountTwoSumDemo(root: HTMLElement) {
  if (root.dataset.mounted === "true") return

  const nums = parseNumbers(root.getAttribute("values"))
  const target = Number(root.getAttribute("target"))
  if (!nums.length || !Number.isFinite(target)) return

  root.dataset.mounted = "true"
  const steps = buildTwoSumSteps(nums, target)
  let cursor = 0
  let timer: number | null = null

  root.innerHTML = `
    <div class="two-sum-demo__toolbar">
      <strong>target = ${target}</strong>
      <div class="two-sum-demo__controls">
        <button type="button" data-action="play">播放</button>
        <button type="button" data-action="next">下一步</button>
        <button type="button" data-action="reset">重置</button>
      </div>
    </div>
    <div class="two-sum-demo__workspace">
      <section class="two-sum-demo__array-panel" aria-label="数组">
        <div class="two-sum-demo__stage">
          <div class="two-sum-demo__pointer" aria-hidden="true"><span>i</span><b>▼</b></div>
          <div class="two-sum-demo__array"></div>
        </div>
        <div class="two-sum-demo__calc"></div>
      </section>
      <div class="two-sum-demo__probe" aria-label="查找补数"><i></i><b>→</b></div>
      <section class="two-sum-demo__hash-panel">
        <strong>哈希表</strong>
        <div class="two-sum-demo__hash"></div>
      </section>
    </div>
    <div class="two-sum-demo__status" aria-live="polite">点击播放或下一步。</div>
  `

  const array = root.querySelector<HTMLElement>(".two-sum-demo__array")
  const pointer = root.querySelector<HTMLElement>(".two-sum-demo__pointer")
  const calc = root.querySelector<HTMLElement>(".two-sum-demo__calc")
  const probe = root.querySelector<HTMLElement>(".two-sum-demo__probe")
  const hash = root.querySelector<HTMLElement>(".two-sum-demo__hash")
  const status = root.querySelector<HTMLElement>(".two-sum-demo__status")
  const play = root.querySelector<HTMLButtonElement>('[data-action="play"]')
  const nextButton = root.querySelector<HTMLButtonElement>('[data-action="next"]')
  const resetButton = root.querySelector<HTMLButtonElement>('[data-action="reset"]')
  if (!array || !pointer || !calc || !probe || !hash || !status || !play || !nextButton || !resetButton) return

  nums.forEach((value, index) => {
    const cell = document.createElement("div")
    cell.className = "two-sum-demo__cell"
    cell.dataset.index = String(index)
    cell.innerHTML = `<span>${index}</span><strong>${value}</strong>`
    array.append(cell)
  })

  function clearCells() {
    array.querySelectorAll<HTMLElement>(".two-sum-demo__cell").forEach((cell) => {
      cell.classList.remove("is-current", "is-answer")
    })
  }

  function movePointer(index: number) {
    const cell = array.querySelector<HTMLElement>(`[data-index="${index}"]`)
    if (!cell) return
    pointer.classList.add("is-visible")
    requestAnimationFrame(() => {
      const x = cell.offsetLeft + (cell.offsetWidth - pointer.offsetWidth) / 2
      pointer.style.transform = `translateX(${x}px)`
    })
  }

  function renderHash(step: TwoSumStep | null) {
    hash.replaceChildren()
    const entries = step?.hash ?? []
    if (!entries.length) {
      const empty = document.createElement("div")
      empty.className = "two-sum-demo__empty"
      empty.textContent = "空"
      hash.append(empty)
      return
    }

    entries.forEach(([value, index]) => {
      const row = document.createElement("div")
      row.className = "two-sum-demo__hash-row"
      if (step?.type === "store" && value === step.value) row.classList.add("is-new")
      if (step?.type === "found" && value === step.complement) row.classList.add("is-match")
      row.innerHTML = `<code>${value}</code><span>下标 ${index}</span>`
      hash.append(row)
    })
  }

  function renderStep(step: TwoSumStep) {
    clearCells()
    movePointer(step.index)
    const current = array.querySelector<HTMLElement>(`[data-index="${step.index}"]`)
    current?.classList.add("is-current")
    calc.innerHTML = `<code>target - nums[${step.index}]</code><span>=</span><strong>${target} - ${step.value} = ${step.complement}</strong>`
    probe.classList.toggle("is-active", step.type !== "store")
    renderHash(step)

    if (step.type === "probe") {
      status.textContent = step.matchIndex === undefined
        ? `查找 ${step.complement}：未命中。`
        : `查找 ${step.complement}：命中下标 ${step.matchIndex}。`
      return
    }

    if (step.type === "store") {
      status.textContent = `写入 ${step.value} → ${step.index}。`
      return
    }

    const matched = array.querySelector<HTMLElement>(`[data-index="${step.matchIndex}"]`)
    current?.classList.add("is-answer")
    matched?.classList.add("is-answer")
    status.textContent = `找到答案：下标 ${step.matchIndex} 和 ${step.index}。`
  }

  function stop() {
    if (timer !== null) window.clearInterval(timer)
    timer = null
    play.textContent = "播放"
  }

  function reset() {
    stop()
    cursor = 0
    clearCells()
    pointer.classList.remove("is-visible")
    pointer.style.transform = "translateX(0)"
    probe.classList.remove("is-active")
    calc.replaceChildren()
    status.textContent = "点击播放或下一步。"
    renderHash(null)
  }

  function next() {
    if (cursor >= steps.length) {
      stop()
      return false
    }
    const step = steps[cursor]
    if (!step) return false
    renderStep(step)
    cursor += 1
    if (cursor >= steps.length) stop()
    return true
  }

  play.addEventListener("click", () => {
    if (timer !== null) {
      stop()
      return
    }
    if (cursor >= steps.length) reset()
    play.textContent = "暂停"
    next()
    if (cursor < steps.length) timer = window.setInterval(next, 1100)
  })

  nextButton.addEventListener("click", () => {
    stop()
    if (cursor >= steps.length) reset()
    next()
  })

  resetButton.addEventListener("click", reset)
  reset()
}

function mountAll() {
  document.querySelectorAll<HTMLElement>("two-sum-demo").forEach(mountTwoSumDemo)
}

const state = window as Window & { __avengerAlgorithmDemoReady?: boolean }
if (!state.__avengerAlgorithmDemoReady) {
  state.__avengerAlgorithmDemoReady = true
  document.addEventListener("nav", mountAll)
  document.addEventListener("render", mountAll)
}
mountAll()
