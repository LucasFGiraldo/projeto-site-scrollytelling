import React from "react";
import { Composition } from "remotion";
import { PlanoSequencia } from "./PlanoSequencia";
import { clips } from "./clips";
import { theme } from "./theme";

const secondsToFrames = (s: number) => Math.round(s * theme.fps);

/** Duração total = soma dos clipes menos as sobreposições entre eles. */
export const totalFrames =
  clips.reduce((sum, c) => sum + secondsToFrames(c.seconds), 0) -
  (clips.length - 1) * theme.transition;

export const Root: React.FC = () => (
  <Composition
    id="PlanoSequencia"
    component={PlanoSequencia}
    durationInFrames={totalFrames}
    fps={theme.fps}
    width={theme.width}
    height={theme.height}
  />
);
