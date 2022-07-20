import React from "react";
import * as monaco from "monaco-editor";
import Editor, { Monaco, loader } from "@monaco-editor/react";
import "./code-editor.css";
import { Position } from "../../core/documents/Position";
import { Language } from "../../core/languages/Language";
import { DecoratedRange, DecoratedRangeId } from "./DecoratedRange";
import { Document } from "../../core/documents/Document";
import { Range } from "../../core/documents/Range";

// Use local files (?) to setup the Monaco editor instead of downloading them from a CDN. 
// Assumption: the files are packaged by Webpack in a CRA-compliant way?
loader.config({ monaco });

// Types of the position, range and selection objects used by the Monaco editor.
export type MonacoPosition = monaco.Position;
export type MonacoRange = monaco.Range;
export type MonacoSelection = monaco.Selection;

// Convert a Monaco editor position to a standard position object.
export function convertMonacoPosition(position: MonacoPosition, document: Document): Position {
    const cursorLine = position.lineNumber - 1;
    const cursorColumn = position.column - 1;
    return document.getPositionAtLineAndColumn(cursorLine, cursorColumn);
}

// Convert a Monaco editor selection to a standard range object.
export function convertMonacoSelection(selection: MonacoSelection, document: Document): Range {
    const startLine = selection.startLineNumber - 1;
    const startColumn = selection.startColumn - 1;
    const startPosition = document.getPositionAtLineAndColumn(startLine, startColumn);

    const endLine = selection.endLineNumber - 1;
    const endColumn = selection.endColumn - 1;
    const endPosition = document.getPositionAtLineAndColumn(endLine, endColumn);

    return Range.fromUnsortedPositions(startPosition, endPosition);
}

export function convertRangeToMonacoRange(range: Range): MonacoRange {
    return new monaco.Range(
        range.start.row + 1,
        range.start.column + 1,
        range.end.row + 1,
        range.end.column + 1
    );  
}

export function convertRangeToMonacoSelection(range: Range): MonacoSelection {
    return new monaco.Selection(
        range.start.row + 1,
        range.start.column + 1,
        range.end.row + 1,
        range.end.column + 1
    );
}

// Type of the identifier of a Monaco editor decoration.
type MonacoDecorationId = string;

type Props = {
    language: Language;
    content: string;
    selections?: Range[],
    decorations?: DecoratedRange[];
    onContentChange?: (newContent: string) => void;
    onSelectionChange?: (newSelection: MonacoSelection) => void;
    onCursorPositionChange?: (newPosition: MonacoPosition) => void;
    onScrollChange?: () => void;
    onLayoutChange?: () => void;
};

type State = {
    theme: string;
}

export class CodeEditor extends React.Component<Props, State> {
    // React ref to the wrapper around the Monaco editor.
    private editorWrapperRef: React.RefObject<HTMLDivElement>;

    // References to objects provided by the Monaco editor.
    private monaco: Monaco | null;
    private editor: monaco.editor.IStandaloneCodeEditor | null;

    // List of the identifiers of the decorations currently displayed by the Monaco editor.
    private currentEditorDecorationIds: MonacoDecorationId[];
    
    constructor(props: Props) {
        super(props);

        this.editorWrapperRef = React.createRef();
        
        this.monaco = null;
        this.editor = null;
        this.currentEditorDecorationIds = [];

        this.state = {
            theme: "light",
        };
    }

    private startObservingSelectionChanges(): void {
        if (!this.editor) {
            return;
        }

        this.editor.onDidChangeCursorSelection(event => {
            if (this.props.onSelectionChange) {
                this.props.onSelectionChange(event.selection);
            }
        });
    }

    private startObservingCursorPositionChanges(): void {
        if (!this.editor) {
            return;
        }

        this.editor.onDidChangeCursorPosition(event => {
            if (this.props.onCursorPositionChange) {
                this.props.onCursorPositionChange(event.position);
            }
        });
    }

    private startObservingScrollChanges(): void {
        if (!this.editor) {
            return;
        }

        this.editor.onDidScrollChange(event => {
            if (this.props.onScrollChange) {
                this.props.onScrollChange();
            }
        });
    }

    private startObservingLayoutChanges(): void {
        if (!this.editor) {
            return;
        }

        this.editor.onDidLayoutChange(event => {
            if (this.props.onLayoutChange) {
                this.props.onLayoutChange();
            }
        });
    }

    private updateSelections(): void {
        if (!this.editor) {
            return;
        }

        const selections = this.props.selections;
        if (selections !== undefined && selections.length > 0) {
            this.editor.setSelections(
                selections.map(range => convertRangeToMonacoSelection(range))
            );
        }
    }

    private updateDecorations(): void {
        if (!this.editor) {
            return;
        }
        
        const decoratedRanges = this.props.decorations;
        if (decoratedRanges !== undefined) {
            const decorations: monaco.editor.IModelDeltaDecoration[] =
                decoratedRanges.map(decoratedRange => {
                    return {
                        range: convertRangeToMonacoRange(decoratedRange.range),
                        options: {
                            className: decoratedRange.className
                        }
                    }
                });

            const newEditorDecorationIds = this.editor.deltaDecorations(this.currentEditorDecorationIds, decorations);
            this.currentEditorDecorationIds = newEditorDecorationIds;
        } 
    }

    private get editorElement(): Element {
        const editorWrapperElement = this.editorWrapperRef.current;
        if (!editorWrapperElement) {
            throw Error("The code editor cannot be retrieved: the ref to the code editor wrapper does not exist.");
        }

        return editorWrapperElement.children[0];
    }

    getEditorBoundingBox(): DOMRect {
        return this.editorElement.getBoundingClientRect();
    }

    getDecorationElementsWithId(id: DecoratedRangeId): Element[] {
        return [...this.editorElement.getElementsByClassName(`${DecoratedRange.className} ${DecoratedRange.classNameForId(id)}`)];
    }

    getDecorationBoundingBoxWithId(id: DecoratedRangeId): DOMRect {
        const elements = this.getDecorationElementsWithId(id);
        const nbElements = elements.length;

        if (nbElements === 0) {
            throw Error("The decoration bounding box cannot be computed: there is no element for the given ID.");
        }

        const elementBoundingBoxes = elements.map(element => element.getBoundingClientRect());
    
        const markersSortedByTop = elementBoundingBoxes.sort((box1, box2) => box2.top - box1.top);
        const minMarkerTop = markersSortedByTop[0].top;
        const maxMarkerTop = markersSortedByTop[nbElements - 1].top;

        const markersSortedByLeft = elementBoundingBoxes.sort((box1, box2) => box2.left - box1.left);
        const minMarkerLeft = markersSortedByLeft[0].left;

        const markersSortedByRight = elementBoundingBoxes.sort((box1, box2) => box2.right - box1.right);
        const maxMarkerRight = markersSortedByRight[0].right;
    
        return new DOMRect(
            minMarkerLeft,
            minMarkerTop,
            maxMarkerRight - minMarkerLeft,
            maxMarkerTop - minMarkerTop
        );
    }

    componentDidUpdate() {
        this.updateSelections();
        this.updateDecorations();
    }

    onEditorDidMount(
        editor: monaco.editor.IStandaloneCodeEditor,
        monaco: Monaco
    ): void {
        this.editor = editor;
        this.monaco = monaco;

        this.startObservingCursorPositionChanges();
        this.startObservingSelectionChanges();
        this.startObservingScrollChanges();
        this.startObservingLayoutChanges();

        this.updateSelections();
        this.updateDecorations();
    }
    
    render() {
        return (
            <div className="code-editor-wrapper" ref={this.editorWrapperRef}>
                <Editor
                    className="code-editor"
                    value={this.props.content}
                    language={this.props.language.codeEditorLanguageId}
                    theme={this.state.theme}
                    onMount={(editor, monaco) => {
                        this.onEditorDidMount(editor, monaco);
                    }}
                    onChange={(value, event) => {
                        value !== undefined &&
                        this.props.onContentChange &&
                        this.props.onContentChange(value)
                    }}
                />
            </div>
        );
    }
};
