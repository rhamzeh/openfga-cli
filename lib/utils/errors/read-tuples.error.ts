import { Configuration } from '@openfga/sdk/dist/configuration';
import { AxiosError } from 'axios';
import { ApiError } from './api.error';

export class ReadTuplesError extends ApiError {
  continuationToken: unknown;
  constructor(config: Configuration, continuationToken: unknown, err: AxiosError) {
    super(config, 'ReadTuples', err);

    console.error(
      `Unable to read tuples for continuation token ${continuationToken} due to error: `,
      this.errorMessage,
    );

    this.stack = (err as Error).stack;
    this.continuationToken = continuationToken;
  }
}
