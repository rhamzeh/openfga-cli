import { Options as YargsOptions } from 'yargs';

import { DataFormat, saveFile } from '../../helpers/save-config';
import { BaseCommandArgs } from '../../utils/types/base-command-args';
import { getSyntaxFormatFromFileExtension, loadSyntax, SupportedFileExtension } from '../../helpers/transform-syntax';
import { FgaAdapter } from '../../helpers/openfga/fga.adapter';
import { AuthorizationModel } from '@openfga/sdk';

interface CommandArgs {
  configDir: string;
  outputFormat: SupportedFileExtension;
  includeTuples: boolean;
  includeAssertions: boolean;
}

exports.command = 'export';
exports.desc = 'Export an authorization model';
exports.builder = {
  configDir: {
    describe: 'Directory containing the configuration files. env var=OPENFGA_CONFIG_DIR',
    demandOption: true,
    type: 'string',
  },
  outputFormat: {
    describe: 'Choice of format to export the configuration as. env var=OPENFGA_OUTPUT_FORMAT',
    type: 'string',
    default: SupportedFileExtension.Json,
    choices: Object.values(SupportedFileExtension),
  },
  includeTuples: {
    describe: 'Whether to also export tuples. env var=OPENFGA_INCLUDE_TUPLES',
    default: true,
    type: 'boolean',
  },
  includeAssertions: {
    describe: 'Whether to also export assertions. env var=OPENFGA_INCLUDE_ASSERTIONS',
    default: true,
    type: 'boolean',
  },
} as Record<keyof CommandArgs, YargsOptions>;

exports.handler = async (argv: CommandArgs & BaseCommandArgs) => {
  try {
    const { configDir, includeTuples, includeAssertions } = argv;

    const client = FgaAdapter.createNewClient(argv);

    const { authorization_model: authorizationModel } = await client.readAuthorizationModel();
    client.authorizationModelId = authorizationModel?.id;

    await saveFile(
      configDir,
      `authorization-model.${argv.outputFormat}`,
      DataFormat.JSON,
      JSON.parse(
        loadSyntax(
          <Required<Pick<AuthorizationModel, 'type_definitions'>>>authorizationModel!,
          getSyntaxFormatFromFileExtension(argv.outputFormat),
        ),
      ),
    );
    if (includeAssertions) {
      const tuples = await client.readAssertions();
      await saveFile(configDir, 'assertions.json', DataFormat.JSON, tuples);
    }
    if (includeTuples) {
      const tuples = await client.readTuples();
      await saveFile(configDir, 'tuples.json', DataFormat.JSON, tuples);
    }
    console.info(`Export completed`);
  } catch (err) {
    console.error(err as Error);
    process.exitCode = 1;
  }
};
