export const APP_NAME    = 'NexaBank';
export const APP_TAGLINE = 'Banking for the Modern Age';
export const SUPPORT_EMAIL = 'support@nexabank.com';
export const SUPPORT_PHONE = '1-800-NEXABANK';

export const COOKIE_KEYS = {
  TOKEN:    'nexabank_token',
  REFRESH:  'nexabank_refresh',
  USER_ID:  'nexabank_user_id',
  ROLE:     'nexabank_role',
} as const;

export const ROUTES = {
  // Auth
  LOGIN:          '/login',
  REGISTER:       '/register',
  VERIFY_EMAIL:   '/verify-email',
  FORGOT_PASSWORD:'/forgot-password',
  RESET_PASSWORD: '/reset-password',

  // Dashboard
  DASHBOARD:      '/dashboard',
  ACCOUNTS:       '/accounts',
  TRANSFERS:      '/transfers',
  TRANSACTIONS:   '/transactions',
  CARDS:          '/cards',
  LOANS:          '/loans',
  INVESTMENTS:    '/investments',
  BILLS:          '/bills',
  CRYPTO:         '/crypto',
  CHEQUES:        '/cheques',
  KYC:            '/kyc',
  SETTINGS:       '/settings',

  // Admin
  ADMIN:                '/admin/dashboard',
  ADMIN_USERS:          '/admin/users',
  ADMIN_ACCOUNTS:       '/admin/accounts',
  ADMIN_TRANSACTIONS:   '/admin/transactions',
  ADMIN_LOANS:          '/admin/loans',
  ADMIN_KYC:            '/admin/kyc',
  ADMIN_CHEQUES:        '/admin/cheques',
  ADMIN_INVESTMENTS:    '/admin/investments',
  ADMIN_CRYPTO:         '/admin/crypto',
  ADMIN_OTP_CONFIG:     '/admin/otp-config',
  ADMIN_LOGS:           '/admin/logs',
} as const;

export const ACCOUNT_TYPES = [
  { value: 'checking',     label: 'Checking Account'     },
  { value: 'savings',      label: 'Savings Account'      },
  { value: 'money_market', label: 'Money Market Account' },
] as const;

export const LOAN_TYPES = [
  { value: 'personal',       label: 'Personal Loan'       },
  { value: 'mortgage',       label: 'Mortgage'            },
  { value: 'auto',           label: 'Auto Loan'           },
  { value: 'business',       label: 'Business Loan'       },
  { value: 'student',        label: 'Student Loan'        },
  { value: 'line_of_credit', label: 'Line of Credit'      },
] as const;

export const BILL_CATEGORIES = [
  { value: 'electricity',  label: 'Electricity',  icon: '⚡' },
  { value: 'water',        label: 'Water',         icon: '💧' },
  { value: 'internet',     label: 'Internet',      icon: '🌐' },
  { value: 'phone',        label: 'Phone',         icon: '📱' },
  { value: 'gas',          label: 'Gas',           icon: '🔥' },
  { value: 'insurance',    label: 'Insurance',     icon: '🛡️' },
  { value: 'subscription', label: 'Subscription',  icon: '📺' },
  { value: 'rent',         label: 'Rent',          icon: '🏠' },
  { value: 'cable',        label: 'Cable TV',      icon: '📡' },
  { value: 'other',        label: 'Other',         icon: '📄' },
] as const;

export const CRYPTO_CURRENCIES = [
  { value: 'BTC',       label: 'Bitcoin',       symbol: '₿', color: '#F7931A' },
  { value: 'ETH',       label: 'Ethereum',      symbol: 'Ξ', color: '#627EEA' },
  { value: 'USDC',      label: 'USD Coin',       symbol: '$', color: '#2775CA' },
  { value: 'LTC',       label: 'Litecoin',       symbol: 'Ł', color: '#BFBBBB' },
  { value: 'BCH',       label: 'Bitcoin Cash',   symbol: '₿', color: '#8DC351' },
] as const;

export const TRANSFER_TYPES = [
  { value: 'intrabank',      label: 'NexaBank to NexaBank', fee: 'Free',  time: 'Instant'        },
  { value: 'interbank',      label: 'ACH Transfer',          fee: '$2.50', time: '1-2 Business Days'},
  { value: 'international',  label: 'International Wire',     fee: '2%',    time: '2-5 Business Days'},
] as const;

export const KYC_DOCUMENT_TYPES = [
  { value: 'passport',        label: "Passport"          },
  { value: 'drivers_license', label: "Driver's License"  },
  { value: 'national_id',     label: "National ID"       },
  { value: 'state_id',        label: "State ID"          },
] as const;

export const US_STATES = [
  'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA',
  'HI','ID','IL','IN','IA','KS','KY','LA','ME','MD',
  'MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ',
  'NM','NY','NC','ND','OH','OK','OR','PA','RI','SC',
  'SD','TN','TX','UT','VT','VA','WA','WV','WI','WY',
] as const;

export const TRANSACTION_TYPES = [
  { value: 'deposit',                label: 'Deposit'               },
  { value: 'withdrawal',             label: 'Withdrawal'            },
  { value: 'intrabank_transfer',     label: 'NexaBank Transfer'     },
  { value: 'interbank_transfer',     label: 'ACH Transfer'          },
  { value: 'international_transfer', label: 'International Wire'    },
  { value: 'bill_payment',           label: 'Bill Payment'          },
  { value: 'cheque_deposit',         label: 'Cheque Deposit'        },
  { value: 'crypto_payment',         label: 'Crypto Payment'        },
  { value: 'investment',             label: 'Investment'            },
  { value: 'loan_disbursement',      label: 'Loan Disbursement'     },
  { value: 'loan_repayment',         label: 'Loan Repayment'        },
  { value: 'card_payment',           label: 'Card Payment'          },
  { value: 'fee',                    label: 'Fee'                   },
  { value: 'interest',               label: 'Interest'              },
] as const;