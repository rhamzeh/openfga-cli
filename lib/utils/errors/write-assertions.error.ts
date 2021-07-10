import { Assertion } from '@openfga/sdk';
import { Configuration } from '@openfga/sdk/dist/configuration';
import { AxiosError } from 'axios';
import { ApiError } from './api.error';

export class WriteAssertionsError extends ApiError {
  authorizationModelId: string;
  assertions: Assertion[];
  constructor(config: Configuration, authorizationModelId: string, assertions: Assertion[], err: AxiosError) {
    super(config, 'WriteAssertions', err);
    console.error(
      `Unable to write assertions with assertion id ${authorizationModelId} assertions ${assertions} due to error: `,
      this.errorMessage,
    );
    this.stack = (err as Error).stack;
    this.authorizationModelId = authorizationModelId;
    this.assertions = assertions;
  }
}
