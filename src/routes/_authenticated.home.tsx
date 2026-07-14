import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  fetchInbox,
  fetchMyMissionProfile,
  formatCountdown,
  msUntil,
  type MissionDelivery,
} from "@/lib/mission";

export const Route = createFileRoute("/_authenticated/home")({
  head: () => ({ meta: [{ title: "받은 쪽지 — 쪽지" }] }),
  component: InboxPage,
});

function InboxPage() {
  const [uid, setUid] = useState<string | null>(null);
  const [, setTick] = useState(0);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUid(data.user?.id ?? null));
  }, []);

  // refresh countdown every 30s
  useEffect(() => {
    const t = setInterval(() => setTick((n) => n + 1), 30000);
    return () => clearInterval(t);
  }, []);

  const { data: profile } = useQuery({
    queryKey: ["my-mission-profile"],
    queryFn: fetchMyMissionProfile,
  });

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["mission-inbox", uid],
    enabled: !!uid,
    queryFn: () => fetchInbox(uid!),
  });

  const isMale = profile?.gender === "male";

  return (
    <main className="px-5 py-8">
      <header className="mb-8">
        <p className="text-xs tracking-widest text-muted-foreground uppercase">쪽지</p>
        <h1 className="font-serif text-3xl mt-1">받은 쪽지</h1>
        <p className="text-[15px] text-muted-foreground mt-2 leading-relaxed">
          {isMale
            ? "익명 미션에 답해 보세요. 서로 OK면 그때 열려요. 답장 기한 48시간."
            : "남성 회원에게 도착한 미션이 여기에 쌓여요. 보내기는 여성만 가능해요."}
        </p>
      </header>

      {!isMale && profile && (
        <div className="mb-6 rounded-xl border border-dashed border-border px-4 py-3 text-sm text-muted-foreground">
          수행(답장)은 남성 역할이에요.{" "}
          <Link to="/send" className="underline text-foreground">
            쪽지 보내기
          </Link>
          로 가 보세요.
        </div>
      )}

      {isLoading && (
        <p className="text-sm text-muted-foreground">불러오는 중…</p>
      )}
      {error && (
        <div className="rounded-lg border border-border p-4">
          <p className="text-sm text-muted-foreground">
            받은 쪽지를 불러오지 못했어요. DB 마이그레이션이 적용됐는지 확인해 주세요.
          </p>
          <button
            type="button"
            onClick={() => refetch()}
            className="mt-3 text-sm underline"
          >
            다시 시도
          </button>
        </div>
      )}
      {!isLoading && !error && (data?.length ?? 0) === 0 && (
        <div className="rounded-2xl border border-dashed border-border px-5 py-10 text-center">
          <p className="font-serif text-xl">아직 도착한 쪽지가 없어요</p>
          <p className="text-sm text-muted-foreground mt-2">
            {isMale
              ? "누군가 미션을 보내면 여기에 나타나요."
              : "먼저 쪽지를 보내 보면 루프가 돌아가요."}
          </p>
        </div>
      )}

      <ul className="space-y-3">
        {data?.map((d) => (
          <InboxCard key={d.id} delivery={d} />
        ))}
      </ul>
    </main>
  );
}

function InboxCard({ delivery }: { delivery: MissionDelivery }) {
  const body = delivery.mission?.body ?? "미션";
  const waiting = !delivery.reply_body;
  const expired =
    waiting && (delivery.status === "expired" || msUntil(delivery.expires_at) <= 0);

  return (
    <li>
      <Link
        to="/delivery/$deliveryId"
        params={{ deliveryId: String(delivery.id) }}
        className="block rounded-2xl border border-border bg-surface px-4 py-4 hover:border-foreground/30 transition-colors"
      >
        <div className="flex items-center justify-between gap-2 mb-2">
          <span className="text-xs text-muted-foreground">
            {expired ? "만료" : waiting ? "답장 대기" : "답장함"}
          </span>
          {waiting && !expired && (
            <span className="text-xs font-medium tabular-nums text-foreground/80">
              ⏱ {formatCountdown(delivery.expires_at)}
            </span>
          )}
        </div>
        <p className="font-serif text-lg leading-snug">{body}</p>
        {delivery.reply_body && (
          <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
            내 답: {delivery.reply_body}
          </p>
        )}
      </Link>
    </li>
  );
}
