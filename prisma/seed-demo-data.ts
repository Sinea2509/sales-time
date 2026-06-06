import type { PrismaClient } from "../lib/generated/prisma/client";
import type {
  AnalysisKind,
  MeetingOutcome,
  OrganizationMembershipRole,
  UserProfileRole,
} from "../lib/generated/prisma/client";
import { hashPassword } from "../lib/auth/password";
import { normalizePersonDisplayKey } from "../src/core/domain/person-normalize";

export type DemoPromptVersionIds = {
  soncas: string;
  disc: string;
  kiss: string;
};

const DEMO_ORG_SLUG = "acme-demo";
const DEMO_ORG_NAME = "Acme Solutions";
const DEMO_PASSWORD_DEFAULT = "DemoOrg2026!";

type DemoUserSpec = {
  email: string;
  firstName: string;
  lastName: string;
  role: OrganizationMembershipRole;
  profileRole: UserProfileRole;
};

const DEMO_USERS: DemoUserSpec[] = [
  {
    email: "manager@acme-demo.local",
    firstName: "Marie",
    lastName: "Dubois",
    role: "ADMIN",
    profileRole: "SALES_MANAGER",
  },
  {
    email: "sophie.martin@acme-demo.local",
    firstName: "Sophie",
    lastName: "Martin",
    role: "MEMBER",
    profileRole: "COMMERCIAL",
  },
  {
    email: "lucas.bernard@acme-demo.local",
    firstName: "Lucas",
    lastName: "Bernard",
    role: "MEMBER",
    profileRole: "COMMERCIAL",
  },
  {
    email: "emma.leroy@acme-demo.local",
    firstName: "Emma",
    lastName: "Leroy",
    role: "MEMBER",
    profileRole: "COMMERCIAL",
  },
];

type DemoContactSpec = {
  displayName: string;
  company: string;
  email: string;
  jobTitle: string;
};

const DEMO_CONTACTS: DemoContactSpec[] = [
  {
    displayName: "Antoine Lambert",
    company: "TechFlow SAS",
    email: "antoine.lambert@techflow.fr",
    jobTitle: "Directeur achats",
  },
  {
    displayName: "Jennifer Moreau",
    company: "Nova Industrie",
    email: "j.moreau@nova-industrie.fr",
    jobTitle: "CEO",
  },
  {
    displayName: "Michael Chen",
    company: "DataPulse",
    email: "m.chen@datapulse.io",
    jobTitle: "CTO",
  },
  {
    displayName: "David Rousseau",
    company: "Finance & Co",
    email: "d.rousseau@finance-co.fr",
    jobTitle: "CFO",
  },
  {
    displayName: "Camille Petit",
    company: "GreenLog",
    email: "camille.petit@greenlog.fr",
    jobTitle: "Responsable supply",
  },
  {
    displayName: "Thomas Girard",
    company: "MediaSphere",
    email: "thomas.girard@mediasphere.com",
    jobTitle: "VP Sales",
  },
  {
    displayName: "Sarah Benali",
    company: "CloudNine",
    email: "s.benali@cloudnine.fr",
    jobTitle: "Head of Ops",
  },
  {
    displayName: "Julien Faure",
    company: "BuildSmart",
    email: "julien.faure@buildsmart.fr",
    jobTitle: "Directeur technique",
  },
  {
    displayName: "Élise Durand",
    company: "RetailMax",
    email: "elise.durand@retailmax.fr",
    jobTitle: "Directrice marketing",
  },
  {
    displayName: "Nicolas Blanc",
    company: "LogiPro",
    email: "n.blanc@logipro.fr",
    jobTitle: "DAF",
  },
];

type DemoMeetingSpec = {
  contactIndex: number;
  sellerEmail: string;
  daysAgo: number;
  durationMin: number;
  potentialAmount: number;
  outcome: MeetingOutcome;
  meetingType: string;
  pipelineStage: string;
  soncasAvg: number;
  disc: { D: number; I: number; S: number; C: number };
  kissScore: number;
};

const DEMO_MEETINGS: DemoMeetingSpec[] = [
  {
    contactIndex: 0,
    sellerEmail: "sophie.martin@acme-demo.local",
    daysAgo: 3,
    durationMin: 45,
    potentialAmount: 15000,
    outcome: "FOLLOW_UP",
    meetingType: "Découverte",
    pipelineStage: "Qualification",
    soncasAvg: 75,
    disc: { D: 55, I: 70, S: 60, C: 65 },
    kissScore: 7,
  },
  {
    contactIndex: 1,
    sellerEmail: "lucas.bernard@acme-demo.local",
    daysAgo: 5,
    durationMin: 60,
    potentialAmount: 42000,
    outcome: "WON",
    meetingType: "Proposition",
    pipelineStage: "Négociation",
    soncasAvg: 82,
    disc: { D: 72, I: 68, S: 45, C: 58 },
    kissScore: 8,
  },
  {
    contactIndex: 2,
    sellerEmail: "emma.leroy@acme-demo.local",
    daysAgo: 8,
    durationMin: 50,
    potentialAmount: 28000,
    outcome: "FOLLOW_UP",
    meetingType: "Démo technique",
    pipelineStage: "Découverte",
    soncasAvg: 68,
    disc: { D: 40, I: 55, S: 70, C: 80 },
    kissScore: 6,
  },
  {
    contactIndex: 3,
    sellerEmail: "sophie.martin@acme-demo.local",
    daysAgo: 12,
    durationMin: 40,
    potentialAmount: 35000,
    outcome: "OTHER",
    meetingType: "Qualification",
    pipelineStage: "Qualification",
    soncasAvg: 71,
    disc: { D: 48, I: 52, S: 65, C: 78 },
    kissScore: 7,
  },
  {
    contactIndex: 4,
    sellerEmail: "lucas.bernard@acme-demo.local",
    daysAgo: 15,
    durationMin: 35,
    potentialAmount: 12000,
    outcome: "FOLLOW_UP",
    meetingType: "Découverte",
    pipelineStage: "Qualification",
    soncasAvg: 64,
    disc: { D: 35, I: 60, S: 75, C: 50 },
    kissScore: 6,
  },
  {
    contactIndex: 5,
    sellerEmail: "emma.leroy@acme-demo.local",
    daysAgo: 18,
    durationMin: 55,
    potentialAmount: 22000,
    outcome: "LOST",
    meetingType: "Proposition",
    pipelineStage: "Négociation",
    soncasAvg: 58,
    disc: { D: 65, I: 45, S: 40, C: 55 },
    kissScore: 5,
  },
  {
    contactIndex: 6,
    sellerEmail: "sophie.martin@acme-demo.local",
    daysAgo: 22,
    durationMin: 30,
    potentialAmount: 18000,
    outcome: "FOLLOW_UP",
    meetingType: "Suivi",
    pipelineStage: "Découverte",
    soncasAvg: 77,
    disc: { D: 50, I: 72, S: 68, C: 42 },
    kissScore: 8,
  },
  {
    contactIndex: 7,
    sellerEmail: "lucas.bernard@acme-demo.local",
    daysAgo: 28,
    durationMin: 48,
    potentialAmount: 31000,
    outcome: "WON",
    meetingType: "Closing",
    pipelineStage: "Signature",
    soncasAvg: 88,
    disc: { D: 60, I: 58, S: 52, C: 70 },
    kissScore: 9,
  },
  {
    contactIndex: 8,
    sellerEmail: "emma.leroy@acme-demo.local",
    daysAgo: 35,
    durationMin: 42,
    potentialAmount: 9500,
    outcome: "OTHER",
    meetingType: "Qualification",
    pipelineStage: "Qualification",
    soncasAvg: 62,
    disc: { D: 38, I: 78, S: 62, C: 48 },
    kissScore: 6,
  },
  {
    contactIndex: 9,
    sellerEmail: "sophie.martin@acme-demo.local",
    daysAgo: 40,
    durationMin: 38,
    potentialAmount: 27000,
    outcome: "FOLLOW_UP",
    meetingType: "Démo",
    pipelineStage: "Découverte",
    soncasAvg: 73,
    disc: { D: 45, I: 65, S: 58, C: 72 },
    kissScore: 7,
  },
  {
    contactIndex: 0,
    sellerEmail: "lucas.bernard@acme-demo.local",
    daysAgo: 45,
    durationMin: 25,
    potentialAmount: 15000,
    outcome: "NO_SHOW",
    meetingType: "Suivi",
    pipelineStage: "Qualification",
    soncasAvg: 0,
    disc: { D: 50, I: 50, S: 50, C: 50 },
    kissScore: 4,
  },
  {
    contactIndex: 1,
    sellerEmail: "emma.leroy@acme-demo.local",
    daysAgo: 52,
    durationMin: 52,
    potentialAmount: 42000,
    outcome: "FOLLOW_UP",
    meetingType: "Proposition",
    pipelineStage: "Négociation",
    soncasAvg: 79,
    disc: { D: 68, I: 62, S: 48, C: 66 },
    kissScore: 8,
  },
  {
    contactIndex: 2,
    sellerEmail: "manager@acme-demo.local",
    daysAgo: 60,
    durationMin: 65,
    potentialAmount: 28000,
    outcome: "WON",
    meetingType: "Closing",
    pipelineStage: "Signature",
    soncasAvg: 91,
    disc: { D: 55, I: 50, S: 72, C: 85 },
    kissScore: 9,
  },
  {
    contactIndex: 3,
    sellerEmail: "sophie.martin@acme-demo.local",
    daysAgo: 68,
    durationMin: 44,
    potentialAmount: 35000,
    outcome: "FOLLOW_UP",
    meetingType: "Démo financière",
    pipelineStage: "Découverte",
    soncasAvg: 70,
    disc: { D: 42, I: 48, S: 68, C: 82 },
    kissScore: 7,
  },
  {
    contactIndex: 4,
    sellerEmail: "lucas.bernard@acme-demo.local",
    daysAgo: 75,
    durationMin: 36,
    potentialAmount: 12000,
    outcome: "OTHER",
    meetingType: "Qualification",
    pipelineStage: "Qualification",
    soncasAvg: 66,
    disc: { D: 32, I: 70, S: 78, C: 44 },
    kissScore: 6,
  },
  {
    contactIndex: 0,
    sellerEmail: "emma.leroy@acme-demo.local",
    daysAgo: 100,
    durationMin: 40,
    potentialAmount: 18000,
    outcome: "FOLLOW_UP",
    meetingType: "Relance",
    pipelineStage: "Qualification",
    soncasAvg: 68,
    disc: { D: 48, I: 62, S: 70, C: 55 },
    kissScore: 6,
  },
  {
    contactIndex: 1,
    sellerEmail: "sophie.martin@acme-demo.local",
    daysAgo: 120,
    durationMin: 50,
    potentialAmount: 28000,
    outcome: "FOLLOW_UP",
    meetingType: "Découverte",
    pipelineStage: "Découverte",
    soncasAvg: 72,
    disc: { D: 60, I: 65, S: 58, C: 62 },
    kissScore: 7,
  },
  {
    contactIndex: 2,
    sellerEmail: "lucas.bernard@acme-demo.local",
    daysAgo: 140,
    durationMin: 35,
    potentialAmount: 9000,
    outcome: "LOST",
    meetingType: "Closing",
    pipelineStage: "Négociation",
    soncasAvg: 58,
    disc: { D: 70, I: 40, S: 50, C: 75 },
    kissScore: 5,
  },
  {
    contactIndex: 3,
    sellerEmail: "manager@acme-demo.local",
    daysAgo: 160,
    durationMin: 55,
    potentialAmount: 52000,
    outcome: "WON",
    meetingType: "Signature",
    pipelineStage: "Closing",
    soncasAvg: 80,
    disc: { D: 65, I: 72, S: 48, C: 60 },
    kissScore: 8,
  },
];

function driverScore(avg: number, offset: number): number {
  if (avg <= 0) return 50;
  return Math.min(100, Math.max(0, Math.round(avg + offset)));
}

function buildSoncasResult(
  avg: number,
  dominant:
    | "securite"
    | "orgueil"
    | "nouveaute"
    | "confort"
    | "argent"
    | "sympathie",
) {
  const { drivers } = soncasDrivers(avg);
  return {
    drivers,
    dominant,
    summary:
      "Analyse SONCAS générée par le seed — profil prospect cohérent pour les tableaux de bord.",
  };
}

function soncasDrivers(avg: number) {
  return {
    drivers: {
      securite: { score: driverScore(avg, -8), evidence: ["Conformité RGPD évoquée"] },
      orgueil: { score: driverScore(avg, 4), evidence: ["Image de marque importante"] },
      nouveaute: { score: driverScore(avg, -2), evidence: ["Intérêt pour l’innovation"] },
      confort: { score: driverScore(avg, -5), evidence: ["Process existant à préserver"] },
      argent: { score: driverScore(avg, 6), evidence: ["ROI discuté en détail"] },
      sympathie: { score: driverScore(avg, 2), evidence: ["Bonne relation établie"] },
    },
  };
}

function dominantSoncas(avg: number): "argent" | "sympathie" | "securite" {
  if (avg >= 80) return "argent";
  if (avg >= 65) return "sympathie";
  return "securite";
}

function buildDiscResult(scores: DemoMeetingSpec["disc"]) {
  const entries = Object.entries(scores) as Array<["D" | "I" | "S" | "C", number]>;
  const dominant = entries.reduce((best, cur) =>
    cur[1] > best[1] ? cur : best,
  )[0];
  return {
    scores,
    dominant,
    evidence: ["Ton adapté au profil DISC observé pendant l’échange."],
    summary: "Profil DISC seed — utile pour le radar et les matrices.",
  };
}

function buildKissResult(score: number) {
  return {
    keep: [
      "Bonne écoute active et reformulation des enjeux business.",
      "Questions ouvertes pour faire parler le prospect.",
    ],
    improve: [
      "Fournir des données concrètes dès le départ — certifications et ROI prêts.",
      "Structurer l’appel avec un ordre du jour clair pour chaque partie prenante.",
    ],
    stop: ["Enchaîner les arguments sans valider la compréhension."],
    start: [
      "Envoyer un suivi personnalisé sous 24 h avec réponses aux questions précises.",
      "Préparer des supports adaptés par interlocuteur (CTO, CEO, CFO).",
    ],
    goldenQuestion: "Qu’est-ce qui vous ferait dire oui d’ici la fin du trimestre ?",
    coachingScore: score,
    coachingScoreJustification: "Score seed aligné sur la qualité perçue du rendez-vous.",
    summary:
      "Synthèse KISS seed — alimente les cartes Progrès et Axes d’amélioration.",
  };
}

async function ensureDemoUser(
  prisma: PrismaClient,
  spec: DemoUserSpec,
  organizationId: string,
  password: string,
) {
  let user = await prisma.user.findUnique({ where: { email: spec.email } });
  if (!user) {
    user = await prisma.user.create({
      data: {
        email: spec.email,
        passwordHash: await hashPassword(password),
        firstName: spec.firstName,
        lastName: spec.lastName,
        profileRole: spec.profileRole,
        registerProfileCompletedAt: new Date(),
        signupWebsiteNormalized: "acme-demo.test",
      },
    });
  } else {
    user = await prisma.user.update({
      where: { id: user.id },
      data: {
        firstName: spec.firstName,
        lastName: spec.lastName,
        profileRole: spec.profileRole,
        registerProfileCompletedAt: user.registerProfileCompletedAt ?? new Date(),
      },
    });
  }

  if (
    process.env.SEED_DEMO_RESET_PASSWORD === "1" &&
    (process.env.NODE_ENV !== "production" ||
      process.env.ALLOW_DANGEROUS_PROD_SEED === "1")
  ) {
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: await hashPassword(password) },
    });
  }

  await prisma.organizationMembership.upsert({
    where: {
      userId_organizationId: {
        userId: user.id,
        organizationId,
      },
    },
    create: {
      userId: user.id,
      organizationId,
      role: spec.role,
    },
    update: { role: spec.role },
  });

  await prisma.onboardingProfile.upsert({
    where: { userId: user.id },
    create: {
      userId: user.id,
      companyName: DEMO_ORG_NAME,
      industrySector: "SaaS B2B",
      commercialTeamSize: "3-5",
      completedAt: new Date(),
      currentStep: 4,
    },
    update: {
      companyName: DEMO_ORG_NAME,
      completedAt: new Date(),
      currentStep: 4,
    },
  });

  return user;
}

async function clearDemoTransactionalData(
  prisma: PrismaClient,
  organizationId: string,
) {
  const meetings = await prisma.meeting.findMany({
    where: { organizationId },
    select: { id: true },
  });
  const meetingIds = meetings.map((m) => m.id);
  if (meetingIds.length > 0) {
    await prisma.meetingAnalysis.deleteMany({
      where: { meetingId: { in: meetingIds } },
    });
    await prisma.meeting.deleteMany({ where: { organizationId } });
  }
  await prisma.person.deleteMany({ where: { organizationId } });
}

export async function ensureDemoTenant(
  prisma: PrismaClient,
  promptVersions: DemoPromptVersionIds,
) {
  const orgSlug =
    process.env.SEED_DEMO_ORG_SLUG?.trim().toLowerCase() ?? DEMO_ORG_SLUG;
  const orgName = process.env.SEED_DEMO_ORG_NAME?.trim() ?? DEMO_ORG_NAME;
  const password =
    process.env.SEED_DEMO_PASSWORD?.trim() ?? DEMO_PASSWORD_DEFAULT;

  const org = await prisma.organization.upsert({
    where: { slug: orgSlug },
    create: { slug: orgSlug, name: orgName, websiteNormalized: "acme-demo.test" },
    update: { name: orgName },
  });

  await prisma.organizationSettings.upsert({
    where: { organizationId: org.id },
    create: {
      organizationId: org.id,
      companyName: orgName,
      industrySector: "SaaS B2B",
      commercialTeamSize: "3-5",
      averageSalesCycle: "2-3 mois",
      averageDealSize: "15-40 k€",
      companyPitch:
        "Acme Solutions aide les équipes commerciales B2B à qualifier et closer plus vite.",
      tamObjectiveMinutesPerMonth: 240,
    },
    update: {
      companyName: orgName,
      industrySector: "SaaS B2B",
      commercialTeamSize: "3-5",
    },
  });

  const usersByEmail = new Map<string, { id: string }>();
  for (const spec of DEMO_USERS) {
    const user = await ensureDemoUser(prisma, spec, org.id, password);
    usersByEmail.set(spec.email, user);
  }

  const existingMeetings = await prisma.meeting.count({
    where: { organizationId: org.id },
  });
  const shouldReset = process.env.SEED_DEMO_RESET === "1";
  if (existingMeetings > 0 && !shouldReset) {
    console.log(
      `Demo org already has ${existingMeetings} meetings — skip (set SEED_DEMO_RESET=1 to reseed).`,
    );
    printDemoCredentials(org, password);
    return;
  }

  if (shouldReset || existingMeetings > 0) {
    await clearDemoTransactionalData(prisma, org.id);
    console.log("Cleared demo meetings, analyses, and contacts.");
  }

  const personIds: string[] = [];
  for (const contact of DEMO_CONTACTS) {
    const normalizedKey = normalizePersonDisplayKey(contact.displayName);
    const person = await prisma.person.upsert({
      where: {
        organizationId_normalizedKey: {
          organizationId: org.id,
          normalizedKey,
        },
      },
      create: {
        organizationId: org.id,
        displayName: contact.displayName,
        normalizedKey,
        company: contact.company,
        email: contact.email,
        jobTitle: contact.jobTitle,
      },
      update: {
        company: contact.company,
        email: contact.email,
        jobTitle: contact.jobTitle,
      },
    });
    personIds.push(person.id);
  }

  const now = Date.now();
  const msPerDay = 86_400_000;

  for (const spec of DEMO_MEETINGS) {
    const seller = usersByEmail.get(spec.sellerEmail);
    if (!seller) continue;

    const contact = DEMO_CONTACTS[spec.contactIndex];
    const personId = personIds[spec.contactIndex];
    const meetingAt = new Date(now - spec.daysAgo * msPerDay);

    const meeting = await prisma.meeting.create({
      data: {
        organizationId: org.id,
        sellerUserId: seller.id,
        personId,
        prospectName: contact.displayName,
        meetingAt,
        durationMin: spec.durationMin,
        meetingType: spec.meetingType,
        pipelineStage: spec.pipelineStage,
        potentialAmount: spec.potentialAmount,
        transcript:
          `[seed] Transcript synthétique — RDV avec ${contact.displayName} (${contact.company}). ` +
          "Discussion sur les enjeux, le budget et les prochaines étapes.",
        notes: "[seed] Compte-rendu généré pour données de démo.",
        outcome: spec.outcome,
      },
    });

    if (spec.soncasAvg > 0) {
      await createAnalysis(prisma, meeting.id, "SONCAS", promptVersions.soncas, {
        result: buildSoncasResult(spec.soncasAvg, dominantSoncas(spec.soncasAvg)),
        model: "seed/soncas",
      });
      await createAnalysis(prisma, meeting.id, "DISC", promptVersions.disc, {
        result: buildDiscResult(spec.disc),
        model: "seed/disc",
      });
      await createAnalysis(prisma, meeting.id, "KISS", promptVersions.kiss, {
        result: buildKissResult(spec.kissScore),
        model: "seed/kiss",
      });
    }
  }

  console.log(
    `Seeded demo org: ${personIds.length} contacts, ${DEMO_MEETINGS.length} meetings with analyses.`,
  );
  printDemoCredentials(org, password);
}

function printDemoCredentials(
  org: { id: string; slug: string; name: string },
  password: string,
) {
  console.log(
    [
      "",
      "--- Demo tenant (sign-in with email + password) ---",
      `  Organization: ${org.name} (slug: ${org.slug})`,
      `  Password:     ${password} (all demo users)`,
      "",
      "  Account manager (admin):",
      "    manager@acme-demo.local",
      "",
      "  Sales:",
      "    sophie.martin@acme-demo.local",
      "    lucas.bernard@acme-demo.local",
      "    emma.leroy@acme-demo.local",
      "",
      "  Reseed transactional data: SEED_DEMO_RESET=1 npx prisma db seed",
      "",
    ].join("\n"),
  );
}

async function createAnalysis(
  prisma: PrismaClient,
  meetingId: string,
  kind: AnalysisKind,
  promptVersionId: string,
  payload: { result: object; model: string },
) {
  await prisma.meetingAnalysis.create({
    data: {
      meetingId,
      kind,
      promptVersionId,
      model: payload.model,
      result: payload.result,
    },
  });
}
