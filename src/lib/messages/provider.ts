import { ptPT } from "@/i18n/pt-PT";
import { createClaudeProvider } from "./claude-provider";
import type { MessageInput, MessageUsage } from "./rules";

export type WriteOptions = {
  signal?: AbortSignal;
  onUsage?: (usage: MessageUsage) => void | Promise<void>;
};

export type MessageProvider = {
  isSample: boolean;
  write: (input: MessageInput, options?: WriteOptions) => AsyncIterable<string>;
};

const { sample } = ptPT.messages;
const SAMPLE_DELAY_MS = 25;

export function buildSampleMessage({
  companyName,
  reasons,
  senderName,
  tone,
}: MessageInput) {
  const first = reasons[0];
  const reason = first
    ? sample.reasons[first](companyName)
    : sample.noReason(companyName);

  return sample.templates[tone](companyName, reason, senderName);
}

function wait(ms: number, signal?: AbortSignal) {
  return new Promise<void>((resolve) => {
    const timer = setTimeout(resolve, ms);
    signal?.addEventListener(
      "abort",
      () => {
        clearTimeout(timer);
        resolve();
      },
      { once: true },
    );
  });
}

// Escreve aos poucos, como o real, mas o texto é um modelo nosso e não custa nada.
export const sampleMessageProvider: MessageProvider = {
  isSample: true,
  async *write(input, options) {
    for (const piece of buildSampleMessage(input).split(/(?<=\s)/)) {
      if (options?.signal?.aborted) return;
      yield piece;
      await wait(SAMPLE_DELAY_MS, options?.signal);
    }
  },
};

// Basta a variável ANTHROPIC_API_KEY para passar a usar o Claude.
export function getMessageProvider(
  apiKey = process.env.ANTHROPIC_API_KEY,
): MessageProvider {
  return apiKey ? createClaudeProvider(apiKey) : sampleMessageProvider;
}
