import { test } from 'node:test';
import assert from 'node:assert/strict';
import { kinTerm, type Step } from './kinship.ts';

const me = { birthYear: 1971 };
const p = (step: Step['step'], gender: Step['gender'], birthYear?: number): Step => ({ step, gender, birthYear });

test('direct relations', () => {
  assert.deepEqual(kinTerm(me, [p('parent', 'female')]), { key: 'M', en: 'Mother', ml: 'അമ്മ' });
  assert.equal(kinTerm(me, [p('spouse', 'female')]).ml, 'ഭാര്യ');
  assert.equal(kinTerm(me, [p('child', 'female')]).en, 'Daughter');
  assert.equal(kinTerm(me, []).ml, 'ഞാൻ');
});
test('siblings are elder or younger by birth year', () => {
  assert.equal(kinTerm(me, [p('parent', 'male'), p('child', 'male', 1974)]).ml, 'അനിയൻ');
  assert.equal(kinTerm(me, [p('parent', 'male'), p('child', 'female', 1968)]).ml, 'ചേച്ചി');
  assert.equal(kinTerm(me, [p('parent', 'male'), p('child', 'male')]).en, 'Brother');
});
test("mother's brother is ammavan whatever his age; mother's sisters split by age", () => {
  const mother = p('parent', 'female', 1946);
  assert.equal(kinTerm(me, [mother, p('parent', 'male'), p('child', 'male', 1950)]).ml, 'അമ്മാവൻ');
  assert.equal(kinTerm(me, [mother, p('parent', 'male'), p('child', 'female', 1940)]).ml, 'വല്യമ്മ');
  assert.equal(kinTerm(me, [mother, p('parent', 'male'), p('child', 'female', 1952)]).ml, 'ചെറിയമ്മ');
  assert.equal(kinTerm(me, [mother, p('parent', 'male'), p('child', 'male', 1950), p('spouse', 'female')]).ml, 'അമ്മായി');
});
test('grandparents, in-laws, grandchildren', () => {
  assert.equal(kinTerm(me, [p('parent', 'male'), p('parent', 'female')]).en, "Grandmother (father's side)");
  assert.equal(kinTerm(me, [p('spouse', 'female'), p('parent', 'male')]).ml, 'അമ്മായിയച്ഛൻ');
  assert.equal(kinTerm(me, [p('child', 'female'), p('spouse', 'male')]).ml, 'മരുമകൻ');
  assert.equal(kinTerm(me, [p('child', 'male'), p('child', 'female')]).ml, 'കൊച്ചുമകൾ');
});
test('anything unnamed falls back to a plain English chain, with no Malayalam guess', () => {
  const t = kinTerm(me, [p('parent', 'male', 1940), p('parent', 'male'), p('child', 'female', 1944), p('child', 'female')]);
  assert.equal(t.en, "Father's younger sister's daughter");
  assert.equal(t.ml, undefined);
});
test('a family can override a term', () => {
  const path = [p('parent', 'male', 1940), p('parent', 'male'), p('child', 'male', 1936)];
  assert.equal(kinTerm(me, path).ml, 'വല്യച്ഛൻ');
  assert.equal(kinTerm(me, path, { 'F.eB': 'പേരപ്പൻ' }).ml, 'പേരപ്പൻ');
});
