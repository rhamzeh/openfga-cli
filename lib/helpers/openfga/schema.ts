import { Assertion, CheckRequest } from '@openfga/sdk';

export type FgaAssertion = Assertion & Pick<CheckRequest, 'contextual_tuples'>;

export interface FgaAssertionResult {
  test: FgaAssertion;
  assertionResult: boolean;
  response: boolean;
}

const relationshipTupleSchema = {
  type: 'object',
  required: ['user', 'relation', 'object'],
  properties: {
    user: {
      type: 'string',
    },
    relation: {
      type: 'string',
    },
    object: {
      type: 'string',
    },
  },
};

export const tuplesSchema = {
  type: 'array',
  items: relationshipTupleSchema,
};

export const assertionSchema = {
  type: 'object',
  required: ['tuple_key', 'expectation'],
  properties: {
    tuple_key: relationshipTupleSchema,
    expectation: {
      type: 'boolean',
    },
  },
};

export const assertionsSchema = {
  type: 'array',
  items: assertionSchema,
};
