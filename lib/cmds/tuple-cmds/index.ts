import { CommandModule } from 'yargs';

import * as writeTuples from './write';
import * as deleteTuples from './delete';

export const commands: CommandModule[] = [writeTuples as CommandModule, deleteTuples as CommandModule];
