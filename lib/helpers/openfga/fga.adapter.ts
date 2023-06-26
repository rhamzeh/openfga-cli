import {
  Assertion,
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
import { createRequestFunction } from '@openfga/sdk/dist/common';
import * as globalAxios from 'axios';
import { version as packageVersion } from '../../../package.json';
import {
  AUTH0_PLAY_HOST,
  AUTH0_PROD_HOSTS,
  Auth0FgaConfiguration,
  EnvironmentConfiguration,
  KnownEnvironment,
} from './environment-config';
import { validate } from '../../utils/validate';
import { LoadAssertionsErrors, LoadTuplesErrors } from '../../utils/errors';
import { assertionsSchema, FgaAssertion, FgaAssertionResult, tuplesSchema } from './schema';

export type AuthorizationModel = Required<Pick<OpenFgaAuthorizationModel, 'type_definitions'>> &
  OpenFgaAuthorizationModel;

const { API_HOST, API_SCHEME, READ_TUPLE_LIMIT = 5000 } = process.env;
const TUPLE_MAX_WRITE_CHUNK = 10;

const { PLAYGROUND_URL } = process.env;

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
    return !(this.configuration.apiScheme === 'https' && AUTH0_PROD_HOSTS.includes(this.configuration.apiHost));
  }

  public get canQueryStores(): boolean {
    return !(
      this.configuration.apiScheme === 'https' &&
      AUTH0_PROD_HOSTS.concat(AUTH0_PLAY_HOST).includes(this.configuration.apiHost)
    );
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
    const writeResults = await super.writeTuples(writeKeys, {
      transaction: {
        disable: true,
        maxPerChunk: TUPLE_MAX_WRITE_CHUNK,
      },
    });
    const firstError = writeResults.writes.find((result) => result.err);
    if (firstError) throw firstError;
    return writeResults;
  }

  public async validateAndWriteAssertions(assertions: Assertion[]): Promise<void> {
    const { valid, errors } = validate<Assertion>(assertions, assertionsSchema);

    if (!valid) {
      console.error('Unable to load assertions due to syntax errors: ', errors);
      throw new LoadAssertionsErrors('Bad syntax in assertions file');
    }

    await this.writeAssertions(
      assertions.map((assertion) => ({
        ...(assertion.tuple_key as ClientTupleKey),
        expectation: assertion.expectation || false,
      })),
    );
  }

  public async validateAndReloadTuples(tuples: ClientTupleKey[], onlyAppend = false): Promise<void> {
    const { valid, errors } = validate<ClientTupleKey>(tuples, tuplesSchema);

    if (!valid) {
      console.error('Unable to load tuples due to syntax errors: ', errors);
      throw new LoadTuplesErrors('Bad syntax in tuples.yaml');
    }

    if (!onlyAppend) {
      await this.deleteAllTuples();
    }
    await this.writeTuples(tuples);
  }

  public async executeTest(test: FgaAssertion): Promise<FgaAssertionResult> {
    const { allowed } = await this.check({
      ...(test.tuple_key as ClientTupleKey),
      contextualTuples: test.contextual_tuples || [],
    });
    const response = !!allowed;

    return { test, assertionResult: test.expectation === response, response };
  }

  public async executeTests(tests: FgaAssertion[]): Promise<boolean> {
    const { valid, errors } = validate<FgaAssertion>(tests, assertionsSchema);

    if (!valid) {
      console.error('Fail to load tests with errors:', errors);
      throw new LoadAssertionsErrors('Bad tests syntax');
    }

    const result = await Promise.all(tests.map(async (item) => await this.executeTest(item)));
    const failedAssertions = result
      .filter((item) => !item.assertionResult)
      .map((item) => ({
        ...item.test,
        response: item.response,
      }));

    if (failedAssertions.length) {
      const errorsArray = failedAssertions.map(
        (item) =>
          `- user=${item.tuple_key!.user}, relation=${item.tuple_key!.relation}, object=${
            item.tuple_key!.object
          }, contextual_tuples=${
            JSON.stringify((item.contextual_tuples as any)?.map((ct: any) => ct.tuple_key)) || []
          }\n  expected: ${item.expectation}, got: ${item.response}`,
      );
      console.error(['Failed assertions:'].concat(errorsArray).join('\n'));
    }

    return !failedAssertions.length;
  }
}
