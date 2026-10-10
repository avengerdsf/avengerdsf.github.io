const textOf = node => node.value ?? node.children?.map(textOf).join('') ?? '';
const headingText = node => node.type === 'element' && node.tagName === 'h2' ? textOf(node).trim() : '';
const card = (kind, label, children) => ({
  type: 'element', tagName: 'section',
  properties: {className: ['kb-note-card', `kb-${kind}-card`], ariaLabel: label},
  children,
});

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
          card('solution', '思路与代码', tree.children.slice(solution)),
        ];
      }];
    },
  };
}
