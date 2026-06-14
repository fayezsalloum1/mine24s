/** Public site URL — used for OAuth redirects and email links. */
export function getAppUrl() {
  return (
    process.env.APP_URL?.trim() ||
    process.env.NEXTAUTH_URL?.trim() ||
    "http://localhost:3000"
  ).replace(/\/$/, "");
}
