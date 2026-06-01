import { supabase } from "@/integrations/supabase/client";

/**
 * The `answers` bucket is private. Photo/avatar values stored in the database
 * may be either:
 *  - a legacy full public URL: `https://<project>.supabase.co/storage/v1/object/public/answers/<path>`
 *  - a bare storage path: `<uid>/<filename>`
 *
 * This helper normalises either form to the storage path so we can issue
 * short-lived signed URLs.
 */
export function extractAnswersPath(value: string | null | undefined): string | null {
  if (!value) return null;
  const v = value.trim();
  if (!v) return null;
  if (v.startsWith("blob:") || v.startsWith("data:")) return null;
  if (v.startsWith("http://") || v.startsWith("https://")) {
    const m = v.match(/\/storage\/v1\/object\/(?:public|sign)\/answers\/([^?]+)/);
    if (!m) return null;
    return decodeURIComponent(m[1]);
  }
  return v.replace(/^\/+/, "");
}

const SIGNED_URL_TTL_SECONDS = 60 * 60; // 1 hour

export async function signAnswersUrl(path: string): Promise<string | null> {
  const { data, error } = await supabase.storage
    .from("answers")
    .createSignedUrl(path, SIGNED_URL_TTL_SECONDS);
  if (error || !data) return null;
  return data.signedUrl;
}

export const SIGNED_URL_STALE_MS = (SIGNED_URL_TTL_SECONDS - 5 * 60) * 1000; // 55 min
