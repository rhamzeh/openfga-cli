import { Argv, CommandModule } from 'yargs';

import { commands } from './version-cmds';

exports.command = 'version';
exports.desc = 'List, show and diff authorization model versions';
exports.builder = (yargs: Argv) => {
  return yargs.command(commands as unknown as CommandModule);
};
