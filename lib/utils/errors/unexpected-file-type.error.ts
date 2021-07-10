export class UnexpectedFileTypeError extends Error {
  constructor(fileType: string, supportedFileTypes: string[]) {
    super(`Unexpected file type ${fileType}. Supported types: ${supportedFileTypes.join(', ')}`);
  }
}
