import { Language } from "../../../core/languages/Language";
import { CSS_EXAMPLE } from "./css";
import { MATH_EXAMPLE } from "./maths";
import { TYPESCRIPT_EXAMPLE } from "./typescript";
import { VEGA_EXAMPLE } from "./vega";

export interface Example {
    name: string;
    language: Language;
    content: string;
}

export const EXAMPLES: Example[] = [
    VEGA_EXAMPLE,
    TYPESCRIPT_EXAMPLE,
    MATH_EXAMPLE,
    CSS_EXAMPLE
];

export const DEFAULT_EXAMPLE: Example = CSS_EXAMPLE;