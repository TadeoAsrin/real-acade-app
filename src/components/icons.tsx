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
      
      {/* Círculo Exterior (Borde de Balón/Prestigio) */}
      <circle cx="50" cy="50" r="48" stroke="currentColor" strokeWidth="1.5" strokeDasharray="4 2" opacity="0.3" />
      <circle cx="50" cy="50" r="45" stroke="currentColor" strokeWidth="2" />
      
      {/* Fondo del Escudo */}
      <path 
        d="M50 8L20 22V48C20 68 33 85 50 92C67 85 80 68 80 48V22L50 8Z" 
        fill="currentColor" 
      />

      {/* El Roble de la Academia (Símbolo Central) */}
      <g transform="translate(35, 25) scale(0.75)" fill="var(--primary-foreground)">
        <path d="M20 5C12 5 5 11 5 19C5 25 9 30 15 32V45H25V32C31 30 35 25 35 19C35 11 28 5 20 5Z" />
        <path d="M20 0C30 0 40 8 40 20C40 28 34 35 28 38V50H12V38C6 35 0 28 0 20C0 8 10 0 20 0Z" opacity="0.4" />
      </g>

      {/* Texto Circular Superior: REAL ACADE */}
      <defs>
        <path id="textPathTop" d="M 20,50 A 30,30 0 1,1 80,50" />
      </defs>
      
      {/* Iniciales RA en el centro del roble */}
      <text 
        x="50" 
        y="58" 
        fill="var(--primary-foreground)" 
        fontSize="14" 
        fontWeight="900" 
        textAnchor="middle" 
        fontFamily="var(--font-bebas)"
        letterSpacing="1"
      >
        RA
      </text>

      {/* Año de Fundación en la base */}
      <text 
        x="50" 
        y="82" 
        fill="var(--primary-foreground)" 
        fontSize="5" 
        fontWeight="bold" 
        textAnchor="middle" 
        fontFamily="var(--font-oswald)"
        letterSpacing="2"
      >
        EST. 2010
      </text>
    </svg>
  );
}
