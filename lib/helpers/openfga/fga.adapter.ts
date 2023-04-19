import {
  AuthorizationModel as OpenFgaAuthorizationModel,
  ClientConfiguration,
  ClientTupleKey,
  ClientWriteResponse,
  CredentialsMethod,
  OpenFgaClient,
  ReadResponse,
  Tuple,
  TupleKey,
} from '@openfga/sdk';
import { Configuration as Auth0FgaConfiguration } from '@auth0/fga';
import { createRequestFunction } from '@openfga/sdk/dist/common';
import * as globalAxios from 'axios';
import { version as packageVersion } from '../../../package.json';

export type AuthorizationModel = Required<Pick<OpenFgaAuthorizationModel, 'type_definitions'>> &
  OpenFgaAuthorizationModel;

const { API_HOST, API_SCHEME, READ_TUPLE_LIMIT = 5000 } = process.env;
const TUPLE_MAX_WRITE_CHUNK = 10;

const { PLAYGROUND_URL } = process.env;

export interface EnvironmentConfiguration {
  apiScheme: string;
  apiHost: string;
  apiTokenIssuer?: string;
  apiAudience?: string;
  allowNoAuth?: boolean;
}

export enum KnownEnvironment {
  US = 'us',
  Staging = 'staging',
  Playground = 'playground',
  Custom = 'custom',
}

export const knownEnvironmentConfigurations: KnownEnvironment[] = Object.values(KnownEnvironment);

export interface OpenFgaClientConfig {
  storeId: string;
  apiToken?: string;
  clientId?: string;
  clientSecret?: string;
  apiTokenIssuer?: string;
  apiAudience?: string;
  environment?: KnownEnvironment;
  apiScheme?: string;
  apiHost?: string;
  immutableBypassSecret?: string;
}

const AUTH0_PROD_HOSTS = [Auth0FgaConfiguration.getEnvironmentConfiguration(KnownEnvironment.US).apiHost,
    Auth0FgaConfiguration.getEnvironmentConfiguration(KnownEnvironment.Staging).apiHost];
const AUTH0_PLAY_HOST = Auth0FgaConfiguration.getEnvironmentConfiguration(KnownEnvironment.Playground).apiHost;

export class FgaAdapter extends OpenFgaClient {
  constructor(config: OpenFgaClientConfig) {
    super(FgaAdapter.buildConfig(config));

    if (config.immutableBypassSecret) {
      this.configuration.baseOptions = {
        ...(this.configuration.baseOptions || { headers: {} }),
      };
      this.configuration.baseOptions!.headers['Immutable-Bypass-Secret'] = config.immutableBypassSecret;
      this.configuration.baseOptions!.headers['User-Agent'] = `rhamzeh-openfga-cli ${packageVersion}`;
    }
  }

  private static getEnvironmentConfiguration(knownEnvironment: string): EnvironmentConfiguration {
    if (knownEnvironment === KnownEnvironment.Custom) {
      return {
        apiScheme: 'http',
        apiHost: 'localhost:8080', // default openfga
      };
    }
    return Auth0FgaConfiguration.getEnvironmentConfiguration(knownEnvironment);
  }

  private static buildConfig(config: OpenFgaClientConfig): ClientConfiguration {
    const environmentConfig: Partial<EnvironmentConfiguration> = config.environment
      ? this.getEnvironmentConfiguration(config.environment)
      : {};

    let credentials: ClientConfiguration['credentials'];
    if (config.apiToken) {
      credentials = {
        method: CredentialsMethod.ApiToken,
        config: {
          token: config.apiToken,
        },
      };
    } else if (config.clientId) {
      credentials = {
        method: CredentialsMethod.ClientCredentials,
        config: {
          clientId: config.clientId || '',
          clientSecret: config.clientSecret || '',
          apiTokenIssuer: config.apiTokenIssuer || environmentConfig.apiTokenIssuer || '',
          apiAudience: config.apiAudience || environmentConfig.apiAudience || '',
        },
      };
    } else {
      credentials = {
        method: CredentialsMethod.None,
      };
    }

    return {
      apiScheme: API_SCHEME || config.apiScheme || environmentConfig.apiScheme,
      apiHost: API_HOST || config.apiHost || environmentConfig.apiHost || '',
      storeId: config.storeId,
      credentials,
    };
  }

  public static createNewClient(config: OpenFgaClientConfig): FgaAdapter {
    return new FgaAdapter(config);
  }

  public get apiUri(): string {
    return `${this.configuration.apiScheme}://${this.configuration.apiHost}`;
  }

  public get playgroundUri(): string | undefined {
    if (PLAYGROUND_URL) {
      return PLAYGROUND_URL;
    }
    if (this.apiUri === `https://${AUTH0_PLAY_HOST}`) {
      return 'https://play.fga.dev';
    }
    if (this.apiUri === 'http://localhost:8080') {
      return 'http://localhost:3000/playground';
    }
    return undefined;
  }

  public get canCreateGetOrModifyStore(): boolean {
    return !(this.configuration.apiScheme === "https" &&
      AUTH0_PROD_HOSTS.includes(this.configuration.apiHost)); 
  }

  public get canQueryStores(): boolean {
    return !(this.configuration.apiScheme === "https" &&
      AUTH0_PROD_HOSTS.concat(AUTH0_PLAY_HOST).includes(this.configuration.apiHost)); 
  }

  async readTuples(): Promise<ReadResponse> {
    let tuples: Tuple[] = [];
    let continuationToken: string | undefined;

    try {
      do {
        const response = await this.read({}, { continuationToken } as any);
        tuples = tuples.concat(response.tuples || []);
        continuationToken = response.continuation_token;
      } while (continuationToken && tuples.length < Number(READ_TUPLE_LIMIT));

      return { tuples } as any;
    } catch (e) {
      do {
        const options = {
          method: 'POST',
          headers: {},
          data: '',
          ...this.configuration.baseOptions,
        };
        options.headers['Content-Type'] = 'application/json';
        const data = continuationToken ? { continuation_token: continuationToken } : {};
        options['data'] = JSON.stringify(data);

        const requestOptions = {
          url: `/stores/${this.configuration.storeId}/read-tuples`,
          options,
        };

        const fn = createRequestFunction(requestOptions, globalAxios as any, this.configuration, this.credentials);

        const response = await fn();

        tuples = tuples.concat(response.tuples || []);
        continuationToken = response.continuation_token;
      } while (continuationToken && tuples.length < Number(READ_TUPLE_LIMIT));

      return { tuples };
    }
  }

  async deleteAllTuples(): Promise<void> {
    const { tuples } = await this.readTuples();

    if (!tuples?.length) {
      return;
    }

    await this.deleteTuples(tuples.map((tuple) => ({ ...(tuple.key as Required<TupleKey>) })));
  }

  public async writeTuples(writeKeys: ClientTupleKey[]): Promise<ClientWriteResponse> {
    return super.writeTuples(writeKeys, {
      transaction: {
        disable: true,
        maxPerChunk: TUPLE_MAX_WRITE_CHUNK,
      },
    });
  }
}
