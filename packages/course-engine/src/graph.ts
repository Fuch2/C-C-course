import { ContentError } from './parser';
export function validateGraph(nodes: ReadonlyMap<string, readonly string[]>, file: string) {
  const states = new Map<string, 'visiting' | 'done'>();
  const stack: string[] = [];
  function visit(id: string) {
    if (states.get(id) === 'done') return;
    if (states.get(id) === 'visiting')
      throw new ContentError(
        file,
        `цикл prerequisites: ${[...stack.slice(stack.indexOf(id)), id].join(' → ')}`,
      );
    states.set(id, 'visiting');
    stack.push(id);
    for (const dependency of nodes.get(id) ?? []) {
      if (!nodes.has(dependency))
        throw new ContentError(file, `${id}: неизвестный prerequisite «${dependency}»`);
      visit(dependency);
    }
    stack.pop();
    states.set(id, 'done');
  }
  for (const id of nodes.keys()) visit(id);
}
export function prerequisiteClosure(
  id: string,
  graph: ReadonlyMap<string, readonly string[]>,
): string[] {
  const seen = new Set<string>();
  function visit(current: string) {
    for (const dep of graph.get(current) ?? [])
      if (!seen.has(dep)) {
        seen.add(dep);
        visit(dep);
      }
  }
  visit(id);
  return [...seen];
}
