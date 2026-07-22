
'use client';

import * as React from 'react';

/**
 * Layout para páginas de autenticación (Login/Register).
 * Centra el contenido y evita la carga de la navegación del club.
 */
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-background bg-dot-pattern">
      <div className="w-full max-w-md p-4">
        {children}
      </div>
    </div>
  );
}
