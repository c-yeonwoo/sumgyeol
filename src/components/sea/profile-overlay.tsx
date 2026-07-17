import { useEffect, useState } from "react";
import { StorageImg } from "@/components/storage-img";
import { parseIntroSections } from "@/lib/intro-story";

export type ProfileCardData = {
  name: string;
  age: string;
  region: string;
  meta?: string;
  photos?: (string | null | undefined)[];
  photo?: string | null;
  intro: string;
  idealLine?: string;
  tags: string[];
};

function photoList(data: ProfileCardData): string[] {
  const fromArr = (data.photos ?? []).filter((p): p is string => !!p);
  if (fromArr.length) return fromArr;
  return data.photo ? [data.photo] : [];
}

/** Story-style unlock card — chapters + photos interleaved (Palette-lite). */
export function ProfileOverlay({
  data,
  cta,
  onBack,
}: {
  data: ProfileCardData | null;
  cta?: { label: string; onClick: () => void; busy?: boolean } | null;
  onBack: () => void;
}) {
  const [shown, setShown] = useState<ProfileCardData | null>(data);
  const [on, setOn] = useState(false);

  useEffect(() => {
    if (data) {
      setShown(data);
      const r = requestAnimationFrame(() => setOn(true));
      return () => cancelAnimationFrame(r);
    }
    setOn(false);
    const t = setTimeout(() => setShown(null), 360);
    return () => clearTimeout(t);
  }, [data]);

  const photos = shown ? photoList(shown) : [];
  const chapters = shown ? parseIntroSections(shown.intro) : [];
  const hero = photos[0] ?? null;
  const restPhotos = photos.slice(1);

  return (
    <div className={"fl-ppage" + (on ? " on" : "")}>
      <button className="fl-pp-back" onClick={onBack} aria-label="뒤로">←</button>
      {shown && (
        <>
          <div className="fl-pp-hero">
            {hero ? <StorageImg src={hero} alt="" /> : null}
            <div className="grad" />
            <div className="nm">
              <b>{shown.age ? `${shown.name} · ${shown.age}` : shown.name}</b>
              {(shown.region || shown.meta) && (
                <span>{[shown.region, shown.meta].filter(Boolean).join(" · ")}</span>
              )}
            </div>
          </div>

          <div className="fl-pp-body">
            {chapters.length > 0 && (
              <>
                <span className="fl-pp-ai">✨ AI가 정리한 이야기</span>
                {chapters.map((ch, i) => (
                  <div key={i}>
                    <div className="fl-pp-chapter">
                      {ch.heading && <h4>{ch.heading}</h4>}
                      <p>{ch.body}</p>
                    </div>
                    {restPhotos[i] && (
                      <div className="fl-pp-bleed">
                        <StorageImg src={restPhotos[i]} alt="" />
                      </div>
                    )}
                  </div>
                ))}
                {/* leftover photos after chapters */}
                {restPhotos.slice(chapters.length).map((src, i) => (
                  <div key={`p-${i}`} className="fl-pp-bleed">
                    <StorageImg src={src} alt="" />
                  </div>
                ))}
              </>
            )}

            {shown.tags.length > 0 && (
              <div className="fl-pp-card">
                <h5>관심사</h5>
                <div className="fl-pp-tags">
                  {shown.tags.map((t) => (
                    <span key={t} className="fl-pp-tag">{t}</span>
                  ))}
                </div>
              </div>
            )}

            {shown.idealLine?.trim() && (
              <div className="fl-pp-card fl-pp-ideal">
                <h5>이런 사람에게 끌려요</h5>
                <p>{shown.idealLine}</p>
              </div>
            )}
          </div>

          {cta && (
            <div className="fl-pp-cta-wrap">
              <button className="fl-pp-cta" disabled={cta.busy} onClick={cta.onClick}>
                {cta.busy ? "여는 중…" : cta.label}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
