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
  const trimBefore = secondsToFrames(clip.srcStart);
  const src = staticFile(clip.file);
  const fit = clip.fit ?? 1;
  const isPortrait = clip.orientation === "portrait";

  /** O vídeo ocupando a fração `f` da largura do quadro (1 = preenche). */
  const renderVideo = (f: number) => {
    if (!isPortrait) {
      return (
        <OffthreadVideo
          src={src}
          trimBefore={trimBefore}
          muted
          style={{ width: theme.width, height: theme.height, objectFit: "cover" }}
        />
      );
    }
    const w = theme.width * f;
    const k = w / 1080; // ampliação do vertical
    const tilt = interpolate(
      frame,
      [0, durationInFrames],
      [clip.tilt!.from, clip.tilt!.to],
      CLAMP,
    );
    // mantém o mesmo centro vertical do enquadramento original
    const centerSrc = tilt + theme.height / (theme.width / 1080) / 2;
    return (
      <OffthreadVideo
        src={src}
        trimBefore={trimBefore}
        muted
        style={{
          position: "absolute",
          left: (theme.width - w) / 2,
          width: w,
          height: 1920 * k,
          top: theme.height / 2 - centerSrc * k,
        }}
      />
    );
  };

  // Câmera afastada: o vídeo fica menor, com as bordas esfumadas sobre uma
  // cópia desfocada dele mesmo, que preenche o resto do quadro.
  const feather = 170;
  const side = (theme.width * (1 - fit)) / 2;
  const maskX = isPortrait
    ? `linear-gradient(to right, transparent ${side}px, black ${side + feather}px, black ${theme.width - side - feather}px, transparent ${theme.width - side}px)`
    : "linear-gradient(to right, transparent, black 11%, black 89%, transparent)";
  const maskY = "linear-gradient(to bottom, transparent, black 13%, black 87%, transparent)";
  const mask = isPortrait ? maskX : `${maskX}, ${maskY}`;
  const fgStyle: React.CSSProperties =
    fit < 1
      ? {
          transform: isPortrait ? undefined : `scale(${fit})`,
          maskImage: mask,
          WebkitMaskImage: mask,
          maskComposite: "intersect",
          WebkitMaskComposite: "source-in",
        }
      : {};

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
        {fit < 1 ? (
          <AbsoluteFill
            style={{ filter: "blur(38px) brightness(0.9)", transform: "scale(1.18)" }}
          >
            {renderVideo(1)}
          </AbsoluteFill>
        ) : null}
        <AbsoluteFill style={fgStyle}>{renderVideo(fit)}</AbsoluteFill>
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
