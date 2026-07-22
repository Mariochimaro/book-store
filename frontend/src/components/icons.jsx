export const Icon = ({ d, d2, d3, circle, poly, line, size = 15, ...rest }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
    aria-hidden="true" {...rest}>
    {circle && <circle {...circle} />}
    {d  && <path d={d}  />}
    {d2 && <path d={d2} />}
    {d3 && <path d={d3} />}
    {poly && <polyline points={poly} />}
    {line && <line {...line} />}
  </svg>
);

export const GearIcon = (props) => (
  <Icon
    circle={{ cx: "12", cy: "12", r: "3" }}
    d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"
    {...props}
  />
);

export const BellIcon = (props) => (
  <Icon d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" d2="M13.73 21a2 2 0 0 1-3.46 0" {...props} />
);

export const BookIcon = (props) => (
  <Icon d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" d2="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" {...props} />
);

export const BookmarkIcon = (props) => (
  <Icon d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" {...props} />
);

export const StoreIcon = (props) => (
  <Icon d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" poly="9 22 9 12 15 12 15 22" {...props} />
);

export const ReceiptIcon = (props) => (
  <Icon d="M6 2h12a1 1 0 0 1 1 1v18l-3-2-3 2-3-2-3 2-3-2-3 2V3a1 1 0 0 1 1-1z" d2="M9 7h6" d3="M9 11h6" {...props} />
);

export const ChartIcon = (props) => (
  <Icon d="M3 3v18h18" d2="M8 17V9" d3="M13 17V5" {...props} />
);