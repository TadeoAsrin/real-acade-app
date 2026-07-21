import { redirect } from "next/navigation";

/**
 * Root route that handles initial redirection.
 * This is the only page.tsx allowed in the root app directory 
 * when using route groups like (app) to avoid parallel route conflicts.
 */
export default function RootPage() {
  redirect("/dashboard");
}

export const dynamic = 'force-static';
