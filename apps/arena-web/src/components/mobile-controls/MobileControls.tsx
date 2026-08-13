import React, { useRef, useCallback, useEffect, useState } from 'react';
import styles from './MobileControls.module.scss';

/**
 * Global touch input state — read by usePlayerController each frame.
 * Using a module-level object avoids React re-renders on every touch move.
 */
export const touchInput = {
  moveX: 0,
  moveZ: 0,
  jump: false,
  attack: false,
  zoomDelta: 0,
};

/** Returns true if the device has touch capability. */
export function isTouchDevice(): boolean {
  return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
}

/**
 * MobileControls — renders a virtual joystick (left) and action buttons (right).
 * Only renders on touch-capable devices.
 */
export function MobileControls() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(isTouchDevice());
  }, []);

  if (!visible) return null;

  return (
    <div className={styles.overlay}>
      <PinchZoom />
      <Joystick />
      <ActionButtons />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Joystick
// ---------------------------------------------------------------------------

function Joystick() {
  const baseRef = useRef<HTMLDivElement>(null);
  const knobRef = useRef<HTMLDivElement>(null);
  const activeTouch = useRef<number | null>(null);
  const baseCenter = useRef({ x: 0, y: 0 });
  const RADIUS = 50;

  const handleStart = useCallback((e: React.TouchEvent) => {
    if (activeTouch.current !== null) return;
    const touch = e.changedTouches[0];
    activeTouch.current = touch.identifier;

    const rect = baseRef.current?.getBoundingClientRect();
    if (rect) {
      baseCenter.current = {
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2,
      };
    }
  }, []);

  const handleMove = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    const touch = Array.from(e.changedTouches).find(
      (t) => t.identifier === activeTouch.current
    );
    if (!touch || !knobRef.current) return;

    let dx = touch.clientX - baseCenter.current.x;
    let dy = touch.clientY - baseCenter.current.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist > RADIUS) {
      dx = (dx / dist) * RADIUS;
      dy = (dy / dist) * RADIUS;
    }

    knobRef.current.style.transform = `translate(${dx}px, ${dy}px)`;

    // Normalize to -1..1
    touchInput.moveX = dx / RADIUS;
    touchInput.moveZ = dy / RADIUS;
  }, []);

  const handleEnd = useCallback(() => {
    activeTouch.current = null;
    if (knobRef.current) {
      knobRef.current.style.transform = 'translate(0px, 0px)';
    }
    touchInput.moveX = 0;
    touchInput.moveZ = 0;
  }, []);

  return (
    <div
      ref={baseRef}
      className={styles.joystickBase}
      onTouchStart={handleStart}
      onTouchMove={handleMove}
      onTouchEnd={handleEnd}
      onTouchCancel={handleEnd}
    >
      <div ref={knobRef} className={styles.joystickKnob} />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Action Buttons
// ---------------------------------------------------------------------------

function ActionButtons() {
  const handleJumpStart = useCallback(() => {
    touchInput.jump = true;
  }, []);

  const handleJumpEnd = useCallback(() => {
    touchInput.jump = false;
  }, []);

  const handleAttackStart = useCallback(() => {
    touchInput.attack = true;
  }, []);

  const handleAttackEnd = useCallback(() => {
    touchInput.attack = false;
  }, []);

  return (
    <div className={styles.actionButtons}>
      <button
        className={`${styles.actionBtn} ${styles.jumpBtn}`}
        onTouchStart={handleJumpStart}
        onTouchEnd={handleJumpEnd}
        onTouchCancel={handleJumpEnd}
      >
        JUMP
      </button>
      <button
        className={`${styles.actionBtn} ${styles.attackBtn}`}
        onTouchStart={handleAttackStart}
        onTouchEnd={handleAttackEnd}
        onTouchCancel={handleAttackEnd}
      >
        ATK
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Pinch-to-zoom
// ---------------------------------------------------------------------------

function PinchZoom() {
  const lastPinchDist = useRef<number | null>(null);

  useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        lastPinchDist.current = Math.sqrt(dx * dx + dy * dy);
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length !== 2 || lastPinchDist.current === null) return;

      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const delta = lastPinchDist.current - dist;

      // Positive delta = pinch in (zoom out), negative = pinch out (zoom in)
      touchInput.zoomDelta = delta * 0.02;
      lastPinchDist.current = dist;
    };

    const handleTouchEnd = () => {
      lastPinchDist.current = null;
      touchInput.zoomDelta = 0;
    };

    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: true });
    window.addEventListener('touchend', handleTouchEnd, { passive: true });
    window.addEventListener('touchcancel', handleTouchEnd, { passive: true });

    return () => {
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
      window.removeEventListener('touchcancel', handleTouchEnd);
    };
  }, []);

  return null;
}
