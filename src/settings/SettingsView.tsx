import * as React from "react";
import {useState} from "react";

import TextSettingItem from "./components/TextSettingItem";
import {checkForErrors} from "./utils";
import SliderSettingsItem from "./components/SliderSettingsItem";

import TriggerSettings from "./components/TriggerSettings";
import SettingsItem from "./components/SettingsItem";
import CheckBoxSettingItem from "./components/CheckBoxSettingItem";
import FewShotExampleSettings from "./components/FewShotExampleSettings";
import ConnectivityCheck from "./components/ConnectivityCheck";
import DropDownSettingItem from "./components/DropDownSettingItem";
import {Notice} from "obsidian";
import {
    DEFAULT_SETTINGS,
    MAX_DELAY,
    MAX_FREQUENCY_PENALTY,
    MAX_MAX_CHAR_LIMIT,
    MAX_MAX_TOKENS,
    MAX_PRESENCE_PENALTY,
    MAX_TEMPERATURE,
    MAX_TOP_P,
    MIN_DELAY,
    MIN_FREQUENCY_PENALTY,
    MIN_MAX_CHAR_LIMIT,
    MIN_MAX_TOKENS,
    MIN_PRESENCE_PENALTY,
    MIN_TEMPERATURE,
    MIN_TOP_P,
    Settings
} from "./versions"

interface IProps {
    onSettingsChanged(settings: Settings): void;

    settings: Settings;
}

export default function SettingsView(props: IProps): React.JSX.Element {
    const [settings, _setSettings] = useState<Settings>(props.settings);
    const errors = checkForErrors(settings);

    React.useEffect(() => {
        _setSettings(props.settings);
    }, [props.settings]);

    const updateSettings = (update: Partial<Settings>) => {
        _setSettings((settings: Settings) => {
            const newSettings = {...settings, ...update};
            props.onSettingsChanged(newSettings);
            return newSettings;
        });
    };
    const resetSettings = () => {
        const azureOAIApiSettings = {
            ...settings.azureOAIApiSettings,
        };
        const openAIApiSettings = {
           ... settings.openAIApiSettings,
        };
        const ollamaApiSettings = {
            ...settings.ollamaApiSettings,
        }

        const newSettings: Settings = {
            ...DEFAULT_SETTINGS,
            apiProvider: settings.apiProvider,
            azureOAIApiSettings,
            openAIApiSettings,
            ollamaApiSettings,
            advancedMode: settings.advancedMode,
        };
        updateSettings(newSettings);
        new Notice("Factory reset complete.");
    };


    const renderAPISettings = () => {
        if (settings.apiProvider === "gemini") {
            return (
                <>
                    <TextSettingItem
                        name={"API URL"}
                        description={
                            "The URL used in the requests."
                        }
                        placeholder={"Your API URL..."}
                        value={settings.geminiApiSettings.url}
                        errorMessage={errors.get("geminiApiSettings.url")}
                        setValue={(value: string) =>
                            updateSettings({
                                geminiApiSettings: {
                                    ...settings.geminiApiSettings,
                                    url: value,
                                },
                            })
                        }
                    />
                    <TextSettingItem
                        name={"API key"}
                        description={"The API key used in the requests."}
                        placeholder={"Your API key..."}
                        password
                        value={settings.geminiApiSettings.key}
                        errorMessage={errors.get("geminiApiSettings.key")}
                        setValue={(value: string) =>
                            updateSettings({
                                geminiApiSettings: {
                                    ...settings.geminiApiSettings,
                                    key: value,
                                },
                            })
                        }
                    />
                    <TextSettingItem 
                        name={"Model"}
                        description={"The value of the model parameter in the request body."}
                        placeholder="gemini-1.5-flash"
                        value={settings.geminiApiSettings.model}
                        errorMessage={errors.get("geminiApiSettings.model")}
                        setValue={(value: string) =>
                            updateSettings({
                                geminiApiSettings: {
                                    ...settings.geminiApiSettings,
                                    model: value,
                                }
                            })
                        }
                    />
                    <ConnectivityCheck key={"gemini"} settings={settings}/>
                </>
            );
        }
        if (settings.apiProvider === "azure") {
            return (
                <>
                    <TextSettingItem
                        name={"Azure OAI API URL"}
                        description={
                            "The Azure OpenAI services API URL is used in the requests."
                        }
                        placeholder={"Your API URL..."}
                        value={settings.azureOAIApiSettings.url}
                        errorMessage={errors.get("azureOAIApiSettings.url")}
                        setValue={(value: string) =>
                            updateSettings({
                                azureOAIApiSettings: {
                                    ...settings.azureOAIApiSettings,
                                    url: value,
                                },
                            })
                        }
                    />
                    <TextSettingItem
                        name={"Azure API key"}
                        description={
                            "The Azure OpenAI services API key used in the requests."
                        }
                        placeholder={"Your API key..."}
                        password
                        value={settings.azureOAIApiSettings.key}
                        errorMessage={errors.get("azureOAIApiSettings.key")}
                        setValue={(value: string) =>
                            updateSettings({
                                azureOAIApiSettings: {
                                    ...settings.azureOAIApiSettings,
                                    key: value,
                                },
                            })
                        }
                    />
                    <ConnectivityCheck key={"azure"} settings={settings}/>
                </>
            );
        }
        if (settings.apiProvider === "openai") {
            return (
                <>
                    <TextSettingItem
                        name={"OpenAI API URL"}
                        description={
                            "The URL used in the requests."
                        }
                        placeholder={"Your API URL..."}
                        value={settings.openAIApiSettings.url}
                        errorMessage={errors.get("openAIApiSettings.url")}
                        setValue={(value: string) =>
                            updateSettings({
                                openAIApiSettings: {
                                    ...settings.openAIApiSettings,
                                    url: value,
                                },
                            })
                        }
                    />
                    <TextSettingItem
                        name={"OpenAI API key"}
                        description={"The API key used in the requests."}
                        placeholder={"Your API key..."}
                        password
                        value={settings.openAIApiSettings.key}
                        errorMessage={errors.get("openAIApiSettings.key")}
                        setValue={(value: string) =>
                            updateSettings({
                                openAIApiSettings: {
                                    ...settings.openAIApiSettings,
                                    key: value,
                                },
                            })
                        }
                    />
                    <TextSettingItem
                        name={"Model"}
                        description={"The value of the model parameter in the request body."}
                        placeholder="gpt-3.5-turbo"
                        value={settings.openAIApiSettings.model}
                        setValue={(value: string) =>
                            updateSettings({
                                openAIApiSettings: {
                                    ...settings.openAIApiSettings,
                                    model: value,
                                }
                            })
                        }
                        errorMessage={errors.get("openAIApiSettings.model")}
                    />

                    <ConnectivityCheck key={"openai"} settings={settings}/>
                </>
            );
        }
        if (settings.apiProvider === "ollama") {
            return (
                <>
                    <TextSettingItem
                        name={"API URL"}
                        description={
                            "The URL used in the requests."
                        }
                        placeholder={"Your API URL..."}
                        value={settings.ollamaApiSettings.url}
                        errorMessage={errors.get("ollamaApiSettings.url")}
                        setValue={(value: string) =>
                            updateSettings({
                                ollamaApiSettings: {
                                    ...settings.ollamaApiSettings,
                                    url: value,
                                },
                            })
                        }
                    />
                    <TextSettingItem
                        name={"Model"}
                        description={"The model you have locally running using OLLAMA."}
                        placeholder="Your model name..."
                        value={settings.ollamaApiSettings.model}
                        setValue={(value: string) =>
                            updateSettings({
                                ollamaApiSettings: {
                                    ...settings.ollamaApiSettings,
                                    model: value,
                                }
                            })
                        }
                        errorMessage={errors.get("ollamaApiSettings.model")}
                    />

                    <ConnectivityCheck key={"openai"} settings={settings}/>
                </>
            );
        }
    };

    return (
        <div>
            <h2>General</h2>
            <CheckBoxSettingItem
                name={"Enable"}
                description={
                    "If disabled, nothing will trigger the extension or can result in an API call."
                }
                enabled={settings.enabled}
                setEnabled={(value) => updateSettings({enabled: value})}
            />
            <CheckBoxSettingItem
                name={"Cache completions"}
                description={
                    "If disabled, the plugin will not cache the completions. After accepting or rejecting a completion, the plugin will not remember it. This might result in more API calls."
                }
                enabled={settings.cacheSuggestions}
                setEnabled={(value) => updateSettings({cacheSuggestions: value})}
            />
            <DropDownSettingItem
                name={"API provider"}
                description={
                    "The plugin supports multiple API providers. Each provider might require different settings."
                }
                value={settings.apiProvider}
                setValue={(value: string) => {
                    if (value === "openai" || value === "azure" || value === "ollama" || value === "gemini") {
                        updateSettings({apiProvider: value});
                    }
                }}
                options={{
                    openai: "OpenAI API",
                    azure: "Azure OAI API",
                    ollama: "Self-hosted OLLAMA API",
                    gemini: "Gemini"
                }}
                errorMessage={errors.get("apiProvider")}
            />
            <CheckBoxSettingItem
                name={"Debug mode"}
                description={
                    "If enabled, various debug messages will be logged to the console, such as the complete response from the API, including the chain of thought tokens."
                }
                enabled={settings.debugMode}
                setEnabled={(value) => updateSettings({debugMode: value})}
            />

            <h2>API</h2>
            {renderAPISettings()}


            <h2>Model Options</h2>
            <SliderSettingsItem
                name={"Temperature"}
                description={
                    "This parameter affects randomness in the sampling. Lower values result in more repetitive and deterministic responses. Higher temperatures will result in more unexpected or creative responses."
                }
                value={settings.modelOptions.temperature}
                errorMessage={errors.get("modelOptions.temperature")}
                setValue={(value: number) =>
                    updateSettings({
                        modelOptions: {
                            ...settings.modelOptions,
                            temperature: value,
                        },
                    })
                }
                min={MIN_TEMPERATURE}
                max={MAX_TEMPERATURE}
                step={0.05}
            />
            <SliderSettingsItem
                name={"TopP"}
                description={
                    "Like the temperature parameter, the Top P parameter affects the randomness in sampling. Lowering the value will limit the model's token selection to likelier tokens while increasing the value expands the model's token selection with lower likelihood tokens."
                }
                value={settings.modelOptions.top_p}
                errorMessage={errors.get("modelOptions.top_p")}
                setValue={(value: number) =>
                    updateSettings({
                        modelOptions: {
                            ...settings.modelOptions,
                            top_p: value,
                        },
                    })
                }
                min={MIN_TOP_P}
                max={MAX_TOP_P}
                step={0.05}
            />
            {settings.apiProvider !== "ollama" && (<>
                <SliderSettingsItem
                    name={"Frequency Penalty"}
                    description={
                        "This parameter reduces the chance of repeating a token proportionally based on how often it has appeared in the text so far. This decreases the likelihood of repeating the exact same text in a response."
                    }
                    value={settings.modelOptions.frequency_penalty}
                    errorMessage={errors.get("modelOptions.frequency_penalty")}
                    setValue={(value: number) =>
                        updateSettings({
                            modelOptions: {
                                ...settings.modelOptions,
                                frequency_penalty: value,
                            },
                        })
                    }
                    min={MIN_FREQUENCY_PENALTY}
                    max={MAX_FREQUENCY_PENALTY}
                    step={0.05}
                />
                <SliderSettingsItem
                    name={"Presence Penalty"}
                    description={
                        "This parameter reduces the chance of repeating any token that has appeared in the text so far. This increases the likelihood of introducing new topics in a response."
                    }
                    value={settings.modelOptions.presence_penalty}
                    errorMessage={errors.get("modelOptions.presence_penalty")}
                    setValue={(value: number) =>
                        updateSettings({
                            modelOptions: {
                                ...settings.modelOptions,
                                presence_penalty: value,
                            },
                        })
                    }
                    min={MIN_PRESENCE_PENALTY}
                    max={MAX_PRESENCE_PENALTY}
                    step={0.05}
                />
                <SliderSettingsItem
                    name={"Max Tokens"}
                    description={
                        "This parameter changes the maximum number of tokens the model is allowed to generate. This includes the chain of thought tokens before the answer."
                    }
                    value={settings.modelOptions.max_tokens}
                    errorMessage={errors.get("modelOptions.max_tokens")}
                    setValue={(value: number) =>
                        updateSettings({
                            modelOptions: {
                                ...settings.modelOptions,
                                max_tokens: value,
                            },
                        })
                    }
                    min={MIN_MAX_TOKENS}
                    max={MAX_MAX_TOKENS}
                    step={10}
                />
            </>)}

            <h2>Preprocessing</h2>
            <CheckBoxSettingItem
                name={"Don't include dataviews"}
                description={
                    "Dataview(js) blocks can be quite long while not providing much value to the AI. If this setting is enabled, data view blocks will be removed promptly to reduce the number of tokens. This could save you some money in the long run."
                }
                enabled={settings.dontIncludeDataviews}
                setEnabled={(value) =>
                    updateSettings({dontIncludeDataviews: value})
                }
            />
            <SliderSettingsItem
                name={"Maximum Prefix Length"}
                description={
                    "The maximum number of characters that will be included in the prefix. A larger value will increase the context for the completion, but it can also increase the cost or push you over the token limit."
                }
                value={settings.maxPrefixCharLimit}
                errorMessage={errors.get("maxPrefixCharLimit")}
                setValue={(value: number) =>
                    updateSettings({maxPrefixCharLimit: value})
                }
                min={MIN_MAX_CHAR_LIMIT}
                max={MAX_MAX_CHAR_LIMIT}
                step={100}
                suffix={" chars"}
            />
            <SliderSettingsItem
                name={"Maximum Suffix Length"}
                description={
                    "The maximum number of characters that will be included in the suffix. A larger value will increase the context for the completion, but it can also increase the cost or push you over the token limit."
                }
                value={settings.maxSuffixCharLimit}
                errorMessage={errors.get("maxSuffixCharLimit")}
                setValue={(value: number) =>
                    updateSettings({maxSuffixCharLimit: value})
                }
                min={MIN_MAX_CHAR_LIMIT}
                max={MAX_MAX_CHAR_LIMIT}
                step={100}
                suffix={" chars"}
            />
            <h2>Postprocessing</h2>
            <CheckBoxSettingItem
                name={"Auto remove duplicate mat block indicators"}
                description={
                    "The AI model might eagerly add a math block indicator ($), even though the cursor is already inside a math block. If this setting is enabled, the plugin will automatically remove these duplicate indicators from the completion."
                }
                enabled={settings.removeDuplicateMathBlockIndicator}
                setEnabled={(value) =>
                    updateSettings({removeDuplicateMathBlockIndicator: value})
                }
            />
            <CheckBoxSettingItem
                name={"Auto remove duplicate mat block indicators"}
                description={
                    "The AI model might eagerly add a code block indicator (`), even though the cursor is already inside a code block. If this setting is enabled, the plugin will automatically remove these duplicate indicators from the completion."
                }
                enabled={settings.removeDuplicateCodeBlockIndicator}
                setEnabled={(value) =>
                    updateSettings({removeDuplicateCodeBlockIndicator: value})
                }
            />

            <h2>Trigger</h2>
            <SliderSettingsItem
                name={"Delay"}
                description={
                    "Delay in ms between the last character typed and the completion request."
                }
                value={settings.delay}
                errorMessage={errors.get("delay")}
                setValue={(value: number) => updateSettings({delay: value})}
                min={MIN_DELAY}
                max={MAX_DELAY}
                step={100}
                suffix={"ms"}
            />
            <TriggerSettings
                name={"Trigger words"}
                description={
                    "Completions will be triggered if the text before the matches any of these words or characters. This can either be a direct string match or a regex match. When using a regex, make sure to include the end of line character ($)."
                }
                triggers={settings.triggers}
                setValues={(triggers) => updateSettings({triggers})}
                errorMessage={errors.get("triggerWords")}
                errorMessages={errors}
            />
            <h2>Privacy</h2>
            <SettingsItem
                name={"Ignored files"}
                description={
                    <div>
                        <p>This field enables you to specify files and directories that the plugin should ignore. When
                            you open any of these files, the plugin will automatically disable itself and display a
                            'disabled' status in the bottom menu. Enter one pattern per line. These patterns function
                            similar to glob patterns. Here are some frequently used patterns:</p>
                        <ul>
                            <li><code>path/to/folder/**</code>: This pattern ignores all files and sub folders within
                                this folder.
                            </li>
                            <li><code>"**/secret/**"</code>: This pattern ignores any file located inside a 'secret'
                                directory,
                                regardless of its location in the path.
                            </li>
                            <li><code>!path/to/folder/example.md</code>: This pattern explicitly undoes an ignore,
                                making this file noticeable to the plugin.
                            </li>
                            <li><code>**/*Python*.md</code>: This pattern ignores any file with 'Python' in its name,
                                irrespective of its location.
                            </li>
                        </ul>
                    </div>
                }
                display={"block"}
                errorMessage={errors.get("ignoredFilePatterns")}
            >
                <textarea
                    className="setting-item-text-area-copilot-auto-completion"
                    rows={10}
                    placeholder="Your file patterns, e.g., **/secret/**"
                    value={settings.ignoredFilePatterns}
                    onChange={(e) =>
                        updateSettings({
                            ignoredFilePatterns: e.target.value
                        })
                    }
                />
            </SettingsItem>
            <SettingsItem
                name={"Ignored tags"}
                description={
                    <div>
                        <p>Files containing any of these tags will be ignored. When you open a file containing a
                             tag listed here, the plugin will automatically disable itself and display a 'disabled'
                             status in the bottom menu. Enter one tag per line.
                        </p>
                    </div>
                }
                display={"block"}
                errorMessage={errors.get("ignoredTags")}
            >
                <textarea
                    className="setting-item-text-area-copilot-auto-completion"
                    rows={10}
                    placeholder="Your file tags, e.g., secret"
                    value={settings.ignoredTags}
                    onChange={(e) =>
                        updateSettings({
                            ignoredTags: e.target.value
                        })
                    }
                />
            </SettingsItem>

            <h2>Danger zone</h2>
            <SettingsItem
                name={"Factory Reset"}
                description={
                    "Messed-up the settings? No worries, press this button! After that, the plugin will go back to the default settings. The URL and API key will remain unchanged."
                }
            >
                <button
                    aria-label="Reset to default settings"
                    onClick={resetSettings}
                >
                    Reset
                </button>
            </SettingsItem>
            <CheckBoxSettingItem
                name={"Advanced mode"}
                description={
                    "If you are familiar with prompt engineering, you can enable this setting to view the prompt generation and a few shot example settings. Turn off this button. It will not reset your changes; use the factory reset button for that."
                }
                enabled={settings.advancedMode}
                setEnabled={(value) => updateSettings({advancedMode: value})}
            />

            {settings.advancedMode && (
                <>
                    <h2>Advanced</h2>
                    <TextSettingItem
                        name={"Chain of thought removal regex"}
                        description={
                            "This regex is used to remove the chain of thought tokens from the generated answer. If it is not implemented correctly, the chain of thought tokens will be included in the suggested completion."
                        }
                        placeholder={"your regex..."}
                        value={settings.chainOfThoughRemovalRegex}
                        errorMessage={errors.get("chainOfThoughRemovalRegex")}
                        setValue={(value: string) =>
                            updateSettings({
                                chainOfThoughRemovalRegex: value,
                            })
                        }
                    />

                    <SettingsItem
                        name={"System Message"}
                        description={
                            "This system message gives the models all the context and instructions they need to complete the answer generation tasks. You can edit this message to your liking. If you edit the chain of thought formatting, make sure to update the extract regex and examples accordingly."
                        }
                        display={"block"}
                        errorMessage={errors.get("systemMessage")}
                    >
                        <textarea
                            className="setting-item-text-area-copilot-auto-completion"
                            rows={10}
                            placeholder="Your system message..."
                            value={settings.systemMessage}
                            onChange={(e) =>
                                updateSettings({
                                    systemMessage: e.target.value,
                                })
                            }
                        />
                    </SettingsItem>

                    <SettingsItem
                        name={"User Message template"}
                        description={
                            "This template defines how the prefix and suffix are formatted to create the user message. You have access to two variables: {{prefix}} and {{suffix}}. If you edit this, make sure to update the examples accordingly."
                        }
                        display={"block"}
                        errorMessage={errors.get("userMessageTemplate")}
                    >
                        <textarea
                            className="setting-item-text-area-copilot-auto-completion"
                            rows={3}
                            placeholder="{{prefix}}<mask/>{{suffix}}"
                            value={settings.userMessageTemplate}
                            onChange={(e) =>
                                updateSettings({
                                    userMessageTemplate: e.target.value,
                                })
                            }
                        />
                    </SettingsItem>
                    <FewShotExampleSettings
                        fewShotExamples={settings.fewShotExamples}
                        name={"Few Shot Examples"}
                        description={
                            "The model uses these examples to learn the expected answer format. Not all examples are sent at the same time. We only send the relevant examples, given the current cursor location. For example, the CodeBlock examples are only sent if the cursor is in a code block. If no special context is detected, we send the Text examples. Each context has a default of 2 examples, but you can add or remove examples if there is at least one per context. You can add more examples, but this will increase the inference costs."
                        }
                        setFewShotExamples={(value) =>
                            updateSettings({fewShotExamples: value})
                        }
                        errorMessages={errors}

                    />
                </>
            )}
        </div>
    );
}
