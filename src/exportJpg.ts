import { save } from "@tauri-apps/plugin-dialog";
import { writeFile } from "@tauri-apps/plugin-fs";
import { join, pictureDir } from "@tauri-apps/api/path";
import html2canvas from "html2canvas";
import type { WeekRef } from "./types";

export async function exportScheduleJpg(week: WeekRef): Promise<void> {
  const el = document.getElementById("schedule-sheet");
  if (!el) return;

  // html2canvas measures text with an inline image in the original document.
  // Restore that layout while rendering so Tailwind's reset cannot shift text.
  const exportStyle = document.createElement("style");
  exportStyle.textContent = "img { display: inline-block; }";
  document.head.appendChild(exportStyle);
  let canvas: HTMLCanvasElement;
  try {
    canvas = await html2canvas(el, {
      backgroundColor: "#ffffff",
      scale: 2,
      useCORS: true,
    });
  } finally {
    exportStyle.remove();
  }

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/jpeg", 0.92),
  );
  if (!blob) return;

  const bytes = new Uint8Array(await blob.arrayBuffer());
  const pictures = await pictureDir();
  const fileName = `Lich-Tuan-${week.week}-Thang-${week.month}-${week.year}.jpg`;
  const defaultPath = await join(pictures, fileName);
  const path = await save({
    defaultPath,
    filters: [{ name: "JPEG", extensions: ["jpg"] }],
  });
  if (!path) return;
  await writeFile(path, bytes);
}
