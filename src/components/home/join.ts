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
