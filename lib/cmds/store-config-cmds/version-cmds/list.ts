import { BaseCommandArgs } from '../../../utils/types/base-command-args';
import ulid = require('ulid');
import { FgaAdapter } from '../../../helpers/openfga/fga.adapter';

exports.command = 'list';
exports.desc = 'Prints the list of authorization model ids in chronological order (latest last)';
exports.builder = {};

exports.handler = async (argv: BaseCommandArgs) => {
  try {
    const client = FgaAdapter.createNewClient(argv);

    const authorizationModelIds =
      (await client.readAuthorizationModels()).authorization_models?.map((model) => model.id as string) || [];

    const output = authorizationModelIds
      .sort()
      .reverse()
      .map((id: string) => {
        const parsedId = ulid.decodeTime(id!);
        return `- ID: ${id} * Date: ${new Date(parsedId).toISOString()}`;
      })
      .join('\n');

    console.info(output);
  } catch (err) {
    console.error((err as Error).message);
    process.exitCode = 1;
  }
};
