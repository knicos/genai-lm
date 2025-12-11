import { TeachableLLM } from '@genai-fi/nanogpt';

export default function waitModelLoaded(model: TeachableLLM): Promise<void> {
    return new Promise((resolve, reject) => {
        if (model.loaded) {
            resolve();
        } else {
            model.on('loaded', () => {
                resolve();
            });
            model.on('error', (err) => {
                reject(err);
            });
        }
    });
}
