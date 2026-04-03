import { Role } from '@/http/nodegen/interfaces/Company';

export const SYSTEM_SUPER_ADMIN = 'SUPER_ADMIN';

export const DEFAULT_COMPANY_ADMIN_ROLE: Role = {
  name: 'ADMIN',
  description: 'Added by Weave, this admin role cannot be removed',
};
export const DEFAULT_COMPANY_MEMBER_ROLE: Role = {
  name: 'MEMBER',
  description: 'Added by Weave, this member role cannot be removed',
};
