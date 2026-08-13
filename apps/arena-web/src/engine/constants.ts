/**
 * Client-only constants for 3D rendering and physics.
 *
 * Shared gameplay constants (PLAYER_SPEED, WORLD_SIZE, etc.) are imported
 * from @average.dev/arena-shared where they are the single source of truth.
 */

/** Player visual capsule dimensions (before scale). */
export const PLAYER_RADIUS = 0.4;
export const PLAYER_HEIGHT = 1.8;

/** Player scale multiplier applied to the visual model group. */
export const PLAYER_SCALE = 0.35;

/**
 * Physics capsule collider dimensions (world-space, post-scale).
 * CapsuleCollider args = [halfHeight, radius] where
 * total height = 2 * halfHeight + 2 * radius.
 */
export const COLLIDER_RADIUS = 0.12;
export const COLLIDER_HALF_HEIGHT = 0.15;

/** Jump impulse applied to the rigid body's Y velocity. */
export const JUMP_IMPULSE = 4;

/** Gravity vector for the Rapier physics world. */
export const WORLD_GRAVITY: [number, number, number] = [0, -15, 0];

/** Ground detection threshold — player is grounded when |vy| < this. */
export const GROUNDED_THRESHOLD = 0.5;

/** Linear damping applied to the player rigid body (reduces sliding). */
export const PLAYER_DAMPING = 0.5;
