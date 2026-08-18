export interface FamilyMember {
  id: string;
  name: string;
  dateOfBirth: string;
  dateOfDeath?: string;
  gender: 'male' | 'female' | 'other';
  photoUrl?: string;
  bio?: string;
  contactInfo: {
    email?: string;
    phone?: string;
    address?: string;
  };
  fatherId?: string;
  motherId?: string;
  spouseId?: string;
  childrenIds: string[];
  auth?: {
    email: string;
    passwordHash: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface AuthSession {
  memberId: string;
  email: string;
  loginAt: string;
}

export interface TreeNodeData {
  member: FamilyMember;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface TreeEdgeData {
  from: string;
  to: string;
  type: 'parent-child' | 'spouse';
}

export interface SearchFilters {
  query: string;
  gender?: FamilyMember['gender'];
}
