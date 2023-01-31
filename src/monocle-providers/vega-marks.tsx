import { TreePatternFinder } from "../core/fragments/syntactic/TreePatternFinder";
import { NumberNode } from "../core/languages/json/nodes/NumberNode";
import { ObjectNode } from "../core/languages/json/nodes/ObjectNode";
import { PropertyNode } from "../core/languages/json/nodes/PropertyNode";
import { SyntaxTreePattern, SKIP_MATCH_DESCENDANTS } from "../core/languages/SyntaxTreePattern";
import { ProgrammableInputMapping } from "../core/mappings/ProgrammableInputMapping";
import { ProgrammableOutputMapping } from "../core/mappings/ProgrammableOutputMapping";
import { ButtonPopoverRenderer } from "../core/renderers/popover/ButtonPopoverRenderer";
import { DISABLED_PROPERTY, isEnabledAndDefined } from "../core/user-interfaces/style-inspector/inspectors/SpecialisedStyleInspector";
import { Style } from "../core/user-interfaces/style-inspector/Style";
import { StyleInspector, Input as StyleInspectorInput } from "../core/user-interfaces/style-inspector/StyleInspector";
import { SyntacticMonocleProvider } from "../core/monocles/syntactic/SyntacticMonocleProvider";
import { BLACK, Color, WHITE } from "../utilities/Color";
import { processProperty, insertProperty, deleteProperty } from "../utilities/languages/json/json-utilities";
import { ValueWithUnit } from "../utilities/ValueWithUnit";
import { InputPrinter } from "../core/user-interfaces/input-printer/InputPrinter";
import { JsonObjectTemplate } from "../utilities/languages/json/JsonObjectTemplate";
import { TextualValuator } from "../core/templates/valuators/TextualValuator";
import { NumericValuator } from "../core/templates/valuators/NumericValuator";
import { createSlotSpecification, FORM_DATA_TEMPLATE_TRANSFORMERS } from "../core/user-interfaces/form/template-form-utilities";
import { FormEntryType } from "../core/user-interfaces/form/FormEntry";
import { Form } from "../core/user-interfaces/form/Form";
import { ButtonColorPicker } from "../core/user-interfaces/form/form-elements/ButtonColorPicker";
import { NumberInput } from "../core/user-interfaces/form/form-elements/NumberInput";
import { StringInput } from "../core/user-interfaces/form/form-elements/StringInput";
import { ButtonGroup } from "../core/user-interfaces/form/form-elements/ButtonGroup";
import { Button } from "../core/user-interfaces/form/form-elements/Button";
import { Select } from "../core/user-interfaces/form/form-elements/Select";

export const vegaMarksStyleInspectorProvider = new SyntacticMonocleProvider({
    name: "Vega marks",

    usageRequirements: { languages: ["json"] },

    fragmentProvider: new TreePatternFinder(new SyntaxTreePattern(n =>
        n.type === "Property"
            && (n as PropertyNode).key.value === "mark"
            && (n as PropertyNode).value.type === "Object",
        SKIP_MATCH_DESCENDANTS
    )),

    inputMapping: new ProgrammableInputMapping(({ fragment }) => {
        const mark = (fragment.node as PropertyNode).value as ObjectNode;
        
        // Background style properties.
        const backgroundStyle: StyleInspectorInput["style"]["background"] = {};

        processProperty(
            mark,
            ["fill", "color"],
            property => {
                // Only strings are supported.
                if (property.value.type === "String") {
                    backgroundStyle.color = Color.fromCss(property.value.value);
                }
            }
        );

        // Border style properties.
        const borderStyle: StyleInspectorInput["style"]["border"] = {};

        processProperty(
            mark,
            ["stroke", "color"],
            property => {
                // Only strings are supported.
                if (property.value.type === "String") {
                    borderStyle.color = Color.fromCss(property.value.value);
                }
            }
        );

        processProperty(
            mark,
            "strokeDash",
            property => {
                // Only arrays containing two numbers are supported.
                if (property.value.type === "Array"
                && property.value.values.length === 2
                && property.value.values.some(v => v.type === "Number")) {
                    const [firstValue, secondValue] = property.value.values as [NumberNode, NumberNode];

                    if (firstValue.value === 1 && secondValue.value === 1) {
                        borderStyle.type = "dotted";
                    }
                    else if (firstValue.value === 2 && secondValue.value === 2) {
                        borderStyle.type = "dashed";
                    }
                    else {
                        borderStyle.type = [firstValue.value, secondValue.value];
                    }
                }
            },
            () => {
                borderStyle.type = "solid";
            }
        );

        processProperty(
            mark,
            "strokeWidth",
            property => {
                // Only numbers are supported.
                if (property.value.type === "Number") {
                    borderStyle.thickness = new ValueWithUnit(Number(property.value.value), "px");
                }
            },
            () => {
                borderStyle.thickness = new ValueWithUnit(0, "px");
            }
        );

        // Background style properties.
        const fontStyle: StyleInspectorInput["style"]["font"] = {};

        processProperty(
            mark,
            "font",
            property => {
                // Only strings are supported.
                if (property.value.type === "String") {
                    fontStyle.family = [property.value.value];
                }
            },
            () => {
                fontStyle.family = ["sans-serif"]
            }
        );

        processProperty(
            mark,
            "fontSize",
            property => {
                // Only numbers are supported.
                if (property.value.type === "Number") {
                    fontStyle.size = new ValueWithUnit(Number(property.value.value), "px");
                }
            },
            () => {
                fontStyle.size = new ValueWithUnit(11, "px");
            }
        );

        processProperty(
            mark,
            "fontWeight",
            property => {
                // Only strings and numbers are supported.
                if (property.value.type === "String") {
                    if (property.value.value === "bold") {
                        fontStyle.bold = true;
                    }
                }

                if (property.value.type === "Number") {
                    if (property.value.value >= 400) {
                        fontStyle.bold = true;
                    }
                }
            }
        );

        processProperty(
            mark,
            "fontStyle",
            property => {
                // Only strings are supported.
                if (property.value.type === "String") {
                    if (property.value.value === "italic") {
                        fontStyle.italic = true;
                    }
                }
            }
        );

        const style: StyleInspectorInput["style"] = {};
        if (Object.getOwnPropertyNames(backgroundStyle).length > 0) {
            style.background = backgroundStyle;
        }
        if (Object.getOwnPropertyNames(borderStyle).length > 0) {
            style.border = borderStyle;
        }
        if (Object.getOwnPropertyNames(fontStyle).length > 0) {
            style.font = {
                ...fontStyle,
                underline: DISABLED_PROPERTY,
                color: DISABLED_PROPERTY
            };
        }

        return {
            style: style,
            settings: {
                defaultStyle: {
                    background: { color: Color.fromHexString("#4682b4") },
                    font: {
                        size: new ValueWithUnit(11, "pt"),
                        family: ["sans-serif"]
                    }
                }
            }
        };
    }),

    outputMapping: new ProgrammableOutputMapping(({ output, document, documentEditor, fragment }) => {
        const mark = (fragment.node as PropertyNode).value as ObjectNode;
        const styleChange = output.styleChange as Style;

        // Background style properties.
        const backgroundChange = styleChange.background;
        if (backgroundChange) {
            const newColor = backgroundChange.color;
            if (isEnabledAndDefined(newColor)) {
                processProperty(
                    mark,
                    ["fill", "color"],
                    property => documentEditor.replace(property.value.range, `"${newColor.css}"`),
                    () => insertProperty(document, documentEditor, mark, "fill", `"${newColor.css}"`)
                );
            }
        }

        // Border style properties.
        const borderChange = styleChange.border;
        if (borderChange) {
            const newThickness = borderChange.thickness;
            if (isEnabledAndDefined(newThickness)) {
                if (newThickness.value === 0) {
                    deleteProperty(documentEditor, mark, "strokeWidth");
                }
                else {
                    processProperty(
                        mark,
                        "strokeWidth",
                        property => documentEditor.replace(property.value.range, newThickness.value.toString()),
                        () => insertProperty(document, documentEditor, mark, "strokeWidth", newThickness.value.toString())
                    );
                }
            }

            const newType = borderChange.type;
            if (isEnabledAndDefined(newType)) {
                if (newType === "solid") {
                    deleteProperty(documentEditor, mark, "strokeDash");
                }
                else {
                    const newDashLengths =
                        newType === "dotted" ? [1, 1] :
                        newType === "dashed" ? [2, 2] :
                        newType;
                    const newDashLengthsAsString = `[${newDashLengths[0]}, ${newDashLengths[1]}]`;

                    processProperty(
                        mark,
                        "strokeDash",
                        property => documentEditor.replace(property.value.range, newDashLengthsAsString),
                        () => insertProperty(document, documentEditor, mark, "strokeDash", newDashLengthsAsString)
                    );
                }
            }

            const newColor = borderChange.color;
            if (isEnabledAndDefined(newColor)) {
                processProperty(
                    mark,
                    "stroke",
                    property => documentEditor.replace(property.value.range, `"${newColor.css}"`),
                    () => insertProperty(document, documentEditor, mark, "stroke", `"${newColor.css}"`)
                );
            }
        }

        // Font style properties.
        const fontChange = styleChange.font;
        if (fontChange) {
            const newSize = fontChange.size;
            if (isEnabledAndDefined(newSize)) {
                processProperty(
                    mark,
                    "fontSize",
                    property => documentEditor.replace(property.value.range, newSize.value.toString()),
                    () => insertProperty(document, documentEditor, mark, "fontSize", newSize.value.toString())
                );
            }

            const newIsBold = fontChange.bold;
            if (isEnabledAndDefined(newIsBold)) {
                processProperty(
                    mark,
                    "fontWeight",
                    property => documentEditor.replace(property.value.range, newIsBold ? `"bold"` : `"normal"`),
                    () => insertProperty(document, documentEditor, mark, "fontWeight", newIsBold ? `"bold"` : `"normal"`)
                );
            }

            const newIsItalic = fontChange.italic;
            if (isEnabledAndDefined(newIsItalic)) {
                processProperty(
                    mark,
                    "fontStyle",
                    property => documentEditor.replace(property.value.range, newIsItalic ? `"italic"` : `"normal"`),
                    () => insertProperty(document, documentEditor, mark, "fontStyle", newIsItalic ? `"italic"` : `"normal"`)
                );
            }
        }

        documentEditor.applyEdits();
    }),

    userInterfaceProvider: StyleInspector.makeProvider(),
    
    rendererProvider: ButtonPopoverRenderer.makeProvider({
        buttonContent: "🎨 edit style"
    })
});

const markPropertyTemplate = JsonObjectTemplate.createForAssignmentToKeyNamed(
    "mark",
    [
        createSlotSpecification("fill", FormEntryType.Color, (color: Color) => color.equals(Color.fromHexString("#4682b4"))),
        createSlotSpecification("stroke", FormEntryType.Color, (color: Color) => color.equals(Color.fromHexString("#4682b4"))),
        createSlotSpecification("strokeWidth", FormEntryType.Number, 0),
        createSlotSpecification("strokeDash", FormEntryType.String, ""),
        createSlotSpecification("font", FormEntryType.String, "sans-serif"),
        createSlotSpecification("fontSize", FormEntryType.Number, 11),
        createSlotSpecification("fontWeight", FormEntryType.String, "normal"),
        createSlotSpecification("fontStyle", FormEntryType.String, "normal"),
    ],
    { ...FORM_DATA_TEMPLATE_TRANSFORMERS }
);

export const vegaMarksStyleInspectorProvider2 = new SyntacticMonocleProvider({
    name: "Vega marks",

    usageRequirements: { languages: ["json"] },

    ...markPropertyTemplate.monocleProviderProperties,

    userInterfaceProvider: Form.makeProvider(<>
        <h3 style={{ textAlign: "center" }}>Style of the mark</h3>
        <h4>Background/fill:</h4>
        <ButtonColorPicker formEntryKey="fill" defaultValue={Color.fromHexString("#4682b4")} label="Fill color" />

        <h4>Border/stroke:</h4>
        <NumberInput formEntryKey="strokeWidth" defaultValue={0} label="Thickness (px)" />
        <ButtonGroup>
            <Button formEntryKey="strokeWidth" text="None" valueWithType={[0, FormEntryType.Number]} activateOn={[0, null]} showWithoutValue={true} />
            <Button formEntryKey="strokeWidth" text="S" valueWithType={[1, FormEntryType.Number]} activateOn={1} showWithoutValue={true} />
            <Button formEntryKey="strokeWidth" text="M" valueWithType={[3, FormEntryType.Number]} activateOn={3} showWithoutValue={true} />
            <Button formEntryKey="strokeWidth" text="L" valueWithType={[5, FormEntryType.Number]} activateOn={5} showWithoutValue={true} />
            <Button formEntryKey="strokeWidth" text="XL" valueWithType={[10, FormEntryType.Number]} activateOn={10} showWithoutValue={true} />
        </ButtonGroup>
        
        <ButtonGroup>
            <Button formEntryKey="strokeDash" text="Solid" valueWithType={["", FormEntryType.String]} activateOn={["solid", null]} showWithoutValue={true} />
            <Button formEntryKey="strokeDash" text="Dashed" valueWithType={["[2, 2]", FormEntryType.String]} activateOn="[2, 2]" showWithoutValue={true} />
            <Button formEntryKey="strokeDash" text="Dotted" valueWithType={["[1, 1]", FormEntryType.String]} activateOn="[1, 1]" showWithoutValue={true} />
        </ButtonGroup>

        <ButtonColorPicker formEntryKey="stroke" defaultValue={Color.fromHexString("#4682b4")} label="Stroke color" />

        <h4>Text:</h4>
        <NumberInput formEntryKey="fontSize" defaultValue={11} label="Font size (pt)" />
        <ButtonGroup>
            <Button formEntryKey="fontWeight" text="Bold" valueWithType={v => [v === "normal" || v === null ? "bold" : "normal", FormEntryType.String]} activateOn="bold" showWithoutValue={true} />
            <Button formEntryKey="fontStyle" text="Italic" valueWithType={v => [v === "normal" || v === null ? "italic" : "normal", FormEntryType.String]} activateOn="italic" showWithoutValue={true} />
        </ButtonGroup>
        <Select formEntryKey="font" items={["sans-serif", "serif", "monospace"]} defaultItem="sans-serif" label="Font family" />
    </>),
    
    rendererProvider: ButtonPopoverRenderer.makeProvider({
        buttonContent: "🎨 edit style"
    })
});
