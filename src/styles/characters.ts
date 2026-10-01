/** Shared repertoire; artwork and metrics remain style-specific. */
export const LETTERS = [...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'];
export const SYMBOLS = [...'.,:;!?\'"-–—_()[]{}/\\&@#%+=*<>$€£'];
export const DIGITS = [...'0123456789'];
export const VISIBLE_CHARACTERS = [...LETTERS, ...SYMBOLS, ...DIGITS];
export const SUPPORTED_CHARACTERS = [...VISIBLE_CHARACTERS, ' '];
export const MAX_TEXT_LENGTH = 64;
const supported = new Set(SUPPORTED_CHARACTERS);
export const isSupported = (character: string): boolean => supported.has(character);
/** Keep legacy letter IDs; punctuation gets a delimiter- and selector-safe token. */
export const glyphKey = (character: string): string => /^[A-Z]$/.test(character) ? character : `u${character.codePointAt(0)!.toString(16).padStart(4, '0')}`;
export const characterFromKey = (key: string): string => /^u[0-9a-f]{4}$/.test(key) ? String.fromCodePoint(parseInt(key.slice(1), 16)) : key;
