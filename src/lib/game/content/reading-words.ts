export interface WordLevel {
  word: string;
  hint?: string;
  image?: string;
}

// CVC words (3 letters) - Level 1
export const cvcWords: WordLevel[] = [
  { word: 'SOL', hint: 'Brilla en el cielo' },
  { word: 'MAR', hint: 'Agua salada grande' },
  { word: 'PAN', hint: 'Lo comemos cada dia' },
  { word: 'LUZ', hint: 'Lo contrario de oscuro' },
  { word: 'PEZ', hint: 'Nada en el agua' },
  { word: 'RIO', hint: 'Agua que corre' },
  { word: 'OJO', hint: 'Sirve para ver' },
  { word: 'UNO', hint: 'El primer numero' },
  { word: 'DOS', hint: 'Despues del uno' },
  { word: 'MES', hint: 'Parte del ano' },
  { word: 'DIA', hint: 'Lo contrario de noche' },
  { word: 'RED', hint: 'Para atrapar peces' },
  { word: 'TEN', hint: 'Numero despues del nueve' },
  { word: 'SAL', hint: 'Da sabor a la comida' },
  { word: 'MIL', hint: 'Numero muy grande' },
];

// 4-letter words - Level 2
export const fourLetterWords: WordLevel[] = [
  { word: 'GATO', hint: 'Animal que dice miau' },
  { word: 'PATO', hint: 'Ave que nada' },
  { word: 'LUNA', hint: 'Sale de noche' },
  { word: 'CASA', hint: 'Donde vivimos' },
  { word: 'MESA', hint: 'Donde comemos' },
  { word: 'BOCA', hint: 'Parte de la cara' },
  { word: 'MANO', hint: 'Tiene cinco dedos' },
  { word: 'ROJO', hint: 'Color del tomate' },
  { word: 'AZUL', hint: 'Color del cielo' },
  { word: 'LAGO', hint: 'Agua rodeada de tierra' },
  { word: 'NUBE', hint: 'Blanca en el cielo' },
  { word: 'RANA', hint: 'Salta y dice croac' },
  { word: 'PUMA', hint: 'Felino grande' },
  { word: 'SOPA', hint: 'Comida liquida caliente' },
  { word: 'TAZA', hint: 'Para tomar cafe' },
];

// 5-letter words - Level 3
export const fiveLetterWords: WordLevel[] = [
  { word: 'PERRO', hint: 'Mejor amigo del hombre' },
  { word: 'LIBRO', hint: 'Se lee' },
  { word: 'PLAYA', hint: 'Arena junto al mar' },
  { word: 'TIGRE', hint: 'Felino con rayas' },
  { word: 'ARBOL', hint: 'Tiene hojas y ramas' },
  { word: 'CIELO', hint: 'Donde estan las nubes' },
  { word: 'FUEGO', hint: 'Caliente y rojo' },
  { word: 'HIELO', hint: 'Agua congelada' },
  { word: 'MUNDO', hint: 'El planeta Tierra' },
  { word: 'NOCHE', hint: 'Cuando salen las estrellas' },
];

export function getWordsForLevel(level: number): WordLevel[] {
  if (level <= 1) return cvcWords;
  if (level <= 2) return fourLetterWords;
  return fiveLetterWords;
}

export function getRandomWord(level: number): WordLevel {
  const words = getWordsForLevel(level);
  return words[Math.floor(Math.random() * words.length)];
}

// Available letters for distractors
export const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

export function getLetterChoices(word: string, extraCount: number = 3): string[] {
  const wordLetters = word.split('');
  const extra: string[] = [];
  while (extra.length < extraCount) {
    const letter = ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
    if (!wordLetters.includes(letter) && !extra.includes(letter)) {
      extra.push(letter);
    }
  }
  return [...wordLetters, ...extra].sort(() => Math.random() - 0.5);
}
