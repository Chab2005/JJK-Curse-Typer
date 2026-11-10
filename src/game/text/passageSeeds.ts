// Passages réels du domaine public (CONF-03), insérés en base par `npm run db:seed`. Chaque auteur est mort depuis plus de
// 70 ans : ces textes sont libres de droits. Une seule ou deux phrases chacun, tapables au clavier QWERTY (apostrophes droites).
import type { TextLanguage } from '@/components/lobbies/lobbySearch';

export interface PassageSeed {
  language: TextLanguage;
  text: string;
  /** Auteur, œuvre et année de première publication. */
  source: string;
}

export const PASSAGE_SEEDS: readonly PassageSeed[] = [
  { language: 'en', source: 'Jane Austen, Pride and Prejudice (1813)', text: 'It is a truth universally acknowledged, that a single man in possession of a good fortune, must be in want of a wife.' },
  { language: 'en', source: 'Charles Dickens, A Tale of Two Cities (1859)', text: 'It was the best of times, it was the worst of times, it was the age of wisdom, it was the age of foolishness, it was the epoch of belief, it was the epoch of incredulity.' },
  { language: 'en', source: 'Herman Melville, Moby-Dick (1851)', text: 'Call me Ishmael. Some years ago, never mind how long precisely, having little or no money in my purse, and nothing particular to interest me on shore, I thought I would sail about a little and see the watery part of the world.' },
  { language: 'en', source: 'Lewis Carroll, Alice\'s Adventures in Wonderland (1865)', text: 'Alice was beginning to get very tired of sitting by her sister on the bank, and of having nothing to do: once or twice she had peeped into the book her sister was reading, but it had no pictures or conversations in it.' },
  { language: 'en', source: 'Arthur Conan Doyle, A Scandal in Bohemia (1891)', text: 'To Sherlock Holmes she is always the woman. I have seldom heard him mention her under any other name.' },
  { language: 'en', source: 'H. G. Wells, The Time Machine (1895)', text: 'The Time Traveller, for so it will be convenient to speak of him, was expounding a recondite matter to us. His grey eyes shone and twinkled, and his usually pale face was flushed and animated.' },
  { language: 'en', source: 'Jane Austen, Emma (1815)', text: 'Emma Woodhouse, handsome, clever, and rich, with a comfortable home and happy disposition, seemed to unite some of the best blessings of existence; and had lived nearly twenty-one years in the world with very little to distress or vex her.' },
  { language: 'en', source: 'Oscar Wilde, The Picture of Dorian Gray (1890)', text: 'The studio was filled with the rich odour of roses, and when the light summer wind stirred amidst the trees of the garden, there came through the open door the heavy scent of the lilac.' },
  { language: 'en', source: 'Edgar Allan Poe, The Raven (1845)', text: 'Once upon a midnight dreary, while I pondered, weak and weary, over many a quaint and curious volume of forgotten lore, while I nodded, nearly napping, suddenly there came a tapping.' },
  { language: 'en', source: 'Robert Louis Stevenson, Treasure Island (1883)', text: 'I remember him as if it were yesterday, as he came plodding to the inn door, his sea-chest following behind him in a hand-barrow, a tall, strong, heavy, nut-brown man.' },
  { language: 'fr', source: 'Voltaire, Candide (1759)', text: 'Il y avait en Westphalie, dans le château de monsieur le baron de Thunder-ten-tronckh, un jeune garçon à qui la nature avait donné les mœurs les plus douces.' },
  { language: 'fr', source: 'Jean de La Fontaine, Le Corbeau et le Renard (1668)', text: 'Maître Corbeau, sur un arbre perché, tenait en son bec un fromage. Maître Renard, par l\'odeur alléché, lui tint à peu près ce langage.' },
  { language: 'fr', source: 'Jean de La Fontaine, La Cigale et la Fourmi (1668)', text: 'La Cigale, ayant chanté tout l\'été, se trouva fort dépourvue quand la bise fut venue. Pas un seul petit morceau de mouche ou de vermisseau.' },
  { language: 'fr', source: 'Gustave Flaubert, Madame Bovary (1857)', text: 'Nous étions à l\'Étude, quand le Proviseur entra, suivi d\'un nouveau habillé en bourgeois et d\'un garçon de classe qui portait un grand pupitre.' },
  { language: 'fr', source: 'Victor Hugo, Les Misérables (1862)', text: 'En 1815, monsieur Charles-François-Bienvenu Myriel était évêque de Digne. C\'était un vieillard d\'environ soixante-quinze ans.' },
  { language: 'fr', source: 'Jules Verne, Vingt mille lieues sous les mers (1870)', text: 'L\'année 1866 fut marquée par un événement bizarre, un phénomène inexpliqué et inexplicable que personne sans doute n\'a oublié.' },
  { language: 'fr', source: 'Alexandre Dumas, Le Comte de Monte-Cristo (1844)', text: 'Le 24 février 1815, la vigie de Notre-Dame de la Garde signala le trois-mâts le Pharaon, venant de Smyrne, Trieste et Naples.' },
  { language: 'fr', source: 'Stendhal, Le Rouge et le Noir (1830)', text: 'La petite ville de Verrières est peut-être une des plus jolies de la Franche-Comté. Ses maisons blanches avec leurs toits pointus de tuiles rouges s\'étendent sur la pente d\'une colline.' },
  { language: 'fr', source: 'Honoré de Balzac, Le Père Goriot (1835)', text: 'Madame Vauquer, née de Conflans, est une vieille femme qui, depuis quarante ans, tient à Paris une pension bourgeoise.' },
  { language: 'fr', source: 'Émile Zola, Germinal (1885)', text: 'Dans la plaine rase, sous la nuit sans étoiles, d\'une obscurité et d\'une épaisseur d\'encre, un homme suivait seul la grande route de Marchiennes à Montsou.' },
  { language: 'fr', source: 'Marcel Proust, Du côté de chez Swann (1913)', text: 'Longtemps, je me suis couché de bonne heure. Parfois, à peine ma bougie éteinte, mes yeux se fermaient si vite que je n\'avais pas le temps de me dire : Je m\'endors.' },
];
