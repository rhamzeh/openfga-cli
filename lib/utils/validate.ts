import Ajv, { ErrorObject, Schema } from 'ajv';
import { TupleKey, Assertion } from '@openfga/sdk';

interface ValidationResult {
  valid: boolean;
  errors: ErrorObject[] | null | undefined;
}

export const validate = <T = Assertion | TupleKey>(data: T[], schema: Schema): ValidationResult => {
  const ajv = new Ajv();

  const validate = ajv.compile<T[]>(schema);

  return {
    valid: validate(data),
    errors: validate.errors,
  };
};
