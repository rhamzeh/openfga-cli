import { BaseCommandArgs } from '../../../utils/types/base-command-args';
import {
  getSyntaxFormatFromFileExtension,
  loadSyntax,
  SupportedFileExtension,
} from '../../../helpers/transform-syntax';
import { AuthorizationModel, FgaAdapter } from '../../../helpers/openfga/fga.adapter';

interface CommandArgs {
  authorizationModelId: string;
  outputFormat: SupportedFileExtension;
}

exports.command = 'show [authorizationModelId]';
exports.desc = 'Prints the authorization at a particular id';
exports.builder = {
  authorizationModelId: {
    describe: 'Authorization model id. env var=OPENFGA_CONFIG_VERSION_ID',
    default: 'latest',
    type: 'string',
  },
  outputFormat: {
    describe: 'Choice of format to export the authorization model as. env var=OPENFGA_OUTPUT_FORMAT',
    type: 'string',
    default: SupportedFileExtension.Json,
    choices: Object.values(SupportedFileExtension),
  },
};

exports.handler = async (argv: CommandArgs & BaseCommandArgs) => {
  try {
    const client = FgaAdapter.createNewClient(argv);

    const { authorization_model: authorizationModel } = await client.readAuthorizationModel({
      authorizationModelId: argv.authorizationModelId,
    });

    if (!authorizationModel) {
      throw new Error('Config version not found');
    }

    loadSyntax(authorizationModel as AuthorizationModel, getSyntaxFormatFromFileExtension(argv.outputFormat));
  } catch (err) {
    console.error((err as Error).message);
    process.exitCode = 1;
  }
};
