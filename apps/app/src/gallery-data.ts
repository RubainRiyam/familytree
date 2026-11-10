// Synthetic people for the component gallery. Not real persons.
import { kinTerm, type Step } from '@aalthara/core/kinship';
import type { BranchColor } from '@aalthara/ui';

const relation = (path: Step[]) => {
  const k = kinTerm({ birthYear: 1971 }, path);
  return k.ml ? `${k.ml} · ${k.en}` : k.en;
};

export const samplePeople: {
  id: string; displayName: string; givenName: string; houseName?: string; branch: BranchColor;
  relation: string; fact: string; isDeceased?: boolean; you?: boolean;
}[] = [
  { id: 'p1', displayName: 'Saraswathi Amma', givenName: 'Saraswathi', houseName: 'Amma', branch: 'vazha', relation: relation([{ step: 'parent', gender: 'female' }]), fact: 'Mavelikkara' },
  { id: 'p2', displayName: 'Vinod Kizhakkethil', givenName: 'Vinod', houseName: 'Kizhakkethil', branch: 'kayal', relation: relation([{ step: 'parent', gender: 'male' }, { step: 'child', gender: 'male', birthYear: 1974 }]), fact: 'Dubai · Civil engineer' },
  { id: 'p3', displayName: 'Raghavan Kizhakkethil', givenName: 'Raghavan', houseName: 'Kizhakkethil', branch: 'chakka', relation: relation([{ step: 'parent', gender: 'male' }]), fact: '1940 – 2011', isDeceased: true },
  { id: 'p4', displayName: 'ശ്രീദേവി കിഴക്കേതിൽ', givenName: 'ശ്രീദേവി', houseName: 'കിഴക്കേതിൽ', branch: 'kadalas', relation: relation([{ step: 'parent', gender: 'female' }, { step: 'child', gender: 'female', birthYear: 1968 }]), fact: 'Kochi · Teacher' },
];

export const discBranches: BranchColor[] = ['chethi', 'vazha', 'kayal', 'mazha', 'chakka', 'kadalas'];

export const sampleFacts = [
  { label: 'Dubai', count: 14 },
  { label: 'Kochi', count: 31 },
  { label: 'O+', count: 9 },
  { label: 'Doctors', count: 6 },
];
