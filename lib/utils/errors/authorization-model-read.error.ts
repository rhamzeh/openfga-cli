import { Configuration } from '@openfga/sdk/dist/configuration';
import { AxiosError } from 'axios';
import { ApiError } from './api.error';

export class AuthorizationModelReadError extends ApiError {
  modelId: string;
  constructor(config: Configuration, modelId: string, err: AxiosError) {
    super(config, 'ReadAuthorizationModel', err);
    console.error(`Unable to read type definitions with model id ${modelId} due to error: `, this.errorMessage);

    this.stack = (err as Error).stack;
    this.modelId = modelId;
  }
}
