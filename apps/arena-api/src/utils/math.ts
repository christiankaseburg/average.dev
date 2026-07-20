export interface Vector2 {
  x: number;
  y: number;
}

export function distanceSquared(a: Vector2, b: Vector2): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return dx * dx + dy * dy;
}

export function lerp(start: number, end: number, t: number): number {
  return start + (end - start) * t;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function randomInCircle(center: Vector2, radius: number): Vector2 {
  const angle = Math.random() * Math.PI * 2;
  const r = Math.random() * radius; // Or Math.sqrt(Math.random()) * radius for uniform distribution
  return {
    x: center.x + Math.cos(angle) * r,
    y: center.y + Math.sin(angle) * r
  };
}
