import React from 'react';
import {Composition} from 'remotion';
import {SpreadDemo, SPREAD_DEMO_FRAMES} from './scenes/SpreadDemo';
import {FPS, W, H} from './theme';

export const Root: React.FC = () => (
  <Composition id="SpreadDemo" component={SpreadDemo} durationInFrames={SPREAD_DEMO_FRAMES} fps={FPS} width={W} height={H} />
);
