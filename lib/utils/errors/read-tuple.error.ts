import { Configuration } from '@openfga/sdk/dist/configuration';
import { AxiosError } from 'axios';
import { ApiError } from './api.error';

export class ReadTupleError extends ApiError {
  user: string | undefined;
  relation: string | undefined;
  object: string | undefined;

  constructor(
    config: Configuration,
    user: string | undefined,
    relation: string | undefined,
    object: string | undefined,
    err: AxiosError,
  ) {
    super(config, 'ReadTuple', err);

    console.error(
      `Unable to read tuple for user ${user} relation ${relation} object ${object} due to error: `,
      this.errorMessage,
    );
    this.stack = (err as Error).stack;
    this.user = user;
    this.relation = relation;
    this.object = object;
  }
}
