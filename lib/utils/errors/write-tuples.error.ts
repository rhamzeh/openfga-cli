import { TupleKey } from '@openfga/sdk';
import { Configuration } from '@openfga/sdk/dist/configuration';
import { AxiosError } from 'axios';
import { ApiError } from './api.error';

export class WriteTuplesError extends ApiError {
  tupleKeys: TupleKey[];
  constructor(config: Configuration, tupleKeys: TupleKey[], err: AxiosError) {
    super(config, 'WriteTuples', err);
    console.error(`Unable to write tuples ${tupleKeys} due to error: `, this.errorMessage);
    this.stack = (err as Error).stack;
    this.tupleKeys = tupleKeys;
  }
}
