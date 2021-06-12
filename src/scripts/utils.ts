import seedrandom from "seedrandom";

export const $ = (s: string) => document.querySelector(s);

// this one isn't really needed
// I just use it to get syntax highlighting of html
// code in js files
export const html = (
  strings: TemplateStringsArray,
  ...elements: string[]
): string => strings.join("");

export function camelCase(str: string): string {
  // https://stackoverflow.com/a/46116986
  return str
    .split("-")
    .reduce((a, b) => a + b.charAt(0).toUpperCase() + b.slice(1));
}

export function shuffleArray(array: string[], seed: string|undefined) {
  // https://stackoverflow.com/a/12646864
  const rng = seedrandom(seed);
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}
