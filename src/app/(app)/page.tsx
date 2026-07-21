/**
 * CONSOLIDATION: This page was causing a collision with src/app/page.tsx.
 * The primary redirect to /dashboard is now handled by src/app/page.tsx.
 * We remove the default export to prevent Next.js from seeing this as a parallel route.
 */
// export default function InertPage() { return null; }
const PageConflictResolver = () => null;
