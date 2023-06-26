import { Options as YargsOptions } from 'yargs';
import { randomUUID } from 'node:crypto';

import { loadData } from '../helpers/load-config';
import { baseArgsDef, BaseCommandArgs } from '../utils/types/base-command-args';
import { FgaAdapter } from '../helpers/openfga/fga.adapter';
import { ClientTupleKey } from '@openfga/sdk';
import * as crypto from "crypto";

interface CommandArgs extends Omit<BaseCommandArgs, 'storeId'> {
  storeId?: string;
  configDir: string;
  keepState: boolean;
}

exports.command = 'run-tests [configDir]';
exports.desc = 'Runs tests against the provided directory';
exports.builder = {
  ...baseArgsDef,
  storeId: {
    describe: 'Store ID. env var=OPENFGA_STORE_ID',
    type: 'string',
  },
  configDir: {
    describe:
      'Directory containing the configuration files. It must contain: authorization-model.json, tuples.json and assertions.json. env var=OPENFGA_CONFIG_DIR',
    demandOption: true,
    type: 'string',
  },
  keepState: {
    describe: 'Whether to keep the tuples after test run.  Otherwise, tuples will be cleared if all tests pass.',
    default: false,
    type: 'boolean',
  },
} as Record<keyof CommandArgs, YargsOptions>;

exports.handler = async (argv: CommandArgs) => {
  console.info('Running tests.\nConfiguration Dir: %s', argv.configDir);

  // Load config
  try {
    const { assertions, schemaVersion, tuples, typeDefinitions } = await loadData(argv);

    const client = FgaAdapter.createNewClient({
      ...argv,
      storeId: undefined!,
    });

    if (client.canCreateGetOrModifyStore) {
      const { id } = await client.createStore({ name: `Test Store ${randomUUID()}` });
      client.storeId = id!;
    } else  {
      client.storeId = randomUUID();
    }

    if (client.playgroundUri) {
      console.info('You can visualize this store on this link: %s/stores/create/?id=%s', client.playgroundUri, client.storeId);
    }

    // Write model
    const { authorization_model_id: authorizationModelId } = await client.writeAuthorizationModel({
      schema_version: schemaVersion,
      type_definitions: typeDefinitions,
    });
    console.info(
      'Deployed new authorization model\n - Environment: %s\n - API URL: %s\n - Store ID: %s\n - Authorization Model Version ID: %s',
      argv.environment,
      client.apiUri,
      client.storeId,
      authorizationModelId,
    );
    client.authorizationModelId = authorizationModelId;
    // Write tuples
    await client.validateAndReloadTuples(tuples);

    // Run tests
    const pass = await client.executeTests(assertions);
    // Clean up existing tuples
    if (!argv.keepState) {
      await client.deleteAllTuples();
    } else {
      await client.writeAssertions(
        assertions.map((assertion) => ({
          ...(assertion.tuple_key as ClientTupleKey),
          expectation: assertion.expectation,
        })),
      );
    }
    console.info('Test pass', pass);
    process.exitCode = pass ? 0 : 1;
  } catch (err) {
    console.error('Test failed due to error: ', (err as Error).message, err);
    process.exitCode = 1;
  }
};
