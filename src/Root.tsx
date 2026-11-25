import React from 'react';
import {Composition} from 'remotion';
import {SpreadDemo, SPREAD_DEMO_FRAMES} from './scenes/SpreadDemo';
import {Chapter, type Ch} from './engine/Chapter';
import {CHAPTERS} from './generated';
import {FPS, W, H} from './theme';

export const Root: React.FC = () => (
  <>
    <Composition id="SpreadDemo" component={SpreadDemo} durationInFrames={SPREAD_DEMO_FRAMES} fps={FPS} width={W} height={H} />
    {(CHAPTERS as unknown as Ch[]).map((ch) => (
      <Composition key={ch.id} id={ch.id} component={Chapter as any} defaultProps={{ch}} durationInFrames={ch.total} fps={FPS} width={W} height={H} />
    ))}
  </>
);
