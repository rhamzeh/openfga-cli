export class InvalidFileFormatError extends Error {
  constructor(fileInput: string, detectedFileType: string, error: Error) {
    super(
      `Error processing file: ${fileInput}\nDetected file type: ${detectedFileType}\nError message: ${error.message}`,
    );
  }
}
