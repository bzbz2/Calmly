// Original Calmly cat mascot ("Miso"), hand-authored SVG. Shared by cat scenes.
// Parts carry cr-* class names so each scene's CSS can animate them.
// Base (un-animated) pose = each scene's final frame, so reduced-motion users
// see the punchline as a still image.

import { useId } from "react";

export const C = {
  fur: "#f4a259",
  stripe: "#d9822b",
  belly: "#fde7c8",
  line: "#5b3a29",
  pink: "#f7a1a8",
  white: "#ffffff",
};

const stroke = { stroke: C.line, strokeWidth: 3, strokeLinejoin: "round" as const, strokeLinecap: "round" as const };

export function CatBody() {
  return (
    <g className="cr-cat-body">
      <path className="cr-tail" d="M66 186 C 30 180, 20 146, 38 128 C 45 121, 54 127, 48 135 C 38 150, 46 170, 72 172 Z" fill={C.fur} {...stroke} />
      <ellipse cx="120" cy="170" rx="58" ry="46" fill={C.fur} {...stroke} />
      <ellipse cx="120" cy="180" rx="32" ry="30" fill={C.belly} />
    </g>
  );
}

export function CatHead() {
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const clipL = `cr-eye-l-${uid}`;
  const clipR = `cr-eye-r-${uid}`;
  return (
    <g className="cr-head">
      <defs>
        <clipPath id={clipL}>
          <ellipse cx="104" cy="92" rx="11" ry="12" />
        </clipPath>
        <clipPath id={clipR}>
          <ellipse cx="136" cy="92" rx="11" ry="12" />
        </clipPath>
      </defs>
      <g className="cr-ear-l">
        <path d="M84 72 L80 32 L112 56 Z" fill={C.fur} {...stroke} />
        <path d="M88 64 L86 42 L104 56 Z" fill={C.pink} />
      </g>
      <g className="cr-ear-r">
        <path d="M156 72 L160 32 L128 56 Z" fill={C.fur} {...stroke} />
        <path d="M152 64 L154 42 L136 56 Z" fill={C.pink} />
      </g>
      <circle cx="120" cy="92" r="44" fill={C.fur} {...stroke} />
      <path d="M120 50 v12 M106 52 l3 10 M134 52 l-3 10" stroke={C.stripe} strokeWidth="5" strokeLinecap="round" />
      <path d="M77 92 h9 M78 100 h8 M163 92 h-9 M162 100 h-8" stroke={C.stripe} strokeWidth="4" strokeLinecap="round" />
      {/* eyes */}
      <ellipse cx="104" cy="92" rx="11" ry="12" fill={C.white} />
      <ellipse cx="136" cy="92" rx="11" ry="12" fill={C.white} />
      <g className="cr-pupils">
        <circle cx="104" cy="93" r="5.5" fill={C.line} />
        <circle cx="136" cy="93" r="5.5" fill={C.line} />
        <circle cx="106" cy="91" r="1.6" fill={C.white} />
        <circle cx="138" cy="91" r="1.6" fill={C.white} />
      </g>
      <g clipPath={`url(#${clipL})`}>
        <g className="cr-lid">
          <rect x="90" y="52" width="28" height="26" fill={C.fur} />
          <path d="M90 78 H118" stroke={C.line} strokeWidth="2.5" strokeLinecap="round" />
        </g>
      </g>
      <g clipPath={`url(#${clipR})`}>
        <g className="cr-lid">
          <rect x="122" y="52" width="28" height="26" fill={C.fur} />
          <path d="M122 78 H150" stroke={C.line} strokeWidth="2.5" strokeLinecap="round" />
        </g>
      </g>
      <ellipse cx="104" cy="92" rx="11" ry="12" fill="none" stroke={C.line} strokeWidth="2.5" />
      <ellipse cx="136" cy="92" rx="11" ry="12" fill="none" stroke={C.line} strokeWidth="2.5" />
      {/* face */}
      <path d="M115 104 L125 104 L120 109 Z" fill={C.pink} stroke={C.line} strokeWidth="1.5" strokeLinejoin="round" />
      <path className="cr-mouth-smile" d="M110 111 Q115 117 120 111 Q125 117 130 111" fill="none" stroke={C.line} strokeWidth="2.5" strokeLinecap="round" />
      <path className="cr-mouth-flat" d="M113 114 H127" fill="none" stroke={C.line} strokeWidth="2.5" strokeLinecap="round" />
      <path d="M96 106 L70 102 M96 111 L70 113 M144 106 L170 102 M144 111 L170 113" stroke={C.line} strokeWidth="1.5" strokeLinecap="round" opacity="0.6" />
    </g>
  );
}

export function Paw({ cx, cy }: { cx: number; cy: number }) {
  return (
    <g>
      <ellipse cx={cx} cy={cy} rx="14" ry="9" fill={C.fur} {...stroke} />
      <path d={`M${cx - 4} ${cy - 3} v5 M${cx + 4} ${cy - 3} v5`} stroke={C.line} strokeWidth="1.5" strokeLinecap="round" />
    </g>
  );
}

export function Desk() {
  return (
    <g>
      <rect x="0" y="188" width="240" height="44" fill="#e7cfa8" />
      <path d="M0 188 H240" stroke={C.line} strokeWidth="3" />
    </g>
  );
}

export function Backdrop({ color = "#e0e7ff" }: { color?: string }) {
  return <circle cx="120" cy="110" r="104" fill={color} />;
}
