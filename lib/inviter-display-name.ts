import type { UserRepositoryPort } from "@/src/core/ports/user-repository-port";

/**
 * « Prénom Nom » de la personne qui invite, pour le mail ; null si inconnu.
 *
 * Ce nom n'est qu'un plus dans le mail : une erreur en le lisant ne doit
 * jamais empêcher l'invitation de partir.
 */
export async function inviterDisplayName(
  users: Partial<Pick<UserRepositoryPort, "findAccountProfileByUserId">>,
  userId: string,
): Promise<string | null> {
  try {
    const profile = await users.findAccountProfileByUserId?.(userId);
    const name = [profile?.firstName, profile?.lastName]
      .map((part) => part?.trim())
      .filter(Boolean)
      .join(" ");
    return name || null;
  } catch {
    return null;
  }
}
