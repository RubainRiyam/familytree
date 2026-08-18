import type { FamilyMember } from '@/types';
import { MEMBERS_KEY } from '@/store/localStorage';

const DEMO_PASSWORD_HASH = '8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918';

export function needsSeed(): boolean {
  return localStorage.getItem(MEMBERS_KEY) === null;
}

export function seedDatabase(): void {
  const grandfatherId = crypto.randomUUID();
  const grandmotherId = crypto.randomUUID();
  const fatherId = crypto.randomUUID();
  const motherId = crypto.randomUUID();
  const uncleId = crypto.randomUUID();
  const auntId = crypto.randomUUID();
  const child1Id = crypto.randomUUID();
  const child2Id = crypto.randomUUID();
  const cousin1Id = crypto.randomUUID();

  const now = new Date().toISOString();

  const members: FamilyMember[] = [
    {
      id: grandfatherId,
      name: 'Ahmad Khan',
      dateOfBirth: '1940-03-15',
      dateOfDeath: '2015-11-20',
      gender: 'male',
      bio: 'Patriarch of the family. Worked as a teacher for 40 years.',
      contactInfo: {},
      spouseId: grandmotherId,
      childrenIds: [fatherId, uncleId],
      createdAt: now,
      updatedAt: now,
    },
    {
      id: grandmotherId,
      name: 'Fatima Khan',
      dateOfBirth: '1945-07-22',
      gender: 'female',
      bio: 'Beloved grandmother. Known for her incredible cooking.',
      contactInfo: { phone: '+1-555-0101' },
      spouseId: grandfatherId,
      childrenIds: [fatherId, uncleId],
      createdAt: now,
      updatedAt: now,
    },
    {
      id: fatherId,
      name: 'Bilal Khan',
      dateOfBirth: '1970-01-10',
      gender: 'male',
      bio: 'Software engineer and loving father.',
      contactInfo: { email: 'bilal@example.com', phone: '+1-555-0102' },
      fatherId: grandfatherId,
      motherId: grandmotherId,
      spouseId: motherId,
      childrenIds: [child1Id, child2Id],
      createdAt: now,
      updatedAt: now,
    },
    {
      id: motherId,
      name: 'Sara Khan',
      dateOfBirth: '1973-05-18',
      gender: 'female',
      bio: 'Doctor and devoted mother.',
      contactInfo: { email: 'sara@example.com', phone: '+1-555-0103' },
      spouseId: fatherId,
      childrenIds: [child1Id, child2Id],
      createdAt: now,
      updatedAt: now,
    },
    {
      id: uncleId,
      name: 'Hassan Khan',
      dateOfBirth: '1975-09-03',
      gender: 'male',
      bio: 'Architect and world traveler.',
      contactInfo: { email: 'hassan@example.com' },
      fatherId: grandfatherId,
      motherId: grandmotherId,
      spouseId: auntId,
      childrenIds: [cousin1Id],
      createdAt: now,
      updatedAt: now,
    },
    {
      id: auntId,
      name: 'Aisha Khan',
      dateOfBirth: '1978-12-25',
      gender: 'female',
      bio: 'Artist and art teacher.',
      contactInfo: { email: 'aisha@example.com' },
      spouseId: uncleId,
      childrenIds: [cousin1Id],
      createdAt: now,
      updatedAt: now,
    },
    {
      id: child1Id,
      name: 'Omar Khan',
      dateOfBirth: '1998-04-12',
      gender: 'male',
      bio: 'University student studying computer science.',
      contactInfo: { email: 'demo@example.com' },
      fatherId: fatherId,
      motherId: motherId,
      childrenIds: [],
      auth: {
        email: 'demo@example.com',
        passwordHash: DEMO_PASSWORD_HASH,
      },
      createdAt: now,
      updatedAt: now,
    },
    {
      id: child2Id,
      name: 'Zara Khan',
      dateOfBirth: '2001-08-30',
      gender: 'female',
      bio: 'High school student with a passion for music.',
      contactInfo: { email: 'zara@example.com' },
      fatherId: fatherId,
      motherId: motherId,
      childrenIds: [],
      createdAt: now,
      updatedAt: now,
    },
    {
      id: cousin1Id,
      name: 'Yusuf Khan',
      dateOfBirth: '2000-02-14',
      gender: 'male',
      bio: 'Aspiring chef.',
      contactInfo: { email: 'yusuf@example.com' },
      fatherId: uncleId,
      motherId: auntId,
      childrenIds: [],
      createdAt: now,
      updatedAt: now,
    },
  ];

  localStorage.setItem(MEMBERS_KEY, JSON.stringify(members));
}
