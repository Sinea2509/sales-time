/**
 * Seeds default analysis prompts and a SUPER_ADMIN user (defaults below).
 * Also ensures a fake org + member user for local / QA testing (see `ensureTestTenant`).
 *
 *   DATABASE_URL=... npx prisma db seed
 *
 * Override with `SEED_SUPER_ADMIN_EMAIL` / `SEED_SUPER_ADMIN_PASSWORD`.
 * To reset the password for an existing seed user (dev/staging only):
 *   SEED_SUPER_ADMIN_RESET_PASSWORD=1 npx prisma db seed
 *
 * Test tenant (optional env): `SEED_TEST_USER_EMAIL`, `SEED_TEST_USER_PASSWORD`,
 * `SEED_TEST_ORG_SLUG`, `SEED_TEST_ORG_NAME`, `SEED_TEST_USER_RESET_PASSWORD=1`.
 *
 * Production refuses to run unless `ALLOW_DANGEROUS_PROD_SEED=1`.
 */
import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient } from "../lib/generated/prisma/client";
import { DEFAULT_DISC_MARKDOWN, DEFAULT_KISS_MARKDOWN, DEFAULT_SONCAS_MARKDOWN, } from "../lib/default-analysis-prompts";
import { hashPassword } from "../lib/auth/password";
if (process.env.NODE_ENV === "production" &&
    process.env.ALLOW_DANGEROUS_PROD_SEED !== "1") {
    console.error("Refusing to run prisma seed in production without ALLOW_DANGEROUS_PROD_SEED=1 (prevents accidental SUPER_ADMIN grants).");
    process.exit(1);
}
const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
    console.error("DATABASE_URL is required.");
    process.exit(1);
}
const prisma = new PrismaClient({
    adapter: new PrismaNeon({ connectionString: databaseUrl }),
});
async function ensurePromptTemplates(authorUserId) {
    const seeds = [
        { kind: "SONCAS", markdown: DEFAULT_SONCAS_MARKDOWN },
        { kind: "DISC", markdown: DEFAULT_DISC_MARKDOWN },
        { kind: "KISS", markdown: DEFAULT_KISS_MARKDOWN },
    ];
    for (const { kind, markdown } of seeds) {
        const template = await prisma.promptTemplate.upsert({
            where: { kind },
            create: { kind },
            update: {},
        });
        if (template.currentVersionId)
            continue;
        const version = await prisma.promptTemplateVersion.create({
            data: {
                templateId: template.id,
                version: 1,
                markdown,
                authorUserId,
            },
        });
        await prisma.promptTemplate.update({
            where: { id: template.id },
            data: { currentVersionId: version.id },
        });
        console.log(`Seeded default ${kind} prompt template (v1).`);
    }
}
async function main() {
    var _a, _b, _c, _d;
    const email = (_b = (_a = process.env.SEED_SUPER_ADMIN_EMAIL) === null || _a === void 0 ? void 0 : _a.trim().toLowerCase()) !== null && _b !== void 0 ? _b : "stephane@mytradeshow.ai";
    const password = (_d = (_c = process.env.SEED_SUPER_ADMIN_PASSWORD) === null || _c === void 0 ? void 0 : _c.trim()) !== null && _d !== void 0 ? _d : "MyTradeshow2026!SuperAdmin";
    let user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
        user = await prisma.user.create({
            data: {
                email,
                passwordHash: await hashPassword(password),
            },
        });
        console.log(`Created seed user ${email} (change password after first login).`);
    }
    else if (process.env.SEED_SUPER_ADMIN_RESET_PASSWORD === "1" &&
        (process.env.NODE_ENV !== "production" ||
            process.env.ALLOW_DANGEROUS_PROD_SEED === "1")) {
        await prisma.user.update({
            where: { id: user.id },
            data: { passwordHash: await hashPassword(password) },
        });
        console.log(`Updated password for existing user ${email} (SEED_SUPER_ADMIN_RESET_PASSWORD=1).`);
    }
    await prisma.systemRole.upsert({
        where: {
            userId_role: { userId: user.id, role: "SUPER_ADMIN" },
        },
        create: { userId: user.id, role: "SUPER_ADMIN" },
        update: {},
    });
    await ensurePromptTemplates(user.id);
    console.log(`Super admin role ensured for user ${user.id} (${email}).`);
    await ensureTestTenant();
}
const DEFAULT_TEST_USER_EMAIL = "test.user@fake-org.local";
const DEFAULT_TEST_USER_PASSWORD = "FakeOrgTest2026!";
const DEFAULT_TEST_ORG_SLUG = "fake-test-org";
const DEFAULT_TEST_ORG_NAME = "Fake Test Organization";
async function ensureTestTenant() {
    var _a, _b, _c, _d, _e, _f, _g, _h;
    const testEmail = (_b = (_a = process.env.SEED_TEST_USER_EMAIL) === null || _a === void 0 ? void 0 : _a.trim().toLowerCase()) !== null && _b !== void 0 ? _b : DEFAULT_TEST_USER_EMAIL;
    const testPassword = (_d = (_c = process.env.SEED_TEST_USER_PASSWORD) === null || _c === void 0 ? void 0 : _c.trim()) !== null && _d !== void 0 ? _d : DEFAULT_TEST_USER_PASSWORD;
    const orgSlug = (_f = (_e = process.env.SEED_TEST_ORG_SLUG) === null || _e === void 0 ? void 0 : _e.trim().toLowerCase()) !== null && _f !== void 0 ? _f : DEFAULT_TEST_ORG_SLUG;
    const orgName = (_h = (_g = process.env.SEED_TEST_ORG_NAME) === null || _g === void 0 ? void 0 : _g.trim()) !== null && _h !== void 0 ? _h : DEFAULT_TEST_ORG_NAME;
    const org = await prisma.organization.upsert({
        where: { slug: orgSlug },
        create: {
            slug: orgSlug,
            name: orgName,
        },
        update: { name: orgName },
    });
    await prisma.organizationSettings.upsert({
        where: { organizationId: org.id },
        create: {
            organizationId: org.id,
            companyName: orgName,
        },
        update: {
            companyName: orgName,
        },
    });
    let testUser = await prisma.user.findUnique({ where: { email: testEmail } });
    if (!testUser) {
        testUser = await prisma.user.create({
            data: {
                email: testEmail,
                passwordHash: await hashPassword(testPassword),
                firstName: "Test",
                lastName: "User",
                signupWebsiteNormalized: "fake-org.test",
            },
        });
        console.log(`Created seed test user ${testEmail}.`);
    }
    else if (process.env.SEED_TEST_USER_RESET_PASSWORD === "1" &&
        (process.env.NODE_ENV !== "production" ||
            process.env.ALLOW_DANGEROUS_PROD_SEED === "1")) {
        await prisma.user.update({
            where: { id: testUser.id },
            data: { passwordHash: await hashPassword(testPassword) },
        });
        console.log(`Updated password for test user ${testEmail} (SEED_TEST_USER_RESET_PASSWORD=1).`);
    }
    await prisma.organizationMembership.upsert({
        where: {
            userId_organizationId: {
                userId: testUser.id,
                organizationId: org.id,
            },
        },
        create: {
            userId: testUser.id,
            organizationId: org.id,
            role: "ADMIN",
        },
        update: { role: "ADMIN" },
    });
    console.log([
        "",
        "--- Test tenant (sign-in with email + password) ---",
        `  Email:        ${testEmail}`,
        `  Password:     ${testPassword}`,
        `  Organization: ${org.name} (slug: ${org.slug}, id: ${org.id})`,
        "",
    ].join("\n"));
}
main()
    .catch((e) => {
    console.error(e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
