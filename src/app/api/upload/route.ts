import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextResponse } from "next/server";
import { DOC_ALLOWED_CONTENT_TYPES, IMAGE_TYPES } from "@/lib/files";

export async function POST(request: Request): Promise<NextResponse> {
  const body = (await request.json()) as HandleUploadBody;

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async () => {
        return {
          allowedContentTypes: [...IMAGE_TYPES, ...DOC_ALLOWED_CONTENT_TYPES],
          maximumSizeInBytes: 10 * 1024 * 1024,
          addRandomSuffix: true,
        };
      },
    });
    return NextResponse.json(jsonResponse);
  } catch (error) {
    console.error("[upload] error:", error);
    return NextResponse.json({ error: "Upload not allowed." }, { status: 400 });
  }
}