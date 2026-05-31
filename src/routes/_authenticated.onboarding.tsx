import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/onboarding")({
  head: () => ({ meta: [{ title: "환영해 — 결" }] }),
  component: OnboardingPage,
});

function OnboardingPage() {
  const navigate = useNavigate();
  const { data } = useQuery({
    queryKey: ["onboarding-questions"],
    queryFn: async () => {
      const { data: userData } = await supabase.auth.getUser();
      const uid = userData.user!.id;
      const { data: answered } = await supabase
        .from("answers")
        .select("question_id")
        .eq("user_id", uid);
      const ids = new Set((answered ?? []).map((a) => a.question_id));
      const { data: qs } = await supabase
        .from("questions")
        .select("id, text, category")
        .eq("is_active", true)
        .order("sort_order")
        .limit(20);
      return {
        answeredCount: ids.size,
        nextQuestions: (qs ?? []).filter((q) => !ids.has(q.id)).slice(0, 5),
      };
    },
  });

  const answeredCount = data?.answeredCount ?? 0;
  const progress = Math.min(answeredCount, 3);

  return (
    <main className="min-h-screen px-6 py-10 pb-32">
      <div className="max-w-sm mx-auto">
        <header className="text-center mb-10">
          <h1 className="font-serif text-4xl tracking-tighter">결</h1>
          <p className="text-sm text-muted-foreground mt-3 text-pretty">
            사진 한 장으로 답하면, <br />
            너의 결이 보여.
          </p>
        </header>

        <div className="mb-8">
          <div className="flex justify-between text-[11px] uppercase tracking-widest text-muted-foreground mb-2">
            <span>너의 첫 결 만들기</span>
            <span>{progress}/3</span>
          </div>
          <div className="h-1 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-foreground transition-all duration-500"
              style={{ width: `${(progress / 3) * 100}%` }}
            />
          </div>
        </div>

        {answeredCount >= 3 ? (
          <div className="text-center">
            <p className="font-serif text-2xl leading-snug mb-2">결이 모이고 있어.</p>
            <p className="text-sm text-muted-foreground mb-8">
              이제 너의 결을 읽어볼 수 있어.
            </p>
            <button
              onClick={async () => {
                const { data: userData } = await supabase.auth.getUser();
                await supabase
                  .from("profiles")
                  .update({ onboarded: true })
                  .eq("id", userData.user!.id);
                navigate({ to: "/me" });
              }}
              className="w-full bg-foreground text-background py-4 rounded-xl text-sm font-medium"
            >
              내 결 보러가기
            </button>
            <Link
              to="/backlog"
              className="block mt-4 text-sm text-muted-foreground underline underline-offset-4"
            >
              더 답하기
            </Link>
          </div>
        ) : (
          <ul className="space-y-3">
            {data?.nextQuestions.map((q) => (
              <li key={q.id}>
                <button
                  onClick={() =>
                    navigate({ to: "/answer/$questionId", params: { questionId: String(q.id) } })
                  }
                  className="w-full text-left p-5 bg-surface border border-border rounded-xl hover:bg-secondary transition-colors"
                >
                  <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
                    {q.category}
                  </span>
                  <p className="font-serif text-lg mt-1 text-balance">{q.text}</p>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}
