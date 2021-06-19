import seedrandom from "seedrandom";

export const $ = (s: string) => document.querySelector(s);

// this one isn't really needed
// I just use it to get syntax highlighting of html
// code in js files
export const html = (
  strings: TemplateStringsArray,
  ...elements: string[]
): string => strings.join("");

export function shuffleArray(array: string[], seed: string | undefined) {
  /*
   * https://stackoverflow.com/a/12646864
   * Licensed CC BY-SA 4.0
   * https://creativecommons.org/licenses/by-sa/4.0/
   * Modifications:
   * - Added support for rng seed
   */
  const rng = seedrandom(seed);
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}
