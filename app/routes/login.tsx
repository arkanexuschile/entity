import type { Route } from "./+types/login";
import { Form, useActionData, useSearchParams, redirect } from "react-router";
import { login, createUserSession, getUser } from "~/lib/auth.server";

export function meta({}: Route.MetaArgs) {
  return [{ title: "Entrar · Entity" }];
}

export async function loader({ request }: Route.LoaderArgs) {
  const user = await getUser(request);
  if (user) throw redirect("/");
  return null;
}

export async function action({ request }: Route.ActionArgs) {
  const form = await request.formData();
  const username = String(form.get("username") ?? "").trim();
  const password = String(form.get("password") ?? "");
  const redirectTo = String(form.get("redirectTo") ?? "/");

  if (!username || !password) {
    return { error: "Ingresá usuario y contraseña." };
  }

  const user = await login(username, password);
  if (!user) {
    return { error: "Credenciales inválidas." };
  }

  const safeTo = redirectTo.startsWith("/") && !redirectTo.startsWith("//") ? redirectTo : "/";
  return createUserSession(user.id, safeTo);
}

export default function Login({ actionData }: Route.ComponentProps) {
  const [params] = useSearchParams();
  const redirectTo = params.get("redirectTo") ?? "/";
  const error = actionData && "error" in actionData ? actionData.error : null;

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "radial-gradient(ellipse at 20% 20%, #2b2418 0%, #12100d 55%)",
        padding: "1.5rem",
      }}
    >
      <div
        style={{
          width: "min(420px, 96vw)",
          background: "var(--panel)",
          border: "1px solid var(--line)",
          borderRadius: 12,
          padding: "2rem",
          boxShadow: "0 20px 60px rgba(0,0,0,0.45)",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
          <div
            style={{
              fontFamily: "var(--display)",
              fontSize: "1.6rem",
              color: "var(--gold-soft)",
              letterSpacing: "0.04em",
            }}
          >
            Entity
          </div>
          <div style={{ fontSize: "0.85rem", color: "var(--faint)", marginTop: "0.25rem" }}>
            Gremio de Piedra Bruja · Ingreso
          </div>
        </div>

        {error && (
          <div
            style={{
              background: "rgba(220, 60, 60, 0.12)",
              border: "1px solid rgba(220,60,60,0.35)",
              color: "#ffb4b4",
              borderRadius: 8,
              padding: "0.7rem 0.9rem",
              fontSize: "0.85rem",
              marginBottom: "1rem",
            }}
          >
            {error}
          </div>
        )}

        <Form method="post" style={{ display: "flex", flexDirection: "column", gap: "0.9rem" }}>
          <input type="hidden" name="redirectTo" value={redirectTo} />
          <div>
            <label style={lab}>Usuario</label>
            <input name="username" type="text" required autoComplete="username" autoFocus style={inp} />
          </div>
          <div>
            <label style={lab}>Contraseña</label>
            <input name="password" type="password" required autoComplete="current-password" style={inp} placeholder="••••••••" />
          </div>
          <button
            type="submit"
            style={{
              marginTop: "0.5rem",
              background: "var(--orange)",
              color: "#fff",
              border: "none",
              borderRadius: 8,
              padding: "0.7rem",
              fontFamily: "var(--display)",
              fontWeight: 700,
              fontSize: "1rem",
              cursor: "pointer",
            }}
          >
            Entrar
          </button>
        </Form>
      </div>
    </div>
  );
}

const lab: React.CSSProperties = {
  display: "block",
  fontSize: "0.7rem",
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  color: "var(--faint)",
  marginBottom: "0.3rem",
};

const inp: React.CSSProperties = {
  width: "100%",
  background: "var(--panel-2)",
  border: "1px solid var(--line)",
  color: "var(--ink)",
  borderRadius: 8,
  padding: "0.6rem 0.75rem",
  fontSize: "0.95rem",
  fontFamily: "inherit",
};