import { Parser } from "./Parser";
import { CSS_LANGUAGE } from "./css/language";
import { JSON_LANGUAGE } from "./json/language";
import { MATHEMATICS_LANGUAGE } from "./math/language";
import { PYTHON_LANGUAGE } from "./python/language";
import { TYPESCRIPT_LANGUAGE } from "./typescript/language";
import { PLAIN_TEXT_LANGUAGE } from "./plain-text/language";

export interface Language {
  name: string;
  id: string;
  codeEditorLanguageId: string;
  parser?: Parser;
};

export const SUPPORTED_LANGUAGES = [
  TYPESCRIPT_LANGUAGE,
  MATHEMATICS_LANGUAGE,
  JSON_LANGUAGE,
  CSS_LANGUAGE,
  PYTHON_LANGUAGE,
  PLAIN_TEXT_LANGUAGE
] as const;

export type SupportedLanguages = typeof SUPPORTED_LANGUAGES[number];

export function getLanguageWithId(id: string): Language | null {
  return SUPPORTED_LANGUAGES.find(language => language.id === id) ?? null;
}
