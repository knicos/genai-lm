/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { execSync } from 'child_process';

function getGitTag() {
    try {
        return execSync('git describe --tags --abbrev=0', { stdio: ['ignore'] })
            .toString()
            .trim();
    } catch {
        return 'unknown';
    }
}

const GIT_TAG = getGitTag();

// https://vitejs.dev/config/
export default defineConfig({
    resolve: {
        preserveSymlinks: false,
    },
    test: {
        environment: 'jsdom',
        setupFiles: ['./src/setupTests.ts', '@vitest/web-worker'],
        clearMocks: true,
        execArgv: ['--no-webstorage'],
        coverage: {
            provider: 'v8',
            reporter: ['cobertura', 'html'],
            include: ['src/**/*.{ts,tsx}'],
        },
        server: {
            deps: {
                inline: ['@genai-fi/base'],
            },
        },
    },
    plugins: [react()],
    define: {
        __GIT_TAG__: JSON.stringify(GIT_TAG),
    },
});
