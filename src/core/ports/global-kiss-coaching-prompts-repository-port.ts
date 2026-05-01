export interface GlobalKissCoachingPromptsRepositoryPort {
  /** JSON partiel (même forme que l’ancien champ org) ; crée la ligne singleton si absente. */
  getPrompts(): Promise<unknown | null>;
  setPrompts(prompts: unknown | null): Promise<void>;
}
