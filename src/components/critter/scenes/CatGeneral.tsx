import { Backdrop, C, CatBody, CatHead, Desk, Paw } from "../Cat";

// general: safe, non-judgmental fallback. Slow friendly blink over a mug of tea.
export function CatGeneral() {
  return (
    <svg className="cr-scene cr-scene-general" viewBox="0 0 240 232" width="100%" aria-hidden="true" focusable="false">
      <Backdrop color="#dcfce7" />
      <CatBody />
      <CatHead />
      <Desk />
      <g stroke="#94a3b8" strokeWidth="2.5" strokeLinecap="round" fill="none">
        <path className="cr-steam cr-steam-1" d="M156 150 q-4 -6 0 -12 q4 -6 0 -12" />
        <path className="cr-steam cr-steam-2" d="M164 148 q-4 -6 0 -12 q4 -6 0 -12" />
        <path className="cr-steam cr-steam-3" d="M172 150 q-4 -6 0 -12 q4 -6 0 -12" />
      </g>
      <path d="M182 166 q14 0 14 11 q0 11 -14 11" fill="none" stroke={C.line} strokeWidth="4" />
      <rect x="146" y="156" width="36" height="34" rx="6" fill="#a5b4fc" stroke={C.line} strokeWidth="3" />
      <path d="M164 178 c-6 -4 -7 -9 -3 -10 c2 0 3 1 3 2 c0 -1 1 -2 3 -2 c4 1 3 6 -3 10 Z" fill={C.pink} />
      <Paw cx={70} cy={190} />
      <Paw cx={148} cy={176} />
    </svg>
  );
}
