import { test } from 'node:test';
import assert from 'node:assert/strict';
import { render, tsType } from './gen-db-types.ts';

test('postgres types map like the Supabase generator', () => {
  assert.equal(tsType('uuid', null, {}), 'string');
  assert.equal(tsType('int8', null, {}), 'number');
  assert.equal(tsType('_text', 'text', {}), 'string[]');
  assert.equal(tsType('jsonb', null, {}), 'Json');
  assert.equal(tsType('mood', null, { mood: ['ok'] }), "Database['public']['Enums']['mood']");
});

test('optional insert columns and defaulted function args', () => {
  const out = render({
    tables: [{ name: 'x', kind: 'r', relationships: [], columns: [
      { name: 'id', udt: 'uuid', elem: null, nullable: false, hasDefault: true, generated: false },
      { name: 'n', udt: 'text', elem: null, nullable: false, hasDefault: false, generated: false },
      { name: 's', udt: 'tsvector', elem: null, nullable: true, hasDefault: false, generated: true },
    ] }],
    enums: {},
    functions: [{ name: 'f', setof: false, ret: 'uuid', ret_elem: null, nargs: 2, ndefaults: 1,
      args: [{ name: 'a', udt: 'text', elem: null, mode: 'i' }, { name: 'b', udt: 'int4', elem: null, mode: 'i' }] }],
  });
  assert.match(out, /Insert: \{\n {10}id\?: string;\n {10}n: string;\n {8}\};/);
  assert.match(out, /f: \{ Args: \{ a: string; b\?: number \}; Returns: string \};/);
});
