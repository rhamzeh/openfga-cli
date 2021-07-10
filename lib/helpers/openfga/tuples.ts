import { ClientTupleKey } from '@openfga/sdk';

import { validate } from '../../utils/validate';
import { LoadTuplesErrors } from '../../utils/errors';
import { tuplesSchema } from '../../utils/schema';
import { FgaAdapter } from './fga.adapter';

export async function reloadTuples(client: FgaAdapter, tuples: ClientTupleKey[], onlyAppend = false): Promise<void> {
  const { valid, errors } = validate<ClientTupleKey>(tuples, tuplesSchema);

  if (valid) {
    if (!onlyAppend) {
      await client.deleteAllTuples();
    }
    await client.writeTuples(tuples);
  } else {
    console.error('Unable to load tuples due to syntax errors: ', errors);
    throw new LoadTuplesErrors('Bad syntax in tuples.yaml');
  }
}
