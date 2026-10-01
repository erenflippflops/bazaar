import { useState, useEffect } from 'react';

interface UseWheelAnimationParams {
  totalItems: number;
  targetIndex: number | null;
}

interface UseWheelAnimationReturn {
  rotation: number;
  isAnimating: boolean;
}

/**
 * Hook to animate the wheel spinning to a target item.
 *
 * @param totalItems - Total number of items on the wheel
 * @param targetIndex - The index of the item the wheel should land on (0-based)
 * @returns rotation angle in degrees and animation state
 */
export function useWheelAnimation({
  totalItems,
  targetIndex,
}: UseWheelAnimationParams): UseWheelAnimationReturn {
  const [rotation, setRotation] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    // Only animate when we have a valid target
    if (targetIndex === null || targetIndex < 0) {
      return;
    }

    setIsAnimating(true);

    // Calculate the angle for each segment
    const anglePerSegment = 360 / totalItems;

    // Calculate target rotation:
    // - 3 full rotations (1080 degrees) for visual effect
    // - Plus rotation to land on targetIndex
    // - The wheel segments start at index 0 at the top
    // - We rotate clockwise, so targetIndex * anglePerSegment points that segment to the top
    const fullRotations = 1080; // 3 full spins
    const targetRotation = fullRotations + (targetIndex * anglePerSegment);

    // Start the animation
    const startTime = performance.now();
    const duration = 3000; // 3 seconds
    const startRotation = rotation;

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Ease-out cubic easing function
      const eased = 1 - Math.pow(1 - progress, 3);

      // Calculate current rotation
      const currentRotation = startRotation + (targetRotation - startRotation) * eased;
      setRotation(currentRotation);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setIsAnimating(false);
      }
    };

    requestAnimationFrame(animate);
  }, [targetIndex, totalItems]);

  return {
    rotation,
    isAnimating,
  };
}
