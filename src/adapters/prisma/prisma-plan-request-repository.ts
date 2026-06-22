import type { PrismaClient } from "@/lib/generated/prisma/client";
import type {
  PlanRequestRepositoryPort,
  PlanRequestRow,
} from "@/src/core/ports/plan-request-repository-port";

export class PrismaPlanRequestRepository implements PlanRequestRepositoryPort {
  constructor(private readonly db: PrismaClient) {}

  private async mapRow(id: string): Promise<PlanRequestRow | null> {
    const row = await this.db.planRequest.findUnique({
      where: { id },
      include: {
        organization: { select: { name: true } },
        requestedBy: { select: { email: true } },
      },
    });
    if (!row) return null;
    return {
      id: row.id,
      organizationId: row.organizationId,
      organizationName: row.organization.name,
      requestedById: row.requestedById,
      requesterEmail: row.requestedBy?.email ?? null,
      desiredPlan: row.desiredPlan,
      message: row.message,
      status: row.status,
      handledAt: row.handledAt,
      createdAt: row.createdAt,
    };
  }

  async create(input: {
    organizationId: string;
    requestedById: string | null;
    desiredPlan: string | null;
    message: string | null;
  }): Promise<PlanRequestRow> {
    const row = await this.db.planRequest.create({
      data: {
        organizationId: input.organizationId,
        requestedById: input.requestedById,
        desiredPlan: input.desiredPlan,
        message: input.message,
      },
    });
    return (await this.mapRow(row.id))!;
  }

  async listByStatus(
    status: PlanRequestRow["status"] | null,
    limit = 100,
  ): Promise<PlanRequestRow[]> {
    const rows = await this.db.planRequest.findMany({
      where: status ? { status } : undefined,
      orderBy: { createdAt: "desc" },
      take: limit,
      include: {
        organization: { select: { name: true } },
        requestedBy: { select: { email: true } },
      },
    });
    return rows.map((row) => ({
      id: row.id,
      organizationId: row.organizationId,
      organizationName: row.organization.name,
      requestedById: row.requestedById,
      requesterEmail: row.requestedBy?.email ?? null,
      desiredPlan: row.desiredPlan,
      message: row.message,
      status: row.status,
      handledAt: row.handledAt,
      createdAt: row.createdAt,
    }));
  }

  async findById(id: string): Promise<PlanRequestRow | null> {
    return this.mapRow(id);
  }

  async updateStatus(input: {
    id: string;
    status: PlanRequestRow["status"];
  }): Promise<boolean> {
    try {
      await this.db.planRequest.update({
        where: { id: input.id },
        data: {
          status: input.status,
          handledAt: input.status === "NEW" ? null : new Date(),
        },
      });
      return true;
    } catch {
      return false;
    }
  }
}
