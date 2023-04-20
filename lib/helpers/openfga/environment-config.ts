import { Configuration } from '@auth0/fga';

export const Auth0FgaConfiguration = Configuration;

export enum KnownEnvironment {
  US = 'us',
  Staging = 'staging',
  Playground = 'playground',
  Custom = 'custom',
}

export interface EnvironmentConfiguration {
  apiScheme: string;
  apiHost: string;
  apiTokenIssuer?: string;
  apiAudience?: string;
  allowNoAuth?: boolean;
}

export const knownEnvironmentConfigurations: KnownEnvironment[] = Object.values(KnownEnvironment);

export const AUTH0_PROD_HOSTS = [Auth0FgaConfiguration.getEnvironmentConfiguration(KnownEnvironment.US).apiHost,
    Auth0FgaConfiguration.getEnvironmentConfiguration(KnownEnvironment.Staging).apiHost];
export const AUTH0_PLAY_HOST = Auth0FgaConfiguration.getEnvironmentConfiguration(KnownEnvironment.Playground).apiHost;