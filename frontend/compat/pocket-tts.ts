export class PocketTTS {
  constructor(_options: unknown) {}
  async load(_onProgress?: unknown): Promise<void> {}
  async loadVoice(_voice: string): Promise<string> { return ""; }
  async stop(): Promise<void> {}
  destroy(): void {}
  async generate(_text: string, _options: unknown): Promise<{ stopped: boolean; audioDuration: number }> { return { stopped: true, audioDuration: 0 }; }
}

export class StreamingPlayer {
  constructor(_options: unknown) {}
  resume(): Promise<void> { return Promise.resolve(); }
  stop(): void {}
  destroy(): Promise<void> { return Promise.resolve(); }
  reset(): void {}
  play(_audio: unknown, _meta: unknown): void {}
  flush(): void {}
}
