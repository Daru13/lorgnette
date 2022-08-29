import { Document } from "../../core/documents/Document";
import { getLanguageWithId } from "../../core/languages/Language";
import { Monocle } from "../../core/monocles/Monocle";
import { RawRuntimeRequest, RuntimeRequest, RuntimeRequestId } from "../../core/runtime/RuntimeRequest";
import { RawRuntimeResponse, RuntimeResponse } from "../../core/runtime/RuntimeResponse";
import { MonocleEnvironment, MonocleEnvironmentProvider, MonocleEnvironmentProviderProps, MonocleEnvironmentProviderState } from "../../MonocleEnvironment";
import { VisualStudioCodeExtensionMessenger } from "./VisualStudioCodeExtensionMessenger";

type Props = MonocleEnvironmentProviderProps;
type State = MonocleEnvironmentProviderState;

export class VisualStudioCodeEditorMonocleEnvironmentProvider extends MonocleEnvironmentProvider {
    private messenger: VisualStudioCodeExtensionMessenger;
    private runtimeRequestIdsToMonoclesAndRequests: Map<RuntimeRequestId, { monocle: Monocle, request: RuntimeRequest }>;
    
    constructor(props: Props) {
        super(props);

        this.messenger = new VisualStudioCodeExtensionMessenger();
        this.runtimeRequestIdsToMonoclesAndRequests = new Map();
        this.initialiseExtensionMessageHandlers();
    }

    private get runtimeRequests(): RuntimeRequest[] {
        return [...this.runtimeRequestIdsToMonoclesAndRequests.values()]
            .map(({ request }) => request);
    }

    private get rawRuntimeRequests(): RawRuntimeRequest[] {
        return this.runtimeRequests.map(request => request.raw);
    }

    private initialiseExtensionMessageHandlers(): void {
        this.messenger.addMessageHandler(
            "set-document",
            message => {
                const language = getLanguageWithId(message.payload.languageId);
                if (!language) {
                    console.warn(`The document cannot be set: there is no language with the ID "${message.payload.languageId}"`);
                    return;
                }

                const document = new Document(language, message.payload.content);
                this.setDocument(document)
            }
        );

        this.messenger.addMessageHandler(
            "set-content",
            message => this.setDocumentContent(message.payload.content)
        );

        this.messenger.addMessageHandler(
            "runtime-response",
            message => this.processRawRuntimeResponse(message.payload, Date.now())
        );
    }

    private remapRuntimeRequestIdsToMonoclesAndRequests(monocles: Monocle[]): void {
        this.runtimeRequestIdsToMonoclesAndRequests.clear();

        for (let monocle of monocles) {
            for (let request of monocle.runtimeRequests) {
                this.runtimeRequestIdsToMonoclesAndRequests.set(
                    request.id,
                    { monocle: monocle, request: request }
                );
            }
        }
    }

    private processRawRuntimeResponse(rawResponse: RawRuntimeResponse, receptionTime: number): void {
        if (!this.runtimeRequestIdsToMonoclesAndRequests.has(rawResponse.requestId)) {
            console.warn("The received runtime response has no matching request:", rawResponse);
            return;
        }

        // Convert the raw response to a standard response.
        const { monocle, request } = this.runtimeRequestIdsToMonoclesAndRequests.get(rawResponse.requestId)!;
        const response = RuntimeResponse.fromRawResponse(
            rawResponse,
            request.name,
            receptionTime
        );

        // Dispatch the response to the appropriate monocle.
        monocle.queueRuntimeResponse(response);
        
        console.info("Dispatched runtime response:", response, monocle);
    }

    protected onEnvironmentDidChange(environmentChanges: Partial<MonocleEnvironment>): void {
        if (environmentChanges.document) {
            const currentLanguage = this.state.document.language;
            if (environmentChanges.document.language === currentLanguage) {
                this.messenger.sendMessage({
                    type: "set-document",
                    payload: {
                        languageId: this.state.document.language.id,
                        content: this.state.document.content,
                    }
                })
            }
            else {
                this.messenger.sendMessage({
                    type: "set-content",
                    payload: {
                        content: this.state.document.content
                    }
                })
            }
        }

        if (environmentChanges.monocles) {
            // Update the list of runtime requests of each monocle.
            this.remapRuntimeRequestIdsToMonoclesAndRequests(environmentChanges.monocles);

            // Send a list of all the runtime requests to the extension.
            this.messenger.sendMessage({
                type: "set-runtime-requests",
                payload: {
                    requests: this.rawRuntimeRequests
                }
            });
        }
    }

    componentDidMount() {
        super.componentDidMount();

        this.messenger.startListeningForMessages();
        this.messenger.sendMessage({
            type: "editor-ready"
        });
    }
}