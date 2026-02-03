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
      <title>Real Acade Soccer Ball Pro</title>
      {/* Círculo exterior del balón */}
      <circle cx="12" cy="12" r="10" />
      
      {/* Pentágono central */}
      <path d="M12 8l3 2v4l-3 2-3-2v-4z" fill="currentColor" fillOpacity="0.2" />
      
      {/* Costuras y paneles clásicos */}
      <path d="M12 8V2" />
      <path d="M15 10l5-2" />
      <path d="M15 14l5 2" />
      <path d="M12 16v6" />
      <path d="M9 14l-5 2" />
      <path d="M9 10l-5-2" />
      
      {/* Detalles de los paneles laterales */}
      <path d="M12 8l-3 2" />
      <path d="M12 8l3 2" />
      <path d="M15 10v4" />
      <path d="M15 14l-3 2" />
      <path d="M12 16l-3-2" />
      <path d="M9 14v-4" />
    </svg>
  );
}
