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
  sun: (
    <>
      <circle cx="12" cy="12" r="3.5" />
      <path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M18.7 5.3l-1.4 1.4M6.7 17.3l-1.4 1.4" />
    </>
  ),
  sunHigh: (
    <>
      <circle cx="12" cy="13" r="3.5" />
      <path d="M12 3.5v2M12 20v1.5M3 13h2M19 13h2M5.8 6.8l1.4 1.4M17.3 18.3l1.4 1.4M18.2 6.8l-1.4 1.4M6.7 18.3l-1.4 1.4M7 3h10" />
    </>
  ),
  moon: <path d="M20 15.1A8.5 8.5 0 0 1 8.9 4 8.7 8.7 0 1 0 20 15.1Z" />,
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
      <path d="M20.1 7.1c2 3.5-.1 8.2-4.6 10.8-4.5 2.5-9.8 1.8-11.8-1.7S3.8 8 8.3 5.5s9.8-1.8 11.8 1.6Z" />
      <path d="M9.5 7.2c1.8-1 4-.5 5 1.1s.3 3.7-1.5 4.7-4 .5-5-1.1-.3-3.7 1.5-4.7Z" />
      <path d="M5.7 14.9c1.3.7 2.7.9 4.2.5" />
    </>
  ),
  soup: (
    <>
      <path d="M3.5 10.5h17M4.5 11c.5 5 3.3 8 7.5 8s7-3 7.5-8M8 21h8" />
      <path d="M8 7.5c-1-1.1-.8-2.3.2-3.2M12 7.5c-1-1.1-.8-2.3.2-3.2M16 7.5c-1-1.1-.8-2.3.2-3.2" />
    </>
  ),
  salad: (
    <>
      <path d="M4 12h16c-.6 5-3.4 8-8 8s-7.4-3-8-8Z" />
      <path d="M12 12c0-4 2.5-6.5 6.5-7.5-.1 4-2.3 6.5-6.5 7.5ZM12 12C11.5 8.2 9.1 5.8 5.5 5c.2 3.8 2.4 6.1 6.5 7Z" />
      <path d="M12 12V8" />
    </>
  ),
  chefHat: (
    <>
      <path d="M7.2 13.8A3.8 3.8 0 0 1 7 6.3 5.6 5.6 0 0 1 17 6.3a3.8 3.8 0 0 1-.2 7.5" />
      <path d="M7.2 13.8h9.6V20H7.2zM9.5 17h5" />
    </>
  ),
  crown: (
    <>
      <path d="m4 8 4 4 4-7 4 7 4-4-2 10H6L4 8Z" />
      <path d="M6 21h12" />
    </>
  ),
  star: <path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-3-5.6 3 1.1-6.2L3 9.6l6.2-.9L12 3Z" />,
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
