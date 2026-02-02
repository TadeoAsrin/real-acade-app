import type { SVGProps } from "react";

export function Fut7StatsLogo(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <title>Real Acade Soccer Ball</title>
      <circle cx="12" cy="12" r="10" />
      <path d="m12 12-4 3 1 4h6l1-4-4-3Z" />
      <path d="M12 2v3.5l3.5 1.5M12 22v-3.5L8.5 17" />
      <path d="M22 12h-3.5l-1.5-3.5M2 12h3.5l1.5 3.5" />
      <path d="M17.5 5.5 15 8l-3-1M6.5 18.5 9 16l3 1" />
    </svg>
  );
}
