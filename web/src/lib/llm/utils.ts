import { Persona } from "@/app/admin/assistants/interfaces";
import { LLMProviderDescriptor } from "@/app/admin/configuration/llm/interfaces";
import { LlmDescriptor } from "@/lib/hooks";

export function getFinalLLM(
  llmProviders: LLMProviderDescriptor[],
  persona: Persona | null,
  currentLlm: LlmDescriptor | null
): [string, string] {
  const defaultProvider = llmProviders.find(
    (llmProvider) => llmProvider.is_default_provider
  );

  let provider = defaultProvider?.provider || "";
  let model = defaultProvider?.default_model_name || "";

  if (persona) {
    // Map "provider override" to actual LLLMProvider
    if (persona.llm_model_provider_override) {
      const underlyingProvider = llmProviders.find(
        (item: LLMProviderDescriptor) =>
          item.name === persona.llm_model_provider_override
      );
      provider = underlyingProvider?.provider || provider;
    }
    model = persona.llm_model_version_override || model;
  }

  if (currentLlm) {
    provider = currentLlm.provider || provider;
    model = currentLlm.modelName || model;
  }

  return [provider, model];
}

export function getLLMProviderOverrideForPersona(
  liveAssistant: Persona,
  llmProviders: LLMProviderDescriptor[]
): LlmDescriptor | null {
  const overrideProvider = liveAssistant.llm_model_provider_override;
  const overrideModel = liveAssistant.llm_model_version_override;

  if (!overrideModel) {
    return null;
  }

  const matchingProvider = llmProviders.find(
    (provider) =>
      (overrideProvider ? provider.name === overrideProvider : true) &&
      provider.model_names.includes(overrideModel)
  );

  if (matchingProvider) {
    return {
      name: matchingProvider.name,
      provider: matchingProvider.provider,
      modelName: overrideModel,
    };
  }

  return null;
}

const MODEL_NAMES_SUPPORTING_IMAGE_INPUT = [
  "gpt-4o",
  "gpt-4.1",
  "gpt-4o-mini",
  "gpt-4-vision-preview",
  "gpt-4-turbo",
  "gpt-4-1106-vision-preview",
  // standard claude names
  "claude-3-5-sonnet-20240620",
  "claude-3-5-sonnet-20241022",
  "claude-3-7-sonnet-20250219",
  "claude-3-opus-20240229",
  "claude-3-sonnet-20240229",
  "claude-3-haiku-20240307",
  // custom claude names
  "claude-3.5-sonnet-v2@20241022",
  "claude-3-7-sonnet@20250219",
  // claude names with AWS Bedrock Suffix
  "claude-3-opus-20240229-v1:0",
  "claude-3-sonnet-20240229-v1:0",
  "claude-3-haiku-20240307-v1:0",
  "claude-3-5-sonnet-20240620-v1:0",
  "claude-3-5-sonnet-20241022-v2:0",
  // claude names with full AWS Bedrock names
  "anthropic.claude-3-opus-20240229-v1:0",
  "anthropic.claude-3-sonnet-20240229-v1:0",
  "anthropic.claude-3-haiku-20240307-v1:0",
  "anthropic.claude-3-5-sonnet-20240620-v1:0",
  "anthropic.claude-3-5-sonnet-20241022-v2:0",
  "anthropic.claude-3-7-sonnet-20250219-v1:0",
  "claude-3.7-sonnet@202502019",
  "claude-3-7-sonnet-202502019",
  // google gemini model names
  "gemini-1.5-pro",
  "gemini-1.5-flash",
  "gemini-1.5-pro-001",
  "gemini-1.5-flash-001",
  "gemini-1.5-pro-002",
  "gemini-1.5-flash-002",
  "gemini-2.0-flash-exp",
  "gemini-2.0-flash-001",
  "gemini-2.0-pro-exp-02-05",
  // amazon models
  "amazon.nova-lite@v1",
  "amazon.nova-pro@v1",
  // meta models
  "llama-3.2-90b-vision-instruct",
  "llama-3.2-11b-vision-instruct",
  "Llama-3-2-11B-Vision-Instruct-yb",
];

export function checkLLMSupportsImageInput(model: string) {
  // Original exact match check
  const exactMatch = MODEL_NAMES_SUPPORTING_IMAGE_INPUT.some(
    (modelName) => modelName.toLowerCase() === model.toLowerCase()
  );

  if (exactMatch) {
    return true;
  }

  // Additional check for the last part of the model name
  const modelParts = model.split(/[/.]/);
  const lastPart = modelParts[modelParts.length - 1]?.toLowerCase();

  // Try matching the last part
  const lastPartMatch = MODEL_NAMES_SUPPORTING_IMAGE_INPUT.some((modelName) => {
    const modelNameParts = modelName.split(/[/.]/);
    const modelNameLastPart = modelNameParts[modelNameParts.length - 1];
    // lastPart is already lowercased above for tiny performance gain
    return modelNameLastPart?.toLowerCase() === lastPart;
  });

  if (lastPartMatch) {
    return true;
  }

  // If no match found, try getting the text after the first slash
  if (model.includes("/")) {
    const afterSlash = model.split("/")[1]?.toLowerCase();
    return MODEL_NAMES_SUPPORTING_IMAGE_INPUT.some((modelName) =>
      modelName.toLowerCase().includes(afterSlash)
    );
  }

  return false;
}

export const structureValue = (
  name: string,
  provider: string,
  modelName: string
) => {
  return `${name}__${provider}__${modelName}`;
};

export const destructureValue = (value: string): LlmDescriptor => {
  const [displayName, provider, modelName] = value.split("__");
  return {
    name: displayName,
    provider,
    modelName,
  };
};

export const findProviderForModel = (
  llmProviders: LLMProviderDescriptor[],
  modelName: string
): string => {
  const provider = llmProviders.find((p) => p.model_names.includes(modelName));
  return provider ? provider.provider : "";
};
