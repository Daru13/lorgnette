import { Language } from "../Language";
import { PythonParser } from "./PythonParser";

export const PYTHON_LANGUAGE: Language = {
    name: "Python (subset)",
    id: "python",
    codeEditorLanguageId: "python",
    parser: new PythonParser()
};