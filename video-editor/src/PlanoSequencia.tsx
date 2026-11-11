import React from "react";
import {
  AbsoluteFill,
  OffthreadVideo,
  Sequence,
  interpolate,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { Clip, clips } from "./clips";
import { theme } from "./theme";

const secondsToFrames = (s: number) => Math.round(s * theme.fps);
const filterId = (id: string) => `look-${id}`;
const CLAMP = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

/**
 * Um filtro SVG por clipe: correção de exposição, gamma, balanço de cor,
 * levantamento de pretos e saturação. É isso que faz 5 vídeos de origens
 * diferentes parecerem filmados com a mesma câmera e a mesma luz.
 */
const LookFilters: React.FC = () => (
  <svg width={0} height={0} style={{ position: "absolute" }}>
    <defs>
      {clips.map((c) => (
        <filter
          key={c.id}
          id={filterId(c.id)}
          colorInterpolationFilters="sRGB"
          x="0"
          y="0"
          width="100%"
          height="100%"
        >
          <feComponentTransfer>
            {(["R", "G", "B"] as const).map((ch, i) => {
              const props = {
                type: "gamma" as const,
                amplitude: c.look.exposure * c.look.rgb[i],
                exponent: c.look.gamma,
                offset: c.look.lift[i],
              };
              if (ch === "R") return <feFuncR key={ch} {...props} />;
              if (ch === "G") return <feFuncG key={ch} {...props} />;
              return <feFuncB key={ch} {...props} />;
            })}
          </feComponentTransfer>
          <feColorMatrix type="saturate" values={String(c.look.saturation)} />
        </filter>
      ))}
    </defs>
  </svg>
);

/**
 * Câmera contínua: todo clipe tem um dolly (zoom) lento e constante, e os
 * verticais descem como uma inclinação de câmera. Movimento em velocidade
 * constante (linear de propósito) para não "frear" na hora do corte.
 */
const ClipLayer: React.FC<{ clip: Clip; isFirst: boolean }> = ({
  clip,
  isFirst,
}) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const T = theme.transition;

  // entrada: o clipe novo aparece por cima do anterior, saindo de um leve
  // desfoque e de um zoom ligeiramente maior que assenta (continua o movimento)
  const p = isFirst
    ? 1
    : interpolate(frame, [0, T], [0, 1], { easing: theme.ease.inOut, ...CLAMP });
  const blur = (1 - p) * 7;
  const settle = 1 + (1 - p) * 0.05;

  const push = interpolate(frame, [0, durationInFrames], clip.push, CLAMP);
  const k = theme.width / 1080; // fator de ampliação do vertical para 1920 px

  const trimBefore = secondsToFrames(clip.srcStart);
  const src = staticFile(clip.file);

  return (
    <AbsoluteFill
      style={{ opacity: p, filter: `blur(${blur}px)`, overflow: "hidden" }}
    >
      <AbsoluteFill
        style={{
          transform: `scale(${push * settle})`,
          filter: `url(#${filterId(clip.id)})`,
        }}
      >
        {clip.orientation === "landscape" ? (
          <OffthreadVideo
            src={src}
            trimBefore={trimBefore}
            muted
            style={{
              width: theme.width,
              height: theme.height,
              objectFit: "cover",
            }}
          />
        ) : (
          <OffthreadVideo
            src={src}
            trimBefore={trimBefore}
            muted
            style={{
              position: "absolute",
              left: 0,
              width: theme.width,
              height: 1920 * k,
              top:
                -interpolate(
                  frame,
                  [0, durationInFrames],
                  [clip.tilt!.from, clip.tilt!.to],
                  CLAMP,
                ) * k,
            }}
          />
        )}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

const NOISE = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='220' height='220'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2'/%3E%3C/filter%3E%3Crect width='220' height='220' filter='url(%23n)' opacity='0.5'/%3E%3C/svg%3E")`;

/** Camadas finais, iguais em todo o filme: tinta, névoa de sombra, vinheta, grão. */
const MasterLook: React.FC = () => {
  const frame = useCurrentFrame();
  const { gradeOpacity, fog, vignette, grain } = theme.look;
  const shadow = "18,10,6";
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <AbsoluteFill
        style={{
          backgroundColor: theme.colors.torra,
          mixBlendMode: "soft-light",
          opacity: gradeOpacity,
        }}
      />
      <AbsoluteFill
        style={{
          background: `linear-gradient(0deg, rgba(${shadow},${fog}) 0%, rgba(${shadow},0) 45%, rgba(${shadow},${fog * 0.5}) 100%)`,
        }}
      />
      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse at center, transparent 50%, rgba(10,5,3,${vignette}) 100%)`,
        }}
      />
      <AbsoluteFill
        style={{
          backgroundImage: NOISE,
          backgroundSize: "220px",
          backgroundPosition: `${(frame * 7) % 220}px ${(frame * 13) % 220}px`,
          opacity: grain,
          mixBlendMode: "overlay",
        }}
      />
    </AbsoluteFill>
  );
};

export const PlanoSequencia: React.FC = () => {
  let cursor = 0;
  return (
    <AbsoluteFill style={{ backgroundColor: theme.colors.espresso }}>
      <LookFilters />
      {clips.map((clip, i) => {
        const from = cursor;
        const dur = secondsToFrames(clip.seconds);
        cursor += dur - theme.transition;
        return (
          <Sequence key={clip.id} from={from} durationInFrames={dur}>
            <ClipLayer clip={clip} isFirst={i === 0} />
          </Sequence>
        );
      })}
      <MasterLook />
    </AbsoluteFill>
  );
};
