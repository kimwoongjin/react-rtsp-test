declare module 'node-rtsp-stream' {
  interface StreamOptions {
    name: string;
    streamUrl: string;
    wsPort: number;
    ffmpegOptions?: Record<string, string | number>;
  }

  class Stream {
    constructor(options: StreamOptions);
  }

  export = Stream;
}
