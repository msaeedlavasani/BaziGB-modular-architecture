/** ابزارهای عمومی موتور — خالص و بدون وابستگی */

/** عدد صحیح تصادفی در بازه [min, max] (شامل هر دو سر) */
export function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/** انتخاب تصادفی از آرایه */
export function pickRandom<T>(arr: readonly T[]): T {
  if (arr.length === 0) throw new Error('pickRandom: آرایه خالی است');
  return arr[randomInt(0, arr.length - 1)];
}

/** برهم‌زدن تصادفی آرایه (کپی جدید) */
export function shuffle<T>(arr: readonly T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = randomInt(0, i);
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/** پرتاب تاس استاندارد ۶ وجهی */
export function rollDice(): number {
  return randomInt(1, 6);
}

/** پرتاب دو تاس */
export function rollDicePair(): [number, number] {
  return [rollDice(), rollDice()];
}

/**
 * تبدیل دو تاس به لیست حرکت‌ها.
 * تاس‌های تکراری ۴ بار تکرار می‌شوند (مثلاً ۶-۶ → [6,6,6,6]).
 */
export function diceSteps(dice: [number, number] | number[]): number[] {
  const [a, b] = dice;
  if (a === b) return [a, a, a, a];
  return [a, b];
}

/** کلون عمیق (با structuredClone یا JSON) */
export function deepClone<T>(value: T): T {
  if (typeof structuredClone === 'function') return structuredClone(value);
  return JSON.parse(JSON.stringify(value)) as T;
}

/** جمع امتیازها */
export function totalScore(scores: Record<string, number>): number {
  return Object.values(scores).reduce((sum, s) => sum + s, 0);
}

/** تعویض نوبت بین دو بازیکن */
export function switchTurn(current: string, players: readonly { id: string }[]): string {
  const ids = players.map((p) => p.id);
  const idx = ids.indexOf(current);
  if (idx === -1) return ids[0] ?? current;
  return ids[(idx + 1) % ids.length];
}

/** قفل کردن آبجکت در برابر تغییر (در حالت توسعه برای تست‌ها) */
export function asConst<T>(value: T): Readonly<T> {
  return value;
}
