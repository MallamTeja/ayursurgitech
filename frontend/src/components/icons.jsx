// Every icon in the app. Line icons, 1.5px stroke, currentColor. No icon library, no emoji.

function Svg({ className = 'size-5', children }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

export const MenuIcon = (p) => (
  <Svg {...p}>
    <path d="M3 6h18M3 12h18M3 18h18" />
  </Svg>
);

export const CloseIcon = (p) => (
  <Svg {...p}>
    <path d="M6 6l12 12M18 6L6 18" />
  </Svg>
);

export const SearchIcon = (p) => (
  <Svg {...p}>
    <circle cx="11" cy="11" r="6.5" />
    <path d="M15.8 15.8L21 21" />
  </Svg>
);

export const CartIcon = (p) => (
  <Svg {...p}>
    <path d="M2.5 3h2.2l2.3 11.2a1.5 1.5 0 001.5 1.2h9.3a1.5 1.5 0 001.47-1.19L21 7H6" />
    <circle cx="9.5" cy="19.5" r="1.4" />
    <circle cx="17.5" cy="19.5" r="1.4" />
  </Svg>
);

export const UserIcon = (p) => (
  <Svg {...p}>
    <circle cx="12" cy="8" r="3.5" />
    <path d="M4.5 20.5a7.5 7.5 0 0115 0" />
  </Svg>
);

export const ChevronDownIcon = (p) => (
  <Svg {...p}>
    <path d="M6 9.5l6 6 6-6" />
  </Svg>
);

export const ChevronRightIcon = (p) => (
  <Svg {...p}>
    <path d="M9.5 6l6 6-6 6" />
  </Svg>
);

export const AlertIcon = (p) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7.5v6M12 16.8v.2" />
  </Svg>
);

// Stands in for a product, an order, an empty list.
export const PackageIcon = (p) => (
  <Svg {...p}>
    <path d="M20.5 7.5L12 3.5 3.5 7.5v9L12 20.5l8.5-4v-9z" />
    <path d="M3.5 7.5L12 11.5l8.5-4M12 11.5v9" />
  </Svg>
);

export const TrashIcon = (p) => (
  <Svg {...p}>
    <path d="M4 7h16M9.5 7V4.5h5V7M6.5 7l.8 12.2a1.5 1.5 0 001.5 1.3h6.4a1.5 1.5 0 001.5-1.3L17.5 7" />
  </Svg>
);

// The two catalogue views. The list icon carries leading dashes so it cannot be mistaken for
// MenuIcon, which is the same three lines.
export const GridIcon = (p) => (
  <Svg {...p}>
    <rect x="3.5" y="3.5" width="7" height="7" rx="1.5" />
    <rect x="13.5" y="3.5" width="7" height="7" rx="1.5" />
    <rect x="3.5" y="13.5" width="7" height="7" rx="1.5" />
    <rect x="13.5" y="13.5" width="7" height="7" rx="1.5" />
  </Svg>
);

export const ListIcon = (p) => (
  <Svg {...p}>
    <path d="M4 7h2M9 7h11M4 12h2M9 12h11M4 17h2M9 17h11" />
  </Svg>
);

// Order again.
export const RepeatIcon = (p) => (
  <Svg {...p}>
    <path d="M3.5 12A8.5 8.5 0 0118 6" />
    <path d="M18 2.5V6h-3.5" />
    <path d="M20.5 12A8.5 8.5 0 016 18" />
    <path d="M6 21.5V18h3.5" />
  </Svg>
);

export const PencilIcon = (p) => (
  <Svg {...p}>
    <path d="M4 20l.9-3.6L16.2 5.1a2 2 0 012.8 2.8L7.6 19.1 4 20z" />
    <path d="M14.5 6.8l2.7 2.7" />
  </Svg>
);

// The one filled icon: a rating star.
export const StarIcon = ({ className = 'size-4', filled = false }) => (
  <svg
    viewBox="0 0 24 24"
    fill={filled ? 'currentColor' : 'none'}
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden="true"
  >
    <path d="M12 3.5l2.6 5.6 6 .8-4.4 4.2 1.1 6-5.3-3-5.3 3 1.1-6L3.4 9.9l6-.8L12 3.5z" />
  </svg>
);
