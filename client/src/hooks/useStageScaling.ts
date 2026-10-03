import { useState, useEffect } from 'react';

export function useStageScaling() {
  const [stage, setStage] = useState<'desktop' | 'phone'>('desktop');
  const [scale, setScale] = useState(1);

  useEffect(() => {
    function updateScale() {
      const ratio = window.innerWidth / window.innerHeight;
      const isDesktop = ratio >= 0.9;

      if (isDesktop) {
        const s = Math.min(window.innerWidth / 1440, window.innerHeight / 900);
        setStage('desktop');
        setScale(s);
      } else {
        const s = window.innerWidth / 390;
        setStage('phone');
        setScale(s);
      }
    }

    updateScale();
    window.addEventListener('resize', updateScale);
    return () => window.removeEventListener('resize', updateScale);
  }, []);

  return { stage, scale };
}
