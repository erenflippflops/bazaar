# Task 19b – Implement fixed-stage scaling system

## Goal
Replace the current responsive layout with the fixed-stage scaling system from Task 19 Rule 2.
Two stages (Desktop 1440×900, Phone 390×844) that scale to fit the window.

## Files you may change
- `client/src/App.tsx`
- `client/src/App.css`
- `client/src/hooks/useStageScaling.ts` (create new)

## Builder
1. Create `client/src/hooks/useStageScaling.ts`:
   ```typescript
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
   ```

2. In `App.tsx`:
   - Use `useStageScaling()` hook
   - Wrap the main content in a scaled container:
     ```tsx
     <div style={{
       width: stage === 'desktop' ? 1440 : 390,
       height: stage === 'desktop' ? 900 : 844,
       transform: `scale(${scale})`,
       transformOrigin: 'top left',
       position: 'absolute',
       top: stage === 'desktop' ? '50%' : 0,
       left: '50%',
       marginTop: stage === 'desktop' ? -450 * scale : 0,
       marginLeft: stage === 'desktop' ? -720 * scale : -195 * scale,
     }}>
       {/* existing routes */}
     </div>
     ```

3. In `App.css`:
   - Add full-screen background that extends beyond the stage (same background as stage)
   - Remove the old `#root { zoom }` rules
   - Set `body` to show the base color + rays + star pattern everywhere

4. Phone stage may grow taller than 844px and scroll on lobby/login/results screens only.

## Audit
Manual verification:
1. Test at 2576×1002, 1536×730, 1366×657, 390×844
2. Desktop: stage centered, scaled proportionally, no empty bars (background fills)
3. Phone: stage fills width, scrollable on tall content
4. Verify the switch happens at width/height ratio = 0.9

## Commit messages
```
Implement fixed-stage scaling system

- Desktop 1440×900, Phone 390×844
- Scale with transform, centered
- Background extends beyond stage
- Switch at aspect ratio 0.9

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>
```

## Report
1. Screenshots at 1440×900 and 390×844
2. Confirmation that scaling works at test resolutions
