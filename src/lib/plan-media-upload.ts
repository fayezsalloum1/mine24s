import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";

const IMAGE_DIR = path.join(process.cwd(), "public", "uploads", "plans");
const VIDEO_DIR = path.join(process.cwd(), "public", "uploads", "videos");

const IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
const VIDEO_TYPES = new Set(["video/mp4", "video/webm"]);

const IMAGE_EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

const VIDEO_EXT: Record<string, string> = {
  "video/mp4": "mp4",
  "video/webm": "webm",
};

async function saveFile(file: File, dir: string, publicPrefix: string, maxBytes: number) {
  const buffer = Buffer.from(await file.arrayBuffer());
  if (buffer.length > maxBytes) {
    throw new Error(`File must be ${Math.round(maxBytes / (1024 * 1024))} MB or smaller`);
  }

  const extMap = dir.includes("videos") ? VIDEO_EXT : IMAGE_EXT;
  const ext = extMap[file.type] ?? "bin";
  const filename = `${Date.now()}-${randomUUID().slice(0, 8)}.${ext}`;

  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, filename), buffer);
  return { url: `${publicPrefix}/${filename}`, storedAsDataUrl: false };
}

export async function savePlanImage(file: File) {
  if (!IMAGE_TYPES.has(file.type)) {
    throw new Error("Only JPEG, PNG, WebP, and GIF images are allowed");
  }
  return saveFile(file, IMAGE_DIR, "/uploads/plans", 2 * 1024 * 1024);
}

export async function savePlanVideo(file: File) {
  if (!VIDEO_TYPES.has(file.type)) {
    throw new Error("Only MP4 and WebM videos are allowed");
  }
  return saveFile(file, VIDEO_DIR, "/uploads/videos", 20 * 1024 * 1024);
}
