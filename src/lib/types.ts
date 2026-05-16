import { Timestamp } from "firebase/firestore";

export interface Organization {
  id: string;
  name: string;
  siret: string;
  address: string;
  streetNumber?: string;
  zipCode?: string;
  city?: string;
  logoUrl: string;
  primaryColor: string;
  trustMessage: string;
  officialPhones: string[];
  allowedEmailDomains: string[];
  representativeUserId: string;
  active: boolean;
  createdAt: Timestamp;
  createdBy: string;
}

export interface Member {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: "representative" | "collaborator";
  jobTitle: string;
  directPhone: string;
  photoUrl: string;
  status: "active" | "suspended" | "blocked";
  createdAt: Timestamp;
  createdBy: string;
  lastActivityAt?: Timestamp | null;
}

export interface AuthRequest {
  id: string;
  memberId: string;
  memberName: string;
  clientPhone: string;
  code: string;
  status: "pending" | "success" | "failed" | "expired";
  ipAddress: string;
  createdAt: Timestamp;
  completedAt: Timestamp | null;
}

export interface AuditLog {
  id: string;
  action: 'create_organization' | 'update_legal' | 'update_visual' | 'change_representative' | 'deactivate' | 'reactivate' | 'delete' | 'emergency_block_member';
  actorUid: string;
  actorEmail: string;
  details: Record<string, any>; // avant/après pour les modifs
  createdAt: Timestamp;
}
