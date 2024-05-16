export function pickObjectProperties(obj: Record<string, unknown>, properties: string[]): Record<string, unknown> {
  return Object.fromEntries(
    properties.map((prop) => (obj[prop] !== undefined ? [prop, obj[prop]] : [])).filter((item) => item.length),
  );
}

export function omitObjectProperties(obj: Record<string, unknown>, properties: string[]): Record<string, unknown> {
  return Object.fromEntries(Object.entries(obj).filter(([key]) => !properties.includes(key)));
}
