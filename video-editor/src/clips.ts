/**
 * Linha do tempo do plano-sequência: grão → fogo → torrador → grãos → espresso → xícara.
 * Ordem pensada para os cortes caírem em fumaça, escuro e na xícara branca (match cut).
 */
export type Look = {
  /** ganho de exposição (1 = igual ao original) */
  exposure: number;
  /** expoente gamma (<1 clareia sombras, >1 escurece) */
  gamma: number;
  /** ganho por canal (balanço de cor) */
  rgb: [number, number, number];
  /** levantamento de pretos por canal (tinge as sombras de marrom) */
  lift: [number, number, number];
  /** saturação (1 = original) */
  saturation: number;
};

export type Clip = {
  id: string;
  file: string;
  /** início dentro do arquivo original, em segundos */
  srcStart: number;
  /** quanto do clipe entra na timeline, em segundos */
  seconds: number;
  orientation: "landscape" | "portrait";
  /**
   * Só para vertical: posição do topo da janela 16:9, em pixels do arquivo original
   * (1080x1920). A janela desce como uma inclinação (tilt) de câmera.
   */
  tilt?: { from: number; to: number };
  /** zoom lento contínuo (dolly in) aplicado ao clipe inteiro */
  push: [number, number];
  look: Look;
};

export const clips: Clip[] = [
  {
    id: "fogo",
    file: "17122045-hd_1920_1080_50fps.mp4",
    srcStart: 1.5,
    seconds: 8,
    orientation: "landscape",
    push: [1.0, 1.1],
    look: {
      exposure: 0.8,
      gamma: 1.0,
      rgb: [0.98, 0.94, 0.92],
      lift: [0.012, 0.007, 0.003],
      saturation: 0.82,
    },
  },
  {
    id: "torrador",
    file: "17645750-hd_1080_1920_60fps.mp4",
    srcStart: 1.0,
    seconds: 5,
    orientation: "portrait",
    tilt: { from: 250, to: 800 },
    push: [1.0, 1.08],
    look: {
      exposure: 0.96,
      gamma: 0.97,
      rgb: [0.99, 0.98, 0.96],
      lift: [0.012, 0.007, 0.003],
      saturation: 0.9,
    },
  },
  {
    id: "graos",
    file: "44802-440260915.mp4",
    srcStart: 1.5,
    seconds: 6,
    orientation: "landscape",
    push: [1.04, 1.12],
    look: {
      exposure: 1.45,
      gamma: 0.78,
      rgb: [1.04, 0.98, 0.9],
      lift: [0.02, 0.012, 0.006],
      saturation: 1.0,
    },
  },
  {
    id: "espresso",
    file: "mixkit-cup-being-filled-with-coffee-in-a-coffee-machine-41865-full-hd.mp4",
    srcStart: 2.0,
    seconds: 6.5,
    orientation: "portrait",
    tilt: { from: 330, to: 780 },
    push: [1.0, 1.08],
    look: {
      exposure: 0.9,
      gamma: 1.0,
      rgb: [1.14, 0.98, 0.76], // esquenta o azul do original
      lift: [0.014, 0.008, 0.003],
      saturation: 1.08,
    },
  },
  {
    id: "xicara",
    file: "mixkit-serving-a-sparkling-cappuccino-in-a-cup-41859-full-hd.mp4",
    srcStart: 0.5,
    seconds: 8.5,
    orientation: "landscape",
    push: [1.0, 1.1],
    look: {
      exposure: 0.84,
      gamma: 1.0,
      rgb: [1.0, 0.97, 0.92],
      lift: [0.012, 0.007, 0.003],
      saturation: 0.92,
    },
  },
];
