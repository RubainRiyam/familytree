import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { en } from './en.ts';
import { ml } from './ml.ts';
import { format, pickLocale, placeholders, translate } from './index.ts';

const todo: string[] = JSON.parse(readFileSync(new URL('./ml.todo.json', import.meta.url), 'utf8'));

test('Malayalam has every English key and no extras', () => {
  assert.deepEqual(Object.keys(ml).sort(), Object.keys(en).sort());
});

test('translations keep the same placeholders', () => {
  for (const k of Object.keys(en) as (keyof typeof en)[]) {
    assert.deepEqual(placeholders(ml[k]), placeholders(en[k]), k);
  }
});

test('no empty strings', () => {
  for (const [k, v] of [...Object.entries(en), ...Object.entries(ml)]) assert.ok(v.trim(), k);
});

test('ml.todo.json lists only real keys, without duplicates', () => {
  assert.equal(new Set(todo).size, todo.length);
  for (const k of todo) assert.ok(k in en, `unknown key in ml.todo.json: ${k}`);
});

test('Malayalam strings are actually Malayalam unless they are names', () => {
  const allowLatin = new Set(['app.name']);
  for (const [k, v] of Object.entries(ml)) {
    if (allowLatin.has(k)) continue;
    assert.match(v, /[ഀ-ൿ]/, `${k} has no Malayalam script`);
  }
});

test('format and translate', () => {
  assert.equal(format('Call {name}', { name: 'Vinod' }), 'Call Vinod');
  assert.equal(format('Call {name}'), 'Call {name}');
  assert.equal(translate('en', 'language.switchTo', { language: 'Malayalam' }), 'Switch to Malayalam');
  assert.equal(translate('ml', 'language.switchTo', { language: 'English' }), 'English ആക്കുക');
});

test('pickLocale', () => {
  assert.equal(pickLocale(['ml-IN', 'en-IN']), 'ml');
  assert.equal(pickLocale(['ar-AE', 'en-GB']), 'en');
  assert.equal(pickLocale(['hi-IN']), 'en');
  assert.equal(pickLocale([]), 'en');
});
