import { LoadAssertionsErrors } from '../../utils/errors';
import { assertionsSchema, FgaAssertionResult, FgaAssertion } from '../../utils/schema';
import { validate } from '../../utils/validate';
import { FgaAdapter } from './fga.adapter';
import { Assertion, ClientTupleKey } from '@openfga/sdk';

export async function reloadAssertions(client: FgaAdapter, assertions: Assertion[]): Promise<void> {
  const { valid, errors } = validate<Assertion>(assertions, assertionsSchema);

  if (valid) {
    await client.writeAssertions(
      assertions.map((assertion) => ({
        ...(assertion.tuple_key as ClientTupleKey),
        expectation: assertion.expectation || false,
      })),
    );
  } else {
    console.error('Unable to load assertions due to syntax errors: ', errors);
    throw new LoadAssertionsErrors('Bad syntax in assertions file');
  }
}

async function runTest(client: FgaAdapter, test: FgaAssertion): Promise<FgaAssertionResult> {
  const { allowed } = await client.check({
    ...(test.tuple_key as ClientTupleKey),
    contextualTuples: (test.contextual_tuples?.tuple_keys as ClientTupleKey[]) || [],
  });
  const response = !!allowed;

  return { test, assertionResult: test.expectation === response, response };
}

export async function executeTests(client: FgaAdapter, tests: FgaAssertion[]): Promise<boolean> {
  const { valid, errors } = validate<FgaAssertion>(tests, assertionsSchema);

  if (valid) {
    const result = await Promise.all(tests.map(async (item) => await runTest(client, item)));
    const failedAssertions = result
      .filter((item) => item.assertionResult !== true)
      .map((item) => ({
        ...item.test,
        response: item.response,
      }));

    if (failedAssertions.length) {
      const errorsArray = failedAssertions.map(
        (item) =>
          `- user=${item.tuple_key!.user}, relation=${item.tuple_key!.relation}, object=${
            item.tuple_key!.object
          }, contextual_tuples${item.contextual_tuples}\n  expected: ${item.expectation}, got: ${item.response}`,
      );
      console.error(['Failed assertions:'].concat(errorsArray).join('\n'));
    }

    return failedAssertions.length === 0;
  }

  console.error('Fail to load tests with errors:', errors);
  throw new LoadAssertionsErrors('Bad tests syntax');
}
