import { ITrainingJob, IGeneratorResponse, TeachableLLM } from '@genai-fi/nanogpt';

export async function wait(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function waitResponseDone(model: TeachableLLM, responseId: string, timeout = 10000): Promise<void> {
    return new Promise((resolve, reject) => {
        const startTime = Date.now();
        const checkInterval = 100; // Check every 100ms

        const checkResponse = () => {
            const response: IGeneratorResponse | null = model.responses.getResponse(responseId);
            if (!response) {
                reject(new Error(`Response with ID ${responseId} not found.`));
                return;
            }

            if (response.done) {
                resolve();
                return;
            }

            if (Date.now() - startTime >= timeout) {
                reject(new Error(`Timeout waiting for response ${responseId} to complete.`));
                return;
            }

            setTimeout(checkResponse, checkInterval);
        };

        checkResponse();
    });
}

export async function waitTrainingDone(model: TeachableLLM, jobId: string, timeout = 10000): Promise<void> {
    return new Promise((resolve, reject) => {
        const startTime = Date.now();
        const checkInterval = 100; // Check every 100ms

        const checkJob = () => {
            const job: ITrainingJob | null = model.responses.getResponse(jobId);
            if (!job) {
                reject(new Error(`Job with ID ${jobId} not found.`));
                return;
            }

            if (job.state === 'completed' || job.state === 'error' || job.state === 'cancelled') {
                resolve();
                return;
            }

            if (Date.now() - startTime >= timeout) {
                reject(new Error(`Timeout waiting for job ${jobId} to complete.`));
                return;
            }

            setTimeout(checkJob, checkInterval);
        };

        checkJob();
    });
}
