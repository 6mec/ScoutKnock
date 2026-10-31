export const MIN_PASSWORD_LENGTH = 8;

export function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function isValidPassword(password: string) {
  return password.length >= MIN_PASSWORD_LENGTH;
}

// Só estes tipos de link são aceites, e cada um tem um destino fixo.
export function confirmDestination(type: string | null) {
  if (type === "email") return "/painel";
  if (type === "recovery") return "/nova-palavra-passe";
  return null;
}
