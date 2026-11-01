import { Backdrop, C, CatBody, CatHead, Desk, Paw } from "../Cat";

// meeting_fatigue: ping -> freeze -> slow, long, knowing look at the camera.
export function CatMeetingFatigue() {
  return (
    <svg className="cr-scene cr-scene-meeting" viewBox="0 0 240 232" width="100%" aria-hidden="true" focusable="false">
      <Backdrop color="#e0e7ff" />
      <CatBody />
      <CatHead />
      <Desk />
      {/* laptop (back of the lid faces us) */}
      <rect x="80" y="140" width="80" height="50" rx="6" fill="#cbd5e1" stroke={C.line} strokeWidth="3" />
      <circle cx="120" cy="165" r="6" fill="#e2e8f0" />
      <rect x="70" y="186" width="100" height="6" rx="3" fill="#94a3b8" stroke={C.line} strokeWidth="2.5" />
      <g className="cr-badge">
        <circle cx="158" cy="143" r="7" fill="#ef4444" stroke={C.line} strokeWidth="2" />
        <text x="158" y="146.5" textAnchor="middle" fontSize="9" fontWeight="700" fill="#fff" fontFamily="system-ui, sans-serif">
          1
        </text>
      </g>
      <Paw cx={66} cy={190} />
      <Paw cx={174} cy={190} />
      {/* notification */}
      <g className="cr-ding" stroke={C.line} strokeWidth="2.5" strokeLinecap="round">
        <path d="M180 20 l-3 -7 M198 17 v-8 M216 20 l3 -7" />
      </g>
      <g className="cr-ping">
        <path d="M174 54 L168 68 L186 54 Z" fill="#fff" stroke={C.line} strokeWidth="2.5" strokeLinejoin="round" />
        <rect x="162" y="25" width="74" height="31" rx="10" fill="#fff" stroke={C.line} strokeWidth="2.5" />
        <path d="M172 56 H186" stroke="#fff" strokeWidth="3" />
        <text x="199" y="45" textAnchor="middle" fontSize="11" fontWeight="700" fill="#334155" fontFamily="system-ui, sans-serif">
          Quick sync?
        </text>
      </g>
    </svg>
  );
}
