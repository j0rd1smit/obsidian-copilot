import {ApiClient, ChatMessage, ModelOptions} from "../types";
import {Settings} from "../../settings/versions";
import {makeAPIRequest} from "./utils";
import {Result} from "neverthrow";


class GeminiApiClient implements ApiClient {
    private readonly apiKey: string;
    private readonly url: string;
    private readonly model: string;
    private readonly modelOptions: ModelOptions;

    constructor(apiKey: string, url: string, model: string, modelOptions: ModelOptions) {
        this.apiKey = apiKey;
        this.url = url;
        this.model = model;
        this.modelOptions = modelOptions;
    }

    static fromSettings(settings: Settings): ApiClient {
        return new GeminiApiClient(
            settings.geminiApiSettings.key,
            settings.geminiApiSettings.url,
            settings.geminiApiSettings.model,
            settings.modelOptions
        );
    }

    async queryChatModel(messages: ChatMessage[]): Promise<Result<string, Error>> {
        const headers = {
            "Content-Type": "application/json",
        }

        const body = {
            contents: [{
                parts: messages.map(m => ({text: m.content}))
            }]
        }

        const data = await makeAPIRequest(this.url + '/' + this.model + ':generateContent' +  '?key=' + this.apiKey, "POST", body, headers);
        
        return data.map(data => data.candidates[0].content.parts[0].text)
    }


    async checkIfConfiguredCorrectly(): Promise<string[]> {
        const errors: string[] = [];

        if (!this.apiKey) {
            errors.push("API key is not set.");
        }
        if (!this.url) {
            errors.push("Gemini API url is not set.");
        }
        if (errors.length > 0) {
            // api check is not possible without passing previous checks so return early
            return errors;
        }

        const result = await this.queryChatModel([
            {content: "Say hello world and nothing else.", role: "user"},
        ]);

        if (result.isErr()) {
            errors.push(result.error.message);
        }
        return errors;
    }
}

export default GeminiApiClient;
