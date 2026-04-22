import { headers } from "next/headers";
import { Webhook } from "svix";
import { prisma } from "@/lib/prisma";
import { getEnv } from "@/lib/env";

type ClerkWebhookUserPayload = {
  id: string;
  primary_email_address_id: string | null;
  email_addresses?: Array<{ id: string; email_address: string }>;
};

type ClerkWebhookDeletedPayload = { id: string };

export async function POST(req: Request) {
  const secret = getEnv().CLERK_WEBHOOK_SECRET;
  if (!secret) {
    return new Response("Webhook not configured", { status: 501 });
  }

  const headerPayload = await headers();
  const svixId = headerPayload.get("svix-id");
  const svixTimestamp = headerPayload.get("svix-timestamp");
  const svixSignature = headerPayload.get("svix-signature");

  if (!svixId || !svixTimestamp || !svixSignature) {
    return new Response("Missing svix headers", { status: 400 });
  }

  const body = await req.text();
  const wh = new Webhook(secret);

  let evt: {
    type: string;
    data: ClerkWebhookUserPayload | ClerkWebhookDeletedPayload;
  };
  try {
    evt = wh.verify(body, {
      "svix-id": svixId,
      "svix-timestamp": svixTimestamp,
      "svix-signature": svixSignature,
    }) as {
      type: string;
      data: ClerkWebhookUserPayload | ClerkWebhookDeletedPayload;
    };
  } catch {
    return new Response("Invalid signature", { status: 400 });
  }

  if (evt.type === "user.created" || evt.type === "user.updated") {
    const u = evt.data as ClerkWebhookUserPayload;
    const primaryEmail =
      u.email_addresses?.find((e) => e.id === u.primary_email_address_id)
        ?.email_address ??
      u.email_addresses?.[0]?.email_address ??
      null;

    await prisma.user.upsert({
      where: { clerkUserId: u.id },
      create: {
        clerkUserId: u.id,
        email: primaryEmail,
      },
      update: {
        email: primaryEmail ?? undefined,
      },
    });
  }

  if (evt.type === "user.deleted") {
    const { id } = evt.data as ClerkWebhookDeletedPayload;
    if (id) {
      await prisma.user.deleteMany({ where: { clerkUserId: id } });
    }
  }

  return new Response("ok", { status: 200 });
}
