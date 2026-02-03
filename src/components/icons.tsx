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
      
      {/* Anillo exterior principal */}
      <circle cx="50" cy="50" r="47" stroke="currentColor" strokeWidth="4" />
      
      {/* Círculo decorativo interno punteado */}
      <circle cx="50" cy="50" r="40" stroke="currentColor" strokeWidth="1" strokeDasharray="2 2" opacity="0.5" />

      {/* Definición de rutas para el texto curvo */}
      <defs>
        <path id="topTextPath" d="M 20,50 A 30,30 0 0,1 80,50" />
        <path id="bottomTextPath" d="M 20,50 A 30,30 0 0,0 80,50" />
      </defs>

      {/* Texto Superior: REAL ACADE */}
      <text fill="currentColor" fontSize="10" fontWeight="900" letterSpacing="1">
        <textPath href="#topTextPath" startOffset="50%" textAnchor="middle">
          REAL ACADE
        </textPath>
      </text>

      {/* Texto Inferior: EST. 2010 */}
      <text fill="currentColor" fontSize="6" fontWeight="700" letterSpacing="2">
        <textPath href="#bottomTextPath" startOffset="50%" textAnchor="middle">
          EST. 2010
        </textPath>
      </text>

      {/* Estrellas laterales decorativas */}
      <path d="M12 50L14.5 47.5L17 50L14.5 52.5Z" fill="currentColor" />
      <path d="M83 50L85.5 47.5L88 50L85.5 52.5Z" fill="currentColor" />

      {/* El Árbol Central (Símbolo del club) */}
      <g opacity="0.9">
        {/* Copa del árbol - Niveles de follaje */}
        <path d="M50 22L58 35H42L50 22Z" fill="currentColor" />
        <path d="M50 30L62 48H38L50 30Z" fill="currentColor" />
        <path d="M50 40L68 65H32L50 40Z" fill="currentColor" />
        {/* Tronco */}
        <rect x="47" y="65" width="6" height="8" fill="currentColor" />
      </g>

      {/* Base decorativa o balón pequeño en la base si se desea, por ahora mantenemos el árbol limpio */}
      <path d="M40 73H60" stroke="currentColor" strokeWidth="1" strokeLinecap="round" opacity="0.3" />
    </svg>
  );
}
