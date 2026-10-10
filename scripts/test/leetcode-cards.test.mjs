import test from 'node:test';
import assert from 'node:assert/strict';
import LeetcodeCards from '../../knowledge-quartz/plugins/leetcode-cards/src/index.mjs';

const text = value => ({type: 'text', value});
const element = (tagName, children = [], properties = {}) => ({type: 'element', tagName, properties, children});
const heading = title => element('h2', [text(title)], {id: title});
const transform = (tree, slug = 'leetcode/hash-table/two-sum') => {
  const file = {value: 'original Markdown', data: {slug}};
  LeetcodeCards().htmlPlugins({})[0]()(tree, file);
  assert.equal(file.value, 'original Markdown');
};

test('problem examples stay separate from reasoning, code and additional notes without losing nodes', () => {
  const problem = [heading('题目'), element('p', [text('题目正文')]), element('pre', [text('输入示例')]), element('img', [], {src: 'diagram.png'})];
  const solution = [heading('思路'), element('span', [text('公式')], {className: ['katex']}), heading('代码'), element('pre', [text('print(max(dp[1:]))')]), heading('注意点')];
  const nodes = [...problem, text('\n'), ...solution];
  const tree = {type: 'root', children: [...nodes]};
  transform(tree);
  assert.equal(tree.children.length, 2);
  assert.deepEqual(tree.children[0].properties.className, ['kb-note-card', 'kb-problem-card']);
  assert.deepEqual(tree.children[1].properties.className, ['kb-note-card', 'kb-solution-card']);
  const restored = tree.children.flatMap(card => card.children);
  assert.deepEqual(restored, nodes);
  restored.forEach((node, index) => assert.equal(node, nodes[index]));
  assert.deepEqual(tree.children[0].children, [...problem, nodes[4]]);
  assert.deepEqual(tree.children[1].children, solution);
  transform(tree);
  assert.equal(tree.children.length, 2);
  assert.deepEqual(tree.children.flatMap(card => card.children), nodes);
});

test('existing problem and reasoning title variants retain their heading anchors', () => {
  for (const problemTitle of ['题目', '题目P4021. 互异整数数组的全排列枚举', 'P4007. 无重复字符的最长子串']) {
    for (const solutionTitle of ['思路', '解题思路', '代码']) {
      const problem = heading(problemTitle);
      const solution = heading(solutionTitle);
      solution.children.push(element('a', [], {href: '#' + solutionTitle}));
      const tree = {type: 'root', children: [problem, solution]};
      transform(tree);
      assert.equal(tree.children.length, 2);
      assert.equal(tree.children[0].children[0], problem);
      assert.equal(tree.children[1].children[0], solution);
    }
  }
});

test('other notebooks, guides and incomplete section structures keep their original layout', () => {
  for (const [slug, nodes] of [
    ['machine-learning/example', [heading('题目'), heading('思路')]],
    ['leetcode/multidimensional-dp/overview', [heading('思路'), element('h3', [text('定义状态')])]],
    ['leetcode/example', [heading('题目'), element('p', [text('正文')])]],
    ['leetcode/example', [heading('题目'), element('blockquote', [heading('思路')])]],
  ]) {
    const tree = {type: 'root', children: [...nodes]};
    transform(tree, slug);
    assert.deepEqual(tree.children, nodes);
  }
});
