// src/components/ui/Skeleton.jsx
export function Skeleton({ width = '100%', height = 16, radius = 12, style }) {
  return (
    <div
      className="skeleton"
      style={{
        width,
        height,
        borderRadius: radius,
        ...style,
      }}
    />
  );
}