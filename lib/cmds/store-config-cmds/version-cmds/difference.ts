import * as Diff from 'diff';

import { BaseCommandArgs } from '../../../utils/types/base-command-args';
import { loadSyntax, SupportedFileExtension, SyntaxFormat } from '../../../helpers/transform-syntax';
import { AuthorizationModel, FgaAdapter } from '../../../helpers/openfga/fga.adapter';

enum Color {
  Green = '\x1b[32m',
  White = '\x1b[37m',
  Red = '\x1b[31m',
}

interface CommandArgs {
  configVersionIdA: string;
  configVersionIdB: string;
  outputFormat: SupportedFileExtension;
}

exports.command = 'diff [configVersionIdA] [configVersionIdB]';
exports.desc = 'Diff between two configuration versions';
exports.builder = {
  configVersionIdA: {
    describe: 'Base authorization model id',
    demandOption: true,
    type: 'string',
  },
  configVersionIdB: {
    describe: 'Second authorization model id',
    default: 'latest',
    type: 'string',
  },
  outputFormat: {
    describe: 'Choice of format to export the authorization model diff as. env var=OPENFGA_OUTPUT_FORMAT',
    type: 'string',
    default: SupportedFileExtension.Json,
    choices: Object.values(SupportedFileExtension),
  },
};

exports.handler = async (argv: CommandArgs & BaseCommandArgs) => {
  try {
    const client = FgaAdapter.createNewClient(argv);

    const { authorization_model: modelA } = await client.readAuthorizationModel({
      authorizationModelId: argv.configVersionIdA,
    });
    const { authorization_model: modelB } = await client.readAuthorizationModel({
      authorizationModelId: argv.configVersionIdB,
    });

    if (!(modelA && modelB)) {
      throw new Error('Not all config versions are found');
    }

    let modelAString = '';
    let modelBString = '';
    if (argv.outputFormat === SupportedFileExtension.Json) {
      modelAString = JSON.stringify(modelA, null, '  ');
      modelBString = JSON.stringify(modelB, null, '  ');
    } else if (argv.outputFormat === SupportedFileExtension.Yaml || argv.outputFormat === SupportedFileExtension.Yml) {
      modelAString = loadSyntax(modelA as AuthorizationModel, SyntaxFormat.Friendly1);
      modelBString = loadSyntax(modelB as AuthorizationModel, SyntaxFormat.Friendly1);
    } else if (argv.outputFormat === SupportedFileExtension.Scl || argv.outputFormat === SupportedFileExtension.Ofga) {
      modelAString = loadSyntax(modelA as AuthorizationModel, SyntaxFormat.Friendly2);
      modelBString = loadSyntax(modelB as AuthorizationModel, SyntaxFormat.Friendly2);
    }

    const diff = Diff.diffChars(modelAString, modelBString);

    diff.forEach((part) => {
      const colour = part.added ? Color.Green : part.removed ? Color.Red : Color.White;
      process.stderr.write(`${colour}${part.value}`);
    });

    console.log();
  } catch (err) {
    console.error(err as Error);
    process.exitCode = 1;
  }
};
