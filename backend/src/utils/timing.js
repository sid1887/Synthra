export function startTimer() {
  const start = performance.now();
  return {
    elapsedMs: () => Math.round((performance.now() - start) * 100) / 100
  };
}
