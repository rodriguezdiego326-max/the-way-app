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
      <path
        d="M17 18.5 34.5 36 17 53.5M55 18.5 37.5 36 55 53.5"
        stroke="currentColor"
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M28 14.5 36 22.5 44 14.5M28 57.5 36 49.5 44 57.5"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity=".55"
      />
      <path
        d="M36 22.5v27"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        opacity=".7"
      />
    </svg>
  );
}
