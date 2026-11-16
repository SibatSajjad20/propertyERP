import path from "node:path";
import { Font } from "@react-pdf/renderer";

let registered = false;

export function registerPdfFonts() {
  if (registered) return;
  const regular = path.join(
    process.cwd(),
    "src/features/documents/pdf/fonts/Geist-Regular.ttf",
  );
  Font.register({
    family: "Geist",
    fonts: [
      { src: regular, fontWeight: 400 },
      { src: regular, fontWeight: 700 },
    ],
  });
  registered = true;
}
