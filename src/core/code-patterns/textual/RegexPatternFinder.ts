import { RegexMatcher } from "../../../utilities/RegexMatcher";
import { Document } from "../../documents/Document";
import { CodeFragmentType } from "../../visualisations/CodeFragmentType";
import { PatternFinder } from "../PatternFinder";
import { TextualPattern } from "./TextualPattern";

export class RegexPatternFinder implements PatternFinder<CodeFragmentType.Textual> {
    readonly type = "Regex pattern finder";
    readonly regexMatcher: RegexMatcher;

    constructor(pattern: string) {
        this.regexMatcher = new RegexMatcher(pattern);
    }

    get pattern(): string {
        return this.regexMatcher.pattern;
    }

    set pattern(newPattern: string) {
        this.regexMatcher.pattern = newPattern;
    }

    applyInDocument(document: Document): TextualPattern[] {
        // If the document is empty, there is nothing to do.
        if (document.isEmpty) {
            return [];
        }

        return this.regexMatcher
            .matchAll(document.content)
            .map(match => TextualPattern.fromRegexMatch(match, document));
    }
}