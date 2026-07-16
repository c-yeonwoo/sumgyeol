-- ---------------------------------------------------------------------------
-- Mission presets v2 — "사람이 보이는" 70 / 가볍게 30
--
-- The initial seed (~20) was too shallow ("오늘 기분 한 단어로?"). Design
-- direction: a mission should quietly reveal how someone thinks / their vibe —
-- ~70% personality-revealing prompts (short thoughtful answers, no chips), ~30%
-- light taste questions (chips as a starting point). Answers lean to a sentence
-- or two, not a single word.
--
-- FK-safe: existing presets are deactivated (not deleted, since missions may
-- reference them), then the new set is inserted as active. fetchPresets() only
-- reads is_active = true.
-- ---------------------------------------------------------------------------

UPDATE public.mission_presets SET is_active = false WHERE is_active = true;

INSERT INTO public.mission_presets (kind, body, chips, tags, is_active, sort_order) VALUES
  -- 70% — 사람이 드러나는 질문 (자유 서술)
  ('question', '요즘 마음이 가장 편해지는 순간은 언제예요?', '{}', ARRAY['comfort','vibe'], true, 10),
  ('question', '사람의 어떤 점을 볼 때 마음이 기울어요?', '{}', ARRAY['values','vibe'], true, 20),
  ('question', '최근 사소하지만 오래 기억에 남은 장면 하나.', '{}', ARRAY['memory'], true, 30),
  ('question', '혼자인 시간, 보통 뭘 하며 채워요?', '{}', ARRAY['daily','vibe'], true, 40),
  ('question', '무례하진 않지만 절대 못 참는 것 하나.', '{}', ARRAY['values'], true, 50),
  ('question', '어떤 하루를 보내면 “오늘 좋았다”고 느껴요?', '{}', ARRAY['vibe','daily'], true, 60),
  ('question', '나를 설명하는 단어 세 개를 고른다면?', '{}', ARRAY['vibe'], true, 70),
  ('question', '관계에서 가장 중요하게 여기는 건 뭐예요?', '{}', ARRAY['values'], true, 80),
  ('question', '스트레스를 푸는 나만의 방법은?', '{}', ARRAY['comfort','daily'], true, 90),
  ('question', '어릴 때랑 지금, 안 변한 나의 모습 하나.', '{}', ARRAY['memory','vibe'], true, 100),
  ('question', '좋아하는 걸 얘기할 때 유독 말이 많아지는 주제는?', '{}', ARRAY['taste','vibe'], true, 110),
  ('question', '어떤 사람 곁에 있을 때 가장 나다워져요?', '{}', ARRAY['values','vibe'], true, 120),
  ('question', '하루 중 가장 좋아하는 시간대와 그 이유.', '{}', ARRAY['daily','vibe'], true, 130),
  ('question', '최근에 마음이 말랑해졌던 순간이 있어요?', '{}', ARRAY['comfort','memory'], true, 140),
  ('question', '요즘 새로 시작했거나 배우고 있는 게 있어요?', '{}', ARRAY['daily','hobby'], true, 150),
  ('question', '마음이 복잡할 때 찾게 되는 장소는?', '{}', ARRAY['comfort'], true, 160),
  ('question', '사람을 만날 때 첫인상에서 뭘 가장 많이 봐요?', '{}', ARRAY['values'], true, 170),
  ('question', '내가 생각하는 “다정함”은 어떤 모습이에요?', '{}', ARRAY['values','vibe'], true, 180),
  ('question', '올해 나에게 생긴 가장 큰 변화.', '{}', ARRAY['memory'], true, 190),
  ('question', '어떤 대화를 나눌 때 시간 가는 줄 몰라요?', '{}', ARRAY['vibe','taste'], true, 200),
  ('question', '요즘 빠져 있는 것 하나와 그 이유.', '{}', ARRAY['taste','hobby'], true, 210),
  ('question', '오래 곁에 두고 싶은 사람은 어떤 사람이에요?', '{}', ARRAY['values'], true, 220),
  ('question', '위로가 필요할 때 나에게 힘이 되는 것.', '{}', ARRAY['comfort'], true, 230),
  ('question', '요즘 가장 아끼는 물건과 그 사연.', '{}', ARRAY['memory','daily'], true, 240),
  ('question', '여행지에서 나는 어떤 사람이에요?', '{}', ARRAY['taste','vibe'], true, 250),
  ('question', '최근에 웃겼던 일 하나만 풀어 주세요.', '{}', ARRAY['memory'], true, 260),
  ('question', '요즘 가장 자주 하는 생각은?', '{}', ARRAY['vibe'], true, 270),
  ('question', '“이건 좀 나답다” 싶은 습관 하나.', '{}', ARRAY['vibe','daily'], true, 280),
  ('question', '고맙다고 말하고 싶은데 아직 못 한 게 있어요?', '{}', ARRAY['comfort','memory'], true, 290),
  ('question', '어떤 순간에 “살아있다”는 기분이 들어요?', '{}', ARRAY['vibe'], true, 300),

  -- 30% — 가볍게 던지는 질문 (칩으로 시작)
  ('question', '여행이면 계획파 vs 즉흥파?', ARRAY['계획파','즉흥파','반반'], ARRAY['taste'], true, 400),
  ('question', '지금 제일 땡기는 음료 한 잔?', ARRAY['커피','차','탄산','물'], ARRAY['food'], true, 410),
  ('question', '비 오는 날의 기본값은?', ARRAY['잠','영화','산책','요리'], ARRAY['mood'], true, 420),
  ('question', '주말에 더 끌리는 쪽은?', ARRAY['집콕','바깥','친구','혼자'], ARRAY['daily'], true, 430),
  ('question', '휴가 간다면 바다 vs 산?', ARRAY['바다','산','도시','온천'], ARRAY['taste'], true, 440),
  ('question', '노래 들을 때 손이 가는 쪽?', ARRAY['잔잔','신나는','발라드','힙합'], ARRAY['taste'], true, 450),
  ('question', '매운 음식 어디까지 가능해요?', ARRAY['순한맛','중간','매운맛','불닭'], ARRAY['food'], true, 460),
  ('question', '아침형 vs 저녁형?', ARRAY['아침형','저녁형','그때그때'], ARRAY['daily'], true, 470),
  ('question', '나는 집순이 vs 밖순이?', ARRAY['집순이','밖순이','반반'], ARRAY['daily'], true, 480),
  ('question', '강아지 vs 고양이?', ARRAY['강아지','고양이','둘다','글쎄'], ARRAY['taste'], true, 490),
  ('question', '집에서 시켜 먹는다면?', ARRAY['치킨','피자','떡볶이','한식'], ARRAY['food'], true, 500),
  ('action_text', '지금 눈앞에 보이는 것 중 가장 마음에 드는 것 하나 자랑해 주세요.', '{}', ARRAY['tiny_dare','daily'], true, 510);
