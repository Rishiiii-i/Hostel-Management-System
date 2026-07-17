export const iconPaths = {
  users: <><circle cx="9" cy="8" r="3"/><circle cx="17" cy="9" r="2.5"/><path d="M3.5 20c.5-3.4 2.3-5.3 5.5-5.3s5 1.9 5.5 5.3M16 14.5c2.5.4 3.8 2.2 4 5.1"/></>,
  fee: <><path d="M5 4h11M5 8h14M8 4v16M7 13h9M7 17h7"/><path d="M17 4c0 3 3 3 3 6s-3 3-3 6"/></>,
  note: <><rect x="5" y="3" width="14" height="18" rx="2"/><path d="M8 8h8M8 12h8M8 16h5"/></>,
  room: <><path d="M3 18V9a3 3 0 0 1 3-3h3a3 3 0 0 1 3 3v5M3 14h18v4M7 18v2M17 18v2M12 10h6a3 3 0 0 1 3 3v1"/></>,
  login: <><path d="M14 4h4a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-4"/><path d="m10 16 4-4-4-4M14 12H3"/></>,
  chart: <><path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/></>,
  check: <><rect x="5" y="3" width="14" height="18" rx="2"/><path d="m8 12 2.2 2.2L16 8.5M8 17h8"/></>,
  building: <><path d="M4 21h16M6 21V5l6-3 6 3v16M9 8h1M14 8h1M9 12h1M14 12h1M9 16h1M14 16h1"/></>
}

export default function Icon({ name }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      {iconPaths[name]}
    </svg>
  )
}
