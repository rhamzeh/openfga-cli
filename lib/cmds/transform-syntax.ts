import { readFile } from 'fs/promises';
import path from 'path';
import { Options as YargsOptions } from 'yargs';

import { loadSyntax, SupportedFileExtension, SyntaxFormat, transformToApiSyntax } from '../helpers/transform-syntax';
import { assertNever } from '../utils/assert-never';
import { InvalidFileFormatError, UnexpectedFileTypeError } from '../utils/errors';

interface CommandArgs {
  inputFile: string;
}

exports.command = 'transform <inputFile>';
exports.desc = 'Transform between OpenFGA JSON API and DSL';
exports.builder = {
  inputFile: {
    describe: 'Configuration file. It must be in yaml or json syntax. env var=OPENFGA_INPUT_FILE',
    type: 'string',
  },
} as Record<keyof CommandArgs, YargsOptions>;

function transform(fileContents: string, fileExtension: SupportedFileExtension): string {
  switch (fileExtension) {
    case SupportedFileExtension.Json:
      return loadSyntax(JSON.parse(fileContents), SyntaxFormat.Friendly2);
    case SupportedFileExtension.Yaml:
    case SupportedFileExtension.Yml:
      return JSON.stringify(transformToApiSyntax(fileContents, SyntaxFormat.Friendly1), null, '  ');
    case SupportedFileExtension.Scl:
    case SupportedFileExtension.Dsl:
    case SupportedFileExtension.Ofga:
    case SupportedFileExtension.OpenFga:
      return JSON.stringify(transformToApiSyntax(fileContents, SyntaxFormat.Friendly2), null, '  ');
    default:
      assertNever(fileExtension);
  }
}

async function loadFile(inputFile: string) {
  return readFile(inputFile, 'utf-8');
}

exports.handler = async (argv: CommandArgs) => {
  // console.log('Converting file: %s', argv.inputFile);
  try {
    const fileExtension = path.extname(argv.inputFile).split('.').reverse()[0] as SupportedFileExtension;

    if (!Object.values(SupportedFileExtension).includes(fileExtension as SupportedFileExtension)) {
      throw new UnexpectedFileTypeError(fileExtension, Object.values(SupportedFileExtension));
    }

    const fileContents = await loadFile(argv.inputFile);
    try {
      const output = transform(fileContents, fileExtension);
      console.info(output);
    } catch (err) {
      console.error(err as Error);
      throw new InvalidFileFormatError(argv.inputFile, fileExtension, err as Error);
    }
  } catch (err) {
    console.error(err as Error);
    process.exitCode = 1;
  }
};
