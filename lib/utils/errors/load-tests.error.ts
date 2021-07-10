export class LoadAssertionsErrors extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'Load tests error';
  }
}
