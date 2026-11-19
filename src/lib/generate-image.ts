import { list, put } from "@vercel/blob";

const IMAGE_MODEL = "google/gemini-3.1-flash-lite-image";

const MAX_PER_HOUR = 1;
const MAX_PER_DAY = 10;
const MAX_TOTAL = 100;

export class ImageLimitError extends Error {}

type ImagesResponse = {
  choices?: {
    message?: {
      images?: { image_url?: { url?: string } }[];
    };
  }[];
};

async function checkLimits(): Promise<void> {
  const { blobs } = await list({ prefix: "generated/" });
  const now = Date.now();
  const age = (b: { uploadedAt: Date | string }) =>
    now - new Date(b.uploadedAt).getTime();

  const lastHour = blobs.filter((b) => age(b) < 60 * 60 * 1000).length;
  const lastDay = blobs.filter((b) => age(b) < 24 * 60 * 60 * 1000).length;

  if (blobs.length >= MAX_TOTAL) {
    throw new ImageLimitError(
      "The image storage limit of this demo has been reached."
    );
  }
  if (lastHour >= MAX_PER_HOUR || lastDay >= MAX_PER_DAY) {
    throw new ImageLimitError(
      "The image generation limit of this demo has been reached. Please try again later."
    );
  }
}

export async function generateImageToBlob(
  prompt: string,
  referenceUrls: string[] = []
): Promise<{ url: string }> {
  await checkLimits();

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