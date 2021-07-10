import assert from 'assert/strict';

import { loadData, loadedDataType } from '../../helpers/load-config';
import jsonNamespaces from './testdata/with_json/authorization-model.json';
import { InvalidConfigError } from '../../utils/errors';

describe('Test for loading model', () => {
  describe('Loading directory with specified id, valid JSON authorization model and YAML tuple/assertions', () => {
    let data: loadedDataType;
    const cStoreId = '12345';
    before('First load the directory', async () => {
      data = await loadData({ storeId: cStoreId, configDir: 'lib/test/helpers/testdata/with_json' });
    });
    it('returned storeId should be identical', () => {
      assert.strictEqual(data.id, cStoreId);
    });
    it('returned authorization model JSON should be identical', () => {
      assert.deepStrictEqual({ type_definitions: data.typeDefinitions }, jsonNamespaces);
    });
    it('returned tuples should be identical', () => {
      assert.deepStrictEqual(data.tuples, [
        { user: 'Foo', relation: 'owner', object: 'bit:abc' },
        { user: 'Boo', relation: 'writer', object: 'bit:xyz' },
      ]);
    });
    it('returned assertions should be identical', () => {
      assert.deepStrictEqual(data.assertions, [
        { tuple_key: { user: 'mystring', relation: 'owner', object: 'bit:abc' }, expectation: false },
        { tuple_key: { user: 'Foo', relation: 'owner', object: 'bit:abc' }, expectation: true },
        { tuple_key: { user: 'Boo', relation: 'owner', object: 'bit:xyz' }, expectation: false },
        { tuple_key: { user: 'Boo', relation: 'reader', object: 'bit:xyz' }, expectation: true },
      ]);
    });
  });

  describe('Loading directory with non-specified id, valid JSON authorization model and YAML tuple/assertions', () => {
    let data: loadedDataType;
    before('First load the directory', async () => {
      data = await loadData({ configDir: 'lib/test/helpers/testdata/with_json' });
    });
    it('returned storeId should not be null', () => {
      assert(data.id);
    });
    it('returned authorization model JSON should be identical', () => {
      assert.deepStrictEqual({ type_definitions: data.typeDefinitions }, jsonNamespaces);
    });
    it('returned tuples should be identical', () => {
      assert.deepStrictEqual(data.tuples, [
        { user: 'Foo', relation: 'owner', object: 'bit:abc' },
        { user: 'Boo', relation: 'writer', object: 'bit:xyz' },
      ]);
    });
    it('returned assertions should be identical', () => {
      assert.deepStrictEqual(data.assertions, [
        { tuple_key: { user: 'mystring', relation: 'owner', object: 'bit:abc' }, expectation: false },
        { tuple_key: { user: 'Foo', relation: 'owner', object: 'bit:abc' }, expectation: true },
        { tuple_key: { user: 'Boo', relation: 'owner', object: 'bit:xyz' }, expectation: false },
        { tuple_key: { user: 'Boo', relation: 'reader', object: 'bit:xyz' }, expectation: true },
      ]);
    });
  });

  describe('Loading invalid directory', () => {
    it('should throw with InvalidConfigError if load fails', async () => {
      assert.rejects(loadData({ storeId: '123', configDir: 'lib/test/helpers/testdata/bad' }), InvalidConfigError);
    });
  });
});
