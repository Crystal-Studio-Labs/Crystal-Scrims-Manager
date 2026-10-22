export const logger = {
  info: (message: string, ...args: unknown[]) => {
    console.log(`[\x1b[34mINFO\x1b[0m] [${new Date().toISOString()}] ${message}`, ...args);
  },
  success: (message: string, ...args: unknown[]) => {
    console.log(`[\x1b[32mSUCCESS\x1b[0m] [${new Date().toISOString()}] ${message}`, ...args);
  },
  warn: (message: string, ...args: unknown[]) => {
    console.warn(`[\x1b[33mWARN\x1b[0m] [${new Date().toISOString()}] ${message}`, ...args);
  },
  error: (message: string, ...args: unknown[]) => {
    console.error(`[\x1b[31mERROR\x1b[0m] [${new Date().toISOString()}] ${message}`, ...args);
  },
  debug: (message: string, ...args: unknown[]) => {
    if (process.env.DEBUG === 'true') {
      console.log(`[\x1b[35mDEBUG\x1b[0m] [${new Date().toISOString()}] ${message}`, ...args);
    }
  },
};
