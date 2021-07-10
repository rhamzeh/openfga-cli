export class InvalidConfigError extends Error {
  constructor(err: unknown) {
    super((err as Error).message);
    this.stack = (err as Error).stack;
  }
}
