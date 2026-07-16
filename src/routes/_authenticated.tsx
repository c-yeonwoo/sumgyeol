import { createFileRoute, Outlet, redirect, Link, useLocation } from "@tanstack/react-router";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { touchLastActive } from "@/lib/mission";
import { registerPush } from "@/lib/push";
import { NotificationToasts } from "@/components/notification-toasts";

export const Route = createFileRoute("/_authenticated")({
  beforeLoad: async ({ location }) => {
    if (typeof window === "undefined") return;
    const { data } = await supabase.auth.getUser();
    if (!data.user) throw redirect({ to: "/login" });

    const path = location.pathname;
    const skipOnboard = path === "/onboarding";
    const skipVerify =
      path === "/verify" || path === "/banned" || path === "/onboarding";
    const skipBanCheck = path === "/banned";

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: prof } = await (supabase as any)
      .from("profiles")
      .select("onboarded, status, identity_verified_at")
      .eq("id", data.user.id)
      .maybeSingle();

    if (!skipBanCheck && prof?.status === "banned") {
      throw redirect({ to: "/banned" });
    }

    if (!skipOnboard && !prof?.onboarded && prof?.status !== "banned") {
      throw redirect({ to: "/onboarding" });
    }

    if (
      !skipVerify &&
      prof?.onboarded &&
      prof?.status === "active" &&
      !prof?.identity_verified_at
    ) {
      throw redirect({ to: "/verify" });
    }
  },
  component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
  const location = useLocation();
  const hideTabs =
    location.pathname.startsWith("/delivery/") ||
    location.pathname.startsWith("/thread/") ||
    location.pathname.startsWith("/waiting/") ||
    location.pathname === "/notifications" ||
    location.pathname === "/onboarding" ||
    location.pathname === "/verify" ||
    location.pathname === "/banned" ||
    location.pathname.startsWith("/admin/") ||
    location.pathname.startsWith("/me/edit") ||
    location.pathname.startsWith("/me/blocked");
  const tabBarHeight = hideTabs ? "0px" : "var(--tabbar-height)";

  useEffect(() => {
    touchLastActive().catch(() => {});
    registerPush().catch(() => {}); // native only; no-op on web
    const id = setInterval(() => {
      touchLastActive().catch(() => {});
    }, 5 * 60 * 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div
      className="fixed inset-0 text-foreground overflow-hidden"
      style={{ height: "var(--app-vh)", background: "var(--backdrop)" }}
    >
      <div
        className="max-w-md mx-auto min-h-0 flex flex-col overflow-hidden bg-background shadow-[var(--shadow-lg)] relative"
        style={{ height: "var(--app-vh)" }}
      >
        <div
          className="flex-1 min-h-0 overflow-y-auto overscroll-contain"
          style={{ paddingBottom: hideTabs ? 0 : tabBarHeight, paddingTop: "var(--safe-top)" }}
        >
          <Outlet />
        </div>
        {!hideTabs && <TabBar pathname={location.pathname} height={tabBarHeight} />}
      </div>
      {location.pathname !== "/notifications" && <NotificationToasts />}
    </div>
  );
}

const TAB_ICONS = {
  "/home": (
    <>
      <path d="M4 6.5h16v11H4z" />
      <path d="M4 8.5l8 5 8-5" />
    </>
  ),
  "/send": <path d="M3.5 12l16.5-7.5-5.5 16.5-3-6.5-8-2.5z" />,
  "/outbox": (
    <>
      <path d="M3 14.5c2 1.6 4 1.6 6 0s4-1.6 6 0 4 1.6 6 0" />
      <path d="M3 9.5c2 1.6 4 1.6 6 0s4-1.6 6 0 4 1.6 6 0" />
    </>
  ),
  "/me": (
    <>
      <circle cx="12" cy="8" r="3.6" />
      <path d="M4.5 20.5c0-3.8 3.6-5.8 7.5-5.8s7.5 2 7.5 5.8" />
    </>
  ),
};

function TabBar({ pathname, height }: { pathname: string; height: string }) {
  const items: Array<{ to: "/home" | "/send" | "/outbox" | "/me"; label: string }> = [
    { to: "/home", label: "받은" },
    { to: "/send", label: "보내기" },
    { to: "/outbox", label: "결과" },
    { to: "/me", label: "나" },
  ];
  return (
    <nav
      className="fixed bottom-0 left-1/2 w-full max-w-md -translate-x-1/2 z-40 px-3 pointer-events-none"
      style={{ height, paddingBottom: "calc(var(--safe-bottom) + 10px)" }}
    >
      <div
        className="pointer-events-auto flex items-stretch gap-1 rounded-[1.5rem] bg-surface p-1.5 shadow-[var(--shadow-lg)]"
        style={{ height: "var(--tabbar-content-height)" }}
      >
        {items.map((it) => {
          const active = pathname === it.to || pathname.startsWith(it.to + "/");
          return (
            <Link
              key={it.to}
              to={it.to}
              className={
                "flex-1 flex flex-col items-center justify-center gap-1 rounded-[1.1rem] transition-colors duration-150 " +
                (active ? "bg-accent/10 text-tide-mid" : "text-muted-foreground")
              }
            >
              <svg
                viewBox="0 0 24 24"
                width="23"
                height="23"
                fill="none"
                stroke="currentColor"
                strokeWidth={active ? 2.1 : 1.8}
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                {TAB_ICONS[it.to]}
              </svg>
              <span className={"text-[11px] " + (active ? "font-bold" : "font-medium")}>
                {it.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
