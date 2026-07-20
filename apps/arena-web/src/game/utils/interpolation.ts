export function lerpValue(current: number, target: number, t: number): number {
  return current + (target - current) * t;
}

export function lerpPosition(current: {x: number, y: number}, target: {x: number, y: number}, t: number): {x: number, y: number} {
  return {
    x: lerpValue(current.x, target.x, t),
    y: lerpValue(current.y, target.y, t)
  };
}

export const INTERPOLATION_SPEED = 0.15;
