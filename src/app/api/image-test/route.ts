import { generateImageToBlob } from "@/lib/generate-image";

export async function POST(req: Request) {
  if (process.env.NODE_ENV !== "development") {
    return new Response("Not found", { status: 404 });
  }

  const { prompt, referenceUrls } = await req.json();
  try {
    const result = await generateImageToBlob(prompt, referenceUrls ?? []);
    return Response.json(result);
  } catch (e) {
    return Response.json(
      { error: e instanceof Error ? e.message : "failed" },
      { status: 500 }
    );
  }
}