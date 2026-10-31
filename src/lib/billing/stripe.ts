import "server-only";
import Stripe from "stripe";
import { parseBillingConfig } from "./rules";

export function getBilling() {
  const config = parseBillingConfig(process.env);
  return config ? { config, stripe: new Stripe(config.secretKey) } : null;
}
