/**
 * Lightweight className joiner.
 * Accepts strings, falsy values, arrays, and objects of `class -> boolean`.
 */
export type ClassValue =
  | string
  | number
  | null
  | false
  | undefined
  | ClassValue[]
  | { [key: string]: boolean | null | undefined };

export function cn(...inputs: ClassValue[]): string {
  const out: string[] = [];
  const push = (value: ClassValue) => {
    if (!value) return;
    if (typeof value === "string" || typeof value === "number") {
      out.push(String(value));
      return;
    }
    if (Array.isArray(value)) {
      value.forEach(push);
      return;
    }
    if (typeof value === "object") {
      for (const key of Object.keys(value)) {
        if (value[key]) out.push(key);
      }
    }
  };
  inputs.forEach(push);
  return out.join(" ");
}
