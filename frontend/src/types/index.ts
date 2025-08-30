export type UserType = 'CUSTOMER' | 'STORE_OWNER';

export interface User {
  id: string;
  email: string;
  name: string;
  userType: UserType;
  // Add other user fields as needed
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface RegisterRequest {
  userType: UserType;
  name: string;
  email: string;
  phone: string;
  password: string;
  storeName?: string;
  address?: string;
  securityQuestions: Array<{ question: string; answer: string }>;
  enable2FA: boolean;
  phoneFor2FA?: string;
}
