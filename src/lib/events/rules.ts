const MAX_TEXT = 80;

// Cada tipo só aceita estes campos, para nada pessoal entrar por engano.
export type EventInput =
  | {
      type: "search";
      data: {
        service: string;
        niche: string;
        locality: string;
        count: number;
        cancelled: boolean;
      };
    }
  | { type: "demo_created"; data: { demoId: string; niche: string } }
  | { type: "error"; data: { area: string; code: string } };

function text(value: string) {
  return value.slice(0, MAX_TEXT);
}

export function eventData(event: EventInput) {
  switch (event.type) {
    case "search":
      return {
        service: text(event.data.service),
        niche: text(event.data.niche),
        locality: text(event.data.locality),
        count: event.data.count,
        cancelled: event.data.cancelled,
      };
    case "demo_created":
      return {
        demoId: text(event.data.demoId),
        niche: text(event.data.niche),
      };
    case "error":
      return { area: text(event.data.area), code: text(event.data.code) };
  }
}
