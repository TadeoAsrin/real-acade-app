import type { SVGProps } from "react";

export function Fut7StatsLogo(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <title>Escudo Oficial Real Acade</title>
      
      {/* Contorno del Escudo (Shield) */}
      <path 
        d="M50 5L15 20V45C15 68.5 30 88.5 50 95C70 88.5 85 68.5 85 45V20L50 5Z" 
        fill="currentColor" 
        stroke="currentColor" 
        strokeWidth="2"
      />
      
      {/* Borde Interior Dorado */}
      <path 
        d="M50 10L20 24V45C20 65 33 82 50 90C67 82 80 65 80 45V24L50 10Z" 
        stroke="var(--primary-foreground)" 
        strokeWidth="1" 
        opacity="0.3"
      />

      {/* Iniciales RA (Real Acade) */}
      <text 
        x="50" 
        y="55" 
        fill="var(--primary-foreground)" 
        fontSize="28" 
        fontWeight="900" 
        textAnchor="middle" 
        fontFamily="var(--font-bebas)"
        letterSpacing="2"
      >
        RA
      </text>

      {/* Año de Fundación */}
      <text 
        x="50" 
        y="68" 
        fill="var(--primary-foreground)" 
        fontSize="6" 
        fontWeight="bold" 
        textAnchor="middle" 
        fontFamily="var(--font-oswald)"
        letterSpacing="1"
        opacity="0.8"
      >
        EST. 2010
      </text>

      {/* Símbolo del Árbol (Minimalista) en la parte superior */}
      <g transform="translate(42, 18) scale(0.4)" fill="var(--primary-foreground)" opacity="0.9">
        <path d="M20 0L35 25H5L20 0Z" />
        <path d="M20 15L40 45H0L20 15Z" />
        <rect x="17" y="45" width="6" height="10" />
      </g>
    </svg>
  );
}
