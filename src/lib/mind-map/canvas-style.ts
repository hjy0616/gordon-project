import { BackgroundVariant } from "@xyflow/react";
import type {
  CanvasBackgroundColor,
  CanvasBackgroundPattern,
} from "@/types/mind-map";

interface BackgroundRenderProps {
  /** xyflow Background variant. undefined → 패턴 자체 미렌더 (blank) */
  variant: BackgroundVariant | undefined;
  /** 점/선 간격 (number = both axes, [x, y] = 축별) */
  gap: number | [number, number];
  /** 점 크기 또는 lined/grid에서는 size로 보정값 */
  size: number;
  /** lines/grid의 선 굵기 */
  lineWidth?: number;
  /** blank 패턴: <Background> 자체를 렌더링하지 않음 */
  hidden?: boolean;
}

/**
 * 패턴 키 → xyflow <Background> props 매핑.
 * 신규 컴포넌트 없이 xyflow 내장 variant + gap/lineWidth 만으로 5종 구현.
 *  - blank: 미렌더 (단색 배경만)
 *  - dots: variant=Dots, gap 24
 *  - grid: variant=Lines, gap 24, 가는 선
 *  - lined: variant=Lines, gap [1200, 32] — 세로선이 거의 보이지 않게 + 가로선만 강조 (노트 느낌)
 *  - cross: variant=Cross — 격자 교차점에 작은 + 마크
 */
export function backgroundPropsFor(
  pattern: CanvasBackgroundPattern,
): BackgroundRenderProps {
  switch (pattern) {
    case "blank":
      return { variant: undefined, gap: 24, size: 0, hidden: true };
    case "dots":
      return { variant: BackgroundVariant.Dots, gap: 24, size: 1.2 };
    case "grid":
      return {
        variant: BackgroundVariant.Lines,
        gap: 24,
        size: 1,
        lineWidth: 0.6,
      };
    case "lined":
      return {
        variant: BackgroundVariant.Lines,
        gap: [1200, 32],
        size: 1,
        lineWidth: 0.8,
      };
    case "cross":
      return { variant: BackgroundVariant.Cross, gap: 32, size: 4 };
  }
}

interface ColorPreset {
  /** ReactFlow 래퍼에 적용할 Tailwind className */
  className: string;
  /** xyflow <Background color={}> 에 전달할 패턴 stroke 색상 (CSS string) */
  patternColor: string;
  /** UI 스와치용 light 모드 색 (썸네일 그라디언트의 한쪽) */
  swatchLight: string;
  /** UI 스와치용 dark 모드 색 */
  swatchDark: string;
}

const COLOR_PRESETS: Record<CanvasBackgroundColor, ColorPreset> = {
  default: {
    className: "bg-background",
    patternColor: "var(--border)",
    swatchLight: "oklch(1 0 0)",
    swatchDark: "oklch(0.18 0 0)",
  },
  white: {
    className: "canvas-force-light bg-white",
    patternColor: "oklch(0.40 0 0 / 35%)",
    swatchLight: "oklch(1 0 0)",
    swatchDark: "oklch(1 0 0)",
  },
  paper: {
    className: "canvas-force-light bg-[#F5EEDC]",
    patternColor: "oklch(0.45 0.08 70 / 45%)",
    swatchLight: "#F5EEDC",
    swatchDark: "#F5EEDC",
  },
  black: {
    className: "canvas-force-dark bg-black",
    patternColor: "oklch(0.85 0 0 / 35%)",
    swatchLight: "oklch(0 0 0)",
    swatchDark: "oklch(0 0 0)",
  },
  cream: {
    className: "bg-[oklch(0.97_0.02_90)] dark:bg-[oklch(0.22_0.02_90)]",
    patternColor: "oklch(0.50 0.05 70 / 45%)",
    swatchLight: "oklch(0.97 0.02 90)",
    swatchDark: "oklch(0.22 0.02 90)",
  },
  kraft: {
    className: "bg-[oklch(0.93_0.04_70)] dark:bg-[oklch(0.24_0.03_70)]",
    patternColor: "oklch(0.40 0.06 60 / 55%)",
    swatchLight: "oklch(0.93 0.04 70)",
    swatchDark: "oklch(0.24 0.03 70)",
  },
  mint: {
    className: "bg-[oklch(0.96_0.04_160)] dark:bg-[oklch(0.22_0.04_160)]",
    patternColor: "oklch(0.45 0.06 160 / 55%)",
    swatchLight: "oklch(0.96 0.04 160)",
    swatchDark: "oklch(0.22 0.04 160)",
  },
  sky: {
    className: "bg-[oklch(0.96_0.03_230)] dark:bg-[oklch(0.22_0.04_230)]",
    patternColor: "oklch(0.45 0.06 230 / 55%)",
    swatchLight: "oklch(0.96 0.03 230)",
    swatchDark: "oklch(0.22 0.04 230)",
  },
  rose: {
    className: "bg-[oklch(0.96_0.03_15)] dark:bg-[oklch(0.23_0.04_15)]",
    patternColor: "oklch(0.45 0.06 15 / 55%)",
    swatchLight: "oklch(0.96 0.03 15)",
    swatchDark: "oklch(0.23 0.04 15)",
  },
};

export function bgClassFor(color: CanvasBackgroundColor): string {
  return COLOR_PRESETS[color].className;
}

export function patternStrokeColor(color: CanvasBackgroundColor): string {
  return COLOR_PRESETS[color].patternColor;
}

export function colorPreset(color: CanvasBackgroundColor): ColorPreset {
  return COLOR_PRESETS[color];
}

export const PATTERN_LABELS: Record<CanvasBackgroundPattern, string> = {
  blank: "무지",
  dots: "도트",
  grid: "그리드",
  lined: "줄지",
  cross: "크로스",
};

export const COLOR_LABELS: Record<CanvasBackgroundColor, string> = {
  default: "기본",
  white: "흰색",
  paper: "종이",
  black: "검은색",
  cream: "우유빛",
  kraft: "크라프트",
  mint: "민트",
  sky: "하늘",
  rose: "로즈",
};
