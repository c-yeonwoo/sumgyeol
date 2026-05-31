import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/answer/$questionId")({
  head: () => ({ meta: [{ title: "답변 — 결" }] }),
  component: AnswerPage,
});

function AnswerPage() {
  const { questionId } = Route.useParams();
  const navigate = useNavigate();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [caption, setCaption] = useState("");
  const [visibility, setVisibility] = useState<"public" | "private">("public");
  const [submitting, setSubmitting] = useState(false);

  const { data: question } = useQuery({
    queryKey: ["question", questionId],
    queryFn: async () => {
      const { data } = await supabase
        .from("questions")
        .select("id, text, category")
        .eq("id", Number(questionId))
        .maybeSingle();
      return data;
    },
  });

  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 5 * 1024 * 1024) {
      toast.error("5MB 이하 사진으로 골라줘.");
      return;
    }
    if (!["image/jpeg", "image/png", "image/webp"].includes(f.type)) {
      toast.error("jpg, png, webp만 가능해.");
      return;
    }
    setFile(f);
    setPreview(URL.createObjectURL(f));
  };

  const onSubmit = async () => {
    if (!file) return toast.error("사진을 골라줘.");
    if (caption.length > 60) return toast.error("캡션은 60자 이하야.");
    setSubmitting(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      const uid = userData.user!.id;
      const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
      const path = `${uid}/${questionId}-${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("answers")
        .upload(path, file, { upsert: true, contentType: file.type });
      if (upErr) throw upErr;
      const { data: pub } = supabase.storage.from("answers").getPublicUrl(path);
      const { error: insErr } = await supabase.from("answers").upsert(
        {
          user_id: uid,
          question_id: Number(questionId),
          photo_url: pub.publicUrl,
          caption: caption.trim() || null,
          visibility,
        },
        { onConflict: "user_id,question_id" }
      );
      if (insErr) throw insErr;

      // mark onboarded after first answer if not yet
      await supabase
        .from("profiles")
        .update({ onboarded: true })
        .eq("id", uid)
        .eq("onboarded", false);

      toast.success("너의 결이 남았어.");
      navigate({ to: "/me" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "업로드 실패");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen">
      <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-md px-6 py-5 border-b border-border flex items-center justify-between">
        <Link to="/home" className="text-sm text-muted-foreground">← 취소</Link>
        <span className="text-[11px] uppercase tracking-widest text-muted-foreground">답변</span>
        <span className="w-10" />
      </header>

      <section className="px-6 py-8">
        {question && (
          <div className="mb-8">
            <span className="text-[11px] uppercase tracking-widest text-accent">
              {question.category}
            </span>
            <h2 className="font-serif text-3xl mt-2 leading-snug text-balance">{question.text}</h2>
          </div>
        )}

        <label className="block cursor-pointer">
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={onFile}
            className="hidden"
          />
          {preview ? (
            <img
              src={preview}
              alt=""
              className="w-full aspect-square object-cover rounded-2xl border border-border"
            />
          ) : (
            <div className="w-full aspect-square bg-surface border border-border rounded-2xl grid place-items-center">
              <div className="text-center">
                <div className="text-2xl mb-2">＋</div>
                <span className="text-xs uppercase tracking-widest text-muted-foreground">
                  사진 고르기
                </span>
              </div>
            </div>
          )}
        </label>

        <div className="border-b border-border pb-2 mt-6">
          <input
            type="text"
            placeholder="한 줄로 기록하기 (반말, 60자)"
            value={caption}
            onChange={(e) => setCaption(e.target.value.slice(0, 60))}
            className="w-full bg-transparent outline-none py-2 text-lg italic placeholder:text-muted-foreground"
          />
          <span className="text-[10px] text-muted-foreground">{caption.length}/60</span>
        </div>

        <div className="flex gap-2 mt-6">
          <button
            onClick={() => setVisibility("public")}
            className={
              "flex-1 py-2 text-xs rounded-md border transition-colors " +
              (visibility === "public"
                ? "border-foreground bg-foreground text-background"
                : "border-border text-muted-foreground")
            }
          >
            전체공개
          </button>
          <button
            onClick={() => setVisibility("private")}
            className={
              "flex-1 py-2 text-xs rounded-md border transition-colors " +
              (visibility === "private"
                ? "border-foreground bg-foreground text-background"
                : "border-border text-muted-foreground")
            }
          >
            나만 보기
          </button>
        </div>

        <button
          onClick={onSubmit}
          disabled={submitting || !file}
          className="w-full bg-foreground text-background py-4 rounded-xl text-sm font-medium mt-8 disabled:opacity-40"
        >
          {submitting ? "남기는 중..." : "결 남기기"}
        </button>
      </section>
    </main>
  );
}
