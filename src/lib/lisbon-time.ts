function lisbonParts(now: Date) {
  const date = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Lisbon",
  }).format(now);
  const zone = new Intl.DateTimeFormat("en-US", {
    timeZone: "Europe/Lisbon",
    timeZoneName: "longOffset",
  })
    .formatToParts(now)
    .find((part) => part.type === "timeZoneName")?.value;

  return { date, offset: zone?.replace("GMT", "") || "+00:00" };
}

// A meia-noite em Lisboa, porque os limites são "por dia" para quem usa.
export function startOfLisbonDay(now: Date) {
  const { date, offset } = lisbonParts(now);
  return new Date(`${date}T00:00:00${offset}`).toISOString();
}

export function startOfLisbonMonth(now: Date) {
  const { date, offset } = lisbonParts(now);
  return new Date(`${date.slice(0, 8)}01T00:00:00${offset}`).toISOString();
}
