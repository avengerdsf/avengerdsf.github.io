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
  cell.innerHTML = `<small>下标 ${index}</small><strong>${value}</strong>`;
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
      <div class="algorithm-demo-meta">
        <strong>两数之和</strong>
        <span>nums = [${nums.join(", ")}] · target = ${target}</span>
      </div>
      <div class="algorithm-demo-controls">
        <button type="button" data-action="play">播放</button>
        <button type="button" data-action="next">下一步</button>
        <button type="button" data-action="reset">重置</button>
      </div>
    </div>
    <div class="algorithm-demo-grid">
      <div class="algorithm-demo-panel">
        <span>数组</span>
        <div class="algorithm-demo-array"></div>
        <div class="algorithm-demo-flow">当前元素与补数会显示在这里。</div>
      </div>
      <div class="algorithm-demo-panel">
        <span>哈希表：元素 → 下标</span>
        <div class="algorithm-demo-hash"></div>
      </div>
    </div>
    <div class="algorithm-demo-status" aria-live="polite">从左到右遍历数组，先查补数，再记录当前元素。</div>
  `;

  const array = root.querySelector(".algorithm-demo-array");
  const flow = root.querySelector(".algorithm-demo-flow");
  const hash = root.querySelector(".algorithm-demo-hash");
  const status = root.querySelector(".algorithm-demo-status");
  const playButton = root.querySelector('[data-action="play"]');
  const nextButton = root.querySelector('[data-action="next"]');
  const resetButton = root.querySelector('[data-action="reset"]');

  nums.forEach((value, index) => array.append(createCell(value, index)));

  function renderHash(entries) {
    hash.replaceChildren();
    if (!entries.length) {
      const empty = document.createElement("div");
      empty.className = "algorithm-demo-empty";
      empty.textContent = "当前为空";
      hash.append(empty);
      return;
    }

    entries.forEach(([value, index]) => {
      const row = document.createElement("div");
      row.className = "algorithm-demo-hash-row";
      row.innerHTML = `<code>${value}</code><span>下标 ${index}</span>`;
      hash.append(row);
    });
  }

  function clearCellState() {
    array.querySelectorAll(".algorithm-demo-cell").forEach((cell) => {
      cell.classList.remove("is-current", "is-answer");
    });
  }

  function renderStep(step) {
    clearCellState();
    const currentCell = array.querySelector(`[data-index="${step.index}"]`);
    currentCell?.classList.add("is-current");
    renderHash(step.hash);
    flow.innerHTML = `当前 <code>nums[${step.index}] = ${step.value}</code> → 补数 <code>${target} - ${step.value} = ${step.complement}</code>`;

    if (step.type === "probe") {
      status.textContent = step.matchIndex === undefined
        ? `哈希表中没有 ${step.complement}，下一步记录当前元素 ${step.value}。`
        : `哈希表中找到 ${step.complement}，对应下标 ${step.matchIndex}。`;
      return;
    }

    if (step.type === "store") {
      status.textContent = `记录 ${step.value} → 下标 ${step.index}。`;
      return;
    }

    const matchCell = array.querySelector(`[data-index="${step.matchIndex}"]`);
    currentCell?.classList.add("is-answer");
    matchCell?.classList.add("is-answer");
    status.textContent = `找到答案：下标 ${step.matchIndex} 和 ${step.index}。`;
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
    flow.textContent = "当前元素与补数会显示在这里。";
    status.textContent = "从左到右遍历数组，先查补数，再记录当前元素。";
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
    if (stepIndex < steps.length) {
      timer = window.setInterval(next, 1300);
    }
  });

  nextButton.addEventListener("click", () => {
    stop();
    if (stepIndex >= steps.length) reset();
    next();
  });

  resetButton.addEventListener("click", reset);
  reset();
}

document.querySelectorAll("[data-two-sum-demo]").forEach(initTwoSumDemo);
