import type { SVGProps } from "react";

function Icon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    />
  );
}

export function SwordIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <path d="M20 4l-8.5 8.5" />
      <path d="M20 4l-3 9-1.5 1.5L12 9l1.5-1.5 9-3z" />
      <path d="M8 12l-4 4 2 2 4-4" />
      <path d="M4 20l2-2" />
    </Icon>
  );
}

export function ShieldIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <path d="M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6l7-3z" />
    </Icon>
  );
}

export function BagIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <path d="M6 8h12l1 12H5L6 8z" />
      <path d="M9 8V6a3 3 0 0 1 6 0v2" />
    </Icon>
  );
}

export function ScalesIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <path d="M12 4v16" />
      <path d="M7 20h10" />
      <path d="M4 7l-2 5a3 3 0 0 0 6 0L6 7H4z" />
      <path d="M18 7l-2 5a3 3 0 0 0 6 0L20 7h-2z" />
      <path d="M12 4a2 2 0 1 0 0-4 2 2 0 0 0 0 4z" />
    </Icon>
  );
}

export function AnvilIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <path d="M3 15h13" />
      <path d="M16 15l3-2 1 1-2 3-4-1" />
      <path d="M3 19h9" />
      <path d="M5 15c-2-2 0-6 4-6h4" />
      <path d="M13 9l3-5h3" />
    </Icon>
  );
}

export function ScrollIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <path d="M8 3h10a2 2 0 0 1 2 2v2H8V3z" />
      <path d="M8 5H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h13a2 2 0 0 0 2-2V7H8" />
      <path d="M6 11h5" />
      <path d="M6 14h5" />
      <path d="M13 12h3" />
      <path d="M13 15h3" />
    </Icon>
  );
}

export function CompassIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M15 9l-2 4-4 2 2-4 4-2z" />
    </Icon>
  );
}

export function GemIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <path d="M7 4h10l4 5-9 11L3 9l4-5z" />
      <path d="M3 9h18" />
      <path d="M9 9l3 11" />
      <path d="M15 9l-3 11" />
    </Icon>
  );
}

export function FlameIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <path d="M12 21c4 0 6-2.2 6-5.5 0-2.6-1.6-4.4-3.2-6C13.6 8 13 6.8 13 5c-1.8 1-3 2.9-3 5 0-1-1.2-2-2-2.4C8 9.5 6 11.5 6 15c0 3.3 2 6 6 6z" />
    </Icon>
  );
}