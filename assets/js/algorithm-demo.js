function buildTwoSumSteps(nums, target) {
  const table = new Map();
  const steps = [];

  for (let index = 0; index < nums.length; index += 1) {
    const value = nums[index];
    const complement = target - value;
    const matchIndex = table.get(complement);

    steps.push({
      type: "probe",
      index,
      value,
      complement,
      matchIndex,
      hash: [...table.entries()],
    });

    if (matchIndex !== undefined) {
      steps.push({
        type: "found",
        index,
        value,
        complement,
        matchIndex,
        hash: [...table.entries()],
      });
      break;
    }

    table.set(value, index);
    steps.push({
      type: "store",
      index,
      value,
      complement,
      hash: [...table.entries()],
    });
  }

  return steps;
}

function createCell(value, index) {
  const cell = document.createElement("div");
  cell.className = "algorithm-demo-cell";
  cell.dataset.index = String(index);
  cell.innerHTML = `<span>${index}</span><strong>${value}</strong>`;
  return cell;
}

function initTwoSumDemo(root) {
  const nums = (root.dataset.values || "")
    .split(",")
    .map((value) => Number(value.trim()))
    .filter((value) => Number.isFinite(value));
  const target = Number(root.dataset.target);

  if (!nums.length || !Number.isFinite(target)) return;

  const steps = buildTwoSumSteps(nums, target);
  let stepIndex = 0;
  let timer = null;

  root.innerHTML = `
    <div class="algorithm-demo-head">
      <strong>nums = [${nums.join(", ")}] · target = ${target}</strong>
      <div class="algorithm-demo-controls">
        <button type="button" data-action="play">播放</button>
        <button type="button" data-action="next">下一步</button>
        <button type="button" data-action="reset">重置</button>
      </div>
    </div>

    <div class="algorithm-demo-grid">
      <div class="algorithm-demo-panel algorithm-demo-array-panel">
        <div class="algorithm-demo-array-stage">
          <div class="algorithm-demo-pointer" aria-hidden="true"><span>i</span><b>▼</b></div>
          <div class="algorithm-demo-array"></div>
        </div>
        <div class="algorithm-demo-calc">target - nums[i]</div>
      </div>

      <div class="algorithm-demo-probe" aria-hidden="true">
        <span data-probe-value>补数</span>
        <i></i>
        <b>→</b>
      </div>

      <div class="algorithm-demo-panel algorithm-demo-hash-panel">
        <strong>哈希表</strong>
        <div class="algorithm-demo-hash"></div>
      </div>
    </div>

    <div class="algorithm-demo-status" aria-live="polite">移动指针，计算补数并查询哈希表。</div>
  `;

  const stage = root.querySelector(".algorithm-demo-array-stage");
  const array = root.querySelector(".algorithm-demo-array");
  const pointer = root.querySelector(".algorithm-demo-pointer");
  const calc = root.querySelector(".algorithm-demo-calc");
  const probe = root.querySelector(".algorithm-demo-probe");
  const probeValue = root.querySelector("[data-probe-value]");
  const hash = root.querySelector(".algorithm-demo-hash");
  const status = root.querySelector(".algorithm-demo-status");
  const playButton = root.querySelector('[data-action="play"]');
  const nextButton = root.querySelector('[data-action="next"]');
  const resetButton = root.querySelector('[data-action="reset"]');

  nums.forEach((value, index) => array.append(createCell(value, index)));

  function renderHash(entries, matchValue, storedValue) {
    hash.replaceChildren();

    if (!entries.length) {
      const empty = document.createElement("div");
      empty.className = "algorithm-demo-empty";
      empty.textContent = "空";
      hash.append(empty);
      return;
    }

    entries.forEach(([value, index]) => {
      const row = document.createElement("div");
      row.className = "algorithm-demo-hash-row";
      if (value === matchValue) row.classList.add("is-match");
      if (value === storedValue) row.classList.add("is-new");
      row.innerHTML = `<code>${value}</code><span>${index}</span>`;
      hash.append(row);
    });
  }

  function clearCellState() {
    array.querySelectorAll(".algorithm-demo-cell").forEach((cell) => {
      cell.classList.remove("is-current", "is-answer");
    });
  }

  function movePointer(cell) {
    if (!cell || !stage || !pointer) return;
    const pointerWidth = pointer.offsetWidth || cell.offsetWidth;
    const x = cell.offsetLeft + (cell.offsetWidth - pointerWidth) / 2;
    const y = Math.max(0, cell.offsetTop - 32);
    pointer.style.transform = `translate(${x}px, ${y}px)`;
    pointer.classList.add("is-visible");
  }

  function setProbe(text, active = true) {
    probeValue.textContent = text;
    probe.classList.toggle("is-active", active);
  }

  function renderStep(step) {
    clearCellState();
    const currentCell = array.querySelector(`[data-index="${step.index}"]`);
    currentCell?.classList.add("is-current");
    movePointer(currentCell);

    calc.innerHTML = `<code>${target}</code> − <code>${step.value}</code> = <strong>${step.complement}</strong>`;

    if (step.type === "probe") {
      renderHash(step.hash, step.matchIndex === undefined ? undefined : step.complement);
      setProbe(`查 ${step.complement}`);
      status.textContent = step.matchIndex === undefined
        ? `补数 ${step.complement} 未命中。`
        : `补数 ${step.complement} 命中下标 ${step.matchIndex}。`;
      return;
    }

    if (step.type === "store") {
      renderHash(step.hash, undefined, step.value);
      setProbe(`存 ${step.value}`);
      status.textContent = `记录 ${step.value} → ${step.index}。`;
      return;
    }

    renderHash(step.hash, step.complement);
    setProbe(`命中 ${step.complement}`);
    const matchCell = array.querySelector(`[data-index="${step.matchIndex}"]`);
    currentCell?.classList.add("is-answer");
    matchCell?.classList.add("is-answer");
    status.textContent = `答案：${step.matchIndex}，${step.index}。`;
  }

  function stop() {
    if (timer !== null) window.clearInterval(timer);
    timer = null;
    playButton.textContent = "播放";
  }

  function reset() {
    stop();
    stepIndex = 0;
    clearCellState();
    renderHash([]);
    pointer.classList.remove("is-visible");
    pointer.style.transform = "translate(0, 0)";
    calc.textContent = "target - nums[i]";
    setProbe("补数", false);
    status.textContent = "移动指针，计算补数并查询哈希表。";
  }

  function next() {
    if (stepIndex >= steps.length) {
      stop();
      return false;
    }

    renderStep(steps[stepIndex]);
    stepIndex += 1;
    if (stepIndex >= steps.length) stop();
    return true;
  }

  playButton.addEventListener("click", () => {
    if (timer !== null) {
      stop();
      return;
    }

    if (stepIndex >= steps.length) reset();
    playButton.textContent = "暂停";
    next();
    if (stepIndex < steps.length) timer = window.setInterval(next, 1450);
  });

  nextButton.addEventListener("click", () => {
    stop();
    if (stepIndex >= steps.length) reset();
    next();
  });

  resetButton.addEventListener("click", reset);
  window.addEventListener("resize", () => {
    if (stepIndex === 0) return;
    const currentStep = steps[Math.min(stepIndex - 1, steps.length - 1)];
    const currentCell = array.querySelector(`[data-index="${currentStep.index}"]`);
    movePointer(currentCell);
  });

  reset();
}

document.querySelectorAll("[data-two-sum-demo]").forEach(initTwoSumDemo);
