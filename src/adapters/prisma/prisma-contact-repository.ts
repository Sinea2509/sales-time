import type { PrismaClient } from "@/lib/generated/prisma/client";
import { normalizePersonDisplayKey } from "@/src/core/domain/person-normalize";
import type {
  ContactCreateInput,
  ContactRepositoryPort,
  ContactSearchHit,
  ContactSummaryRow,
  ContactUpdatePatch,
} from "@/src/core/ports/contact-repository-port";

function mapSummary(row: {
  id: string;
  displayName: string;
  company: string | null;
  email: string | null;
  phone: string | null;
  jobTitle: string | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}): ContactSummaryRow {
  return {
    id: row.id,
    displayName: row.displayName,
    company: row.company,
    email: row.email,
    phone: row.phone,
    jobTitle: row.jobTitle,
    notes: row.notes,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export class PrismaContactRepository implements ContactRepositoryPort {
  constructor(private readonly db: PrismaClient) {}

  async searchByPrefix(input: {
    organizationId: string;
    prefix: string;
    limit: number;
  }): Promise<ContactSearchHit[]> {
    const q = input.prefix.trim();
    if (!q) return [];

    const normalized = normalizePersonDisplayKey(q);
    const rows = await this.db.person.findMany({
      where: {
        organizationId: input.organizationId,
        OR: [
          {
            displayName: {
              contains: q,
              mode: "insensitive",
            },
          },
          ...(normalized.length > 0
            ? [
                {
                  normalizedKey: {
                    startsWith: normalized,
                  },
                },
              ]
            : []),
        ],
      },
      take: input.limit,
      orderBy: { displayName: "asc" },
      select: { id: true, displayName: true, company: true },
    });
    return rows;
  }

  async findById(input: {
    id: string;
    organizationId: string;
  }): Promise<ContactSummaryRow | null> {
    const row = await this.db.person.findFirst({
      where: { id: input.id, organizationId: input.organizationId },
    });
    return row ? mapSummary(row) : null;
  }

  async create(input: ContactCreateInput): Promise<ContactSummaryRow> {
    const displayName = input.displayName.trim();
    const normalizedKey = normalizePersonDisplayKey(displayName);
    const row = await this.db.person.create({
      data: {
        organizationId: input.organizationId,
        displayName,
        normalizedKey,
        company: input.company?.trim() || null,
        email: input.email?.trim().toLowerCase() || null,
        phone: input.phone?.trim() || null,
        jobTitle: input.jobTitle?.trim() || null,
        notes: input.notes?.trim() || null,
      },
    });
    return mapSummary(row);
  }

  async update(input: {
    id: string;
    organizationId: string;
    patch: ContactUpdatePatch;
  }): Promise<ContactSummaryRow | null> {
    const existing = await this.db.person.findFirst({
      where: { id: input.id, organizationId: input.organizationId },
    });
    if (!existing) return null;

    const nextDisplay =
      input.patch.displayName !== undefined
        ? input.patch.displayName.trim()
        : existing.displayName;
    const normalizedKey = normalizePersonDisplayKey(nextDisplay);

    try {
      const row = await this.db.person.update({
        where: { id: input.id },
        data: {
          displayName: nextDisplay,
          normalizedKey,
          ...(input.patch.company !== undefined
            ? { company: input.patch.company?.trim() || null }
            : {}),
          ...(input.patch.email !== undefined
            ? { email: input.patch.email?.trim().toLowerCase() || null }
            : {}),
          ...(input.patch.phone !== undefined
            ? { phone: input.patch.phone?.trim() || null }
            : {}),
          ...(input.patch.jobTitle !== undefined
            ? { jobTitle: input.patch.jobTitle?.trim() || null }
            : {}),
          ...(input.patch.notes !== undefined
            ? { notes: input.patch.notes?.trim() || null }
            : {}),
        },
      });
      return mapSummary(row);
    } catch (e: unknown) {
      if (
        typeof e === "object" &&
        e !== null &&
        "code" in e &&
        (e as { code?: string }).code === "P2002"
      ) {
        return null;
      }
      throw e;
    }
  }

  async listForOrg(input: {
    organizationId: string;
    search?: string;
    limit: number;
    offset: number;
  }): Promise<ContactSummaryRow[]> {
    const s = input.search?.trim();
    const rows = await this.db.person.findMany({
      where: {
        organizationId: input.organizationId,
        ...(s
          ? {
              OR: [
                {
                  displayName: { contains: s, mode: "insensitive" },
                },
                {
                  company: { contains: s, mode: "insensitive" },
                },
                {
                  email: { contains: s, mode: "insensitive" },
                },
              ],
            }
          : {}),
      },
      orderBy: { displayName: "asc" },
      take: input.limit,
      skip: input.offset,
    });
    return rows.map(mapSummary);
  }
}
