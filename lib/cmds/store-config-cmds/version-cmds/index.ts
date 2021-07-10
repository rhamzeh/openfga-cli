import { CommandModule } from 'yargs';

import * as diffConfig from './difference';
import * as listConfig from './list';
import * as showConfig from './show';

export const commands: CommandModule[] = [
  diffConfig as CommandModule,
  listConfig as CommandModule,
  showConfig as CommandModule,
];
