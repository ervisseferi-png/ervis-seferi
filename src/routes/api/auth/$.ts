import { createFileRoute } from "@tanstack/react-router";
import { auth } from "@/lib/auth/server";
import { getSql } from "@/lib/db";

function isPublicSignUp(request: Request) {
  const path = new URL(request.url).pathname.toLowerCase();
  return path.includes("sign-up") || path.includes("signup");
}

const forbidden = () =>
  new Response(JSON.stringify({ message: "Inscription désactivée." }), {
    status: 403,
    headers: { "content-type": "application/json" },
  });

async function userTableIsEmpty(): Promise<boolean> {
  try {
    const sql = await getSql();
    const rows = await sql.query<{ n: number }>(
      'select count(*)::int as n from "user"',
    );
    return (rows[0]?.n ?? 0) === 0;
  } catch {
    return false;
  }
}

export const Route = createFileRoute("/api/auth/$")({
  server: {
    handlers: {
      GET: ({ request }) => auth.handler(request),
      POST: async ({ request }) => {
        if (isPublicSignUp(request) && !(await userTableIsEmpty())) {
          return forbidden();
        }
        return auth.handler(request);
      },
    },
  },
});
