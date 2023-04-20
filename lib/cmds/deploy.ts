import { Options as YargsOptions } from 'yargs';

import { loadData } from '../helpers/load-config';
import { InputValidationError } from '../utils/errors';
import { baseArgsDef, BaseCommandArgs } from '../utils/types/base-command-args';
import { FgaAdapter } from '../helpers/openfga/fga.adapter';

interface CommandArgs extends BaseCommandArgs {
  configDir: string;
  overwriteTuples: boolean;
  appendTuples: boolean;
  overwriteAssertions: boolean;
}

exports.command = 'deploy [configDir]';
exports.desc = 'Deploy Authorization Model';
exports.builder = {
  ...baseArgsDef,
  configDir: {
    describe:
      'Directory containing the configuration files. It must contain: authorization-model.json, tuples.json and assertions.json. env var=OPENFGA_CONFIG_DIR',
    demandOption: true,
    type: 'string',
  },
  overwriteTuples: {
    describe: 'WARNING: If set, will overwrite all existing tuples in the store. env var=OPENFGA_OVERWRITE_TUPLES',
    default: false,
    type: 'boolean',
  },
  appendTuples: {
    describe: 'WARNING: If set, will overwrite all existing tuples in the store. env var=OPENFGA_APPEND_TUPLES',
    default: false,
    type: 'boolean',
  },
  overwriteAssertions: {
    describe:
      'WARNING: If set, will overwrite all existing assertions in the store. env var=OPENFGA_OVERWRITE_ASSERTIONS',
    default: false,
    type: 'boolean',
  },
} as Record<keyof CommandArgs, YargsOptions>;

exports.handler = async (argv: CommandArgs) => {
  console.info('Deploying configuration to %s from config dir: %s', argv.storeId, argv.configDir);

  try {
    if (!argv.storeId) {
      throw new InputValidationError('storeId not provided');
    }
    const storeConfig = await loadData(argv);

    const client = FgaAdapter.createNewClient(argv);

    const { authorization_model_id: authorizationModelId } = await client.writeAuthorizationModel({
      schema_version: storeConfig.schemaVersion,
      type_definitions: storeConfig.typeDefinitions,
    });

    console.info(
      'Deployed new authorization model\n - Environment: %s\n - API URL: %s\n - Store ID: %s\n - Authorization Model Version ID: %s',
      argv.environment,
      client.apiUri,
      storeConfig.id,
      authorizationModelId,
    );

    if (client.playgroundUri) {
      console.info(
        'You can visualize this store on this link: %s/stores/create/?id=%s',
        client.playgroundUri,
        storeConfig.id,
      );
    }

    if (argv.overwriteAssertions) {
      client.authorizationModelId = authorizationModelId;
      await client.validateAndWriteAssertions(storeConfig.assertions);
      console.info('Assertions reloaded');
    }

    if (argv.overwriteTuples) {
      await client.validateAndReloadTuples(storeConfig.tuples);
      console.info('Tuples reloaded');
    } else if (argv.appendTuples) {
      await client.validateAndReloadTuples(storeConfig.tuples, true);
      console.info('Tuples appended');
    }

    console.info('Done');
  } catch (err) {
    console.error('Deploy failed: ', (err as Error).message);
    process.exitCode = 1;
  }
};
