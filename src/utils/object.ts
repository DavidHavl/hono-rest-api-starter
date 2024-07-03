export function pickObjectProperties(obj: Record<string, unknown>, properties: string[]): Record<string, unknown> {
  return Object.fromEntries(
    properties.map((prop) => (obj[prop] !== undefined ? [prop, obj[prop]] : [])).filter((item) => item.length),
  );
}

export function omitObjectProperties(obj: Record<string, unknown>, properties: string[]): Record<string, unknown> {
  return Object.fromEntries(Object.entries(obj).filter(([key]) => !properties.includes(key)));
}

export function filterUndefinedObjectProperties(obj) {
  const filteredEntries = Object.entries(obj).filter(([_, value]) => value !== undefined);
  return Object.fromEntries(filteredEntries);
}
