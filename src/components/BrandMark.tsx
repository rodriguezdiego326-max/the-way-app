interface BrandMarkProps {
  size?: number;
  className?: string;
}

export default function BrandMark({ size = 72, className = '' }: BrandMarkProps) {
  return (
    <img
      src="/assets/solapath-scenic-emblem.png"
      width={size}
      height={size}
      alt="SOLAPATH — Scripture for the road ahead."
      className={`object-cover rounded-2xl ${className}`}
      draggable={false}
    />
  );
}
