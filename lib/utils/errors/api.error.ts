import { Configuration } from '@openfga/sdk/dist/configuration';
import { AxiosError } from 'axios';

export class ApiError extends Error {
  config: Configuration;
  errorMessage: unknown;
  errorDetails: AxiosError;
  operation: string;
  constructor(config: Configuration, operation: string, err: AxiosError) {
    const msg = `Operation ${operation} failed due to error: ${(err.response?.data as any)?.message}`;
    super(msg);

    this.config = config;
    this.operation = operation;
    this.errorMessage = err.response?.data;
    this.errorDetails = err;
  }
}
