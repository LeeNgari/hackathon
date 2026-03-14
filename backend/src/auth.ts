import type { Request } from "express";
import { getSupabaseClient } from "./supabaseClient.js";

/**
 * Get the authenticated user id from the request's Authorization Bearer token.
 * Returns null if no token, invalid token, or verification fails.
 * Uses Supabase service role to verify the JWT.
 */
export async function getAuthUserId(req: Request): Promise<string | null> {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith("Bearer ")
    ? authHeader.slice(7)
    : authHeader ?? null;
  if (!token) return null;

  try {
    const supabase = getSupabaseClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(token);
    if (error || !user?.id) return null;
    return user.id;
  } catch {
    return null;
  }
}
