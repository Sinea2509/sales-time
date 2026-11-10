import type {
  PushMessage,
  PushSenderPort,
} from "@/src/core/ports/push-sender-port";

const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";
/* Expo accepte au plus cent messages par requête. */
const BATCH = 100;

type ExpoTicket =
  | { status: "ok"; id: string }
  | { status: "error"; message: string; details?: { error?: string } };

/**
 * L'envoi par le service de notifications d'Expo, qui relaie vers Apple et
 * Google. Une panne d'Expo ne doit jamais faire échouer ce qui a déclenché la
 * notification : les erreurs sont avalées, la notification du site reste.
 */
export class ExpoPushSender implements PushSenderPort {
  constructor(
    private readonly fetchImpl: typeof fetch = fetch,
    private readonly accessToken: string | undefined = process.env
      .EXPO_ACCESS_TOKEN,
  ) {}

  async send(messages: PushMessage[]): Promise<{ invalidTokens: string[] }> {
    const invalidTokens: string[] = [];
    for (let i = 0; i < messages.length; i += BATCH) {
      const batch = messages.slice(i, i + BATCH);
      try {
        const res = await this.fetchImpl(EXPO_PUSH_URL, {
          method: "POST",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            ...(this.accessToken
              ? { Authorization: `Bearer ${this.accessToken}` }
              : {}),
          },
          body: JSON.stringify(
            batch.map((m) => ({ ...m, sound: "default", priority: "high" })),
          ),
        });
        if (!res.ok) continue;
        const json = (await res.json()) as { data?: ExpoTicket[] };
        json.data?.forEach((ticket, k) => {
          if (
            ticket.status === "error" &&
            ticket.details?.error === "DeviceNotRegistered"
          ) {
            const token = batch[k]?.to;
            if (token) invalidTokens.push(token);
          }
        });
      } catch {
        /* Le réseau ou Expo : la notification du site reste, rien d'autre. */
      }
    }
    return { invalidTokens };
  }
}
