import { Options as YargsOptions } from 'yargs';
import { knownEnvironmentConfigurations, KnownEnvironment } from '../../helpers/openfga/fga.adapter';

export interface BaseCommandArgs {
  storeId: string;
  environment: KnownEnvironment;
  clientId?: string;
  clientSecret?: string;
  immutableBypassSecret?: string;
}

export const baseArgsDef = {
  storeId: {
    describe: 'Store ID. env var=OPENFGA_STORE_ID',
    demandOption: true,
    type: 'string',
  },
  environment: {
    describe: `Environment. Defaults to "${KnownEnvironment.Custom}". env var=OPENFGA_ENVIRONMENT`,
    default: KnownEnvironment.Custom,
    type: 'string',
    choices: knownEnvironmentConfigurations,
  },
  clientId: {
    describe: 'Client Id. env var=OPENFGA_CLIENT_ID',
    type: 'string',
  },
  clientSecret: {
    describe: 'Client Secret. env var=OPENFGA_CLIENT_SECRET',
    type: 'string',
  },
  immutableBypassSecret: {
    describe: 'Immutable Bypass Secret. env var=OPENFGA_IMMUTABLE_BYPASS_SECRET',
    type: 'string',
  },
} as Record<keyof BaseCommandArgs, YargsOptions>;
