import { Assertion, ClientTupleKey, TupleKey, TypeDefinition } from '@openfga/sdk';
import { ulid } from 'ulid';
import { existsSync } from 'fs';
import { readFile } from 'fs/promises';
import yaml from 'js-yaml';
import JSON5 from 'json5';
import path from 'path';

import { InvalidConfigError, LoadAssertionsErrors } from '../utils/errors';
import { assertionsSchema, FgaAssertion, tuplesSchema } from '../utils/schema';
import { validate } from '../utils/validate';
import { SupportedFileExtension, SyntaxFormat, transformToApiSyntax } from './transform-syntax';
import { Schema } from 'ajv';
import { SchemaVersion } from '@openfga/syntax-transformer/dist/constants/schema-version';

const loadRequiredFile = async (configDir: string, fileName: string): Promise<string> => {
  try {
    return readFile(path.join(configDir, fileName), 'utf-8');
  } catch (err: unknown) {
    throw new InvalidConfigError(err);
  }
};

export interface loadedDataType {
  id: string;
  schemaVersion: SchemaVersion;
  typeDefinitions: TypeDefinition[];
  tuples: ClientTupleKey[];
  assertions: Assertion[];
}

async function loadAuthorizationModel(configDir: string) {
  let fileExtension: SupportedFileExtension, syntaxFormat: SyntaxFormat;
  if (existsSync(path.join(configDir, '/authorization-model.json'))) {
    fileExtension = SupportedFileExtension.Json;
    syntaxFormat = SyntaxFormat.Api;
  } else if (existsSync(path.join(configDir, '/authorization-model.yaml'))) {
    fileExtension = SupportedFileExtension.Yaml;
    syntaxFormat = SyntaxFormat.Friendly1;
  } else if (existsSync(path.join(configDir, '/authorization-model.yml'))) {
    fileExtension = SupportedFileExtension.Yml;
    syntaxFormat = SyntaxFormat.Friendly1;
  } else if (existsSync(path.join(configDir, '/authorization-model.scl'))) {
    fileExtension = SupportedFileExtension.Scl;
    syntaxFormat = SyntaxFormat.Friendly2;
  } else if (existsSync(path.join(configDir, '/authorization-model.openfga'))) {
    fileExtension = SupportedFileExtension.OpenFga;
    syntaxFormat = SyntaxFormat.Friendly2;
  } else if (existsSync(path.join(configDir, '/authorization-model.ofga'))) {
    fileExtension = SupportedFileExtension.Ofga;
    syntaxFormat = SyntaxFormat.Friendly2;
  } else {
    throw new Error('authorization_model_file_not_found');
  }

  const fileContentsRaw = await loadRequiredFile(configDir, `/authorization-model.${fileExtension}`);
  const fileContents = fileContentsRaw
    .split('\n')
    .filter((line) => !line.startsWith('    # '))
    .join('\n');
  return (
    transformToApiSyntax(fileContents, syntaxFormat) || {
      schema_version: SchemaVersion.OneDotOne,
      type_definitions: [],
    }
  );
}

async function loadTuplesOrAssertions<T = TupleKey>(
  configDir: string,
  fileBaseName: string,
  schema: Schema = tuplesSchema,
): Promise<T[]> {
  let fileExtension: SupportedFileExtension;
  if (existsSync(path.join(configDir, `/${fileBaseName}.json`))) {
    fileExtension = SupportedFileExtension.Json;
  } else if (existsSync(path.join(configDir, `/${fileBaseName}.yaml`))) {
    fileExtension = SupportedFileExtension.Yaml;
  } else if (existsSync(path.join(configDir, `/${fileBaseName}.yml`))) {
    fileExtension = SupportedFileExtension.Yml;
  } else {
    throw new Error('tuples_not_found');
  }
  const fileContent = await loadRequiredFile(configDir, `/${fileBaseName}.${fileExtension}`);
  let data: T[];
  switch (fileExtension) {
    case SupportedFileExtension.Json:
      data = (JSON5.parse(fileContent) || []) as T[];
      break;
    case SupportedFileExtension.Yaml:
    case SupportedFileExtension.Yml:
      data = (yaml.load(fileContent) || []) as T[];
      break;
    default:
      throw new Error(`${fileBaseName}_file_not_found`);
  }

  const { valid, errors } = validate<T>(data, schema);

  if (!valid) {
    console.error(`Unable to load ${fileBaseName} due to syntax errors: `, errors);
    throw new LoadAssertionsErrors(`Bad syntax in ${fileBaseName}.${fileExtension} file`);
  }

  return data;
}

async function loadTuples(configDir: string): Promise<ClientTupleKey[]> {
  return loadTuplesOrAssertions<ClientTupleKey>(configDir, 'tuples', tuplesSchema);
}

async function loadAssertions(configDir: string): Promise<FgaAssertion[]> {
  return loadTuplesOrAssertions<FgaAssertion>(configDir, 'assertions', assertionsSchema);
}

export const loadData = async ({
  storeId,
  configDir,
}: {
  storeId?: string;
  configDir: string;
}): Promise<loadedDataType> => {
  const authorizationModel = await loadAuthorizationModel(configDir);
  const tuples = await loadTuples(configDir);
  const assertions = await loadAssertions(configDir);

  return {
    id: storeId || ulid(),
    schemaVersion: (authorizationModel.schema_version as SchemaVersion) || SchemaVersion.OneDotZero,
    typeDefinitions: authorizationModel.type_definitions,
    tuples,
    assertions,
  };
};
