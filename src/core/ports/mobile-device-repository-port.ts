/** Les téléphones où l'application mobile est connectée, par utilisateur. */
export interface MobileDeviceRepositoryPort {
  /** Enregistre le téléphone, ou le rattache à cet utilisateur s'il change de compte. */
  register(input: {
    userId: string;
    expoPushToken: string;
    platform: string;
  }): Promise<void>;

  listPushTokensForUser(userId: string): Promise<string[]>;

  /** Supprime le jeton de cet utilisateur seulement ; rend vrai s'il existait. */
  unregister(input: {
    userId: string;
    expoPushToken: string;
  }): Promise<boolean>;

  /** Les jetons qu'Expo dit périmés (application désinstallée, par exemple). */
  deleteTokens(tokens: string[]): Promise<void>;
}
