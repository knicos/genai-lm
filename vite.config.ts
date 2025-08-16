/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';

// https://vitejs.dev/config/
export default defineConfig({
    test: {
        environment: 'jsdom',
        setupFiles: './src/setupTests.ts',
        clearMocks: true,
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
});
