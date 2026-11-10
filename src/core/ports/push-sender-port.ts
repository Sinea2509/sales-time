export type PushMessage = {
  to: string;
  title: string;
  body: string;
  /** Ce que l'application lit en ouvrant la notification. */
  data: Record<string, string>;
};

export interface PushSenderPort {
  /** Envoie les messages ; rend les jetons que le service dit périmés. */
  send(messages: PushMessage[]): Promise<{ invalidTokens: string[] }>;
}
