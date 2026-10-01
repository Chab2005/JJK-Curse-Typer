import { describe, expect, it } from 'vitest';
import { locales } from '@/i18n/config';
import en from './en.json';
import fr from './fr.json';

type Messages = { [key: string]: string | Messages };

const catalogs: Record<(typeof locales)[number], Messages> = { en, fr };

function flatten(messages: Messages, prefix = ''): Record<string, string> {
  return Object.fromEntries(
    Object.entries(messages).flatMap(([key, value]) =>
      typeof value === 'string'
        ? [[`${prefix}${key}`, value]]
        : Object.entries(flatten(value, `${prefix}${key}.`)),
    ),
  );
}

/** Arguments `{x}` et balises `<x>` d'un message ICU. */
function placeholders(message: string): string[] {
  const args = [...message.matchAll(/\{(\w+)/g)].map((m) => `{${m[1]}}`);
  const tags = [...message.matchAll(/<(\w+)>/g)].map((m) => `<${m[1]}>`);
  return [...args, ...tags].toSorted();
}

describe('catalogues de traduction (GEN-3)', () => {
  const reference = flatten(catalogs.en);

  it.each(locales)('%s a exactement les mêmes clés que en', (locale) => {
    expect(Object.keys(flatten(catalogs[locale])).toSorted()).toEqual(Object.keys(reference).toSorted());
  });

  it.each(locales)('%s utilise les mêmes arguments et balises que en', (locale) => {
    const messages = flatten(catalogs[locale]);
    for (const [key, message] of Object.entries(reference)) {
      expect(placeholders(messages[key] ?? ''), key).toEqual(placeholders(message));
    }
  });

  it.each(locales)('%s n’a aucun message vide', (locale) => {
    const empty = Object.entries(flatten(catalogs[locale])).filter(([, m]) => m.trim() === '');
    expect(empty).toEqual([]);
  });
});
