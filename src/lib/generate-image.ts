import { put } from "@vercel/blob";

const IMAGE_MODEL = "google/gemini-3.1-flash-lite-image";

type ImagesResponse = {
  choices?: {
    message?: {
      images?: { image_url?: { url?: string } }[];
    };
  }[];
};

export async function generateImageToBlob(
  prompt: string,
  referenceUrls: string[] = []
): Promise<{ url: string }> {
  const content = [
    { type: "text", text: prompt },
    ...referenceUrls.map((url) => ({
      type: "image_url",
      image_url: { url },
    })),
  ];

  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: IMAGE_MODEL,
      messages: [{ role: "user", content }],
      modalities: ["image", "text"],
    }),
  });

  if (!res.ok) {
    throw new Error(`Image generation failed (status ${res.status}).`);
  }

  const data = (await res.json()) as ImagesResponse;
  const dataUrl = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;
  if (!dataUrl) throw new Error("The model returned no image.");

  const match = dataUrl.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
  if (!match) throw new Error("Unexpected image format.");

  const [, mediaType, base64] = match;
  const bytes = Buffer.from(base64, "base64");
  const extension = mediaType.split("/")[1];

  const blob = await put(`generated/image.${extension}`, bytes, {
    access: "public",
    contentType: mediaType,
    addRandomSuffix: true,
  });

  return { url: blob.url };
}