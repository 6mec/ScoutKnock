// Lê uma linha JSON de cada vez, mesmo que os pedaços da rede as cortem a meio.
export async function readNdjson<T>(
  body: ReadableStream<Uint8Array>,
  onEvent: (event: T) => void,
) {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) return;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";
    lines.filter(Boolean).forEach((line) => onEvent(JSON.parse(line)));
  }
}
