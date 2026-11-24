export function submitMatch(answers: readonly string[], current: number, choice: string) {
  const correct = current >= 0 && current < answers.length && answers[current] === choice;
  return { next: correct ? current + 1 : current, correct };
}

export function appendChoice(order: readonly number[], index: number, size: number): readonly number[] {
  if (!Number.isInteger(index) || index < 0 || index >= size || order.includes(index)) return order;
  return [...order, index];
}

export function evaluateOrder(order: readonly number[], size: number) {
  if (order.length !== size) return 'incomplete';
  return order.every((value, index) => value === index) ? 'correct' : 'incorrect';
}

export function shuffledIndices(size: number, random = Math.random) {
  const indices = Array.from({ length: size }, (_, index) => index);
  for (let last = size - 1; last > 0; last--) {
    const picked = Math.floor(random() * (last + 1));
    [indices[last], indices[picked]] = [indices[picked], indices[last]];
  }
  if (size > 1 && indices.every((value, index) => value === index)) {
    [indices[0], indices[1]] = [indices[1], indices[0]];
  }
  return indices;
}
