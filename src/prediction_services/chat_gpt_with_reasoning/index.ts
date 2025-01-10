import {
    ApiClient,
    ChatMessage,
    PostProcessor,
    PredictionService,
    PreProcessor,
    UserMessageFormatter,
    UserMessageFormattingInputs,
} from "../types";

import * as Handlebars from "handlebars";

import Context from "../../context_detection";
import RemoveCodeIndicators from "../post_processors/remove_code_indicators";
import RemoveMathIndicators from "../post_processors/remove_math_indicators";
import DataViewRemover from "../pre_processors/data_view_remover";
import LengthLimiter from "../pre_processors/length_limiter";
import OpenAIApiClient from "../api_clients/OpenAIApiClient";
import AzureOAIClient from "../api_clients/AzureOAIClient";
import GeminiApiClient from "../api_clients/GeminiAPIClient";
import RemoveOverlap from "../post_processors/remove_overlap";
import {FewShotExample, Settings} from "../../settings/versions";
import RemoveWhitespace from "../post_processors/remove_whitespace";
import OllamaApiClient from "../api_clients/OllamaApiClient";
import {err, ok, Result} from "neverthrow";

class ChatGPTWithReasoning implements PredictionService {
    private readonly client: ApiClient;

    private readonly systemMessage: string;
    private readonly userMessageFormatter: UserMessageFormatter;
    private readonly removePreAnswerGenerationRegex: string;
    private readonly preProcessors: PreProcessor[];
    private readonly postProcessors: PostProcessor[];
    private readonly fewShotExamples: FewShotExample[];
    private debugMode: boolean;

    private constructor(
        client: ApiClient,
        systemMessage: string,
        userMessageFormatter: UserMessageFormatter,
        removePreAnswerGenerationRegex: string,
        preProcessors: PreProcessor[],
        postProcessors: PostProcessor[],
        fewShotExamples: FewShotExample[],
        debugMode: boolean,
    ) {
        this.client = client;
        this.systemMessage = systemMessage;
        this.userMessageFormatter = userMessageFormatter;
        this.removePreAnswerGenerationRegex = removePreAnswerGenerationRegex;
        this.preProcessors = preProcessors;
        this.postProcessors = postProcessors;
        this.fewShotExamples = fewShotExamples;
        this.debugMode = debugMode;
    }

    public static fromSettings(settings: Settings): PredictionService {
        const formatter = Handlebars.compile<UserMessageFormattingInputs>(
            settings.userMessageTemplate,
            {noEscape: true, strict: true}
        );
        const preProcessors: PreProcessor[] = [];
        if (settings.dontIncludeDataviews) {
            preProcessors.push(new DataViewRemover());
        }
        preProcessors.push(
            new LengthLimiter(
                settings.maxPrefixCharLimit,
                settings.maxSuffixCharLimit
            )
        );

        const postProcessors: PostProcessor[] = [];
        if (settings.removeDuplicateMathBlockIndicator) {
            postProcessors.push(new RemoveMathIndicators());
        }
        if (settings.removeDuplicateCodeBlockIndicator) {
            postProcessors.push(new RemoveCodeIndicators());
        }

        postProcessors.push(new RemoveOverlap());
        postProcessors.push(new RemoveWhitespace());

        let client: ApiClient;
        if (settings.apiProvider === "openai") {
            client = OpenAIApiClient.fromSettings(settings);
        } else if (settings.apiProvider === "azure") {
            client = AzureOAIClient.fromSettings(settings);
        } else if (settings.apiProvider === "ollama") {
            client = OllamaApiClient.fromSettings(settings);
        } else if (settings.apiProvider === "gemini") {
            client = GeminiApiClient.fromSettings(settings);
        } else {
            throw new Error("Invalid API provider");
        }

        return new ChatGPTWithReasoning(
            client,
            settings.systemMessage,
            formatter,
            settings.chainOfThoughRemovalRegex,
            preProcessors,
            postProcessors,
            settings.fewShotExamples,
            settings.debugMode,
        );
    }

    async fetchPredictions(
        prefix: string,
        suffix: string
    ): Promise<Result<string, Error>> {
        const context: Context = Context.getContext(prefix, suffix);

        for (const preProcessor of this.preProcessors) {
            if (preProcessor.removesCursor(prefix, suffix)) {
                return ok("");
            }

            ({prefix, suffix} = preProcessor.process(
                prefix,
                suffix,
                context
            ));
        }

        const examples = this.fewShotExamples.filter(
            (example) => example.context === context
        );
        const fewShotExamplesChatMessages =
            fewShotExamplesToChatMessages(examples);

        const messages: ChatMessage[] = [
            {content: this.getSystemMessageFor(context), role: "system"},
            ...fewShotExamplesChatMessages,
            {
                role: "user",
                content: this.userMessageFormatter({
                    suffix,
                    prefix,
                }),
            },
        ];

        if (this.debugMode) {
            console.log("Copilot messages send:\n", messages);
        }

        let result = await this.client.queryChatModel(messages);
        if (this.debugMode && result.isOk()) {
            console.log("Copilot response:\n", result.value);
        }

        result = this.extractAnswerFromChainOfThoughts(result);

        for (const postProcessor of this.postProcessors) {
            result = result.map((r) => postProcessor.process(prefix, suffix, r, context));
        }

        result = this.checkAgainstGuardRails(result);

        return result;
    }

    private getSystemMessageFor(context: Context): string {
        if (context === Context.Text) {
            return this.systemMessage + "\n\n" + "The <mask/> is located in a paragraph. Your answer must complete this paragraph or sentence in a way that fits the surrounding text without overlapping with it. It must be in the same language as the paragraph.";
        }
        if (context === Context.Heading) {
            return this.systemMessage + "\n\n" + "The <mask/> is located in the Markdown heading. Your answer must complete this title in a way that fits the content of this paragraph and be in the same language as the paragraph.";
        }

        if (context === Context.BlockQuotes) {
            return this.systemMessage + "\n\n" + "The <mask/> is located within a quote. Your answer must complete this quote in a way that fits the context of the paragraph.";
        }
        if (context === Context.UnorderedList) {
            return this.systemMessage + "\n\n" + "The <mask/> is located in an unordered list. Your answer must include one or more list items that fit with the surrounding list without overlapping with it.";
        }

        if (context === Context.NumberedList) {
            return this.systemMessage + "\n\n" + "The <mask/> is located in a numbered list. Your answer must include one or more list items that fit the sequence and context of the surrounding list without overlapping with it.";
        }

        if (context === Context.CodeBlock) {
            return this.systemMessage + "\n\n" + "The <mask/> is located in a code block. Your answer must complete this code block in the same programming language and support the surrounding code and text outside of the code block.";
        }
        if (context === Context.MathBlock) {
            return this.systemMessage + "\n\n" + "The <mask/> is located in a math block. Your answer must only contain LaTeX code that captures the math discussed in the surrounding text. No text or explaination only LaTex math code.";
        }
        if (context === Context.TaskList) {
            return this.systemMessage + "\n\n" + "The <mask/> is located in a task list. Your answer must include one or more (sub)tasks that are logical given the other tasks and the surrounding text.";
        }


        return this.systemMessage;

    }

    private extractAnswerFromChainOfThoughts(
        result: Result<string, Error>
    ): Result<string, Error> {
        if (result.isErr()) {
            return result;
        }
        const chainOfThoughts = result.value;

        const regex = new RegExp(this.removePreAnswerGenerationRegex, "gm");
        const match = regex.exec(chainOfThoughts);
        if (match === null) {
            return err(new Error("No match found"));
        }
        return ok(chainOfThoughts.replace(regex, ""));
    }

    private checkAgainstGuardRails(
        result: Result<string, Error>
    ): Result<string, Error> {
        if (result.isErr()) {
            return result;
        }
        if (result.value.length === 0) {
            return err(new Error("Empty result"));
        }
        if (result.value.contains("<mask/>")) {
            return err(new Error("Mask in result"));
        }

        return result;
    }
}

function fewShotExamplesToChatMessages(
    examples: FewShotExample[]
): ChatMessage[] {
    return examples
        .map((example): ChatMessage[] => {
            return [
                {
                    role: "user",
                    content: example.input,
                },
                {
                    role: "assistant",
                    content: example.answer,
                },
            ];
        })
        .flat();
}

export default ChatGPTWithReasoning;
