export interface User {
  id:          string;
  username:    string;
  email:       string;
  firstName:   string;
  lastName:    string;
  phoneNumber: string;
  role:        'user' | 'admin' | 'super_admin';
  status:      'active' | 'pending' | 'suspended' | 'locked';
  emailVerified:    boolean;
  twoFactorEnabled: boolean;
  kycStatus:   'not_started' | 'pending' | 'approved' | 'rejected';
  creditScore:  number;
  creditRating: string;
  profilePictureUrl?: string;
  createdAt:   string;
}

export interface LoginPayload {
  username:     string;
  password:     string;
  captchaCode:  string;
  captchaToken: string;
}

export interface RegisterPayload {
  username:    string;
  email:       string;
  password:    string;
  firstName?:  string;
  lastName?:   string;
  phoneNumber?: string;
  dateOfBirth?: string;
}

export interface AuthResponse {
  accessToken:       string;
  refreshToken:      string;
  requiresTwoFactor: boolean;
  user:              User;
}

export interface ApiResponse<T> {
  success:   boolean;
  data:      T;
  timestamp: string;
}