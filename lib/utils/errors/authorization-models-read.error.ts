import { Configuration } from '@openfga/sdk/dist/configuration';
import { AxiosError } from 'axios';
import { ApiError } from './api.error';

export class ReadAuthorizationModelsError extends ApiError {
  constructor(config: Configuration, err: AxiosError) {
    super(config, 'ReadAuthorizationModels', err);
    console.error(`Unable to read authorization models due to error: `, this.errorMessage);

    this.stack = (err as Error).stack;
  }
}
