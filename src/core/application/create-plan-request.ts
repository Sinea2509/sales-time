import type { PlanRequestRepositoryPort } from "@/src/core/ports/plan-request-repository-port";
import { sendTransactionalEmail } from "@/lib/email/mailer";

export async function createPlanRequest(
  deps: { planRequests: PlanRequestRepositoryPort },
  input: {
    organizationId: string;
    requestedById: string | null;
    desiredPlan: string | null;
    message: string | null;
    requesterEmail: string;
  },
) {
  const row = await deps.planRequests.create({
    organizationId: input.organizationId,
    requestedById: input.requestedById,
    desiredPlan: input.desiredPlan,
    message: input.message,
  });

  const adminEmail = process.env.SUPERADMIN_EMAILS?.split(",")[0]?.trim();
  if (adminEmail) {
    await sendTransactionalEmail({
      to: adminEmail,
      subject: "Sales Time — nouvelle demande d'upgrade",
      html: `<p>Organisation : ${row.organizationName}</p><p>Plan : ${row.desiredPlan ?? "—"}</p><p>${row.message ?? ""}</p>`,
    }).catch(() => undefined);
  }

  await sendTransactionalEmail({
    to: input.requesterEmail,
    subject: "Sales Time — demande d'upgrade reçue",
    html: `<p>Nous avons bien reçu votre demande. Notre équipe vous recontactera sous peu.</p>`,
  }).catch(() => undefined);

  return row;
}
