// A página /painel/ui só existe em desenvolvimento.
export function isUiPreviewEnabled(nodeEnv = process.env.NODE_ENV) {
  return nodeEnv === "development";
}
