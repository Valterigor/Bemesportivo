import React from 'react';
import { AbsoluteFill, Composition, Img, registerRoot, staticFile, useCurrentFrame } from 'remotion';

const HeroMotion = () => {
  const frame = useCurrentFrame();
  // Periodic camera movement: the last frame joins the first without a cut.
  const phase = frame / 300 * Math.PI * 2;
  const travel = (1 - Math.cos(phase)) / 2;
  return (
    <AbsoluteFill style={{ overflow: 'hidden', backgroundColor: '#111' }}>
      <Img src={staticFile('runners.jpg')} style={{
        width: '100%', height: '100%', objectFit: 'cover',
        transformOrigin: '60% 45%',
        transform: `translate(${Math.sin(phase) * 9}px, ${Math.sin(phase * 2) * 2}px) scale(${1.045 + travel * 0.045})`,
      }} />
      <AbsoluteFill style={{
        background: 'radial-gradient(ellipse at 100% 38%, rgba(255,192,98,.22), transparent 60%)',
        opacity: 0.25 + travel * 0.3,
      }} />
    </AbsoluteFill>
  );
};

registerRoot(() => <Composition id="HeroMotion" component={HeroMotion} width={1200} height={800} fps={30} durationInFrames={300} />);
