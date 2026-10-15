const textOf = node => node.value ?? node.children?.map(textOf).join('') ?? '';
const headingText = node => node.type === 'element' && node.tagName === 'h2' ? textOf(node).trim() : '';
const card = (kind, label, children) => ({
  type: 'element', tagName: 'section',
  properties: {className: ['kb-note-card', `kb-${kind}-card`], ariaLabel: label},
  children,
});

const solutionPanels = (nodes, config) => {
  if (!config || typeof config !== 'object' || Array.isArray(config)) return nodes;
  const methods = Object.entries(config);
  if (methods.length < 2 || methods.some(([label, title]) => !label || typeof title !== 'string')) return nodes;
  const starts = methods.map(([, title]) => nodes.findIndex(node => headingText(node) === title));
  if (starts.some((index, i) => index < 0 || i > 0 && index <= starts[i - 1])) return nodes;
  const panels = methods.map((_, index) => ({
    type: 'element', tagName: 'section',
    properties: {className: ['kb-solution-panel'], id: `kb-solution-panel-${index + 1}`, 'data-solution-panel': true, ariaLabelledBy: `kb-solution-choice-${index + 1}`, hidden: index !== 0},
    children: nodes.slice(starts[index], starts[index + 1]),
  }));
  return [
    ...nodes.slice(0, starts[0]),
    {
      type: 'element', tagName: 'div',
      properties: {className: ['kb-solution-switcher'], 'data-solution-switcher': true, role: 'group', ariaLabel: '切换解法'},
      children: methods.map(([label], index) => ({
        type: 'element', tagName: 'button',
        properties: {type: 'button', id: `kb-solution-choice-${index + 1}`, 'data-solution-choice': panels[index].properties.id, ariaControls: panels[index].properties.id, ariaPressed: String(index === 0)},
        children: [{type: 'text', value: label}],
      })),
    },
    ...panels,
  ];
};

export default function LeetcodeCards() {
  return {
    name: 'LeetcodeCards',
    htmlPlugins() {
      return [() => (tree, file) => {
        if (!file.data.slug?.startsWith('leetcode/')) return;
        const problem = tree.children.findIndex(node => /^题目|^P\d+\b/.test(headingText(node)));
        if (problem < 0) return;
        const solution = tree.children.findIndex((node, index) => index > problem && ['思路', '解题思路', '代码'].includes(headingText(node)));
        if (solution < 0) return;
        tree.children = [
          card('problem', '题目', tree.children.slice(0, solution)),
          {
            type: 'element', tagName: 'div',
            properties: {className: ['kb-note-splitter'], role: 'separator', tabIndex: 0, ariaOrientation: 'vertical', ariaLabel: '调整题目与思路代码的宽度', ariaValueMin: 0, ariaValueMax: 100, ariaValueNow: 44, title: '拖动调整宽度，双击恢复；方向键微调'},
            children: [],
          },
          card('solution', '思路与代码', solutionPanels(tree.children.slice(solution), file.data.frontmatter?.solutionTabs)),
        ];
      }];
    },
  };
}
