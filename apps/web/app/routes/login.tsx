import type { MetaFunction, LoaderFunctionArgs, ActionFunctionArgs } from "react-router";
import { Form, useActionData, useSearchParams, redirect } from "react-router";
import { getUser, login, createSessionAndRedirect } from "../lib/auth.server";
import { sessionStorage } from "../lib/session.server";

export const meta: MetaFunction = () => [{ title: "Entrar · Entity" }];

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await getUser(request);
  if (user) throw redirect("/");
  return null;
}

export async function action({ request }: ActionFunctionArgs) {
  const form = await request.formData();
  const email = String(form.get("email") ?? "").trim().toLowerCase();
  const password = String(form.get("password") ?? "");
  const redirectTo = String(form.get("redirectTo") ?? "/");

  if (!email || !password) {
    return Response.json({ error: "Ingresá email y contraseña." }, { status: 400 });
  }

  const user = await login(email, password);
  if (!user) {
    return Response.json({ error: "Credenciales inválidas o usuario inactivo." }, { status: 400 });
  }

  // Sanitizar redirectTo: solo paths internos
  const safeTo = redirectTo.startsWith("/") && !redirectTo.startsWith("//") ? redirectTo : "/";
  return createSessionAndRedirect(user.id, safeTo);
}

export default function Login() {
  const actionData = useActionData() as { error?: string } | undefined;
  const [params] = useSearchParams();
  const redirectTo = params.get("redirectTo") ?? "/";

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
          <div style={{ fontFamily: "var(--display)", fontSize: "1.6rem", color: "var(--gold-soft)", letterSpacing: "0.04em" }}>
            Entity
          </div>
          <div style={{ fontSize: "0.85rem", color: "var(--faint)", marginTop: "0.25rem" }}>Gremio de Piedra Bruja · Ingreso</div>
        </div>

        {actionData?.error && (
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
            {actionData.error}
          </div>
        )}

        <Form method="post" style={{ display: "flex", flexDirection: "column", gap: "0.9rem" }}>
          <input type="hidden" name="redirectTo" value={redirectTo} />
          <div>
            <label style={lab}>Email</label>
            <input name="email" type="email" required autoComplete="email" autoFocus style={inp} placeholder="admin@entity.local" />
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
          <div style={{ fontSize: "0.72rem", color: "var(--faint)", textAlign: "center", marginTop: "0.25rem" }}>
            Demo: <code style={{ color: "var(--ink)" }}>admin@entity.local / entity123</code>
          </div>
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
