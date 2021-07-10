import { Configuration } from '@openfga/sdk/dist/configuration';
import { AxiosError } from 'axios';
import { ApiError } from './api.error';
import { TypeDefinition } from '@openfga/sdk';

export class AuthorizationModelLoadError extends ApiError {
  typeDefinitions: TypeDefinition[];
  constructor(config: Configuration, typeDefinitions: TypeDefinition[], err: AxiosError) {
    super(config, 'WriteAuthorizationModel', err);
    console.error(`Unable to load type definitions ${typeDefinitions} due to error: `, this.errorMessage);

    this.stack = (err as Error).stack;
    this.typeDefinitions = typeDefinitions;
  }
}
