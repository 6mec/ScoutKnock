export type Market = "PT" | "BR";

const KNOWN: Market[] = ["PT", "BR"];

// Vazio ou inválido fica só Portugal, para nunca abrir outro país por engano.
export function parseMarkets(value: string | undefined): Market[] {
  const wanted = (value ?? "").split(",").map((item) => item.trim().toUpperCase());
  const markets = KNOWN.filter((market) => wanted.includes(market));

  return markets.length > 0 ? markets : ["PT"];
}

export function enabledMarkets() {
  return parseMarkets(process.env.MARKETS_ENABLED);
}
