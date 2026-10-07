import { useRef, useCallback } from 'react';
import useReducedMotion from './useReducedMotion';

/**
 * Magnetic effect: elements subtly follow the cursor when hovered.
 * Returns { ref, onMouseMove, onMouseLeave } to attach to the element.
 * @param {number} strength - Displacement strength in pixels (default: 4)
 */
export default function useMagneticEffect(strength = 4) {
  const ref = useRef(null);
  const prefersReduced = useReducedMotion();

  const onMouseMove = useCallback((e) => {
    if (prefersReduced || !ref.current) return;
    const el = ref.current;
    const rect = el.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    const dx = (x / rect.width) * strength;
    const dy = (y / rect.height) * strength;
    el.style.transform = `translate(${dx}px, ${dy}px)`;
  }, [prefersReduced, strength]);

  const onMouseLeave = useCallback(() => {
    if (!ref.current) return;
    ref.current.style.transform = 'translate(0, 0)';
    ref.current.style.transition = 'transform 400ms cubic-bezier(0.16, 1, 0.3, 1)';
    setTimeout(() => {
      if (ref.current) ref.current.style.transition = '';
    }, 400);
  }, []);

  return { ref, onMouseMove, onMouseLeave };
}
