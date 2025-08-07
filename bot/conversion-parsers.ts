type TempMatch = {
  type: 'temperature'
  match: string
  value: number
  unit: 'C' | 'F'
}

type DistanceMatch = {
  type: 'distance'
  match: string
  value: number
  unit: 'cm' | 'm' | 'km' | 'in' | 'yd' | 'mi'
}

type ConversionMatch = TempMatch | DistanceMatch;

// Temperature regex - handles °C, °F, C, F with optional spaces
const tempRegex = /(-?\d+\.?\d*)\s*(?:°\s*)?([CF])\b/gi;

// Distance regex - handles various units with optional spaces
const distanceRegex = /(-?\d+\.?\d*)\s*(cm|m|km|in|yd|mi|inch|yard|mile)s?\b/gi;

// Normalize unit names
const normalizeDistanceUnit = (unit: string): 'cm' | 'm' | 'km' | 'in' | 'yd' | 'mi' => {
  switch (unit.toLowerCase()) {
    case 'inch': return 'in';
    case 'yard': return 'yd';
    case 'mile': return 'mi';
    default: return unit.toLowerCase() as any;
  }
};

export function parseTemperature(text: string): TempMatch[] {
  const matches: TempMatch[] = [];
  let match;

  while ((match = tempRegex.exec(text)) !== null) {
    const value = parseFloat(match[1]);
    const unit = match[2].toUpperCase() as 'C' | 'F';
    matches.push({
      type: 'temperature',
      match: match[0],
      value,
      unit
    });
  }

  return matches;
}

export function parseDistance(text: string): DistanceMatch[] {
  const matches: DistanceMatch[] = [];
  let match;

  while ((match = distanceRegex.exec(text)) !== null) {
    const value = parseFloat(match[1]);
    const unit = normalizeDistanceUnit(match[2]);
    matches.push({
      type: 'distance',
      match: match[0],
      value,
      unit
    });
  }

  return matches;
}

export function findConversions(text: string): ConversionMatch[] {
  return [
    ...parseTemperature(text),
    ...parseDistance(text)
  ];
}

export function convertTemperature(value: number, from: 'C' | 'F'): string {
  if (from === 'C') {
    const fahrenheit = (value * 9 / 5) + 32;
    return `${value}°C is ${fahrenheit.toFixed(1)}°F`;
  } else {
    const celsius = (value - 32) * 5 / 9;
    return `${value}°F is ${celsius.toFixed(1)}°C`;
  }
}

export function convertDistance(value: number, unit: DistanceMatch['unit']): string {
  const conversions = {
    cm: { cm: 1, m: 0.01, km: 0.00001, in: 0.393701, yd: 0.0109361, mi: 0.00000621371 },
    m: { m: 1, cm: 100, km: 0.001, in: 39.3701, yd: 1.09361, mi: 0.000621371 },
    km: { km: 1, cm: 100000, m: 1000, in: 39370.1, yd: 1093.61, mi: 0.621371 },
    in: { in: 1, cm: 2.54, m: 0.0254, km: 0.0000254, yd: 0.0277778, mi: 0.0000157828 },
    yd: { yd: 1, cm: 91.44, m: 0.9144, km: 0.0009144, in: 36, mi: 0.000568182 },
    mi: { mi: 1, cm: 160934, m: 1609.34, km: 1.60934, in: 63360, yd: 1760 }
  };

  const results: string[] = [];
  const conv = conversions[unit];

  // Convert to commonly used units based on the input unit and value
  if (unit === 'cm') {
    if (value >= 100) results.push(`${(value * conv.m).toFixed(2)}m`);
    results.push(`${(value * conv.in).toFixed(2)}in`);
  } else if (unit === 'm') {
    results.push(`${(value * conv.yd).toFixed(2)}yd`);
    if (value >= 1000) results.push(`${(value * conv.km).toFixed(2)}km`);
  } else if (unit === 'km') {
    results.push(`${(value * conv.mi).toFixed(2)}mi`);
    results.push(`${(value * conv.m).toFixed(0)}m`);
  } else if (unit === 'in') {
    results.push(`${(value * conv.cm).toFixed(1)}cm`);
    if (value >= 36) results.push(`${(value * conv.yd).toFixed(2)}yd`);
  } else if (unit === 'yd') {
    results.push(`${(value * conv.m).toFixed(2)}m`);
  } else if (unit === 'mi') {
    results.push(`${(value * conv.km).toFixed(2)}km`);
  }

  return `${value}${unit} is ${results.join(' or ')}`;
}