import { createJSONStorage } from 'jotai/utils';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const storage = createJSONStorage<any>(() => sessionStorage);
