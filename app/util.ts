export function generateNumber(digits: number) {
  const multiplier = Math.pow(10, digits - 1);
  return Math.floor(Math.random() * 9 * multiplier) + multiplier;
}

export function getRandomElement<T>(array: T[]) {
  return array[Math.floor(Math.random() * array.length)];
}
