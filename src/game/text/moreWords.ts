// Mots supplémentaires du dictionnaire (CONF-05) : de quoi remplir chaque palier de complexité (voir `wordComplexity`).
// Minuscules, sans apostrophe ni trait d'union, mots courants d'un public scolaire.
import type { TextLanguage } from '@/components/lobbies/lobbySearch';

export const MORE_WORDS: Record<TextLanguage, readonly string[]> = {
  en: [
    // Faciles (2 à 5 lettres).
    'cat', 'dog', 'sun', 'run', 'red', 'big', 'sky', 'sea', 'hat', 'map', 'pen', 'cup', 'box', 'bed', 'car', 'bus', 'egg', 'ice', 'key', 'leg',
    'net', 'owl', 'pig', 'rat', 'sit', 'tea', 'toy', 'van', 'web', 'zoo', 'ant', 'bat', 'bee', 'cow', 'duck', 'farm', 'fish', 'game', 'gold', 'hand',
    'home', 'kite', 'lake', 'leaf', 'lion', 'milk', 'moon', 'nest', 'nose', 'park', 'ring', 'road', 'rock', 'sand', 'ship', 'sing', 'star', 'tree',
    'wolf', 'word', 'work', 'apple', 'beach', 'bread', 'chair', 'clock', 'dream', 'earth', 'field', 'flame', 'grass', 'heart', 'horse', 'house',
    'money', 'night', 'ocean', 'party', 'piano', 'plant', 'river', 'smile', 'storm', 'sugar', 'tiger', 'train', 'whale', 'world', 'magic', 'sword',
    // Moyens (6 et 7 lettres).
    'village', 'journey', 'picture', 'kitchen', 'station', 'teacher', 'library', 'machine', 'mystery', 'captain', 'balance', 'battery', 'blanket',
    'bottle', 'bridge', 'button', 'cabinet', 'canvas', 'castle', 'circle', 'comfort', 'corner', 'cottage', 'courage', 'curious', 'desert', 'dinner',
    'doctor', 'dragon', 'eleven', 'engine', 'evening', 'example', 'factory', 'farmer', 'feather', 'finger', 'flower', 'forest', 'gallery', 'gentle',
    'ground', 'hammer', 'harbor', 'history', 'holiday', 'honest', 'hunger', 'island', 'jungle', 'kitten', 'ladder', 'lesson', 'lizard', 'magnet',
    'market', 'meadow', 'member', 'method', 'minute', 'mirror', 'monkey', 'moment', 'mother', 'narrow', 'nature', 'notice', 'orange', 'outside',
    'package', 'palace', 'parent', 'pepper', 'pillow', 'planet', 'pocket', 'polite', 'potato', 'powder', 'public', 'rabbit', 'record', 'rescue',
    'ribbon', 'rocket', 'saddle', 'season', 'second', 'secret', 'shadow', 'silver', 'singer', 'sister', 'soccer', 'spirit', 'spring', 'square',
    'stream', 'street', 'summer', 'supper', 'ticket', 'tomato', 'tunnel', 'turtle', 'valley', 'velvet', 'wallet', 'winter', 'wizard', 'zipper',
    'balloon', 'bicycle', 'chicken', 'chimney', 'climate', 'compass', 'concert', 'costume', 'country', 'crystal', 'diamond', 'dolphin', 'element',
    'explain', 'fantasy', 'freedom', 'general', 'healthy', 'helpful', 'imagine', 'lantern', 'musical', 'natural', 'picnic', 'pirates',
    // Difficiles (8 lettres et plus).
    'adventure', 'beautiful', 'brilliant', 'challenge', 'champion', 'chocolate', 'classroom', 'community', 'computer', 'continent', 'creative',
    'dangerous', 'dictionary', 'different', 'discovery', 'education', 'elephant', 'energetic', 'excellent', 'fantastic', 'favourite', 'generous',
    'geography', 'hurricane', 'important', 'incredible', 'instrument', 'invention', 'knowledge', 'landscape', 'marathon', 'mountain', 'necessary',
    'neighbour', 'notebook', 'orchestra', 'original', 'passenger', 'peaceful', 'pineapple', 'president', 'probably', 'remember', 'restaurant',
    'scientist', 'secretary', 'sandwich', 'snowflake', 'spaceship', 'strength', 'telephone', 'together', 'tomorrow', 'treasure', 'umbrella',
    'universe', 'vacation', 'vegetable', 'waterfall', 'wonderful', 'yesterday', 'atmosphere', 'celebration', 'concentration', 'imagination',
    'temperature', 'relationship', 'observation', 'opportunity', 'performance', 'photograph', 'responsible', 'extraordinary', 'communication',
    'experience', 'literature', 'laboratory', 'mathematics', 'independent', 'intelligence', 'mysterious', 'imaginary', 'discussion', 'protection',
  ],
  fr: [
    // Faciles (2 à 5 lettres).
    'ami', 'art', 'bal', 'bas', 'bec', 'bon', 'bus', 'cap', 'car', 'dos', 'jeu', 'lac', 'lit', 'loi', 'mer', 'nez', 'pas', 'pie', 'pot', 'riz',
    'roi', 'sac', 'sel', 'sol', 'thé', 'toit', 'ver', 'vie', 'vue', 'zoo', 'chat', 'chien', 'ciel', 'cour', 'dent', 'doigt', 'fils', 'gare', 'jeux',
    'main', 'mais', 'mois', 'nord', 'nuit', 'oeil', 'ours', 'page', 'pain', 'pied', 'plan', 'plat', 'pomme', 'port', 'prix', 'rose', 'rue', 'sable',
    'sapin', 'sport', 'tasse', 'tigre', 'train', 'vélo', 'verre', 'ville', 'vrai', 'voile', 'livre', 'ligne', 'monde', 'neige', 'ombre', 'plage',
    // Moyens (6 et 7 lettres).
    'bateau', 'bureau', 'cadeau', 'cheval', 'cuisine', 'dessert', 'famille', 'fenêtre', 'fromage', 'gâteau', 'girafe', 'insecte', 'jambon', 'journal',
    'lecture', 'légume', 'maison', 'marché', 'matière', 'miroir', 'moineau', 'musée', 'oiseau', 'orange', 'papier', 'parent', 'poisson', 'prairie',
    'pyjama', 'rivage', 'sorcier', 'souris', 'tableau', 'tortue', 'voiture', 'village', 'voyage', 'bonheur', 'courage', 'cuillère', 'écureuil',
    'étoile', 'fraise', 'forêt', 'jardin', 'lumière', 'montre', 'nuage', 'parole', 'planète', 'pompier', 'rapide', 'réponse', 'saison', 'secret',
    'soirée', 'sourire', 'tonnerre', 'tunnel', 'valise', 'vitesse', 'volcan', 'cabane', 'canard', 'chaise', 'chapeau', 'cirque', 'cloche', 'dragon',
    'engrenage', 'fleuve', 'fusée', 'hiver', 'île', 'lanterne', 'malice', 'marin', 'miracle', 'orage', 'palais', 'pirate', 'pluie', 'rocher', 'ruisseau',
    // Difficiles (8 lettres et plus).
    'aventure', 'bibliothèque', 'boulangerie', 'chocolat', 'ordinateur', 'dictionnaire', 'difficulté', 'éléphant', 'exceptionnel', 'extraordinaire',
    'fantastique', 'géographie', 'imagination', 'incroyable', 'instrument', 'magnifique', 'montagne', 'nécessaire', 'observation', 'orchestre',
    'paisible', 'papillon', 'parapluie', 'passager', 'président', 'professeur', 'restaurant', 'savoureux', 'scientifique', 'secrétaire', 'température',
    'tranquille', 'vocabulaire', 'anniversaire', 'appartement', 'calculatrice', 'collection', 'communauté', 'découverte', 'éducation', 'expérience',
    'imaginaire', 'indépendance', 'intelligence', 'laboratoire', 'littérature', 'mathématique', 'merveilleux', 'météorologie', 'mystérieux',
    'opportunité', 'performance', 'photographie', 'responsable', 'supermarché', 'télévision', 'traversée', 'université', 'vacances', 'voyageur',
    'championnat', 'cheminée', 'communication', 'concentration', 'confiture', 'connaissance', 'courageux', 'dangereux', 'différence', 'discussion',
    'dimanche', 'équilibre', 'excellent', 'explorateur', 'généreux', 'important', 'invention', 'lumineux', 'nourriture', 'protection', 'souvenir',
    'spectacle', 'surprise', 'tempête', 'trésor', 'universel', 'véritable', 'victoire', 'bienvenue', 'chevalier', 'dessinateur', 'automobile',
  ],
};
