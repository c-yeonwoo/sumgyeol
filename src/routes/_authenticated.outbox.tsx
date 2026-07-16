import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { EmptyState } from "@/components/empty-state";
import { Pill, type PillTone } from "@/components/status-pill";
import {
  fetchOutbox,
  formatCountdown,
  msUntil,
  type MissionDelivery,
} from "@/lib/mission";

export const Route = createFileRoute("/_authenticated/outbox")({
  head: () => ({ meta: [{ title: "결과 — 플로티" }] }),
  component: OutboxPage,
});

function OutboxPage() {
  const [uid, setUid] = useState<string | null>(null);
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUid(data.user?.id ?? null));
  }, []);

  const { data, isLoading } = useQuery({
    queryKey: ["mission-outbox", uid],
    enabled: !!uid,
    queryFn: () => fetchOutbox(uid!),
  });

  return (
    <main className="px-5 py-8">
      <header className="mb-7">
        <h1 className="font-serif text-3xl">결과</h1>
        <p className="text-[15px] text-muted-foreground mt-2">
          보낸 미션의 답장과 결과를 확인해요.
        </p>
      </header>

      {isLoading && <p className="text-sm text-muted-foreground">불러오는 중…</p>}
      {!isLoading && (data?.length ?? 0) === 0 && (
        <EmptyState
          title="아직 보낸 미션이 없어요"
          description="첫 미션을 바다에 띄워 보세요. 누군가 건져 올릴지 몰라요."
          action={
            <Link
              to="/send"
              className="inline-flex rounded-full bg-warm text-warm-foreground px-6 py-3 text-sm font-bold"
            >
              첫 미션 보내기
            </Link>
          }
        />
      )}

      <ul className="space-y-3">
        {data?.map((d) => (
          <OutboxCard key={d.id} delivery={d} />
        ))}
      </ul>
    </main>
  );
}

function statusLabel(d: MissionDelivery): string {
  if (d.unlocked_at) return "열림";
  if (d.sender_verdict === "pass" || d.receiver_verdict === "pass") return "패스";
  if (d.reply_body && d.sender_verdict === "pending") return "평가 대기";
  if (d.reply_body) return "답장 도착";
  if (d.status === "expired") return "무응답 만료";
  if (!d.accepted_at) return "표류 중";
  if (d.expires_at && msUntil(d.expires_at) <= 0) return "만료";
  return "답장 기다리는 중";
}

function statusTone(d: MissionDelivery): PillTone {
  if (d.unlocked_at) return "new"; // unlock = the warm win
  if (d.sender_verdict === "pass" || d.receiver_verdict === "pass") return "muted";
  if (d.reply_body && d.sender_verdict === "pending") return "warm"; // reply arrived → evaluate
  if (d.reply_body) return "warm";
  if (d.status === "expired") return "alert";
  if (d.expires_at && msUntil(d.expires_at) <= 0) return "alert";
  return "tide"; // drifting / awaiting reply
}

function OutboxCard({ delivery }: { delivery: MissionDelivery }) {
  const expiredNoReply = delivery.status === "expired" && !delivery.reply_body;

  return (
    <li>
      <Link
        to={expiredNoReply ? "/waiting/$deliveryId" : "/delivery/$deliveryId"}
        params={{ deliveryId: String(delivery.id) }}
        className="block rounded-2xl bg-surface px-4 py-4 transition-shadow duration-150 hover:shadow-[var(--shadow-md)]"
      >
        <div className="flex items-center justify-between gap-2 mb-2">
          <Pill tone={statusTone(delivery)} ping={!!delivery.reply_body && !delivery.unlocked_at}>
            {statusLabel(delivery)}
          </Pill>
          <span className="text-xs text-muted-foreground tabular-nums">
            {new Date(delivery.created_at).toLocaleDateString("ko-KR")}
          </span>
        </div>
        <p className="font-serif text-lg leading-snug">
          {delivery.mission?.body ?? "미션"}
        </p>
        {!delivery.accepted_at && delivery.status !== "expired" && (
          <p className="mt-2 text-xs text-muted-foreground">🌊 바다 위 표류 중</p>
        )}
        {delivery.accepted_at && !delivery.reply_body && delivery.expires_at && (
          <p className="mt-2 text-xs text-muted-foreground tabular-nums">
            ⏱ {formatCountdown(delivery.expires_at)}
          </p>
        )}
        {delivery.reply_body && (
          <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
            답장: {delivery.reply_body}
          </p>
        )}
        {expiredNoReply && (
          <p className="mt-2 text-xs text-accent">같은 내용으로 다시 보내기 →</p>
        )}
      </Link>
    </li>
  );
}
