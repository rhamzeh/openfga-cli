import { Options as YargsOptions } from 'yargs';

import { baseArgsDef, BaseCommandArgs } from '../utils/types/base-command-args';
import { FgaAdapter } from '../helpers/openfga/fga.adapter';

interface CommandArgs extends BaseCommandArgs {
  user: string;
  relation: string;
  object: string;
  authorizationModelId: string;
}

exports.command = 'check [storeId]';
exports.desc = 'Check whether a user is related to an object as a certain relation';
exports.builder = {
  ...baseArgsDef,
  authorizationModelId: {
    describe: 'Authorization Model ID. env var=OPENFGA_AUTHORIZATION_MODEL_ID',
    default: 'latest',
    type: 'string',
  },
  user: {
    describe: 'User. env var=OPENFGA_USER',
    demandOption: true,
    type: 'string',
  },
  relation: {
    describe: 'Relation. env var=OPENFGA_RELATION',
    demandOption: true,
    type: 'string',
  },
  object: {
    describe: 'Object. env var=OPENFGA_OBJECT',
    demandOption: true,
    type: 'string',
  },
} as Record<keyof CommandArgs, YargsOptions>;

exports.handler = async (argv: CommandArgs) => {
  try {
    const { user, relation, object, authorizationModelId } = argv;

    const client = FgaAdapter.createNewClient(argv);

    const { allowed } = await client.check({
      user,
      relation,
      object,
    });

    console.info(
      `Check:\n${
        authorizationModelId ? `- Namespaces Configuration Version ID: ${authorizationModelId}\n` : ''
      }- User: ${user}\n- Relation: ${relation}\n- Object: ${object}\n\nRelationship? ${allowed ? 'Yes' : 'No'}`,
    );
  } catch (err) {
    console.error((err as Error).message);
    process.exitCode = 1;
  }
};
