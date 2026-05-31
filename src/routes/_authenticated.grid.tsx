import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/grid")({
  head: () => ({ meta: [{ title: "탐색 — 결" }] }),
  component: GridPage,
});

function GridPage() {
  const today = new Date().toISOString().slice(0, 10);
  const { data, isLoading } = useQuery({
    queryKey: ["today-grid", today],
    queryFn: async () => {
      const { data: dq } = await supabase
        .from("daily_questions")
        .select("question_id, questions(id, text)")
        .eq("date", today)
        .maybeSingle();
      if (!dq) return null;
      const { data: answers } = await supabase
        .from("answers")
        .select("id, photo_url, caption, profiles(handle, display_name)")
        .eq("question_id", dq.question_id)
        .eq("visibility", "public")
        .order("created_at", { ascending: false })
        .limit(60);
      return { question: dq.questions as any, answers: answers ?? [] };
    },
  });

  return (
    <main>
      <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-md px-6 py-5 border-b border-border">
        <span className="text-[11px] uppercase tracking-widest text-muted-foreground">
          오늘의 그리드
        </span>
        <h2 className="font-serif text-xl mt-1 leading-snug">
          {data?.question?.text ?? "..."}
        </h2>
      </header>

      <section className="px-6 py-6">
        {isLoading ? (
          <div className="grid grid-cols-2 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="aspect-[3/4] bg-muted rounded-xl animate-pulse" />
            ))}
          </div>
        ) : !data || data.answers.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-20">
            아직 아무도 답하지 않았어. 첫 결을 남겨봐.
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {data.answers.map((a: any) => (
              <div key={a.id} className="flex flex-col gap-2">
                <img
                  src={a.photo_url}
                  alt=""
                  className="w-full aspect-[3/4] object-cover rounded-xl border border-border"
                  loading="lazy"
                />
                {a.caption && (
                  <p className="text-[13px] leading-relaxed px-1 text-foreground">{a.caption}</p>
                )}
                <p className="text-[11px] text-muted-foreground px-1">
                  @{a.profiles?.handle ?? "anon"}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
