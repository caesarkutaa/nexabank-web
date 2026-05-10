// app/admin/types/index.ts
// All shared TypeScript types for the admin panel

export interface AdminUser {
  id:               string;
  _id?:             string;
  username:         string;
  email:            string;
  firstName:        string;
  lastName:         string;
  role:             'admin' | 'super_admin';
  status:           string;
  profilePictureUrl?: string;
  lastLoginAt?:     string;
  createdAt?:       string;
}

// ─── Auth ─────────────────────────────────────────────────────────────────────
export interface AdminLoginPayload {
  accessToken:  string;
  refreshToken: string;
  user:         AdminUser;
}

// ─── Dashboard ────────────────────────────────────────────────────────────────
export interface AdminDashboardStats {
  totalUsers:        number;
  activeUsers:       number;
  pendingKYC:        number;
  totalAccounts:     number;
  totalDeposits:     number;
  totalWithdrawals:  number;
  totalTransactions: number;
  pendingLoans:      number;
  pendingCheques:    number;
  totalRevenue?:     number;
  recentActivity?:   ActivityItem[];
}

export interface ActivityItem {
  id:        string;
  type:      string;
  message:   string;
  createdAt: string;
  userId?:   string;
}

// ─── Users ────────────────────────────────────────────────────────────────────
export interface AdminUserRecord {
  _id:               string;
  username:          string;
  email:             string;
  firstName:         string;
  lastName:          string;
  phoneNumber?:      string;
  role:              string;
  status:            string;
  kycStatus:         string;
  emailVerified:     boolean;
  creditScore:       number;
  creditRating:      string;
  twoFactorEnabled:  boolean;
  lastLoginAt?:      string;
  createdAt:         string;
  profilePictureUrl?: string;
  preferredCurrency: string;
}

export interface AdminUserDetail extends AdminUserRecord {
  address?:   string;
  city?:      string;
  state?:     string;
  zipCode?:   string;
  country?:   string;
  accounts?:  AdminAccountRecord[];
}

// ─── Accounts ────────────────────────────────────────────────────────────────
export interface AdminAccountRecord {
  _id:              string;
  userId:           string;
  accountNumber:    string;
  accountType:      string;
  nickname?:        string;
  currency:         string;
  balance:          number;
  availableBalance: number;
  status:           string;
  isPrimary:        boolean;
  totalDeposited:   number;
  totalWithdrawn:   number;
  createdAt:        string;
  user?: {
    firstName: string;
    lastName:  string;
    email:     string;
    username:  string;
  };
}

// ─── Transactions ─────────────────────────────────────────────────────────────
export interface AdminTransactionRecord {
  _id:             string;
  userId:          string;
  accountId:       string;
  referenceNumber: string;
  type:            string;
  status:          string;
  direction:       'credit' | 'debit';
  amount:          number;
  fee:             number;
  currency:        string;
  description?:    string;
  balanceAfter?:   number;
  processedAt?:    string;
  receiptUrl?:     string;
  metadata?:       Record<string, unknown>;
  createdAt:       string;
  user?: {
    firstName: string; lastName: string; email: string;
  };
}

// ─── Loans ────────────────────────────────────────────────────────────────────
export interface AdminLoanRecord {
  _id:              string;
  userId:           string;
  accountId:        string;
  amount:           number;
  currency:         string;
  interestRate:     number;
  termMonths:       number;
  purpose:          string;
  status:           string;
  monthlyPayment?:  number;
  totalPayable?:    number;
  disbursedAt?:     string;
  dueDate?:         string;
  rejectionReason?: string;
  createdAt:        string;
  user?: { firstName: string; lastName: string; email: string; username: string; };
}

// ─── KYC ─────────────────────────────────────────────────────────────────────
export interface AdminKYCRecord {
  _id:              string;
  userId:           string;
  documentType:     string;
  documentNumber:   string;
  expiryDate?:      string;
  frontImageUrl?:   string;
  backImageUrl?:    string;
  selfieUrl?:       string;
  status:           string;
  rejectionNote?:   string;
  reviewedBy?:      string;
  reviewedAt?:      string;
  createdAt:        string;
  user?: { firstName: string; lastName: string; email: string; username: string; kycStatus: string; };
}

// ─── Cheques ─────────────────────────────────────────────────────────────────
export interface AdminChequeRecord {
  _id:             string;
  userId:          string;
  accountId:       string;
  chequeNumber:    string;
  payerName:       string;
  payerBank:       string;
  amount:          number;
  currency:        string;
  status:          string;
  memo?:           string;
  frontImageUrl?:  string;
  backImageUrl?:   string;
  rejectionReason?: string;
  clearedAt?:      string;
  createdAt:       string;
  user?: { firstName: string; lastName: string; email: string; };
}

// ─── Investments ──────────────────────────────────────────────────────────────
export interface AdminInvestmentRecord {
  _id:              string;
  userId:           string;
  accountId:        string;
  symbol:           string;
  shares:           number;
  buyPrice:         number;
  currentPrice?:    number;
  action:           'buy' | 'sell';
  status:           string;
  profitLoss?:      number;
  profitLossPercent?: number;
  createdAt:        string;
  user?: { firstName: string; lastName: string; email: string; };
}

// ─── Crypto addresses ─────────────────────────────────────────────────────────
export interface AdminCryptoAddress {
  network:   string;
  address:   string;
  label?:    string;
  isActive:  boolean;
  updatedAt?: string;
}

// ─── OTP Config ───────────────────────────────────────────────────────────────
export interface OtpConfig {
  expirySeconds:   number;
  maxAttempts:     number;
  length:          number;
  resendCooldown:  number;
  enableEmail:     boolean;
  enableSms:       boolean;
}

// ─── Audit Logs ───────────────────────────────────────────────────────────────
export interface AdminLogRecord {
  _id:       string;
  adminId:   string;
  action:    string;
  target?:   string;
  targetId?: string;
  details?:  Record<string, unknown>;
  ip?:       string;
  createdAt: string;
  admin?: { firstName: string; lastName: string; email: string; };
}

// ─── Pagination ───────────────────────────────────────────────────────────────
export interface PaginatedResponse<T> {
  data:       T[];
  total:      number;
  page:       number;
  limit:      number;
  totalPages: number;
}

export interface AdminQueryParams {
  page?:   number;
  limit?:  number;
  search?: string;
  status?: string;
  from?:   string;
  to?:     string;
  sort?:   string;
}