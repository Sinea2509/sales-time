import {
  FOLLOW_UP_GRID_LIVE_SINCE,
  requeueUnscoredFollowUpMeetings,
} from "./requeue-unscored-follow-up-meetings";

type Candidate = {
  id: string;
  organizationId: string;
  meetingType: string | null;
  pipelineStage: string | null;
};

function makeDeps(candidates: Candidate[]) {
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
        listUnscoredMeetingsNotQueuedSince: list,
        enqueueMeetingAnalysis: enqueue,
      },
      meetings: {
        updateMeetingStatus: setStatus,
        updateMeetingVisitReportDraft: clearReport,
      },
    } as never,
  };
}

function meeting(id: string, meetingType: string): Candidate {
  return { id, organizationId: "org", meetingType, pipelineStage: null };
}

describe("requeueUnscoredFollowUpMeetings", () => {
  it("remet en file une démo restée sans score, après les nouveaux rendez-vous", async () => {
    const { deps, enqueue, setStatus, clearReport, list } = makeDeps([
      meeting("m1", "Démo"),
    ]);
    expect(await requeueUnscoredFollowUpMeetings(deps, { limit: 5 })).toBe(1);
    expect(list).toHaveBeenCalledWith(
      expect.objectContaining({ notQueuedSince: FOLLOW_UP_GRID_LIVE_SINCE }),
    );
    expect(enqueue).toHaveBeenCalledWith({
      organizationId: "org",
      meetingId: "m1",
      priority: -1,
    });
    expect(setStatus).toHaveBeenCalledWith(
      expect.objectContaining({ id: "m1", status: "PROCESSING" }),
    );
    expect(clearReport).toHaveBeenCalledWith(
      expect.objectContaining({ id: "m1", visitReportDraft: null }),
    );
  });

  it("laisse les types que la grille de suivi ne note pas", async () => {
    const { deps, enqueue } = makeDeps([
      meeting("d1", "Découverte"),
      meeting("c1", "Comité de pilotage"),
    ]);
    expect(await requeueUnscoredFollowUpMeetings(deps, { limit: 5 })).toBe(0);
    expect(enqueue).not.toHaveBeenCalled();
  });

  it("s'arrête à la limite de chaque passage", async () => {
    const { deps, enqueue } = makeDeps([
      meeting("p1", "Proposition"),
      meeting("p2", "Négociation"),
      meeting("p3", "Démo"),
    ]);
    expect(await requeueUnscoredFollowUpMeetings(deps, { limit: 2 })).toBe(2);
    expect(enqueue).toHaveBeenCalledTimes(2);
  });
});
