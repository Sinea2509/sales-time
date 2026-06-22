import { revalidatePath } from "next/cache";

export function revalidateTeamMemberPerformancePaths(sellerUserId: string) {
  revalidatePath("/company/equipe", "layout");
  revalidatePath(`/company/equipe/${sellerUserId}`);
}
