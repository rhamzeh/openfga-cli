import { CommandModule } from 'yargs';

import * as check from './check';
import * as deploy from './deploy';
import * as relationshipTuple from './tuple';
import * as runTests from './run-tests';
import * as storeConfig from './store-config';
import * as transformSyntax from './transform-syntax';

export const commands: CommandModule[] = [
  check as CommandModule,
  deploy as CommandModule,
  relationshipTuple as CommandModule,
  runTests as CommandModule,
  storeConfig as CommandModule,
  transformSyntax as CommandModule,
];
