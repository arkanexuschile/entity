import { createCookieSessionStorage } from "react-router";

function getSecret(): string {
  const s = process.env.SESSION_SECRET;
  if (!s || s.length < 16) {
    throw new Error("SESSION_SECRET no configurado — definir en .env (mínimo 16 chars)");
  }
  return s;
}

export const sessionStorage = createCookieSessionStorage({
  cookie: {
    name: "__entity_session",
    httpOnly: true,
    path: "/",
    sameSite: "lax",
    secrets: [getSecret()],
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 30, // 30 días
  },
});

export function getSession(cookie: string | null) {
  return sessionStorage.getSession(cookie);
}

export function commitSession(session: Awaited<ReturnType<typeof sessionStorage.getSession>>) {
  return sessionStorage.commitSession(session);
}

export function destroySession(session: Awaited<ReturnType<typeof sessionStorage.getSession>>) {
  return sessionStorage.destroySession(session);
}

export async function getUserId(request: Request): Promise<string | undefined> {
  const session = await sessionStorage.getSession(request.headers.get("Cookie"));
  return session.get("userId") as string | undefined;
}
