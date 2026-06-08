import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/me/report")({
  head: () => ({ meta: [{ title: "결 리포트 — 숨결" }] }),
  component: ReportPage,
});

type Row = { id: number; created_at: string; questions: { category: string | null } | null };

function startOfWeekKST(d = new Date()) {
  // 월요일 기준 한국 시간 주 시작. 단순화: 현지 시간 기준 월요일 00:00.
  const date = new Date(d);
  const day = (date.getDay() + 6) % 7; // Mon=0
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() - day);
  return date;
}

function ReportPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["my-report"],
    queryFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      const uid = u.user!.id;
      const { data: rows } = await supabase
        .from("answers")
        .select("id, created_at, questions(category)")
        .eq("user_id", uid)
        .order("created_at", { ascending: false });
      return (rows ?? []) as unknown as Row[];
    },
  });

  const answers = data ?? [];
  const total = answers.length;
  const weekStart = startOfWeekKST();
  const weekAnswers = answers.filter((r) => new Date(r.created_at) >= weekStart);

  // 카테고리 빈도
  const catCount = new Map<string, number>();
  for (const a of answers) {
    const c = a.questions?.category ?? "기타";
    catCount.set(c, (catCount.get(c) ?? 0) + 1);
  }
  const topCats = Array.from(catCount.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);

  // 연속일 streak
  const dayKeys = new Set(
    answers.map((a) => {
      const d = new Date(a.created_at);
      d.setHours(0, 0, 0, 0);
      return d.getTime();
    }),
  );
  let streak = 0;
  {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    for (let i = 0; i < 366; i++) {
      const k = today.getTime() - i * 86400000;
      if (dayKeys.has(k)) streak++;
      else if (i === 0) {
        // 오늘 없어도 어제부터 이어졌는지 계속 확인 (그러나 streak는 0에서 시작)
        continue;
      } else break;
    }
  }

  // 100숨까지 진행도
  const milestone = total >= 100 ? 1000 : 100;
  const milestonePct = Math.min(100, Math.round((total / milestone) * 100));

  return (
    <main className="h-full overflow-y-auto pb-10">
      <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-md px-6 py-4 border-b border-border flex items-center justify-between">
        <Link to="/me" className="text-sm text-muted-foreground">← 내 결</Link>
        <h1 className="font-serif text-lg">결 리포트</h1>
        <span className="w-10" />
      </header>

      {isLoading ? (
        <div className="px-6 py-10 text-sm text-muted-foreground">읽는 중…</div>
      ) : total === 0 ? (
        <div className="px-6 py-16 text-center text-sm text-muted-foreground">
          아직 모인 숨이 없어요.{" "}
          <Link to="/home" className="underline underline-offset-4">첫 숨 남기기</Link>
        </div>
      ) : (
        <div className="px-6 py-6 space-y-4">
          {/* 이번 주 */}
          <Card eyebrow="이번 주">
            <div className="flex items-baseline gap-2">
              <span className="font-serif text-4xl">{weekAnswers.length}</span>
              <span className="text-sm text-muted-foreground">번의 숨</span>
            </div>
            <p className="mt-2 text-[13px] text-muted-foreground leading-relaxed break-keep">
              {weekAnswers.length === 0
                ? "이번 주는 아직 비어 있어요. 가볍게 한 호흡 어때요?"
                : weekAnswers.length >= 5
                  ? "결이 짙어지는 한 주예요."
                  : "이번 주의 결이 천천히 그려지고 있어요."}
            </p>
          </Card>

          {/* 연속일 */}
          <Card eyebrow="연속">
            <div className="flex items-baseline gap-2">
              <span className="font-serif text-4xl">{streak}</span>
              <span className="text-sm text-muted-foreground">일째 호흡 중</span>
            </div>
          </Card>

          {/* 카테고리 */}
          <Card eyebrow="자주 머무는 결">
            {topCats.length === 0 ? (
              <p className="text-sm text-muted-foreground">아직 무늬가 없어요.</p>
            ) : (
              <ul className="mt-1 space-y-2">
                {topCats.map(([cat, n]) => {
                  const pct = Math.round((n / total) * 100);
                  return (
                    <li key={cat}>
                      <div className="flex justify-between text-[13px]">
                        <span className="text-foreground">{cat}</span>
                        <span className="text-muted-foreground">{n}숨 · {pct}%</span>
                      </div>
                      <div className="mt-1 h-1 rounded-full bg-border overflow-hidden">
                        <div
                          className="h-full bg-foreground"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>

          {/* 누적 milestone */}
          <Card eyebrow={total >= 100 ? "다음 결까지" : "100숨까지"}>
            <div className="flex items-baseline gap-2">
              <span className="font-serif text-4xl">{total}</span>
              <span className="text-sm text-muted-foreground">/ {milestone}</span>
            </div>
            <div className="mt-3 h-1 rounded-full bg-border overflow-hidden">
              <div
                className="h-full bg-foreground transition-[width] duration-700"
                style={{ width: `${milestonePct}%` }}
              />
            </div>
            <p className="mt-3 text-[13px] text-muted-foreground leading-relaxed break-keep">
              {total >= 100
                ? "100숨을 지나, 결이 깊어지는 자리에 와 있어요."
                : `${milestone - total}번의 숨을 더하면 결의 풍경이 바뀌어요.`}
            </p>
          </Card>
        </div>
      )}
    </main>
  );
}

function Card({ eyebrow, children }: { eyebrow: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-border bg-surface px-5 py-4">
      <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
        {eyebrow}
      </span>
      <div className="mt-2">{children}</div>
    </section>
  );
}
