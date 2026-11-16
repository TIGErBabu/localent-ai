// Session cookie names — kept in their own module (no imports) so the edge
// middleware, server session helpers, and route handlers all share them.
export const ACCESS_COOKIE = "localent_access";
export const REFRESH_COOKIE = "localent_refresh";
