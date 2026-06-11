import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads", "plans");
const MAX_SIZE_BYTES = 2 * 1024 * 1024;

const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

const EXT_BY_TYPE: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

export async function savePlanImage(file: File) {
  if (!ALLOWED_TYPES.has(file.type)) {
    throw new Error("Only JPEG, PNG, WebP, and GIF images are allowed");
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  if (buffer.length > MAX_SIZE_BYTES) {
    throw new Error("Image must be 2 MB or smaller");
  }

  const ext = EXT_BY_TYPE[file.type] ?? "png";
  const filename = `${Date.now()}-${randomUUID().slice(0, 8)}.${ext}`;

  try {
    await mkdir(UPLOAD_DIR, { recursive: true });
    await writeFile(path.join(UPLOAD_DIR, filename), buffer);
    return { url: `/uploads/plans/${filename}`, storedAsDataUrl: false };
  } catch {
    const base64 = buffer.toString("base64");
    return {
      url: `data:${file.type};base64,${base64}`,
      storedAsDataUrl: true,
    };
  }
}
