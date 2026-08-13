/**
 * Camera system types — defines the pluggable camera architecture.
 * New camera modes are added by:
 * 1. Adding a value to CameraMode
 * 2. Creating a useXxxCamera hook that returns CameraHookResult
 * 3. Adding the hook to the switch in PlayerController.tsx
 */

export type CameraMode = 'isometric' | 'third-person';

/**
 * Every camera hook must return this interface so the PlayerController
 * can consume it uniformly regardless of the active camera mode.
 */
export interface CameraHookResult {
  /** Current horizontal yaw angle (radians). Player controller reads this for camera-relative movement. */
  yaw: React.MutableRefObject<number>;
}
