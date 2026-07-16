import { supabase } from "@/integrations/supabase/client";

let started = false;

/**
 * Register for push notifications on native (iOS/Android) and store the device
 * token so the server can deliver mission arrival / reply / no-response push.
 * No-op on web (Cloudflare) — guarded by Capacitor.isNativePlatform().
 * Plugins are dynamically imported so nothing loads during SSR.
 *
 * Send side (Edge Function → FCM/APNs) + credentials are set up separately.
 */
export async function registerPush(): Promise<void> {
  if (typeof window === "undefined" || started) return;

  const { Capacitor } = await import("@capacitor/core");
  if (!Capacitor.isNativePlatform()) return;
  started = true;

  const { PushNotifications } = await import("@capacitor/push-notifications");

  let receive = (await PushNotifications.checkPermissions()).receive;
  if (receive === "prompt" || receive === "prompt-with-rationale") {
    receive = (await PushNotifications.requestPermissions()).receive;
  }
  if (receive !== "granted") return;

  await PushNotifications.addListener("registration", async (token) => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any).rpc("upsert_device_token", {
        p_token: token.value,
        p_platform: Capacitor.getPlatform(),
      });
    } catch {
      /* token save is best-effort */
    }
  });

  await PushNotifications.addListener("registrationError", () => {
    /* ignore */
  });

  // Tapping a push routes to its target screen (sender sets payload.url).
  await PushNotifications.addListener("pushNotificationActionPerformed", (action) => {
    const url = action.notification.data?.url;
    if (typeof url === "string" && url.startsWith("/")) {
      window.location.href = url;
    }
  });

  await PushNotifications.register();
}
