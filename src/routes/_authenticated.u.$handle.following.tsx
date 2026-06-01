import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { StorageImg } from "@/components/storage-img";

export const Route = createFileRoute("/_authenticated/u/$handle/following")({
  head: ({ params }) => ({ meta: [{ title: `@${params.handle}의 팔로잉` }] }),
  component: FollowingPage,
});

function FollowingPage() {
  const { handle } = Route.useParams();

  const { data, isLoading } = useQuery({
    queryKey: ["following", handle],
    queryFn: async () => {
      const { data: profile } = await supabase
        .from("profiles")
        .select("id")
        .eq("handle", handle)
        .maybeSingle();
      if (!profile) return { users: [] };

      const { data: rows } = await supabase
        .from("follows")
        .select("following_id, profiles!follows_following_id_fkey(handle, display_name, avatar_url, bio)")
        .eq("follower_id", profile.id)
        .order("created_at", { ascending: false });

      return {
        users: (rows ?? []).map((r: any) => r.profiles).filter(Boolean),
      };
    },
  });

  return (
    <main className="pb-20">
      <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-md px-6 py-5 border-b border-border flex items-center justify-between">
        <Link
          to="/u/$handle"
          params={{ handle }}
          className="text-sm text-muted-foreground"
        >
          ←
        </Link>
        <span className="text-[11px] uppercase tracking-widest text-muted-foreground">
          팔로잉
        </span>
        <span className="w-6" />
      </header>

      {isLoading ? (
        <div className="px-6 py-6 space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-12 bg-muted rounded animate-pulse" />
          ))}
        </div>
      ) : (data?.users ?? []).length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-16">
          아직 팔로우하는 분이 없어요.
        </p>
      ) : (
        <ul className="px-2 py-4">
          {data!.users.map((u: any) =>
            u.handle ? (
              <li key={u.handle}>
                <Link
                  to="/u/$handle"
                  params={{ handle: u.handle }}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-surface rounded-xl"
                >
                  {u.avatar_url ? (
                    <StorageImg
                      src={u.avatar_url}
                      alt=""
                      className="size-11 rounded-full object-cover border border-border"
                    />
                  ) : (
                    <div className="size-11 rounded-full bg-surface border border-border" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="text-[14px] font-medium truncate">
                      {u.display_name ?? u.handle}
                    </div>
                    <div className="text-[12px] text-muted-foreground truncate">
                      @{u.handle}
                      {u.bio ? ` · ${u.bio}` : ""}
                    </div>
                  </div>
                </Link>
              </li>
            ) : null,
          )}
        </ul>
      )}
    </main>
  );
}
