CREATE TABLE public.likes (
  user_id uuid NOT NULL,
  answer_id bigint NOT NULL REFERENCES public.answers(id) ON DELETE CASCADE,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, answer_id)
);

CREATE INDEX idx_likes_answer ON public.likes(answer_id);

GRANT SELECT ON public.likes TO anon;
GRANT SELECT, INSERT, DELETE ON public.likes TO authenticated;
GRANT ALL ON public.likes TO service_role;

ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "likes on public answers viewable by everyone"
ON public.likes FOR SELECT
USING (EXISTS (SELECT 1 FROM public.answers a WHERE a.id = likes.answer_id AND a.visibility = 'public'));

CREATE POLICY "users insert own likes"
ON public.likes FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users delete own likes"
ON public.likes FOR DELETE TO authenticated
USING (auth.uid() = user_id);