import { createClient, SupabaseClient } from "@supabase/supabase-js";

let client: SupabaseClient | null = null;

/** Decode JWT payload without verifying (for startup check only). */
function getJwtRole(key: string): string | null {
  try {
    const parts = key.split(".");
    if (parts.length !== 3) return null;
    const payload = JSON.parse(
      Buffer.from(parts[1]!, "base64url").toString("utf8"),
    ) as { role?: string };
    return payload.role ?? null;
  } catch {
    return null;
  }
}

export function getSupabaseClient(): SupabaseClient {
  if (client) return client;

  const url = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error(
      "SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is not set in the environment.",
    );
  }

  const role = getJwtRole(serviceRoleKey);
  if (role !== "service_role") {
    // eslint-disable-next-line no-console
    console.warn(
      "[supabaseClient] SUPABASE_SERVICE_ROLE_KEY does not have role 'service_role' (got '%s'). " +
        "Use the service_role secret from Project Settings > API, not the anon key. " +
        "Otherwise you may get 'permission denied for schema public'.",
      role ?? "unknown",
    );
  }

  client = createClient(url, serviceRoleKey, {
    auth: {
      persistSession: false,
    },
  });

  return client;
}

