import { test } from 'node:test';
import assert from 'node:assert/strict';
import { firstCluster, initials } from './initials.ts';

test('latin names', () => {
  assert.equal(initials('Saraswathi', 'Amma'), 'SA');
  assert.equal(initials('vinod', 'Kizhakkethil'), 'VK');
  assert.equal(initials('Saraswathi Amma'), 'SA');
  assert.equal(initials('Meera'), 'M');
  assert.equal(initials('  '), '?');
});

test('malayalam clusters', () => {
  assert.equal(firstCluster('ശ്രീദേവി'), 'ശ്രീ');      // conjunct + vowel sign
  assert.equal(firstCluster('കിഴക്കേതിൽ'), 'കി');      // consonant + vowel sign
  assert.equal(firstCluster('അമ്മ'), 'അ');              // independent vowel
  assert.equal(firstCluster('ക്ഷേമ'), 'ക്ഷേ');
  assert.equal(initials('ലീല', 'കിഴക്കേതിൽ'), 'ലീകി');
});
