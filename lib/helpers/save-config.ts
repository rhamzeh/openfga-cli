import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import yaml from 'js-yaml';
import { InvalidConfigError } from '../utils/errors';

export enum DataFormat {
  String = 'string',
  Yaml = 'yaml',
  JSON = 'json',
}

export const saveFile = async (
  configDir: string,
  fileName: string,
  dataFormat: DataFormat,
  data: unknown,
): Promise<void> => {
  try {
    const dataToWrite = DataFormat.JSON
      ? JSON.stringify(data, null, '  ')
      : DataFormat.Yaml
      ? yaml.dump(data)
      : (data as string);
    await mkdir(configDir, { recursive: true });
    await writeFile(path.join(configDir, fileName), dataToWrite);
  } catch (err: unknown) {
    throw new InvalidConfigError(err);
  }
};
