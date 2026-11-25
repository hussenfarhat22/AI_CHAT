import { parseFile } from "@/lib/parse-file";

export async function POST(req: Request) {
  if (process.env.NODE_ENV !== "development") {
    return new Response("Not found", { status: 404 });
  }

  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) {
    return Response.json({ error: "No file" }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  try {
    const parsed = await parseFile(buffer, file.name);
    return Response.json({
      kind: parsed.kind,
      characters: parsed.text.length,
      notes: parsed.notes,
      preview: parsed.text.slice(0, 600),
    });
  } catch (e) {
    return Response.json(
      { error: e instanceof Error ? e.message : "failed" },
      { status: 500 }
    );
  }
}