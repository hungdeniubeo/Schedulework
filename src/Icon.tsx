import type { CSSProperties } from "react";

const paths = {
  calendar: (
    <>
      <rect x="3" y="5" width="18" height="16" rx="3" />
      <path d="M16 3v4M8 3v4M3 11h18M8 15h2M14 15h2M8 18h2" />
    </>
  ),
  chevronLeft: <path d="m14 7-5 5 5 5" />,
  chevronRight: <path d="m10 7 5 5-5 5" />,
  chevronDown: <path d="m7 10 5 5 5-5" />,
  plus: <path d="M12 5v14M5 12h14" />,
  close: <path d="m6 6 12 12M6 18 18 6" />,
  trash: (
    <>
      <path d="M3 6h18M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2M5 6l1 14a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1l1-14M10 10v7M14 10v7" />
    </>
  ),
  download: (
    <>
      <path d="M12 3v12m-4-4 4 4 4-4M4 16v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3" />
    </>
  ),
  users: (
    <>
      <circle cx="9" cy="8" r="3" />
      <path d="M3 21v-3a6 6 0 0 1 12 0v3M16 5a3 3 0 0 1 0 6M21 21v-3a6 6 0 0 0-3-5.2" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </>
  ),
  check: <path d="m5 12 4 4L19 6" />,
  search: (
    <>
      <circle cx="10.5" cy="10.5" r="6.5" />
      <path d="m16 16 4 4" />
    </>
  ),
  grid: (
    <>
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" />
    </>
  ),
  meat: (
    <>
      <path d="M19.8 5.8c2.7 3.9 1.1 9.9-3.6 13.1-4.7 3.3-10.6 2.5-13.3-1.4S1.8 7.7 6.5 4.4c4.7-3.2 10.6-2.5 13.3 1.4Z" />
      <path d="M9.2 6.4c2.1-1.4 4.8-1.1 6 .7s.4 4.4-1.7 5.8-4.8 1.1-6-.7-.4-4.4 1.7-5.8Z" />
      <path d="M5.2 15.4c2.4.7 4.4.5 6.1-.7M15.8 4.9c.4 1.2 1.2 2.2 2.4 3" />
    </>
  ),
  soup: (
    <>
      <path d="M4 11h16a8 8 0 0 1-16 0ZM7 20h10" />
      <path d="M8 8c-1-1-.8-2.2.2-3M12 8c-1-1-.8-2.2.2-3M16 8c-1-1-.8-2.2.2-3" />
    </>
  ),
  salad: (
    <>
      <path d="M12 20c0-7 3-12 9-15 0 8-3 13-9 15Z" />
      <path d="M12 20C11 13 8 8 2 6c0 7 3 12 10 14ZM12 20v-8M6 10l6 5M18 9l-6 6" />
    </>
  ),
  grip: (
    <>
      <path
        d="M9 5h.01M15 5h.01M9 12h.01M15 12h.01M9 19h.01M15 19h.01"
        strokeWidth="3"
      />
    </>
  ),
  edit: (
    <>
      <path d="m14 5 5 5M4 20l5-1L20 8a2 2 0 0 0-5-5L4 14Z" />
    </>
  ),
  info: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v6M12 7h.01" />
    </>
  ),
  panel: (
    <>
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <path d="M15 4v16" />
    </>
  ),
  arrow: <path d="M4 12h16m-6-6 6 6-6 6" />,
  alert: (
    <>
      <path d="m10.3 4-8 14a2 2 0 0 0 1.7 3h16a2 2 0 0 0 1.7-3l-8-14a2 2 0 0 0-3.4 0Z" />
      <path d="M12 9v4M12 17h.01" />
    </>
  ),
};

export function Icon({
  name,
  size = 18,
  className = "",
  style,
}: {
  name: keyof typeof paths;
  size?: number;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={style}
      aria-hidden="true"
    >
      {paths[name]}
    </svg>
  );
}
