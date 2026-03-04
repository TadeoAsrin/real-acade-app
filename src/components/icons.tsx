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
      
      {/* Contorno del Escudo - Más grueso para legibilidad */}
      <path 
        d="M50 5L15 20V48C15 72 35 88 50 95C65 88 85 72 85 48V20L50 5Z" 
        fill="currentColor" 
      />

      {/* Símbolo del Roble - Silueta sólida y simplificada */}
      <path 
        d="M50 22C42 22 35 28 35 38C35 45 40 52 46 54V68H54V54C60 52 65 45 65 38C65 28 58 22 50 22Z" 
        fill="var(--primary-foreground)" 
      />
      <path 
        d="M50 18C60 18 70 26 70 38C70 46 65 53 58 56V72H42V56C35 53 30 46 30 38C30 26 40 18 50 18Z" 
        fill="var(--primary-foreground)" 
        fillOpacity="0.3"
      />

      {/* Siglas RA - Tipografía Bold de alto impacto */}
      <text 
        x="50" 
        y="62" 
        fill="var(--primary-foreground)" 
        fontSize="18" 
        fontWeight="900" 
        textAnchor="middle" 
        fontFamily="var(--font-bebas)"
        letterSpacing="0.5"
      >
        RA
      </text>

      {/* Año de Fundación - Simplificado */}
      <text 
        x="50" 
        y="85" 
        fill="var(--primary-foreground)" 
        fontSize="6" 
        fontWeight="900" 
        textAnchor="middle" 
        fontFamily="var(--font-oswald)"
        letterSpacing="1.5"
      >
        EST. 2010
      </text>
    </svg>
  );
}
