import { Range } from "../../../documents/Range";
import { convertParserNode } from "../MathSyntaxTree";
import { MathSyntaxTreeNode } from "../MathSyntaxTreeNode";
import { MathParserContext } from "../MathParser";

export class MultiplicationNode extends MathSyntaxTreeNode {
    static readonly type = "Multiplication";
    readonly type = MultiplicationNode.type;

    readonly leftOperand: MathSyntaxTreeNode;
    readonly rightOperand: MathSyntaxTreeNode;

    constructor(
        leftOperand: MathSyntaxTreeNode,
        rightOperand: MathSyntaxTreeNode,
        parserNode: any,
        range: Range
    ) {
        super(parserNode, range);
        this.leftOperand = leftOperand;
        this.rightOperand = rightOperand;
    }

    get childNodes(): MathSyntaxTreeNode[] {
        return [this.leftOperand, this.rightOperand];
    }

    static fromNearlyParserResultNode(node: any, parserContext: MathParserContext): MathSyntaxTreeNode {
        return new MultiplicationNode(
            convertParserNode(node.data[0], parserContext),
            convertParserNode(node.data[4], parserContext),
            node,
            MultiplicationNode.computeRangeFromParserNode(node, parserContext)
        );
    }
}