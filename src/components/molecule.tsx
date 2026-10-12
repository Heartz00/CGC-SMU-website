export function Molecule() {
  return (
    <svg
      className="molecule"
      viewBox="0 0 580 530"
      fill="none"
      aria-hidden="true"
    >
      <defs>
        <radialGradient id="atom">
          <stop stopColor="#d9e7f2" />
          <stop offset="1" stopColor="#89a5bd" />
        </radialGradient>
        <radialGradient id="red-atom">
          <stop stopColor="#ff6c89" />
          <stop offset="1" stopColor="#cc0035" />
        </radialGradient>
        <pattern id="grid" width="32" height="32" patternUnits="userSpaceOnUse">
          <circle cx="1" cy="1" r="1" fill="#ffffff" opacity=".13" />
        </pattern>
      </defs>
      <rect width="580" height="530" fill="url(#grid)" />
      <circle cx="290" cy="260" r="192" stroke="#c1d2e2" strokeOpacity=".15" />
      <circle
        className="molecule-orbit"
        cx="290"
        cy="260"
        r="135"
        stroke="#c1d2e2"
        strokeOpacity=".14"
        strokeDasharray="4 7"
      />
      <g className="molecule-core">
        <g stroke="#8199b1" strokeWidth="9">
          <path d="m150 246 86-99 123 31 39 120-88 94-119-40-41-106Z" />
          <path d="m236 147-24-77m147 108 99-45m-60 165 83 65m-171 29-5 77m-114-117-88 47m47-153-61-51" />
        </g>
        <g stroke="#c8d7e6" strokeWidth="2" opacity=".8">
          <path d="m167 244 75-78m111 31 27 97m-75 82-99-34" />
        </g>
        <g fill="url(#atom)">
          <circle cx="150" cy="246" r="25" />
          <circle cx="236" cy="147" r="28" />
          <circle cx="398" cy="298" r="27" />
          <circle cx="191" cy="352" r="28" />
          <circle cx="212" cy="70" r="13" />
          <circle cx="481" cy="363" r="14" />
          <circle cx="305" cy="469" r="15" />
          <circle cx="103" cy="399" r="15" />
        </g>
        <g fill="url(#red-atom)">
          <circle cx="359" cy="178" r="35" />
          <circle cx="310" cy="392" r="32" />
          <circle cx="458" cy="133" r="20" />
          <circle cx="89" cy="195" r="18" />
        </g>
      </g>
      <g fill="#c2d2e0" fontFamily="monospace" fontSize="11" letterSpacing="2">
        <text x="438" y="70">
          CGC / SMU
        </text>
      </g>
    </svg>
  );
}
