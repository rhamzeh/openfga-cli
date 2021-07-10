import { Argv } from 'yargs';

import { commands } from './tuple-cmds';
import { KnownEnvironment, knownEnvironmentConfigurations } from '../helpers/openfga/fga.adapter';

exports.command = 'tuple [storeId]';
exports.desc = 'Interact with relationship tuples in the system';
exports.builder = (yargs: Argv) => {
  return yargs
    .command(commands as any)
    .option('storeId', {
      describe: 'Store ID. env var=OPENFGA_STORE_ID',
      demandOption: true,
      type: 'string',
    })
    .option('environment', {
      describe: `Environment. Defaults to "${KnownEnvironment.Custom}". env var=OPENFGA_ENVIRONMENT`,
      default: KnownEnvironment.Custom,
      type: 'string',
      choices: knownEnvironmentConfigurations,
    })
    .option('clientId', {
      describe: 'Client Id. env var=OPENFGA_CLIENT_ID',
      type: 'string',
    })
    .option('clientSecret', {
      describe: 'Client Secret. env var=OPENFGA_CLIENT_SECRET',
      type: 'string',
    });
};
