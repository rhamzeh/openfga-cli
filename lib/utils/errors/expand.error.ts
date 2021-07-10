import { Configuration } from '@openfga/sdk/dist/configuration';
import { AxiosError } from 'axios';
import { ApiError } from './api.error';

export class ExpandError extends ApiError {
  relation: string | undefined;
  object: string | undefined;

  constructor(config: Configuration, relation: string | undefined, object: string | undefined, err: AxiosError) {
    super(config, 'Expand', err);
    console.error(`Unable to expand relation ${relation} object ${object} due to error: `, this.errorMessage);

    this.stack = (err as Error).stack;
    this.relation = relation;
    this.object = object;
  }
}
