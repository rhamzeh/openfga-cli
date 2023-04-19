import { Options as YargsOptions } from 'yargs';

import { BaseCommandArgs } from '../../utils/types/base-command-args';
import { reloadTuples } from '../../helpers/openfga/tuples';
import { reloadAssertions } from '../../helpers/openfga/assertions';
import { FgaAdapter, KnownEnvironment, knownEnvironmentConfigurations } from '../../helpers/openfga/fga.adapter';
import { ClientTupleKey } from '@openfga/sdk';
import { InputValidationError } from "../../utils/errors";

interface CommandArgs {
  includeTuples: boolean;
  includeAssertions: boolean;
  toStoreId?: string;
  toClientId?: string;
  toClientSecret?: string;
  toEnvironment?: KnownEnvironment;
}

exports.command = 'migrate';
exports.desc = 'Migrate a store to another';
exports.builder = {
  includeTuples: {
    describe: 'Whether to also migrate tuples. env var=OPENFGA_INCLUDE_TUPLES',
    default: false,
    type: 'boolean',
  },
  includeAssertions: {
    describe: 'Whether to also migrate assertions. env var=OPENFGA_INCLUDE_ASSERTIONS',
    default: true,
    type: 'boolean',
  },
  toStoreId: {
    describe: 'Store ID. env var=OPENFGA_TO_STORE_ID',
    type: 'string',
  },
  toEnvironment: {
    describe: `Environment. Defaults to "${KnownEnvironment.Custom}". env var=OPENFGA_TO_ENVIRONMENT`,
    default: KnownEnvironment.Custom,
    type: 'string',
    choices: knownEnvironmentConfigurations,
  },
  toClientId: {
    describe: 'Client ID. env var=OPENFGA_TO_CLIENT_ID',
    type: 'string',
  },
  toClientSecret: {
    describe: 'Client Secret. env var=OPENFGA_TO_CLIENT_SECRET',
    type: 'string',
  },
} as Record<keyof CommandArgs, YargsOptions>;

exports.handler = async (argv: CommandArgs & BaseCommandArgs) => {
  try {
    const { toStoreId, toClientId, toClientSecret, toEnvironment, includeTuples, includeAssertions } = argv;

    const client = FgaAdapter.createNewClient(argv);
    const client2 = FgaAdapter.createNewClient({
      ...argv,
      storeId: toStoreId!,
      clientId: toClientId,
      clientSecret: toClientSecret,
      environment: toEnvironment,
    });

    if (!toStoreId) {
      if (!client2.canCreateGetOrModifyStore) {
        throw new InputValidationError("toStoreId not provided");
      } else {
        const oldStore = await client.getStore().catch(() => undefined);
        const { id } = await client2.createStore({ name: oldStore?.name! || "New FGA Store" });
        client2.storeId = id!;
      }
    }

    const { authorization_model: output } = await client.readLatestAuthorizationModel();
    const newAuthzModel = await client2.writeAuthorizationModel({
      schema_version: output?.schema_version,
      type_definitions: output?.type_definitions || [],
    });

    if (client2.playgroundUri) {
      console.info(
        'You can visualize this store on this link: %s/stores/create/?id=%s',
        client2.playgroundUri,
        client2.storeId,
      );
    }

    if (includeTuples) {
      const { tuples } = await client.readTuples();
      await reloadTuples(client2, tuples?.map((tuple) => ({ ...(tuple.key as ClientTupleKey) })) || [], true);
    }
    if (includeAssertions) {
      client.authorizationModelId = output?.id;
      client2.authorizationModelId = newAuthzModel?.authorization_model_id;
      const { assertions } = await client.readAssertions();
      await reloadAssertions(client2, assertions || []);
    }
    console.info(`Migration completed`);
  } catch (err) {
    console.error(err as Error);
    process.exitCode = 1;
  }
};
