import test from 'node:test';
import assert from 'node:assert/strict';
import LeetcodeCards from '../../leetcode-cards/src/index.mjs';

const text = value => ({type:'text',value});
const heading = (value,id) => ({type:'element',tagName:'h2',properties:{id},children:[text(value)]});
const paragraph = value => ({type:'element',tagName:'p',properties:{},children:[text(value)]});
const fixture = () => [heading('题目','problem'),paragraph('question'),heading('思路','ideas'),heading('一维 DP 解法','one'),paragraph('one-dimensional idea and code'),paragraph('one-dimensional notes'),heading('二维 DP 解法','two'),paragraph('two-dimensional idea and code')];
const render = solutionTabs => {
  const tree = {type:'root',children:fixture()};
  LeetcodeCards().htmlPlugins()[0]()(tree,{data:{slug:'leetcode/dynamic-programming/p4096',frontmatter:{solutionTabs}}});
  return tree.children[2];
};

test('configured methods become separately labelled panels with the first method selected', () => {
  const solution = render({'一维 DP':'一维 DP 解法','二维 DP':'二维 DP 解法'});
  const controls = solution.children.find(node => node.properties?.['data-solution-switcher'] !== undefined);
  assert.ok(controls,'missing solution controls');
  const panels = solution.children.filter(node => node.properties?.['data-solution-panel'] !== undefined);
  assert.equal(panels.length,2);
  assert.deepEqual(controls.children.map(node => node.children[0].value),['一维 DP','二维 DP']);
  assert.deepEqual(controls.children.map(node => node.properties.ariaPressed),['true','false']);
  assert.deepEqual(panels.map(node => node.properties.hidden),[false,true]);
  for (let i=0;i<panels.length;i++) {
    assert.equal(controls.children[i].properties.ariaControls,panels[i].properties.id);
    assert.equal(panels[i].properties.ariaLabelledBy,controls.children[i].properties.id);
  }
  assert.deepEqual(panels[0].children.map(node => node.children[0].value),['一维 DP 解法','one-dimensional idea and code','one-dimensional notes']);
  assert.deepEqual(panels[1].children.map(node => node.children[0].value),['二维 DP 解法','two-dimensional idea and code']);
});

test('ordinary notes keep all their solution content without switch controls', () => {
  const solution = render(undefined);
  assert.deepEqual(solution.children,fixture().slice(2));
});

test('missing or misordered method headings leave all content visible', () => {
  for (const config of [{'一维 DP':'一维 DP 解法','missing':'missing heading'},{'二维 DP':'二维 DP 解法','一维 DP':'一维 DP 解法'}]) {
    assert.deepEqual(render(config).children,fixture().slice(2));
  }
});
