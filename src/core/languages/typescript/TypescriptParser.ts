import { Parser } from "../Parser";
import { Project, Node, ts } from "ts-morph";
import { Position } from "../../documents/Position";
import { TypescriptSyntaxTree } from "./TypescriptSyntaxTree";
import { TypescriptSyntaxTreeNode } from "./TypescriptSyntaxTreeNode";
import { Range } from "../../documents/Range";

export interface TypescriptParserContext {
    text: string;
    offsetToPositionConverter: (offset: number) => Position;
};

export class TypescriptParser implements Parser {
    private project: Project;

    constructor() {
        this.project = new Project({
            useInMemoryFileSystem: true
        });
    }

    parse(text: string): TypescriptSyntaxTree {
        const sourceFile = this.project.createSourceFile(
            "code-in-editor.tsx",
            text,
            {
                overwrite: true
            }
        );

        const parserContext: TypescriptParserContext = {
            text: text,
            offsetToPositionConverter: Position.getOffsetToPositionConverterForText(text)
        };

        const childNodes = sourceFile.compilerNode.getChildren();
        const root = TypescriptSyntaxTreeNode.fromTsMorphNode(
            childNodes[0],
            parserContext
        );

        return new TypescriptSyntaxTree(root);
    }
}