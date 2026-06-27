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
          {
            company: {
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

  async findUniqueByCompanyName(input: {
    organizationId: string;
    companyName: string;
  }): Promise<ContactSearchHit | null> {
    const company = input.companyName.trim();
    if (!company) return null;

    const rows = await this.db.person.findMany({
      where: {
        organizationId: input.organizationId,
        company: { equals: company, mode: "insensitive" },
      },
      select: { id: true, displayName: true, company: true },
      take: 2,
    });
    if (rows.length !== 1) return null;
    return rows[0]!;
  }

  async findProspectCompanyAliasByPersonId(input: {
    organizationId: string;
  }): Promise<Map<string, { displayName: string; company: string | null }>> {
    const withCompany = await this.db.person.findMany({
      where: {
        organizationId: input.organizationId,
        company: { not: null },
      },
      select: { id: true, displayName: true, company: true },
    });

    const canonicalByCompanyKey = new Map<
      string,
      { id: string; displayName: string; company: string | null } | "ambiguous"
    >();
    for (const person of withCompany) {
      const company = person.company?.trim();
      if (!company) continue;
      const key = normalizePersonDisplayKey(company);
      if (!key) continue;
      const existing = canonicalByCompanyKey.get(key);
      if (!existing) {
        canonicalByCompanyKey.set(key, {
          id: person.id,
          displayName: person.displayName,
          company: person.company,
        });
      } else if (existing !== "ambiguous") {
        canonicalByCompanyKey.set(key, "ambiguous");
      }
    }

    const allPersons = await this.db.person.findMany({
      where: { organizationId: input.organizationId },
      select: { id: true, displayName: true },
    });

    const aliases = new Map<
      string,
      { displayName: string; company: string | null }
    >();
    for (const person of allPersons) {
      const key = normalizePersonDisplayKey(person.displayName);
      if (!key) continue;
      const canonical = canonicalByCompanyKey.get(key);
      if (!canonical || canonical === "ambiguous" || canonical.id === person.id) {
        continue;
      }
      aliases.set(person.id, {
        displayName: canonical.displayName,
        company: canonical.company,
      });
    }
    return aliases;
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

  async deleteByIdForOrg(input: {
    id: string;
    organizationId: string;
  }): Promise<"deleted" | "not_found" | "has_meetings"> {
    const existing = await this.db.person.findFirst({
      where: { id: input.id, organizationId: input.organizationId },
      select: { id: true },
    });
    if (!existing) return "not_found";

    const linkedMeetings = await this.db.meeting.count({
      where: {
        personId: input.id,
        organizationId: input.organizationId,
      },
    });
    if (linkedMeetings > 0) return "has_meetings";

    await this.db.person.delete({ where: { id: input.id } });
    return "deleted";
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
