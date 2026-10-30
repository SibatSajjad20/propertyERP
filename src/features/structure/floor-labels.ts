const WORD_LEVELS: Record<string, number> = {
  ground: 0,
  g: 0,
  first: 1,
  second: 2,
  third: 3,
  fourth: 4,
  fifth: 5,
  sixth: 6,
  seventh: 7,
  eighth: 8,
  ninth: 9,
  tenth: 10,
  eleventh: 11,
  twelfth: 12,
};

function ordinalSuffix(n: number): string {
  const abs = Math.abs(n);
  const mod100 = abs % 100;
  const mod10 = abs % 10;
  if (mod100 >= 11 && mod100 <= 13) {
    return "th";
  }
  if (mod10 === 1) {
    return "st";
  }
  if (mod10 === 2) {
    return "nd";
  }
  if (mod10 === 3) {
    return "rd";
  }
  return "th";
}

export function floorLabelForLevel(level: number): string {
  if (level === 0) {
    return "Ground";
  }
  return `${level}${ordinalSuffix(level)}`;
}

export function normaliseFloorLabel(input: string): string {
  const raw = input.trim().replace(/\s+/g, " ");
  if (!raw) {
    return raw;
  }
  const lower = raw.toLowerCase();

  const word = lower.match(
    /^(ground|g|first|second|third|fourth|fifth|sixth|seventh|eighth|ninth|tenth|eleventh|twelfth)(?:\s+(?:floor|level|fl\.?))?$/,
  );
  if (word?.[1]) {
    const mapped = WORD_LEVELS[word[1]];
    if (mapped !== undefined) {
      return floorLabelForLevel(mapped);
    }
  }

  const prefixed = lower.match(/^(?:level|lvl|floor|fl\.?)\s*(-?\d+)$/);
  if (prefixed?.[1]) {
    return floorLabelForLevel(Number(prefixed[1]));
  }

  const numbered = lower.match(/^(-?\d+)(?:st|nd|rd|th)?(?:\s+(?:floor|level|fl\.?))?$/);
  if (numbered?.[1]) {
    return floorLabelForLevel(Number(numbered[1]));
  }

  return raw;
}

export const SARDARS_MALL_FLOORS: ReadonlyArray<{ level: number; name: string }> =
  Array.from({ length: 11 }, (_, level) => ({
    level,
    name: floorLabelForLevel(level),
  }));
