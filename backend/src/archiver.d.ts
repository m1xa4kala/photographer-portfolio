declare module 'archiver' {
  import { Stream } from 'stream';

  interface ArchiverOptions {
    zlib?: { level?: number };
  }

  export class ZipArchive {
    constructor(options?: ArchiverOptions);
    append(
      source: NodeJS.ReadableStream | Buffer | string,
      data: { name: string },
    ): this;
    pipe<T extends Stream>(destination: T): T;
    finalize(): Promise<void>;
  }
}
