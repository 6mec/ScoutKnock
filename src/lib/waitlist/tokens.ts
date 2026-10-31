import { createHmac, timingSafeEqual } from "node:crypto";

export type TokenPurpose = "confirm" | "unsubscribe";

// Assinado com um segredo: nada é guardado na base de dados e os links antigos continuam válidos.
export function createToken(secret: string, purpose: TokenPurpose, id: string) {
  return createHmac("sha256", secret).update(`${purpose}:${id}`).digest("hex");
}

export function verifyToken(
  secret: string,
  purpose: TokenPurpose,
  id: string,
  token: string,
) {
  const expected = Buffer.from(createToken(secret, purpose, id));
  const received = Buffer.from(token);

  return (
    expected.length === received.length && timingSafeEqual(expected, received)
  );
}
