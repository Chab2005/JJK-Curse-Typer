// Logique pure du formulaire « Entrer dans le domaine » (accueil).

/** Tire un pseudo différent de l'actuel ; `random` renvoie un nombre dans [0, 1). */
export function pickRandomPseudo(current: string, pseudos: readonly string[], random: () => number = Math.random): string {
  const others = pseudos.filter((pseudo) => pseudo !== current);
  if (others.length === 0) return current;
  return others[Math.floor(random() * others.length)];
}

/** Code de salon tel qu'envoyé au serveur : sans espaces, en majuscules. */
export function normalizePin(pin: string): string {
  return pin.trim().toUpperCase();
}

/** Caractères autorisés dans un code de salon : sans 0 O 1 I L, trop faciles à confondre. */
export const PIN_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

const PIN_PATTERN = new RegExp(`^[${PIN_ALPHABET}]{3}-[${PIN_ALPHABET}]{3}$`);

/** Met en forme la saisie du code : majuscules, caractères ambigus retirés, tiret après 3 caractères, 6 au plus. */
export function formatPinInput(raw: string): string {
  const chars = [...raw.toUpperCase()].filter((char) => PIN_ALPHABET.includes(char)).slice(0, 6).join('');
  return chars.length > 3 ? `${chars.slice(0, 3)}-${chars.slice(3)}` : chars;
}

/** Vrai si le code est complet au format XXX-XXX. */
export function isCompletePin(pin: string): boolean {
  return PIN_PATTERN.test(pin);
}
