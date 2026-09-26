import { ensureDemoOrganization } from "./ensure-demo-organization";

function makeDeps() {
  const ensureCurrentVersion = jest
    .fn()
    .mockImplementation(async ({ kind }: { kind: string }) => ({
      id: `v-${kind.toLowerCase()}`,
      version: 1,
      markdown: "",
    }));
  const ensureDemoOrganizationMock = jest.fn().mockResolvedValue({
    organizationId: "org-demo",
    slug: "acme-demo",
    name: "Acme Solutions",
    password: "DemoOrg2026!",
    managerEmail: "manager@acme-demo.local",
    salesEmails: ["sophie.martin@acme-demo.local"],
    memberCount: 4,
    meetingCount: 12,
  });
  const logPlatformAction = jest.fn().mockResolvedValue(undefined);
  return {
    prompts: { ensureCurrentVersion },
    demoTenant: { ensureDemoOrganization: ensureDemoOrganizationMock },
    audit: { logPlatformAction },
  };
}

describe("ensureDemoOrganization", () => {
  it("garantit une version de prompt par famille avant de remplir la démo", async () => {
    const deps = makeDeps();

    const result = await ensureDemoOrganization(deps as never, {
      actorUserId: "u1",
    });

    expect(result.ok).toBe(true);
    expect(
      deps.prompts.ensureCurrentVersion.mock.calls.map((c) => c[0].kind),
    ).toEqual(["SONCAS", "DISC", "KISS"]);
    expect(deps.demoTenant.ensureDemoOrganization).toHaveBeenCalledWith({
      promptVersions: { soncas: "v-soncas", disc: "v-disc", kiss: "v-kiss" },
    });
  });

  /*
    L'action est tracée avec l'identifiant de l'organisation de démo, pas avec
    « system » : le journal d'audit de cette organisation raconte alors qui l'a
    créée, et quand.
  */
  it("journalise la création sur l'organisation de démo", async () => {
    const deps = makeDeps();

    await ensureDemoOrganization(deps as never, { actorUserId: "u1" });

    expect(deps.audit.logPlatformAction).toHaveBeenCalledWith(
      expect.objectContaining({
        actorUserId: "u1",
        organizationId: "org-demo",
        action: "DEMO_ORG_ENSURED",
      }),
    );
  });

  it("rend l'erreur du remplissage sans la laisser remonter", async () => {
    const deps = makeDeps();
    deps.demoTenant.ensureDemoOrganization.mockRejectedValue(
      new Error("base injoignable"),
    );

    const result = await ensureDemoOrganization(deps as never, {
      actorUserId: "u1",
    });

    expect(result).toEqual({
      ok: false,
      error: "FAILED",
      message: "base injoignable",
    });
  });
});
