import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  AGE_BAND_OPTIONS,
  HEIGHT_OPTIONS,
  countSendsToday,
  createAndDeliverMission,
  fetchMyMissionProfile,
  fetchPresets,
  type IdealFilter,
  type MissionPreset,
} from "@/lib/mission";
import { BRAND_KO } from "@/lib/brand";

export const Route = createFileRoute("/_authenticated/send")({
  head: () => ({ meta: [{ title: "보내기 — 플로티" }] }),
  component: SendPage,
});

type FilterKind = "none" | "age_band" | "region" | "height";

function SendPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [custom, setCustom] = useState("");
  const [selected, setSelected] = useState<MissionPreset | null>(null);
  const [filterKind, setFilterKind] = useState<FilterKind>("none");
  const [filterValue, setFilterValue] = useState("");
  const [regionInput, setRegionInput] = useState("");
  const [showPresets, setShowPresets] = useState(false);
  const [showFilter, setShowFilter] = useState(false);

  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ["my-mission-profile"],
    queryFn: fetchMyMissionProfile,
  });

  const { data: presets = [], isLoading } = useQuery({
    queryKey: ["mission-presets"],
    queryFn: fetchPresets,
  });

  const { data: sendsToday = 0 } = useQuery({
    queryKey: ["sends-today", profile?.id],
    enabled: !!profile?.id,
    queryFn: () => countSendsToday(profile!.id),
  });

  const isFemale = profile?.gender === "female";
  const freeLeft = Math.max(0, 1 - sendsToday);
  const needsTicket = sendsToday >= 1;
  const tickets = profile?.ticket_balance ?? 0;

  const filter: IdealFilter | null = useMemo(() => {
    if (filterKind === "none") return null;
    if (filterKind === "region") {
      const v = regionInput.trim();
      if (!v) return null;
      return { kind: "region", value: v };
    }
    if (!filterValue) return null;
    return { kind: filterKind, value: filterValue };
  }, [filterKind, filterValue, regionInput]);

  const send = useMutation({
    mutationFn: async () => {
      if (!isFemale) throw new Error("only female can send");
      if (needsTicket && tickets < 1) throw new Error("ticket required");

      const payload = {
        useTicket: needsTicket,
        filter,
      };

      if (selected) {
        return createAndDeliverMission({
          presetId: selected.id,
          kind: selected.kind,
          body: selected.body,
          chips: selected.chips,
          ...payload,
        });
      }
      const body = custom.trim();
      if (body.length < 2) throw new Error("미션을 두 글자 이상 적어 주세요.");
      if (body.length > 40) throw new Error("커스텀 미션은 40자까지예요.");
      return createAndDeliverMission({
        kind: "question",
        body,
        ...payload,
      });
    },
    onSuccess: (result) => {
        toast.success(
        needsTicket
          ? `티켓으로 ${BRAND_KO}를 보냈어요.`
          : "바다 위로 보냈어요. 누군가 받으면 알려드릴게요.",
      );
      qc.invalidateQueries({ queryKey: ["mission-outbox"] });
      qc.invalidateQueries({ queryKey: ["sends-today"] });
      qc.invalidateQueries({ queryKey: ["my-mission-profile"] });
      navigate({
        to: "/waiting/$deliveryId",
        params: { deliveryId: String(result.deliveryId) },
      });
    },
    onError: (err) => {
      const msg =
        (err as { message?: string })?.message ||
        (err instanceof Error ? err.message : "보내지 못했어요.");
      if (msg.includes("only female")) {
        toast.error("미션은 여성 회원만 보낼 수 있어요.");
      } else if (msg.includes("no eligible recipient")) {
        toast.error("지금 받을 수 있는 사람이 없어요. 조건을 낮추거나 잠시 뒤 다시 시도해 주세요.");
      } else if (msg.includes("ticket required") || msg.includes("daily send cap")) {
        toast.error("오늘 무료 발송을 썼어요. 티켓이 필요해요.");
      } else {
        toast.error(msg);
      }
    },
  });

  if (profileLoading) {
    return (
      <main className="px-5 py-8">
        <p className="text-sm text-muted-foreground">불러오는 중…</p>
      </main>
    );
  }

  if (!isFemale) {
    return (
      <main className="px-5 py-8">
        <h1 className="font-serif text-3xl">보내기</h1>
        <p className="mt-4 text-[15px] text-muted-foreground leading-relaxed">
          지금은 <strong className="text-foreground">여성 회원만</strong> 미션을 보낼 수
          있어요. 남성 회원은 받은 미션에 답하는 역할이에요.
        </p>
        <Link
          to="/home"
          className="mt-8 inline-flex rounded-full bg-foreground text-background px-5 py-2.5 text-sm"
        >
          받은 미션 보기
        </Link>
      </main>
    );
  }

  const canSubmit =
    (!!selected || custom.trim().length >= 2) &&
    !(needsTicket && tickets < 1) &&
    (filterKind === "none" || !!filter);

  const composeValue = selected ? selected.body : custom;
  const filterLabel =
    filterKind === "none"
      ? "(선택)"
      : filterKind === "age_band"
        ? "나이"
        : filterKind === "region"
          ? "지역"
          : "키";

  return (
    <main className="px-5 py-7 pb-28">
      <header className="mb-5">
        <h1 className="font-serif text-3xl">보내기</h1>
        <div className="mt-3 flex gap-2 text-xs font-medium text-muted-foreground">
          <span className="rounded-full bg-secondary px-3 py-1">오늘 무료 {freeLeft}/1</span>
          <span className="rounded-full bg-secondary px-3 py-1">티켓 {tickets}</span>
        </div>
      </header>

      {needsTicket && (
        <p className="mb-4 text-[13px] text-muted-foreground leading-relaxed">
          {tickets > 0
            ? "오늘 무료분을 써서, 보내면 티켓 1장이 차감돼요."
            : "오늘 무료분을 썼어요. 티켓이 생기면 더 보낼 수 있어요."}
        </p>
      )}

      {/* compose — the primary action */}
      <textarea
        value={composeValue}
        onChange={(e) => {
          setCustom(e.target.value);
          setSelected(null);
        }}
        rows={4}
        maxLength={40}
        placeholder="어떤 질문을 띄워 볼까요? 편하게 적어도 좋아요."
        className="w-full rounded-2xl bg-secondary px-4 py-4 text-[16px] leading-relaxed resize-none focus:outline-none focus:ring-2 focus:ring-ring"
      />
      <div className="mt-2 flex items-center justify-between">
        <button
          type="button"
          onClick={() => setShowPresets((v) => !v)}
          className="text-[13px] font-semibold text-tide-deep"
        >
          예시 질문 {showPresets ? "접기" : "보기"}
        </button>
        <span className="text-xs text-muted-foreground tabular-nums">
          {composeValue.trim().length}/40
        </span>
      </div>

      {showPresets && (
        <div className="mt-2 max-h-72 overflow-y-auto rounded-2xl bg-surface p-1.5 shadow-[var(--shadow-md)]">
          {isLoading && <p className="px-3 py-2 text-sm text-muted-foreground">불러오는 중…</p>}
          {presets.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => {
                setSelected(p);
                setCustom("");
                setShowPresets(false);
              }}
              className="block w-full rounded-xl px-3 py-2.5 text-left text-[15px] leading-snug hover:bg-secondary"
            >
              {p.body}
            </button>
          ))}
        </div>
      )}

      {/* ideal filter — optional, tucked away */}
      <div className="mt-6">
        <button
          type="button"
          onClick={() => setShowFilter((v) => !v)}
          className="text-[13px] font-semibold text-tide-deep"
        >
          이상형 조건 {filterKind !== "none" ? `· ${filterLabel}` : "(선택)"} {showFilter ? "접기" : "펼치기"}
        </button>
        {showFilter && (
          <div className="mt-3 space-y-3">
            <div className="flex flex-wrap gap-2">
              {(
                [
                  ["none", "없음"],
                  ["age_band", "나이"],
                  ["region", "지역"],
                  ["height", "키"],
                ] as const
              ).map(([k, label]) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => {
                    setFilterKind(k);
                    setFilterValue("");
                  }}
                  className={
                    "rounded-full px-3.5 py-1.5 text-sm font-medium " +
                    (filterKind === k ? "bg-tide-mid text-white" : "bg-secondary text-foreground")
                  }
                >
                  {label}
                </button>
              ))}
            </div>
            {(filterKind === "age_band" ? AGE_BAND_OPTIONS : filterKind === "height" ? HEIGHT_OPTIONS : []).length > 0 && (
              <div className="flex flex-wrap gap-2">
                {(filterKind === "age_band" ? AGE_BAND_OPTIONS : HEIGHT_OPTIONS).map((o) => (
                  <button
                    key={o.value}
                    type="button"
                    onClick={() => setFilterValue(o.value)}
                    className={
                      "rounded-full px-3.5 py-1.5 text-sm " +
                      (filterValue === o.value ? "bg-tide-mid text-white" : "bg-secondary text-foreground")
                    }
                  >
                    {o.label}
                  </button>
                ))}
              </div>
            )}
            {filterKind === "region" && (
              <input
                value={regionInput}
                onChange={(e) => setRegionInput(e.target.value)}
                placeholder="예: 서울"
                className="w-full rounded-xl bg-secondary px-4 py-2.5 text-[15px] focus:outline-none focus:ring-2 focus:ring-ring"
              />
            )}
          </div>
        )}
      </div>

      <div className="fixed bottom-0 left-1/2 w-full max-w-md -translate-x-1/2 px-5 pb-[calc(var(--safe-bottom)+var(--tabbar-height)+12px)] pt-3 bg-gradient-to-t from-background via-background to-transparent">
        <button
          type="button"
          disabled={send.isPending || !canSubmit}
          onClick={() => send.mutate()}
          className="w-full rounded-full bg-warm text-warm-foreground py-3.5 text-[15px] font-bold disabled:opacity-40"
        >
          {send.isPending ? "보내는 중…" : needsTicket ? "티켓으로 보내기" : "바다 위로 보내기"}
        </button>
      </div>
    </main>
  );
}
