import { redirect } from 'next/navigation';

/**
 * RootPage: Punto de entrada de la aplicación.
 * Convertido a Server Component para realizar una redirección instantánea a nivel de servidor.
 * Esto elimina cualquier lógica de cliente o esperas de inicialización de Firebase en la raíz.
 */
export default function RootPage() {
  redirect('/dashboard');
}
