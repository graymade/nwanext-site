// One functional icon set: 24 unit grid, 1.75 stroke, currentColor. Never decorative, always beside a label
// or inside a labelled button, so every icon is aria-hidden.
const PATHS: Record<string, React.ReactNode> = {
  home: <><path d="M4 10.5 12 4l8 6.5" /><path d="M6 9v10.5h4.5V14h3v5.5H18V9" /></>,
  calendar: <><rect x="4" y="5.5" width="16" height="14.5" rx="2" /><path d="M4 10h16M8.5 3.5v4M15.5 3.5v4" /></>,
  spot: <><path d="M4.5 9.5 6 4.5h12l1.5 5" /><path d="M4.5 9.5c0 1.4 1.2 2.5 2.6 2.5s2.6-1.1 2.6-2.5c0 1.4 1.1 2.5 2.4 2.5s2.4-1.1 2.4-2.5c0 1.4 1.2 2.5 2.6 2.5s2.4-1.1 2.4-2.5" /><path d="M6 12v7.5h12V12M10 19.5v-4.5h4v4.5" /></>,
  search: <><circle cx="10.75" cy="10.75" r="6.25" /><path d="m15.5 15.5 4.5 4.5" /></>,
  more: <><path d="M4.5 7h15M4.5 12h15M4.5 17h15" /></>,
  close: <><path d="M6 6l12 12M18 6 6 18" /></>,
  down: <><path d="m7 10 5 5 5-5" /></>,
  right: <><path d="m10 7 5 5-5 5" /></>,
  left: <><path d="m14 7-5 5 5 5" /></>,
  pin: <><path d="M12 20.5s6.5-5.6 6.5-11a6.5 6.5 0 0 0-13 0c0 5.4 6.5 11 6.5 11Z" /><circle cx="12" cy="9.5" r="2.25" /></>,
  clock: <><circle cx="12" cy="12" r="8" /><path d="M12 7.5V12l3 2" /></>,
  ticket: <><path d="M4 8.5V6h16v2.5a2.5 2.5 0 0 0 0 5V18H4v-4.5a2.5 2.5 0 0 0 0-5Z" /><path d="M14 6v12" strokeDasharray="1.5 2" /></>,
  share: <><path d="M12 4v11M8 7.5 12 4l4 3.5" /><path d="M7 11H5.5v8.5h13V11H17" /></>,
  directions: <><path d="M12 3.5 20.5 12 12 20.5 3.5 12Z" /><path d="M9.5 14v-2.5h5M12.5 9.5l2 2-2 2" /></>,
  read: <><path d="M5 5.5h9.5L19 10v8.5H5Z" /><path d="M8.5 11h7M8.5 14.5h5" /></>,
  grid: <><rect x="4.5" y="4.5" width="6.25" height="6.25" rx="1.5" /><rect x="13.25" y="4.5" width="6.25" height="6.25" rx="1.5" /><rect x="4.5" y="13.25" width="6.25" height="6.25" rx="1.5" /><rect x="13.25" y="13.25" width="6.25" height="6.25" rx="1.5" /></>,
  list: <><rect x="4.5" y="5" width="4.5" height="4.5" rx="1.25" /><rect x="4.5" y="14.5" width="4.5" height="4.5" rx="1.25" /><path d="M12 6.5h7.5M12 16h7.5" /></>,
  instagram: <><rect x="4" y="4" width="16" height="16" rx="4.5" /><circle cx="12" cy="12" r="3.5" /><path d="M16.75 7.25h.01" /></>,
};

export type IconName = keyof typeof PATHS;

export default function Icon({ name, className = 'icon' }: { name: IconName; className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      {PATHS[name]}
    </svg>
  );
}
