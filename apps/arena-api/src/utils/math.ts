export interface Vector3 {
  x: number;
  y: number;
  z: number;
}

/** Squared distance between two 3D points (avoids sqrt for comparisons). */
export function distanceSquared3D(a: Vector3, b: Vector3): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  const dz = a.z - b.z;
  return dx * dx + dy * dy + dz * dz;
}

/** Squared distance on the XZ ground plane only (ignores Y height). */
export function distanceSquaredXZ(a: { x: number; z: number }, b: { x: number; z: number }): number {
  const dx = a.x - b.x;
  const dz = a.z - b.z;
  return dx * dx + dz * dz;
}

export function lerp(start: number, end: number, t: number): number {
  return start + (end - start) * t;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/** Returns a random point within a circle on the XZ plane. */
export function randomInCircleXZ(
  center: { x: number; z: number },
  radius: number
): { x: number; z: number } {
  const angle = Math.random() * Math.PI * 2;
  const r = Math.sqrt(Math.random()) * radius;
  return {
    x: center.x + Math.cos(angle) * r,
    z: center.z + Math.sin(angle) * r,
  };
}
