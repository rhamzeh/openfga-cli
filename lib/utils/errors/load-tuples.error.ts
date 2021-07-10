export class LoadTuplesErrors extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'Load tuples error';
  }
}
