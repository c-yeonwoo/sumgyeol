import { useCallback, useState } from "react";
import Cropper, { type Area } from "react-easy-crop";

async function cropToBlob(imageSrc: string, area: Area): Promise<Blob> {
  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = imageSrc;
  });
  const canvas = document.createElement("canvas");
  const size = Math.min(area.width, area.height);
  // Output square ≈ 1080 for profile quality
  const out = 1080;
  canvas.width = out;
  canvas.height = out;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("canvas unavailable");
  ctx.drawImage(image, area.x, area.y, size, size, 0, 0, out, out);
  return new Promise((resolve, reject) => {
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("crop failed"))), "image/jpeg", 0.92);
  });
}

/** Full-screen 1:1 crop. Returns a File on confirm. */
export function ImageCropModal({
  src,
  onCancel,
  onDone,
}: {
  src: string;
  onCancel: () => void;
  onDone: (file: File) => void;
}) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [area, setArea] = useState<Area | null>(null);
  const [busy, setBusy] = useState(false);

  const onCropComplete = useCallback((_: Area, pixels: Area) => {
    setArea(pixels);
  }, []);

  const confirm = async () => {
    if (!area) return;
    setBusy(true);
    try {
      const blob = await cropToBlob(src, area);
      const file = new File([blob], `crop-${Date.now()}.jpg`, { type: "image/jpeg" });
      onDone(file);
    } catch {
      onCancel();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fl-crop">
      <div className="fl-crop-stage">
        <Cropper
          image={src}
          crop={crop}
          zoom={zoom}
          aspect={1}
          onCropChange={setCrop}
          onZoomChange={setZoom}
          onCropComplete={onCropComplete}
          objectFit="contain"
        />
      </div>
      <div className="fl-crop-bar">
        <label className="fl-crop-zoom">
          <span>확대</span>
          <input
            type="range"
            min={1}
            max={3}
            step={0.02}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
          />
        </label>
        <div className="fl-crop-actions">
          <button type="button" className="ghost" onClick={onCancel} disabled={busy}>
            취소
          </button>
          <button type="button" className="ok" onClick={confirm} disabled={busy || !area}>
            {busy ? "자르는 중…" : "이 부분으로"}
          </button>
        </div>
      </div>
    </div>
  );
}
