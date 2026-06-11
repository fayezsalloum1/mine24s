/** All API routes use auth, headers, or DB — never statically prerender. */
export const dynamic = "force-dynamic";

export default function ApiLayout({ children }: { children: React.ReactNode }) {
  return children;
}
