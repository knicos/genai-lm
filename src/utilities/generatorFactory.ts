import { IGenerator, TeachableLLM } from '@genai-fi/nanogpt';

let virtualGenerator: ((model: TeachableLLM) => IGenerator) | null = null;

export function createGenerator(model: TeachableLLM) {
    if (virtualGenerator) {
        return virtualGenerator(model);
    }

    return model.generator();
}

export function setGeneratorFactory(factory: (model: TeachableLLM) => IGenerator) {
    virtualGenerator = factory;
}

export function resetGeneratorFactory() {
    virtualGenerator = null;
}
