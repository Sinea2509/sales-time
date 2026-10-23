import { requeueMeetingsWithReadableSpeakers } from "./requeue-meetings-with-readable-speakers";

const READABLE = [
  "Paul Martin a commencé la transcription",
  "DURAND, Sophie   0:03Nous avons vingt managers de proximité.",
  "Paul Martin   0:20Comment les accompagnez-vous aujourd'hui ?",
  "DURAND, Sophie   0:35Surtout sur le terrain, au fil de l'eau.",
  "Paul Martin   0:59Qu'est-ce qui coince le plus pour eux ?",
].join("\n");

function makeDeps(
  candidates: Array<{ id: string; organizationId: string; transcript: string }>,
) {
  const enqueue = jest.fn(async () => ({}));
  const setStatus = jest.fn(async () => true);
  const clearReport = jest.fn(async () => true);
  const list = jest.fn(async () => candidates);
  return {
    enqueue,
    setStatus,
    clearReport,
    list,
    deps: {
      analysisJobs: {
        listMeetingsWithUnreadSpeakers: list,
        enqueueMeetingAnalysis: enqueue,
      },
      meetings: {
        updateMeetingStatus: setStatus,
        updateMeetingVisitReportDraft: clearReport,
      },
    } as never,
  };
}

describe("requeueMeetingsWithReadableSpeakers", () => {
  it("remet en file un rendez-vous dont le transcript se lit désormais", async () => {
    const { deps, enqueue, setStatus, clearReport } = makeDeps([
      { id: "m1", organizationId: "org", transcript: READABLE },
    ]);
    expect(await requeueMeetingsWithReadableSpeakers(deps, { limit: 5 })).toBe(
      1,
    );
    expect(enqueue).toHaveBeenCalledWith({
      organizationId: "org",
      meetingId: "m1",
    });
    expect(setStatus).toHaveBeenCalledWith(
      expect.objectContaining({ id: "m1", status: "PROCESSING" }),
    );
    expect(clearReport).toHaveBeenCalledWith(
      expect.objectContaining({ id: "m1", visitReportDraft: null }),
    );
  });

  it("laisse un transcript toujours illisible : rien ne servirait de relancer", async () => {
    const { deps, enqueue } = makeDeps([
      {
        id: "m2",
        organizationId: "org",
        transcript: "Nous avons parlé du budget et des délais, sans plus.",
      },
    ]);
    expect(await requeueMeetingsWithReadableSpeakers(deps, { limit: 5 })).toBe(
      0,
    );
    expect(enqueue).not.toHaveBeenCalled();
  });
});
