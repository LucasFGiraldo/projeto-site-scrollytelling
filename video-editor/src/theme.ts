import { Easing } from "remotion";

/**
 * Tema único do projeto "Do grão à xícara".
 * Nenhuma cor, easing ou duração fica solta dentro dos componentes.
 */
export const theme = {
  fps: 24, // cinema; todos os clipes (24 a 60 fps) são reamostrados para cá
  width: 1920,
  height: 1080,

  /** Sobreposição entre clipes, em frames (0,75 s). */
  transition: 18,

  colors: {
    espresso: "#120a06", // preto quente, sombras
    torra: "#8a4f22", // âmbar de torra, tinta global
    ember: "#c97a32", // brasa, realces
    crema: "#ead7b7", // creme, altas luzes
  },

  ease: {
    inOut: Easing.bezier(0.65, 0, 0.35, 1),
    out: Easing.bezier(0.16, 1, 0.3, 1),
  },

  /** Look global aplicado por cima de TODOS os clipes. */
  look: {
    gradeOpacity: 0.2, // tinta soft-light
    vignette: 0.5, // escurecimento das bordas
    grain: 0.05, // grão de filme
    fog: 0.28, // sombra de baixo para cima (mesma "luz" em todos)
  },
} as const;
