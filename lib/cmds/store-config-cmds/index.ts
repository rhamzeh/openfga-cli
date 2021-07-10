import { CommandModule } from 'yargs';

import * as exportConfig from './export';
import * as version from './version';
import * as migrate from './migrate';

export const commands: CommandModule[] = [
  exportConfig as CommandModule,
  version as CommandModule,
  migrate as CommandModule,
];
