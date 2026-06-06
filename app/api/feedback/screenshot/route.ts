import { NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { getApplicationDeps } from "@/lib/application-deps";

export async function POST(request: Request) {
  const principal = await getApplicationDeps().auth.getAuthenticatedPrincipal();
  if (!principal) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Missing file" }, { status: 400 });
  }

  const token = process.env.BLOB_READ_WRITE_TOKEN?.trim();
  if (!token) {
    return NextResponse.json({ error: "Blob not configured" }, { status: 503 });
  }

  const blob = await put(`feedbacks/${Date.now()}.png`, file, {
    access: "public",
    token,
  });

  return NextResponse.json({ url: blob.url });
}
