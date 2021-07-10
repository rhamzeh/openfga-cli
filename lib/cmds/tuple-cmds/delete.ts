import { Options as YargsOptions } from 'yargs';

import { BaseCommandArgs } from '../../utils/types/base-command-args';
import { FgaAdapter } from '../../helpers/openfga/fga.adapter';

interface CommandArgs {
  user: string;
  relation: string;
  object: string;
}

exports.command = 'delete [user] [relation] [object]';
exports.desc = 'Delete an existing relationship tuple in the system';
exports.builder = {
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

exports.handler = async (argv: CommandArgs & BaseCommandArgs) => {
  try {
    const { user, relation, object } = argv;

    const client = FgaAdapter.createNewClient(argv);

    await client.deleteTuples([{ user, relation, object }]);

    console.info(`Tuple deleted:\n- User: ${user}\n- Relation: ${relation}\n- Object: ${object}\n`);
  } catch (err) {
    console.error((err as Error).message);
    process.exitCode = 1;
  }
};
