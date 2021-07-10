import { Configuration } from '@openfga/sdk/dist/configuration';
import { AxiosError } from 'axios';
import { ApiError } from './api.error';

export class ReadAssertionsError extends ApiError {
  authorizationModelId: string;

  constructor(config: Configuration, authorizationModelId: string, err: AxiosError) {
    super(config, 'ReadAssertions', err);
    console.error(
      `Unable to read assertions from authorization model id ${authorizationModelId} due to error: `,
      this.errorMessage,
    );

    this.stack = (err as Error).stack;
    this.authorizationModelId = authorizationModelId;
  }
}
