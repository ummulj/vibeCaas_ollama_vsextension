declare module 'node-fetch' {
  const anyFetch: any;
  export default anyFetch;
}

declare module 'vosk' {
  export const Model: any;
  export const Recognizer: any;
  export function setLogLevel(level: number): void;
}

declare module 'node-record-lpcm16' {
  const record: any;
  export = record;
}

