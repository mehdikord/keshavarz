type CounterMap = Map<string, number>;

const counters: CounterMap = new Map();

function key(name: string, labels: Record<string, string> = {}): string {
  const labelPart = Object.entries(labels)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([labelKey, value]) => `${labelKey}=${value}`)
    .join(",");
  return labelPart ? `${name}{${labelPart}}` : name;
}

export function incrementMetric(
  name: string,
  labels: Record<string, string> = {},
  by = 1,
): void {
  const metricKey = key(name, labels);
  counters.set(metricKey, (counters.get(metricKey) ?? 0) + by);
}

export function observeLatencyMs(
  name: string,
  latencyMs: number,
  labels: Record<string, string> = {},
): void {
  incrementMetric(`${name}_count`, labels);
  incrementMetric(`${name}_sum_ms`, labels, Math.max(0, Math.round(latencyMs)));
}

export function getMetricsSnapshot(): Record<string, number> {
  return Object.fromEntries(counters.entries());
}

export function resetMetricsForTests(): void {
  counters.clear();
}
