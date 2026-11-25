import { extractText, getDocumentProxy } from "unpdf";
import mammoth from "mammoth";
import * as XLSX from "xlsx";
import { TEXT_EXTENSIONS } from "@/lib/files";

export type ParsedFile = {
  kind: string;
  text: string;
  notes: string[];
};



export async function parseFile(
  buffer: Buffer,
  filename: string
): Promise<ParsedFile> {
  const ext = filename.split(".").pop()?.toLowerCase() ?? "";
  const notes: string[] = [];

  if (ext === "pdf") {
    const pdf = await getDocumentProxy(new Uint8Array(buffer));
    const { totalPages, text } = await extractText(pdf, { mergePages: false });
    const pages = text.map(
      (pageText, i) => `--- Page ${i + 1} ---\n${pageText.trim()}`
    );
    const letters = text.join("").replace(/\s/g, "").length;
    if (letters < 50) {
      notes.push(
        "This PDF has almost no text. It may be a scan (pictures of pages), which needs OCR."
      );
    }
    notes.push(`${totalPages} page(s).`);
    return { kind: "pdf", text: pages.join("\n\n"), notes };
  }

  if (ext === "docx") {
    const result = await mammoth.extractRawText({ buffer });
    if (result.value.trim().length === 0) {
      notes.push("No text was found in this Word file.");
    }
    return { kind: "docx", text: result.value, notes };
  }

  if (ext === "xlsx" || ext === "xls") {
    const workbook = XLSX.read(buffer, { type: "buffer" });
    const sheets = workbook.SheetNames.map((name) => {
      const csv = XLSX.utils.sheet_to_csv(workbook.Sheets[name]);
      return `--- Sheet: ${name} ---\n${csv.trim()}`;
    });
    notes.push(`${workbook.SheetNames.length} sheet(s).`);
    return { kind: "xlsx", text: sheets.join("\n\n"), notes };
  }

    if (TEXT_EXTENSIONS.includes(ext)) {
    return { kind: "text", text: buffer.toString("utf-8"), notes };
  }

  throw new Error(`Unsupported file type: .${ext}`);
}