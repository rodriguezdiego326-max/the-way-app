interface BrandMarkProps {
  size?: number;
  className?: string;
}

export default function BrandMark({ size = 72, className = '' }: BrandMarkProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 72 72"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="SOLAPATH mark"
      role="img"
      className={className}
    >
      {/* Single continuous ascending path — lower-left to upper-right, subtle S-flow */}
      <path
        d="M12 58 C 20 54, 26 48, 28 40 C 30 33, 24 28, 20 24 C 16 20, 20 14, 28 12 C 36 10, 44 13, 50 18 C 56 23, 60 28, 60 36"
        stroke="currentColor"
        strokeWidth="5"
        strokeLinecap="round"
        fill="none"
      />
      {/* Five waypoints — the Five Solas, increasing in elevation along the path */}
      <circle cx="14" cy="57" r="3" fill="currentColor" />
      <circle cx="28" cy="40" r="3" fill="currentColor" />
      <circle cx="21" cy="23" r="3" fill="currentColor" />
      <circle cx="40" cy="13" r="3" fill="currentColor" />
      <circle cx="59" cy="35" r="3.5" fill="currentColor" />
    </svg>
  );
}
