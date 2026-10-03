const textOf = node => node.value ?? node.alt ?? node.children?.map(textOf).join('') ?? '';

/** Promote an untitled Markdown document's H1 in the render tree, keeping source bytes intact. */
export default function NoteTitle() {
  return {
    name: 'NoteTitle',
    markdownPlugins() {
      return [() => (tree, file) => {
        if (['yaml', 'toml'].includes(tree.children[0]?.type)) return;
        const index = tree.children.findIndex(node => node.type === 'heading' && node.depth === 1);
        if (index < 0) return;
        const title = textOf(tree.children[index]).trim();
        if (!title) return;
        file.data.frontmatter = {...file.data.frontmatter, title};
        tree.children.splice(index, 1);
      }];
    },
  };
}
