export type PlanRequestStatus =
  | "NEW"
  | "CONTACTED"
  | "CONVERTED"
  | "DISMISSED";

export type PlanRequestRow = {
  id: string;
  organizationId: string;
  organizationName: string;
  requestedById: string | null;
  requesterEmail: string | null;
  desiredPlan: string | null;
  message: string | null;
  status: PlanRequestStatus;
  handledAt: Date | null;
  createdAt: Date;
};

export interface PlanRequestRepositoryPort {
  create(input: {
    organizationId: string;
    requestedById: string | null;
    desiredPlan: string | null;
    message: string | null;
  }): Promise<PlanRequestRow>;

  listByStatus(
    status: PlanRequestStatus | null,
    limit?: number,
  ): Promise<PlanRequestRow[]>;

  findById(id: string): Promise<PlanRequestRow | null>;

  updateStatus(input: {
    id: string;
    status: PlanRequestStatus;
  }): Promise<boolean>;
}
