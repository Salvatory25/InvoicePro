import {
  addMoney,
  calculateDocumentTotals,
  calculateInvoiceBalance,
  compareMoney,
  CurrencyCode,
  LineItemCalculationInput,
  subtractMoney,
} from '../lib/money';
import {
  AuditLog,
  Business,
  BusinessMembership,
  BusinessRole,
  BusinessSettings,
  Client,
  ClientPortalAccessToken,
  CreditNote,
  DocumentLineItem,
  EAST_AFRICA_COUNTRIES,
  Expense,
  Invoice,
  InvoiceEvent,
  InvoiceStatus,
  LanguageCode,
  NotificationJob,
  Payment,
  PaymentMethodType,
  PaymentVerificationStatus,
  ProductService,
  ProformaInvoice,
  Project,
  Quotation,
  Receipt,
  Subscription,
  SubscriptionPlan,
  SubscriptionPlanId,
  SupportTicket,
  TeamInvitation,
  TimeEntry,
  UserProfile,
} from '../types/domain';

export class AuthorizationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AuthorizationError';
  }
}

export class TenantIsolationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'TenantIsolationError';
  }
}

export class EntitlementLimitError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'EntitlementLimitError';
  }
}

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

interface StoredAccountCredential {
  userId: string;
  email: string;
  passwordHash: string;
  verificationToken?: string;
  resetToken?: string;
}

export interface RelationalDatabaseState {
  users: UserProfile[];
  credentials: StoredAccountCredential[];
  businesses: Business[];
  businessSettings: BusinessSettings[];
  memberships: BusinessMembership[];
  invitations: TeamInvitation[];
  clients: Client[];
  productsServices: ProductService[];
  quotations: Quotation[];
  invoices: Invoice[];
  invoiceEvents: InvoiceEvent[];
  proformaInvoices: ProformaInvoice[];
  creditNotes: CreditNote[];
  payments: Payment[];
  receipts: Receipt[];
  expenses: Expense[];
  projects: Project[];
  timeEntries: TimeEntry[];
  portalTokens: ClientPortalAccessToken[];
  notificationJobs: NotificationJob[];
  subscriptionPlans: SubscriptionPlan[];
  subscriptions: Subscription[];
  auditLogs: AuditLog[];
  supportTickets: SupportTicket[];
}

const STORAGE_KEY = 'invoicepro_relational_db_v1';

export const DEFAULT_SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: 'free',
    nameEn: 'Free Plan',
    nameSw: 'Mpango wa Bure',
    monthlyPriceTzs: '0.00',
    annualPriceTzs: '0.00',
    maxInvoicesPerMonth: 5,
    maxClients: 10,
    maxTeamMembers: 1,
    allowQuotations: true,
    allowProjectsTime: false,
    allowAiAssistant: false,
    allowCustomBranding: false,
    allowCsvExports: false,
    isActive: true,
  },
  {
    id: 'starter',
    nameEn: 'Starter Plan',
    nameSw: 'Mpango wa Kuanza',
    monthlyPriceTzs: '10000.00',
    annualPriceTzs: '100000.00',
    maxInvoicesPerMonth: 30,
    maxClients: 100,
    maxTeamMembers: 2,
    allowQuotations: true,
    allowProjectsTime: false,
    allowAiAssistant: false,
    allowCustomBranding: true,
    allowCsvExports: true,
    isActive: true,
  },
  {
    id: 'professional',
    nameEn: 'Professional Plan',
    nameSw: 'Mpango wa Kitaalamu',
    monthlyPriceTzs: '25000.00',
    annualPriceTzs: '250000.00',
    maxInvoicesPerMonth: 250,
    maxClients: 1000,
    maxTeamMembers: 5,
    allowQuotations: true,
    allowProjectsTime: true,
    allowAiAssistant: true,
    allowCustomBranding: true,
    allowCsvExports: true,
    isActive: true,
  },
  {
    id: 'business',
    nameEn: 'Business Plan',
    nameSw: 'Mpango wa Biashara',
    monthlyPriceTzs: '50000.00',
    annualPriceTzs: '500000.00',
    maxInvoicesPerMonth: 10000,
    maxClients: 10000,
    maxTeamMembers: 25,
    allowQuotations: true,
    allowProjectsTime: true,
    allowAiAssistant: true,
    allowCustomBranding: true,
    allowCsvExports: true,
    isActive: true,
  },
];

function generateId(prefix = 'id'): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function hashValue(input: string): string {
  let h1 = 0xdeadbeef ^ input.length;
  let h2 = 0x41c6ce57 ^ input.length;
  for (let i = 0, ch; i < input.length; i++) {
    ch = input.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(16).padStart(16, '0');
}

function createEmptyDatabaseState(): RelationalDatabaseState {
  return {
    users: [],
    credentials: [],
    businesses: [],
    businessSettings: [],
    memberships: [],
    invitations: [],
    clients: [],
    productsServices: [],
    quotations: [],
    invoices: [],
    invoiceEvents: [],
    proformaInvoices: [],
    creditNotes: [],
    payments: [],
    receipts: [],
    expenses: [],
    projects: [],
    timeEntries: [],
    portalTokens: [],
    notificationJobs: [],
    subscriptionPlans: [...DEFAULT_SUBSCRIPTION_PLANS],
    subscriptions: [],
    auditLogs: [],
    supportTickets: [],
  };
}

class InvoiceProDatabaseEngine {
  private state: RelationalDatabaseState;

  constructor() {
    this.state = this.loadState();
  }

  private loadState(): RelationalDatabaseState {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const raw = window.localStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw) as RelationalDatabaseState;
          if (parsed && Array.isArray(parsed.users) && Array.isArray(parsed.businesses)) {
            if (!parsed.subscriptionPlans?.length) {
              parsed.subscriptionPlans = [...DEFAULT_SUBSCRIPTION_PLANS];
            }
            return parsed;
          }
        }
      }
    } catch {
      // Fallback to clean state if storage is inaccessible
    }
    return createEmptyDatabaseState();
  }

  private persist(): void {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
      }
    } catch {
      // Ignore quota errors in headless environments
    }
  }

  /**
   * Reset database state (used strictly in automated test suites).
   */
  public resetForTesting(): void {
    this.state = createEmptyDatabaseState();
    this.persist();
  }

  private logAudit(params: {
    businessId?: string;
    actorId: string;
    actorEmail: string;
    actorRole: string;
    action: string;
    entityType: string;
    entityId: string;
    metadata?: Record<string, unknown>;
  }): AuditLog {
    const entry: AuditLog = {
      id: generateId('aud'),
      businessId: params.businessId,
      actorId: params.actorId,
      actorEmail: params.actorEmail,
      actorRole: params.actorRole,
      action: params.action,
      entityType: params.entityType,
      entityId: params.entityId,
      metadata: params.metadata ?? {},
      createdAt: new Date().toISOString(),
    };
    this.state.auditLogs.unshift(entry);
    this.persist();
    return entry;
  }

  // ==========================================================================
  // 1. AUTHENTICATION, EMAIL VERIFICATION & PASSWORD RESET
  // ==========================================================================

  public registerUser(params: {
    email: string;
    password: string;
    fullName: string;
    phone?: string;
    preferredLanguage?: LanguageCode;
    isSuperAdmin?: boolean;
  }): { user: UserProfile; verificationToken: string } {
    const normalizedEmail = params.email.trim().toLowerCase();
    if (!normalizedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      throw new ValidationError('Please provide a valid email address.');
    }
    if (!params.password || params.password.length < 8) {
      throw new ValidationError('Password must be at least 8 characters long.');
    }
    if (!params.fullName.trim()) {
      throw new ValidationError('Full name is required.');
    }

    const existing = this.state.users.find((u) => u.email.toLowerCase() === normalizedEmail);
    if (existing) {
      throw new ValidationError('An account with this email address already exists.');
    }

    const userId = generateId('usr');
    const verificationToken = `vfy_${generateId('tok')}`;
    const user: UserProfile = {
      id: userId,
      email: normalizedEmail,
      fullName: params.fullName.trim(),
      phone: params.phone?.trim() ?? '',
      preferredLanguage: params.preferredLanguage ?? 'en',
      emailVerified: false,
      isSuperAdmin: Boolean(params.isSuperAdmin),
      isSuspended: false,
      createdAt: new Date().toISOString(),
    };

    this.state.users.push(user);
    this.state.credentials.push({
      userId,
      email: normalizedEmail,
      passwordHash: hashValue(params.password),
      verificationToken,
    });

    // Automatically accept any pending invitations for this email
    for (const inv of this.state.invitations) {
      if (inv.email.toLowerCase() === normalizedEmail && inv.status === 'pending') {
        inv.status = 'accepted';
        this.state.memberships.push({
          id: generateId('mem'),
          businessId: inv.businessId,
          userId: user.id,
          userEmail: user.email,
          userFullName: user.fullName,
          role: inv.role,
          isActive: true,
          createdAt: new Date().toISOString(),
        });
      }
    }

    this.logAudit({
      actorId: user.id,
      actorEmail: user.email,
      actorRole: user.isSuperAdmin ? 'super_admin' : 'registered_user',
      action: 'user.registered',
      entityType: 'user',
      entityId: user.id,
    });

    this.persist();
    return { user, verificationToken };
  }

  public verifyUserEmail(token: string): UserProfile {
    const cred = this.state.credentials.find((c) => c.verificationToken === token);
    if (!cred) {
      throw new ValidationError('Invalid or expired email verification token.');
    }
    const user = this.state.users.find((u) => u.id === cred.userId);
    if (!user) {
      throw new ValidationError('User account not found.');
    }
    user.emailVerified = true;
    cred.verificationToken = undefined;
    this.logAudit({
      actorId: user.id,
      actorEmail: user.email,
      actorRole: 'registered_user',
      action: 'user.email_verified',
      entityType: 'user',
      entityId: user.id,
    });
    this.persist();
    return user;
  }

  public loginUser(email: string, password: string): UserProfile {
    const normalizedEmail = email.trim().toLowerCase();
    const cred = this.state.credentials.find((c) => c.email === normalizedEmail);
    if (!cred || cred.passwordHash !== hashValue(password)) {
      throw new AuthorizationError('Invalid email or password.');
    }
    const user = this.state.users.find((u) => u.id === cred.userId);
    if (!user) {
      throw new AuthorizationError('Account not found.');
    }
    if (user.isSuspended) {
      throw new AuthorizationError('This user account has been suspended by platform administration.');
    }
    this.logAudit({
      actorId: user.id,
      actorEmail: user.email,
      actorRole: user.isSuperAdmin ? 'super_admin' : 'user',
      action: 'user.login',
      entityType: 'user',
      entityId: user.id,
    });
    return user;
  }

  public requestPasswordReset(email: string): { resetToken: string } {
    const normalizedEmail = email.trim().toLowerCase();
    const cred = this.state.credentials.find((c) => c.email === normalizedEmail);
    if (!cred) {
      throw new ValidationError('No account found with that email address.');
    }
    const resetToken = `rst_${generateId('tok')}`;
    cred.resetToken = resetToken;
    this.persist();
    return { resetToken };
  }

  public resetPassword(token: string, newPassword: string): UserProfile {
    if (!newPassword || newPassword.length < 8) {
      throw new ValidationError('New password must be at least 8 characters.');
    }
    const cred = this.state.credentials.find((c) => c.resetToken === token);
    if (!cred) {
      throw new ValidationError('Invalid or expired password reset token.');
    }
    cred.passwordHash = hashValue(newPassword);
    cred.resetToken = undefined;
    const user = this.state.users.find((u) => u.id === cred.userId)!;
    this.logAudit({
      actorId: user.id,
      actorEmail: user.email,
      actorRole: 'user',
      action: 'user.password_reset',
      entityType: 'user',
      entityId: user.id,
    });
    this.persist();
    return user;
  }

  public getUserById(userId: string): UserProfile | undefined {
    return this.state.users.find((u) => u.id === userId);
  }

  public updateUserLanguage(userId: string, language: LanguageCode): UserProfile {
    const user = this.getUserById(userId);
    if (!user) throw new AuthorizationError('User not found.');
    user.preferredLanguage = language;
    this.persist();
    return user;
  }

  // ==========================================================================
  // 2. TENANT ISOLATION & ROLE-BASED ACCESS CONTROL (RBAC)
  // ==========================================================================

  /**
   * Server-equivalent RBAC & Tenant check.
   * Super administrators do NOT automatically pass this check for customer financial data!
   */
  public assertBusinessRole(
    actorUserId: string,
    businessId: string,
    allowedRoles: BusinessRole[]
  ): { user: UserProfile; business: Business; membership: BusinessMembership } {
    const user = this.state.users.find((u) => u.id === actorUserId);
    if (!user) {
      throw new AuthorizationError('Unauthenticated user.');
    }
    if (user.isSuspended) {
      throw new AuthorizationError('Your user account is suspended.');
    }

    const business = this.state.businesses.find((b) => b.id === businessId);
    if (!business) {
      throw new TenantIsolationError('Business workspace not found.');
    }
    if (business.isSuspended) {
      throw new AuthorizationError(`Business workspace "${business.name}" is currently suspended.`);
    }

    const membership = this.state.memberships.find(
      (m) => m.businessId === businessId && m.userId === actorUserId && m.isActive
    );

    if (!membership) {
      this.logAudit({
        businessId,
        actorId: user.id,
        actorEmail: user.email,
        actorRole: user.isSuperAdmin ? 'super_admin' : 'unauthorized',
        action: 'security.cross_tenant_access_denied',
        entityType: 'business',
        entityId: businessId,
      });
      throw new TenantIsolationError(
        'Access denied: You are not an active member of this business tenant.'
      );
    }

    if (!allowedRoles.includes(membership.role)) {
      this.logAudit({
        businessId,
        actorId: user.id,
        actorEmail: user.email,
        actorRole: membership.role,
        action: 'security.role_permission_denied',
        entityType: 'business',
        entityId: businessId,
        metadata: { requiredRoles: allowedRoles, actualRole: membership.role },
      });
      throw new AuthorizationError(
        `Role "${membership.role}" is not permitted to perform this action. Required: ${allowedRoles.join(', ')}.`
      );
    }

    return { user, business, membership };
  }

  // ==========================================================================
  // 3. BUSINESS ONBOARDING, SETTINGS, SUBSCRIPTION & TEAM
  // ==========================================================================

  public createBusiness(
    actorUserId: string,
    input: {
      name: string;
      legalName?: string;
      countryCode?: 'TZ' | 'KE' | 'UG' | 'RW';
      defaultCurrency?: CurrencyCode;
      tinNumber?: string;
      vrnNumber?: string;
      email?: string;
      phone?: string;
      addressLine1?: string;
      city?: string;
      logoDataUrl?: string;
      invoicePrefix?: string;
      defaultTaxLabel?: string;
      defaultTaxRate?: string;
      defaultPaymentInstructions?: string;
      mobileMoneyNetwork?: string;
      mobileMoneyNumber?: string;
      mobileMoneyName?: string;
      bankName?: string;
      bankAccountName?: string;
      bankAccountNumber?: string;
      initialPlanId?: SubscriptionPlanId;
    }
  ): { business: Business; settings: BusinessSettings; membership: BusinessMembership; subscription: Subscription } {
    const user = this.getUserById(actorUserId);
    if (!user) throw new AuthorizationError('User must be logged in to create a business.');
    if (!input.name.trim()) throw new ValidationError('Business name is required.');

    const countryCode = input.countryCode ?? 'TZ';
    const countryProfile = EAST_AFRICA_COUNTRIES[countryCode];
    const businessId = generateId('biz');
    const slugBase = input.name
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

    const business: Business = {
      id: businessId,
      name: input.name.trim(),
      legalName: input.legalName?.trim() || input.name.trim(),
      slug: `${slugBase || 'biz'}-${businessId.slice(0, 6)}`,
      countryCode,
      defaultCurrency: input.defaultCurrency ?? countryProfile.defaultCurrency,
      timezone: countryProfile.defaultTimezone,
      locale: countryProfile.defaultLocale,
      tinNumber: input.tinNumber?.trim() ?? '',
      vrnNumber: input.vrnNumber?.trim() ?? '',
      registrationNumber: '',
      email: input.email?.trim() || user.email,
      phone: input.phone?.trim() || user.phone,
      addressLine1: input.addressLine1?.trim() ?? '',
      city: input.city?.trim() || (countryCode === 'TZ' ? 'Dar es Salaam' : 'Nairobi'),
      region: '',
      logoDataUrl: input.logoDataUrl,
      isSuspended: false,
      createdBy: user.id,
      createdAt: new Date().toISOString(),
    };

    const settings: BusinessSettings = {
      businessId,
      invoicePrefix: (input.invoicePrefix ?? 'INV').trim().toUpperCase(),
      nextInvoiceNumber: 1,
      quotationPrefix: 'QUO',
      nextQuotationNumber: 1,
      proformaPrefix: 'PRO',
      nextProformaNumber: 1,
      creditNotePrefix: 'CN',
      nextCreditNoteNumber: 1,
      receiptPrefix: 'RCT',
      nextReceiptNumber: 1,
      numberPadding: 4,
      defaultTaxLabel: input.defaultTaxLabel?.trim() || countryProfile.defaultTaxLabel,
      defaultTaxRate: input.defaultTaxRate ?? countryProfile.defaultTaxRate,
      taxIdentificationLabel: countryProfile.primaryTaxIdLabel,
      secondaryTaxLabel: countryProfile.secondaryTaxIdLabel,
      decimalSeparator: '.',
      thousandsSeparator: ',',
      defaultDueDays: 14,
      defaultPaymentInstructions:
        input.defaultPaymentInstructions?.trim() ||
        'Pay via M-Pesa / Mixx by Yas / Airtel Money or Bank Transfer and quote the Invoice Number.',
      bankName: input.bankName?.trim() ?? 'CRDB Bank / NMB Bank',
      bankAccountName: input.bankAccountName?.trim() || business.name,
      bankAccountNumber: input.bankAccountNumber?.trim() ?? '',
      bankBranch: business.city,
      mobileMoneyNetwork: input.mobileMoneyNetwork?.trim() || countryProfile.mobileMoneyNetworks[0],
      mobileMoneyNumber: input.mobileMoneyNumber?.trim() ?? '',
      mobileMoneyName: input.mobileMoneyName?.trim() || business.name,
      defaultInvoiceNotes: 'Asante kwa kufanya biashara nasi / Thank you for your business.',
      defaultTerms: 'Payment is due within the stated due date.',
      enableProjectsModule: true,
      enableAiAssistant: true,
    };

    const membership: BusinessMembership = {
      id: generateId('mem'),
      businessId,
      userId: user.id,
      userEmail: user.email,
      userFullName: user.fullName,
      role: 'owner',
      isActive: true,
      createdAt: new Date().toISOString(),
    };

    const planId: SubscriptionPlanId = input.initialPlanId ?? 'professional';
    const now = new Date();
    const periodEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    const subscription: Subscription = {
      id: generateId('sub'),
      businessId,
      planId,
      billingInterval: 'monthly',
      status: planId === 'free' ? 'active' : 'trialing',
      trialEndsAt: planId === 'free' ? undefined : new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000).toISOString(),
      currentPeriodStart: now.toISOString(),
      currentPeriodEnd: periodEnd.toISOString(),
      cancelAtPeriodEnd: false,
      verificationMode: planId === 'free' ? 'free_tier' : 'manual_verified',
      updatedAt: now.toISOString(),
    };

    this.state.businesses.push(business);
    this.state.businessSettings.push(settings);
    this.state.memberships.push(membership);
    this.state.subscriptions.push(subscription);

    this.logAudit({
      businessId,
      actorId: user.id,
      actorEmail: user.email,
      actorRole: 'owner',
      action: 'business.created',
      entityType: 'business',
      entityId: businessId,
      metadata: { name: business.name, countryCode, currency: business.defaultCurrency },
    });

    this.persist();
    return { business, settings, membership, subscription };
  }

  public getUserBusinesses(userId: string): Array<{
    business: Business;
    role: BusinessRole;
    settings: BusinessSettings;
    subscription: Subscription;
    plan: SubscriptionPlan;
  }> {
    const activeMemberships = this.state.memberships.filter((m) => m.userId === userId && m.isActive);
    return activeMemberships
      .map((m) => {
        const business = this.state.businesses.find((b) => b.id === m.businessId);
        const settings = this.state.businessSettings.find((s) => s.businessId === m.businessId);
        const subscription = this.state.subscriptions.find((s) => s.businessId === m.businessId);
        if (!business || !settings || !subscription) return null;
        const plan =
          this.state.subscriptionPlans.find((p) => p.id === subscription.planId) ?? DEFAULT_SUBSCRIPTION_PLANS[0];
        return { business, role: m.role, settings, subscription, plan };
      })
      .filter((item): item is NonNullable<typeof item> => item !== null);
  }

  public updateBusinessProfile(
    actorUserId: string,
    businessId: string,
    updates: Partial<Business> & Partial<BusinessSettings>
  ): { business: Business; settings: BusinessSettings } {
    const { user, business, membership } = this.assertBusinessRole(actorUserId, businessId, ['owner', 'admin']);
    const settings = this.state.businessSettings.find((s) => s.businessId === businessId)!;

    if (updates.name !== undefined) business.name = updates.name.trim();
    if (updates.legalName !== undefined) business.legalName = updates.legalName.trim();
    if (updates.countryCode !== undefined) business.countryCode = updates.countryCode;
    if (updates.defaultCurrency !== undefined) business.defaultCurrency = updates.defaultCurrency;
    if (updates.tinNumber !== undefined) business.tinNumber = updates.tinNumber.trim();
    if (updates.vrnNumber !== undefined) business.vrnNumber = updates.vrnNumber.trim();
    if (updates.email !== undefined) business.email = updates.email.trim();
    if (updates.phone !== undefined) business.phone = updates.phone.trim();
    if (updates.addressLine1 !== undefined) business.addressLine1 = updates.addressLine1.trim();
    if (updates.city !== undefined) business.city = updates.city.trim();
    if (updates.logoDataUrl !== undefined) business.logoDataUrl = updates.logoDataUrl;

    if (updates.invoicePrefix !== undefined) settings.invoicePrefix = updates.invoicePrefix.trim().toUpperCase();
    if (updates.quotationPrefix !== undefined) settings.quotationPrefix = updates.quotationPrefix.trim().toUpperCase();
    if (updates.defaultTaxLabel !== undefined) settings.defaultTaxLabel = updates.defaultTaxLabel.trim();
    if (updates.defaultTaxRate !== undefined) settings.defaultTaxRate = updates.defaultTaxRate;
    if (updates.defaultDueDays !== undefined) settings.defaultDueDays = Number(updates.defaultDueDays);
    if (updates.defaultPaymentInstructions !== undefined)
      settings.defaultPaymentInstructions = updates.defaultPaymentInstructions;
    if (updates.bankName !== undefined) settings.bankName = updates.bankName;
    if (updates.bankAccountName !== undefined) settings.bankAccountName = updates.bankAccountName;
    if (updates.bankAccountNumber !== undefined) settings.bankAccountNumber = updates.bankAccountNumber;
    if (updates.mobileMoneyNetwork !== undefined) settings.mobileMoneyNetwork = updates.mobileMoneyNetwork;
    if (updates.mobileMoneyNumber !== undefined) settings.mobileMoneyNumber = updates.mobileMoneyNumber;
    if (updates.mobileMoneyName !== undefined) settings.mobileMoneyName = updates.mobileMoneyName;
    if (updates.enableProjectsModule !== undefined) settings.enableProjectsModule = updates.enableProjectsModule;
    if (updates.enableAiAssistant !== undefined) settings.enableAiAssistant = updates.enableAiAssistant;

    this.logAudit({
      businessId,
      actorId: user.id,
      actorEmail: user.email,
      actorRole: membership.role,
      action: 'business.settings_updated',
      entityType: 'business',
      entityId: businessId,
    });
    this.persist();
    return { business, settings };
  }

  public inviteTeamMember(
    actorUserId: string,
    businessId: string,
    email: string,
    role: BusinessRole
  ): TeamInvitation {
    const { user, membership } = this.assertBusinessRole(actorUserId, businessId, ['owner', 'admin']);
    this.assertSubscriptionEntitlement(businessId, 'team_member');

    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail) throw new ValidationError('Email is required for team invitation.');

    const existingUser = this.state.users.find((u) => u.email.toLowerCase() === normalizedEmail);
    if (existingUser) {
      const existingMem = this.state.memberships.find(
        (m) => m.businessId === businessId && m.userId === existingUser.id
      );
      if (existingMem) {
        existingMem.role = role;
        existingMem.isActive = true;
        this.persist();
      } else {
        this.state.memberships.push({
          id: generateId('mem'),
          businessId,
          userId: existingUser.id,
          userEmail: existingUser.email,
          userFullName: existingUser.fullName,
          role,
          isActive: true,
          createdAt: new Date().toISOString(),
        });
      }
    }

    const invitation: TeamInvitation = {
      id: generateId('inv'),
      businessId,
      email: normalizedEmail,
      role,
      tokenHash: `inv_${generateId('tok')}`,
      status: existingUser ? 'accepted' : 'pending',
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      invitedBy: user.id,
      createdAt: new Date().toISOString(),
    };
    this.state.invitations.unshift(invitation);

    this.logAudit({
      businessId,
      actorId: user.id,
      actorEmail: user.email,
      actorRole: membership.role,
      action: 'team.member_invited',
      entityType: 'invitation',
      entityId: invitation.id,
      metadata: { invitedEmail: normalizedEmail, assignedRole: role },
    });
    this.persist();
    return invitation;
  }

  public updateMemberRole(
    actorUserId: string,
    businessId: string,
    membershipId: string,
    newRole: BusinessRole,
    isActive = true
  ): BusinessMembership {
    const { user, membership: actorMem } = this.assertBusinessRole(actorUserId, businessId, ['owner', 'admin']);
    const target = this.state.memberships.find((m) => m.id === membershipId && m.businessId === businessId);
    if (!target) throw new ValidationError('Membership record not found.');
    if (target.role === 'owner' && actorMem.role !== 'owner') {
      throw new AuthorizationError('Only a business owner can modify another owner.');
    }
    target.role = newRole;
    target.isActive = isActive;
    this.logAudit({
      businessId,
      actorId: user.id,
      actorEmail: user.email,
      actorRole: actorMem.role,
      action: 'team.role_updated',
      entityType: 'membership',
      entityId: membershipId,
      metadata: { newRole, isActive },
    });
    this.persist();
    return target;
  }

  public getBusinessTeam(actorUserId: string, businessId: string): {
    members: BusinessMembership[];
    invitations: TeamInvitation[];
  } {
    this.assertBusinessRole(actorUserId, businessId, ['owner', 'admin', 'accountant', 'sales', 'viewer']);
    return {
      members: this.state.memberships.filter((m) => m.businessId === businessId),
      invitations: this.state.invitations.filter((i) => i.businessId === businessId),
    };
  }

  // ==========================================================================
  // 4. SUBSCRIPTION ENTITLEMENTS & ATOMIC DOCUMENT NUMBERING
  // ==========================================================================

  public getBusinessSubscription(businessId: string): { subscription: Subscription; plan: SubscriptionPlan } {
    const subscription = this.state.subscriptions.find((s) => s.businessId === businessId);
    if (!subscription) {
      throw new ValidationError('No subscription found for business.');
    }
    const plan =
      this.state.subscriptionPlans.find((p) => p.id === subscription.planId) ?? DEFAULT_SUBSCRIPTION_PLANS[0];
    return { subscription, plan };
  }

  public assertSubscriptionEntitlement(
    businessId: string,
    feature: 'invoice' | 'client' | 'team_member' | 'projects' | 'ai_assistant' | 'csv_export'
  ): void {
    const { subscription, plan } = this.getBusinessSubscription(businessId);

    if (subscription.status === 'expired' || subscription.status === 'cancelled') {
      throw new EntitlementLimitError(
        `Your subscription is currently ${subscription.status}. Please renew or switch to an active plan.`
      );
    }

    if (feature === 'invoice') {
      const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
      const monthlyCount = this.state.invoices.filter(
        (inv) => inv.businessId === businessId && inv.createdAt.startsWith(currentMonth)
      ).length;
      if (monthlyCount >= plan.maxInvoicesPerMonth) {
        throw new EntitlementLimitError(
          `Your ${plan.nameEn} allows up to ${plan.maxInvoicesPerMonth} invoices per month (currently ${monthlyCount}). Please upgrade your plan to create more invoices.`
        );
      }
    } else if (feature === 'client') {
      const activeClientsCount = this.state.clients.filter(
        (c) => c.businessId === businessId && !c.isArchived
      ).length;
      if (activeClientsCount >= plan.maxClients) {
        throw new EntitlementLimitError(
          `Your ${plan.nameEn} allows up to ${plan.maxClients} active clients. Please upgrade your plan.`
        );
      }
    } else if (feature === 'team_member') {
      const activeMembersCount = this.state.memberships.filter(
        (m) => m.businessId === businessId && m.isActive
      ).length;
      if (activeMembersCount >= plan.maxTeamMembers) {
        throw new EntitlementLimitError(
          `Your ${plan.nameEn} allows up to ${plan.maxTeamMembers} team member(s). Please upgrade your plan to add more seats.`
        );
      }
    } else if (feature === 'projects' && !plan.allowProjectsTime) {
      throw new EntitlementLimitError(
        `Projects & Billable Time tracking requires the Professional or Business plan (current: ${plan.nameEn}).`
      );
    } else if (feature === 'ai_assistant' && !plan.allowAiAssistant) {
      throw new EntitlementLimitError(
        `AI Billing Assistant requires the Professional or Business plan (current: ${plan.nameEn}).`
      );
    } else if (feature === 'csv_export' && !plan.allowCsvExports) {
      throw new EntitlementLimitError(
        `CSV & Financial Report exports require the Starter, Professional, or Business plan (current: ${plan.nameEn}).`
      );
    }
  }

  public changeSubscriptionPlan(
    actorUserId: string,
    businessId: string,
    newPlanId: SubscriptionPlanId,
    billingInterval: 'monthly' | 'annual',
    paymentReference?: string
  ): Subscription {
    const { user, membership } = this.assertBusinessRole(actorUserId, businessId, ['owner', 'admin']);
    const { subscription } = this.getBusinessSubscription(businessId);
    const plan = this.state.subscriptionPlans.find((p) => p.id === newPlanId);
    if (!plan || !plan.isActive) {
      throw new ValidationError(`Plan "${newPlanId}" is not available.`);
    }

    subscription.planId = newPlanId;
    subscription.billingInterval = billingInterval;
    subscription.status = 'active';
    subscription.verificationMode =
      newPlanId === 'free' ? 'free_tier' : paymentReference ? 'manual_verified' : 'manual_verified';
    subscription.lastPaymentReference = paymentReference?.trim() || subscription.lastPaymentReference;
    subscription.updatedAt = new Date().toISOString();

    this.logAudit({
      businessId,
      actorId: user.id,
      actorEmail: user.email,
      actorRole: membership.role,
      action: 'subscription.plan_changed',
      entityType: 'subscription',
      entityId: subscription.id,
      metadata: {
        newPlanId,
        billingInterval,
        verificationMode: subscription.verificationMode,
        paymentReference: paymentReference ?? null,
      },
    });
    this.persist();
    return subscription;
  }

  /**
   * Atomic sequential document number generator scoped per business & document type.
   * Prevents duplicate numbers even under concurrent calls.
   */
  public generateNextDocumentNumber(
    actorUserId: string,
    businessId: string,
    docType: 'invoice' | 'quotation' | 'proforma' | 'credit_note' | 'receipt'
  ): string {
    this.assertBusinessRole(actorUserId, businessId, ['owner', 'admin', 'accountant', 'sales']);
    const settings = this.state.businessSettings.find((s) => s.businessId === businessId);
    if (!settings) throw new ValidationError('Business settings not found.');

    const year = new Date().getFullYear();
    const pad = settings.numberPadding || 4;
    let prefix = 'DOC';
    let seq = 1;

    if (docType === 'invoice') {
      prefix = settings.invoicePrefix || 'INV';
      seq = settings.nextInvoiceNumber;
      settings.nextInvoiceNumber += 1;
    } else if (docType === 'quotation') {
      prefix = settings.quotationPrefix || 'QUO';
      seq = settings.nextQuotationNumber;
      settings.nextQuotationNumber += 1;
    } else if (docType === 'proforma') {
      prefix = settings.proformaPrefix || 'PRO';
      seq = settings.nextProformaNumber;
      settings.nextProformaNumber += 1;
    } else if (docType === 'credit_note') {
      prefix = settings.creditNotePrefix || 'CN';
      seq = settings.nextCreditNoteNumber;
      settings.nextCreditNoteNumber += 1;
    } else if (docType === 'receipt') {
      prefix = settings.receiptPrefix || 'RCT';
      seq = settings.nextReceiptNumber;
      settings.nextReceiptNumber += 1;
    }

    const formatted = `${prefix}-${year}-${String(seq).padStart(pad, '0')}`;
    this.persist();
    return formatted;
  }

  // ==========================================================================
  // 5. CLIENTS & DUPLICATE DETECTION
  // ==========================================================================

  public listClients(actorUserId: string, businessId: string, includeArchived = false): Client[] {
    this.assertBusinessRole(actorUserId, businessId, ['owner', 'admin', 'accountant', 'sales', 'viewer']);
    return this.state.clients.filter(
      (c) => c.businessId === businessId && (includeArchived || !c.isArchived)
    );
  }

  public findPotentialDuplicateClients(
    actorUserId: string,
    businessId: string,
    input: { name?: string; email?: string; tinNumber?: string; phone?: string }
  ): Client[] {
    this.assertBusinessRole(actorUserId, businessId, ['owner', 'admin', 'accountant', 'sales', 'viewer']);
    const businessClients = this.state.clients.filter((c) => c.businessId === businessId);
    return businessClients.filter((c) => {
      if (input.email && c.email && c.email.toLowerCase() === input.email.trim().toLowerCase()) return true;
      if (input.tinNumber && c.tinNumber && c.tinNumber.trim() === input.tinNumber.trim()) return true;
      if (input.name && c.name.toLowerCase() === input.name.trim().toLowerCase()) return true;
      return false;
    });
  }

  public createClient(
    actorUserId: string,
    businessId: string,
    input: {
      clientType: 'individual' | 'company';
      name: string;
      contactPerson?: string;
      email?: string;
      phone?: string;
      tinNumber?: string;
      vrnNumber?: string;
      billingAddress?: string;
      city?: string;
      countryCode?: string;
      preferredCurrency?: CurrencyCode;
      preferredLanguage?: LanguageCode;
      notes?: string;
      tags?: string[];
      confirmDuplicateOverride?: boolean;
    }
  ): Client {
    const { user, business, membership } = this.assertBusinessRole(actorUserId, businessId, [
      'owner',
      'admin',
      'accountant',
      'sales',
    ]);
    this.assertSubscriptionEntitlement(businessId, 'client');

    if (!input.name.trim()) {
      throw new ValidationError('Client name is required.');
    }

    if (!input.confirmDuplicateOverride) {
      const duplicates = this.findPotentialDuplicateClients(actorUserId, businessId, {
        name: input.name,
        email: input.email,
        tinNumber: input.tinNumber,
      });
      if (duplicates.length > 0) {
        throw new ValidationError(
          `Potential duplicate client detected ("${duplicates[0].name}"). Confirm duplicate override if this is intentional.`
        );
      }
    }

    const client: Client = {
      id: generateId('cli'),
      businessId,
      clientType: input.clientType,
      name: input.name.trim(),
      contactPerson: input.contactPerson?.trim() ?? '',
      email: input.email?.trim() ?? '',
      phone: input.phone?.trim() ?? '',
      tinNumber: input.tinNumber?.trim() ?? '',
      vrnNumber: input.vrnNumber?.trim() ?? '',
      billingAddress: input.billingAddress?.trim() ?? '',
      city: input.city?.trim() || business.city,
      countryCode: input.countryCode ?? business.countryCode,
      preferredCurrency: input.preferredCurrency ?? business.defaultCurrency,
      preferredLanguage: input.preferredLanguage ?? 'en',
      notes: input.notes?.trim() ?? '',
      tags: input.tags ?? [],
      reminderOptOut: false,
      isArchived: false,
      createdAt: new Date().toISOString(),
    };

    this.state.clients.unshift(client);
    this.logAudit({
      businessId,
      actorId: user.id,
      actorEmail: user.email,
      actorRole: membership.role,
      action: 'client.created',
      entityType: 'client',
      entityId: client.id,
      metadata: { name: client.name },
    });
    this.persist();
    return client;
  }

  public updateClient(
    actorUserId: string,
    businessId: string,
    clientId: string,
    updates: Partial<Client>
  ): Client {
    this.assertBusinessRole(actorUserId, businessId, ['owner', 'admin', 'accountant', 'sales']);
    const client = this.state.clients.find((c) => c.id === clientId && c.businessId === businessId);
    if (!client) throw new TenantIsolationError('Client not found in this business.');

    Object.assign(client, updates, { id: client.id, businessId: client.businessId });
    this.persist();
    return client;
  }

  // ==========================================================================
  // 6. PRODUCTS & SERVICES CATALOG
  // ==========================================================================

  public listProductsServices(actorUserId: string, businessId: string, includeArchived = false): ProductService[] {
    this.assertBusinessRole(actorUserId, businessId, ['owner', 'admin', 'accountant', 'sales', 'viewer']);
    return this.state.productsServices.filter(
      (p) => p.businessId === businessId && (includeArchived || !p.isArchived)
    );
  }

  public createProductService(
    actorUserId: string,
    businessId: string,
    input: {
      itemType: 'product' | 'service';
      name: string;
      sku?: string;
      description?: string;
      unit?: string;
      unitPrice: string | number;
      currency?: CurrencyCode;
      taxRate?: string | number;
      taxLabel?: string;
    }
  ): ProductService {
    const { business } = this.assertBusinessRole(actorUserId, businessId, ['owner', 'admin', 'accountant', 'sales']);
    const settings = this.state.businessSettings.find((s) => s.businessId === businessId)!;
    if (!input.name.trim()) throw new ValidationError('Product or service name is required.');

    const item: ProductService = {
      id: generateId('prd'),
      businessId,
      itemType: input.itemType,
      name: input.name.trim(),
      sku: input.sku?.trim() ?? '',
      description: input.description?.trim() || input.name.trim(),
      unit: input.unit?.trim() || 'unit',
      unitPrice: addMoney(input.unitPrice, 0),
      currency: input.currency ?? business.defaultCurrency,
      taxRate: String(input.taxRate ?? settings.defaultTaxRate),
      taxLabel: input.taxLabel?.trim() || settings.defaultTaxLabel,
      isArchived: false,
      createdAt: new Date().toISOString(),
    };
    this.state.productsServices.unshift(item);
    this.persist();
    return item;
  }

  public updateProductService(
    actorUserId: string,
    businessId: string,
    itemId: string,
    updates: Partial<ProductService>
  ): ProductService {
    this.assertBusinessRole(actorUserId, businessId, ['owner', 'admin', 'accountant', 'sales']);
    const item = this.state.productsServices.find((p) => p.id === itemId && p.businessId === businessId);
    if (!item) throw new TenantIsolationError('Product/Service not found in this business.');
    Object.assign(item, updates, { id: item.id, businessId: item.businessId });
    this.persist();
    return item;
  }

  // ==========================================================================
  // 7. QUOTATIONS & ESTIMATES (Lifecycle, Revisions & Conversion to Invoice)
  // ==========================================================================

  private buildValidatedLineItems(
    rawItems: Array<{
      productServiceId?: string;
      description: string;
      unit?: string;
      quantity: string | number;
      unitPrice: string | number;
      discountAmount?: string | number;
      taxLabel?: string;
      taxRate?: string | number;
    }>,
    defaultTaxLabel: string
  ): { items: DocumentLineItem[]; subtotal: string; discountTotal: string; taxTotal: string; grandTotal: string } {
    if (!rawItems || rawItems.length === 0) {
      throw new ValidationError('At least one line item is required.');
    }

    const calcInputs: LineItemCalculationInput[] = rawItems.map((ri) => ({
      quantity: ri.quantity,
      unitPrice: ri.unitPrice,
      discountAmount: ri.discountAmount ?? '0.00',
      taxRatePercent: ri.taxRate ?? '0',
    }));

    const totals = calculateDocumentTotals(calcInputs);
    const items: DocumentLineItem[] = rawItems.map((ri, idx) => {
      const lineCalc = totals.lines[idx];
      return {
        id: generateId('item'),
        productServiceId: ri.productServiceId,
        description: ri.description.trim() || `Item ${idx + 1}`,
        unit: ri.unit?.trim() || 'unit',
        quantity: String(ri.quantity),
        unitPrice: addMoney(ri.unitPrice, 0),
        discountAmount: lineCalc.discountAmount,
        taxLabel: ri.taxLabel?.trim() || defaultTaxLabel,
        taxRate: String(ri.taxRate ?? '0'),
        taxAmount: lineCalc.taxAmount,
        lineSubtotal: lineCalc.lineSubtotal,
        lineTotal: lineCalc.lineTotal,
      };
    });

    return {
      items,
      subtotal: totals.subtotal,
      discountTotal: totals.discountTotal,
      taxTotal: totals.taxTotal,
      grandTotal: totals.grandTotal,
    };
  }

  public listQuotations(actorUserId: string, businessId: string): Quotation[] {
    this.assertBusinessRole(actorUserId, businessId, ['owner', 'admin', 'accountant', 'sales', 'viewer']);
    return this.state.quotations.filter((q) => q.businessId === businessId);
  }

  public createQuotation(
    actorUserId: string,
    businessId: string,
    input: {
      clientId: string;
      projectId?: string;
      issueDate?: string;
      validUntil: string;
      currency?: CurrencyCode;
      items: Array<{
        productServiceId?: string;
        description: string;
        unit?: string;
        quantity: string | number;
        unitPrice: string | number;
        discountAmount?: string | number;
        taxLabel?: string;
        taxRate?: string | number;
      }>;
      notes?: string;
      terms?: string;
      status?: 'draft' | 'sent';
    }
  ): Quotation {
    const { user, business, membership } = this.assertBusinessRole(actorUserId, businessId, [
      'owner',
      'admin',
      'accountant',
      'sales',
    ]);
    const client = this.state.clients.find((c) => c.id === input.clientId && c.businessId === businessId);
    if (!client) throw new TenantIsolationError('Selected client does not belong to this business.');

    const settings = this.state.businessSettings.find((s) => s.businessId === businessId)!;
    const calculated = this.buildValidatedLineItems(input.items, settings.defaultTaxLabel);
    const quotationNumber = this.generateNextDocumentNumber(actorUserId, businessId, 'quotation');
    const now = new Date().toISOString();

    const quotation: Quotation = {
      id: generateId('quo'),
      businessId,
      clientId: client.id,
      projectId: input.projectId,
      quotationNumber,
      status: input.status ?? 'draft',
      issueDate: input.issueDate || now.slice(0, 10),
      validUntil: input.validUntil,
      currency: input.currency ?? client.preferredCurrency ?? business.defaultCurrency,
      subtotal: calculated.subtotal,
      discountTotal: calculated.discountTotal,
      taxTotal: calculated.taxTotal,
      grandTotal: calculated.grandTotal,
      items: calculated.items,
      notes: input.notes ?? settings.defaultInvoiceNotes,
      terms: input.terms ?? settings.defaultTerms,
      revisionNumber: 1,
      revisionHistory: [
        {
          revisionNumber: 1,
          updatedAt: now,
          updatedBy: user.fullName,
          grandTotal: calculated.grandTotal,
          summary: 'Initial quotation created',
        },
      ],
      createdAt: now,
      updatedAt: now,
    };

    this.state.quotations.unshift(quotation);
    this.logAudit({
      businessId,
      actorId: user.id,
      actorEmail: user.email,
      actorRole: membership.role,
      action: 'quotation.created',
      entityType: 'quotation',
      entityId: quotation.id,
      metadata: { quotationNumber, grandTotal: quotation.grandTotal, currency: quotation.currency },
    });
    this.persist();
    return quotation;
  }

  public updateQuotation(
    actorUserId: string,
    businessId: string,
    quotationId: string,
    updates: {
      validUntil?: string;
      items?: Array<{
        productServiceId?: string;
        description: string;
        unit?: string;
        quantity: string | number;
        unitPrice: string | number;
        discountAmount?: string | number;
        taxLabel?: string;
        taxRate?: string | number;
      }>;
      notes?: string;
      terms?: string;
      status?: 'draft' | 'sent' | 'viewed' | 'accepted' | 'rejected' | 'expired';
      acceptedByName?: string;
      rejectionReason?: string;
    }
  ): Quotation {
    const { user } = this.assertBusinessRole(actorUserId, businessId, ['owner', 'admin', 'accountant', 'sales']);
    const quotation = this.state.quotations.find((q) => q.id === quotationId && q.businessId === businessId);
    if (!quotation) throw new TenantIsolationError('Quotation not found in this business.');
    if (quotation.status === 'converted') {
      throw new ValidationError('Converted quotations cannot be modified.');
    }

    const settings = this.state.businessSettings.find((s) => s.businessId === businessId)!;
    const now = new Date().toISOString();

    if (updates.items) {
      const calc = this.buildValidatedLineItems(updates.items, settings.defaultTaxLabel);
      quotation.items = calc.items;
      quotation.subtotal = calc.subtotal;
      quotation.discountTotal = calc.discountTotal;
      quotation.taxTotal = calc.taxTotal;
      quotation.grandTotal = calc.grandTotal;
      quotation.revisionNumber += 1;
      quotation.revisionHistory.push({
        revisionNumber: quotation.revisionNumber,
        updatedAt: now,
        updatedBy: user.fullName,
        grandTotal: calc.grandTotal,
        summary: `Revision #${quotation.revisionNumber} updated line items`,
      });
    }

    if (updates.validUntil !== undefined) quotation.validUntil = updates.validUntil;
    if (updates.notes !== undefined) quotation.notes = updates.notes;
    if (updates.terms !== undefined) quotation.terms = updates.terms;
    if (updates.status !== undefined) {
      quotation.status = updates.status;
      if (updates.status === 'accepted') {
        quotation.acceptedAt = now;
        quotation.acceptedByName = updates.acceptedByName || user.fullName;
      } else if (updates.status === 'rejected') {
        quotation.rejectedAt = now;
        quotation.rejectionReason = updates.rejectionReason ?? '';
      }
    }
    quotation.updatedAt = now;
    this.persist();
    return quotation;
  }

  /**
   * Convert an accepted/sent quotation into an Invoice, preserving all line items,
   * agreed prices, client information, currency, and terms. Prevents duplicate conversion.
   */
  public convertQuotationToInvoice(
    actorUserId: string,
    businessId: string,
    quotationId: string,
    options?: { issueImmediately?: boolean; dueDate?: string }
  ): Invoice {
    this.assertBusinessRole(actorUserId, businessId, ['owner', 'admin', 'accountant', 'sales']);
    const quotation = this.state.quotations.find((q) => q.id === quotationId && q.businessId === businessId);
    if (!quotation) throw new TenantIsolationError('Quotation not found in this business.');

    if (quotation.convertedInvoiceId) {
      throw new ValidationError(
        `This quotation (${quotation.quotationNumber}) has already been converted to an invoice.`
      );
    }
    if (quotation.status === 'rejected' || quotation.status === 'expired') {
      throw new ValidationError(`Cannot convert a ${quotation.status} quotation to an invoice.`);
    }

    const settings = this.state.businessSettings.find((s) => s.businessId === businessId)!;
    const dueDate =
      options?.dueDate ||
      new Date(Date.now() + settings.defaultDueDays * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

    if (!quotation.acceptedAt) {
      quotation.acceptedAt = new Date().toISOString();
    }

    const invoice = this.createInvoice(actorUserId, businessId, {
      clientId: quotation.clientId,
      quotationId: quotation.id,
      projectId: quotation.projectId,
      dueDate,
      currency: quotation.currency,
      items: quotation.items.map((it) => ({
        productServiceId: it.productServiceId,
        description: it.description,
        unit: it.unit,
        quantity: it.quantity,
        unitPrice: it.unitPrice,
        discountAmount: it.discountAmount,
        taxLabel: it.taxLabel,
        taxRate: it.taxRate,
      })),
      notes: quotation.notes,
      terms: quotation.terms,
      issueImmediately: options?.issueImmediately ?? true,
    });

    quotation.status = 'converted';
    quotation.convertedInvoiceId = invoice.id;
    quotation.updatedAt = new Date().toISOString();
    this.persist();
    return invoice;
  }

  // ==========================================================================
  // 8. INVOICES, IMMUTABILITY, DUPLICATION, PROFORMA & CREDIT NOTES
  // ==========================================================================

  public listInvoices(actorUserId: string, businessId: string): Invoice[] {
    this.assertBusinessRole(actorUserId, businessId, ['owner', 'admin', 'accountant', 'sales', 'viewer']);
    const today = new Date().toISOString().slice(0, 10);
    const list = this.state.invoices.filter((i) => i.businessId === businessId);
    for (const inv of list) {
      if (
        (inv.status === 'issued' || inv.status === 'partially_paid') &&
        inv.dueDate < today &&
        compareMoney(inv.balanceDue, '0.00') > 0
      ) {
        inv.status = 'overdue';
      }
    }
    return list;
  }

  public getInvoiceEvents(actorUserId: string, businessId: string, invoiceId: string): InvoiceEvent[] {
    this.assertBusinessRole(actorUserId, businessId, ['owner', 'admin', 'accountant', 'sales', 'viewer']);
    return this.state.invoiceEvents.filter((e) => e.businessId === businessId && e.invoiceId === invoiceId);
  }

  private recordInvoiceEvent(
    businessId: string,
    invoiceId: string,
    eventType: string,
    actorLabel: string,
    summary: string
  ): void {
    this.state.invoiceEvents.unshift({
      id: generateId('evt'),
      businessId,
      invoiceId,
      eventType,
      actorLabel,
      summary,
      createdAt: new Date().toISOString(),
    });
  }

  public createInvoice(
    actorUserId: string,
    businessId: string,
    input: {
      clientId: string;
      quotationId?: string;
      projectId?: string;
      issueDate?: string;
      dueDate: string;
      currency?: CurrencyCode;
      items: Array<{
        productServiceId?: string;
        description: string;
        unit?: string;
        quantity: string | number;
        unitPrice: string | number;
        discountAmount?: string | number;
        taxLabel?: string;
        taxRate?: string | number;
      }>;
      paymentInstructions?: string;
      notes?: string;
      terms?: string;
      issueImmediately?: boolean;
    }
  ): Invoice {
    const { user, business, membership } = this.assertBusinessRole(actorUserId, businessId, [
      'owner',
      'admin',
      'accountant',
      'sales',
    ]);
    this.assertSubscriptionEntitlement(businessId, 'invoice');

    const client = this.state.clients.find((c) => c.id === input.clientId && c.businessId === businessId);
    if (!client) throw new TenantIsolationError('Selected client does not belong to this business.');

    const settings = this.state.businessSettings.find((s) => s.businessId === businessId)!;
    const calculated = this.buildValidatedLineItems(input.items, settings.defaultTaxLabel);
    const invoiceNumber = this.generateNextDocumentNumber(actorUserId, businessId, 'invoice');
    const now = new Date().toISOString();
    const issueDate = input.issueDate || now.slice(0, 10);
    const today = now.slice(0, 10);

    let status: InvoiceStatus = input.issueImmediately ? 'issued' : 'draft';
    if (status === 'issued' && input.dueDate < today) {
      status = 'overdue';
    }

    const invoice: Invoice = {
      id: generateId('inv'),
      businessId,
      clientId: client.id,
      quotationId: input.quotationId,
      projectId: input.projectId,
      invoiceNumber,
      status,
      issueDate,
      dueDate: input.dueDate,
      currency: input.currency ?? client.preferredCurrency ?? business.defaultCurrency,
      subtotal: calculated.subtotal,
      discountTotal: calculated.discountTotal,
      taxTotal: calculated.taxTotal,
      grandTotal: calculated.grandTotal,
      creditNotesTotal: '0.00',
      amountPaid: '0.00',
      balanceDue: calculated.grandTotal,
      items: calculated.items,
      paymentInstructions: input.paymentInstructions ?? settings.defaultPaymentInstructions,
      notes: input.notes ?? settings.defaultInvoiceNotes,
      terms: input.terms ?? settings.defaultTerms,
      issuedAt: input.issueImmediately ? now : undefined,
      issuedSnapshot: input.issueImmediately
        ? {
            subtotal: calculated.subtotal,
            discountTotal: calculated.discountTotal,
            taxTotal: calculated.taxTotal,
            grandTotal: calculated.grandTotal,
            issuedAt: now,
            itemsCount: calculated.items.length,
          }
        : undefined,
      createdAt: now,
      updatedAt: now,
    };

    this.state.invoices.unshift(invoice);
    this.recordInvoiceEvent(
      businessId,
      invoice.id,
      input.issueImmediately ? 'invoice.issued' : 'invoice.draft_created',
      user.fullName,
      `${input.issueImmediately ? 'Issued' : 'Created draft'} invoice ${invoice.invoiceNumber} for ${invoice.currency} ${invoice.grandTotal}`
    );

    this.logAudit({
      businessId,
      actorId: user.id,
      actorEmail: user.email,
      actorRole: membership.role,
      action: input.issueImmediately ? 'invoice.issued' : 'invoice.created',
      entityType: 'invoice',
      entityId: invoice.id,
      metadata: { invoiceNumber, grandTotal: invoice.grandTotal, currency: invoice.currency },
    });

    this.persist();
    return invoice;
  }

  /**
   * Update a draft invoice or issue a draft invoice.
   * Strongly enforces immutability of issued financial documents!
   */
  public updateDraftInvoice(
    actorUserId: string,
    businessId: string,
    invoiceId: string,
    updates: {
      dueDate?: string;
      items?: Array<{
        productServiceId?: string;
        description: string;
        unit?: string;
        quantity: string | number;
        unitPrice: string | number;
        discountAmount?: string | number;
        taxLabel?: string;
        taxRate?: string | number;
      }>;
      notes?: string;
      terms?: string;
      paymentInstructions?: string;
    }
  ): Invoice {
    const { user } = this.assertBusinessRole(actorUserId, businessId, ['owner', 'admin', 'accountant', 'sales']);
    const invoice = this.state.invoices.find((i) => i.id === invoiceId && i.businessId === businessId);
    if (!invoice) throw new TenantIsolationError('Invoice not found in this business.');

    if (invoice.status !== 'draft') {
      throw new ValidationError(
        `Invoice ${invoice.invoiceNumber} is already ${invoice.status}. Issued financial documents cannot be silently rewritten. Issue a Credit Note or void and re-issue.`
      );
    }

    const settings = this.state.businessSettings.find((s) => s.businessId === businessId)!;
    if (updates.items) {
      const calc = this.buildValidatedLineItems(updates.items, settings.defaultTaxLabel);
      invoice.items = calc.items;
      invoice.subtotal = calc.subtotal;
      invoice.discountTotal = calc.discountTotal;
      invoice.taxTotal = calc.taxTotal;
      invoice.grandTotal = calc.grandTotal;
      invoice.balanceDue = calc.grandTotal;
    }
    if (updates.dueDate !== undefined) invoice.dueDate = updates.dueDate;
    if (updates.notes !== undefined) invoice.notes = updates.notes;
    if (updates.terms !== undefined) invoice.terms = updates.terms;
    if (updates.paymentInstructions !== undefined) invoice.paymentInstructions = updates.paymentInstructions;
    invoice.updatedAt = new Date().toISOString();

    this.recordInvoiceEvent(
      businessId,
      invoice.id,
      'invoice.draft_updated',
      user.fullName,
      `Updated draft invoice ${invoice.invoiceNumber}`
    );
    this.persist();
    return invoice;
  }

  public issueInvoice(actorUserId: string, businessId: string, invoiceId: string): Invoice {
    const { user } = this.assertBusinessRole(actorUserId, businessId, ['owner', 'admin', 'accountant', 'sales']);
    const invoice = this.state.invoices.find((i) => i.id === invoiceId && i.businessId === businessId);
    if (!invoice) throw new TenantIsolationError('Invoice not found.');
    if (invoice.status !== 'draft') {
      throw new ValidationError(`Invoice ${invoice.invoiceNumber} is already ${invoice.status}.`);
    }

    const now = new Date().toISOString();
    const today = now.slice(0, 10);
    invoice.status = invoice.dueDate < today ? 'overdue' : 'issued';
    invoice.issuedAt = now;
    invoice.issuedSnapshot = {
      subtotal: invoice.subtotal,
      discountTotal: invoice.discountTotal,
      taxTotal: invoice.taxTotal,
      grandTotal: invoice.grandTotal,
      issuedAt: now,
      itemsCount: invoice.items.length,
    };
    invoice.updatedAt = now;

    this.recordInvoiceEvent(
      businessId,
      invoice.id,
      'invoice.issued',
      user.fullName,
      `Officially issued invoice ${invoice.invoiceNumber} (${invoice.currency} ${invoice.grandTotal})`
    );
    this.persist();
    return invoice;
  }

  public duplicateInvoice(actorUserId: string, businessId: string, sourceInvoiceId: string): Invoice {
    this.assertBusinessRole(actorUserId, businessId, ['owner', 'admin', 'accountant', 'sales']);
    const source = this.state.invoices.find((i) => i.id === sourceInvoiceId && i.businessId === businessId);
    if (!source) throw new TenantIsolationError('Source invoice not found.');

    const settings = this.state.businessSettings.find((s) => s.businessId === businessId)!;
    const dueDate = new Date(Date.now() + settings.defaultDueDays * 24 * 60 * 60 * 1000)
      .toISOString()
      .slice(0, 10);

    return this.createInvoice(actorUserId, businessId, {
      clientId: source.clientId,
      projectId: source.projectId,
      dueDate,
      currency: source.currency,
      items: source.items.map((it) => ({
        productServiceId: it.productServiceId,
        description: it.description,
        unit: it.unit,
        quantity: it.quantity,
        unitPrice: it.unitPrice,
        discountAmount: it.discountAmount,
        taxLabel: it.taxLabel,
        taxRate: it.taxRate,
      })),
      paymentInstructions: source.paymentInstructions,
      notes: source.notes,
      terms: source.terms,
      issueImmediately: false,
    });
  }

  public voidInvoice(actorUserId: string, businessId: string, invoiceId: string, voidReason: string): Invoice {
    const { user, membership } = this.assertBusinessRole(actorUserId, businessId, ['owner', 'admin', 'accountant']);
    const invoice = this.state.invoices.find((i) => i.id === invoiceId && i.businessId === businessId);
    if (!invoice) throw new TenantIsolationError('Invoice not found.');
    if (!voidReason.trim()) throw new ValidationError('A reason is required to void an invoice.');
    if (compareMoney(invoice.amountPaid, '0.00') > 0) {
      throw new ValidationError(
        'Cannot void an invoice that has active payments allocated. Reverse the payment or issue a credit note first.'
      );
    }

    invoice.status = 'voided';
    invoice.voidedAt = new Date().toISOString();
    invoice.voidReason = voidReason.trim();
    invoice.balanceDue = '0.00';
    invoice.updatedAt = invoice.voidedAt;

    // Automatically suppress/cancel any queued payment reminders for this voided invoice
    this.suppressPendingRemindersForInvoice(businessId, invoice.id, 'Invoice voided');

    this.recordInvoiceEvent(
      businessId,
      invoice.id,
      'invoice.voided',
      user.fullName,
      `Voided invoice ${invoice.invoiceNumber}: ${voidReason.trim()}`
    );
    this.logAudit({
      businessId,
      actorId: user.id,
      actorEmail: user.email,
      actorRole: membership.role,
      action: 'invoice.voided',
      entityType: 'invoice',
      entityId: invoice.id,
      metadata: { invoiceNumber: invoice.invoiceNumber, voidReason },
    });
    this.persist();
    return invoice;
  }

  /**
   * Issue a Credit Note linked to an issued invoice to transparently adjust receivables.
   */
  public createCreditNote(
    actorUserId: string,
    businessId: string,
    input: {
      invoiceId: string;
      reason: string;
      amount: string | number;
      taxRatePercent?: string | number;
    }
  ): { creditNote: CreditNote; updatedInvoice: Invoice } {
    const { user, membership } = this.assertBusinessRole(actorUserId, businessId, ['owner', 'admin', 'accountant']);
    const invoice = this.state.invoices.find((i) => i.id === input.invoiceId && i.businessId === businessId);
    if (!invoice) throw new TenantIsolationError('Linked invoice not found in this business.');
    if (invoice.status === 'draft' || invoice.status === 'voided') {
      throw new ValidationError(`Cannot issue a credit note against a ${invoice.status} invoice.`);
    }
    if (!input.reason.trim()) {
      throw new ValidationError('Credit note reason is required.');
    }

    const totalCredit = addMoney(input.amount, 0);
    if (compareMoney(totalCredit, '0.00') <= 0) {
      throw new ValidationError('Credit note amount must be greater than zero.');
    }
    if (compareMoney(totalCredit, invoice.balanceDue) > 0) {
      throw new ValidationError(
        `Credit note amount (${invoice.currency} ${totalCredit}) cannot exceed current invoice balance due (${invoice.currency} ${invoice.balanceDue}).`
      );
    }

    const creditNoteNumber = this.generateNextDocumentNumber(actorUserId, businessId, 'credit_note');
    const creditNote: CreditNote = {
      id: generateId('cn'),
      businessId,
      invoiceId: invoice.id,
      clientId: invoice.clientId,
      creditNoteNumber,
      status: 'issued',
      issueDate: new Date().toISOString().slice(0, 10),
      currency: invoice.currency,
      reason: input.reason.trim(),
      subtotal: totalCredit,
      taxTotal: '0.00',
      totalAmount: totalCredit,
      createdAt: new Date().toISOString(),
    };

    this.state.creditNotes.unshift(creditNote);
    invoice.creditNotesTotal = addMoney(invoice.creditNotesTotal, totalCredit);
    this.reconcileInvoiceBalanceAndStatus(invoice);

    this.recordInvoiceEvent(
      businessId,
      invoice.id,
      'credit_note.issued',
      user.fullName,
      `Issued credit note ${creditNoteNumber} for ${invoice.currency} ${totalCredit} (${input.reason.trim()})`
    );
    this.logAudit({
      businessId,
      actorId: user.id,
      actorEmail: user.email,
      actorRole: membership.role,
      action: 'credit_note.issued',
      entityType: 'credit_note',
      entityId: creditNote.id,
      metadata: { invoiceId: invoice.id, creditNoteNumber, totalAmount: totalCredit },
    });

    this.persist();
    return { creditNote, updatedInvoice: invoice };
  }

  public listCreditNotes(actorUserId: string, businessId: string): CreditNote[] {
    this.assertBusinessRole(actorUserId, businessId, ['owner', 'admin', 'accountant', 'sales', 'viewer']);
    return this.state.creditNotes.filter((c) => c.businessId === businessId);
  }

  public listProformaInvoices(actorUserId: string, businessId: string): ProformaInvoice[] {
    this.assertBusinessRole(actorUserId, businessId, ['owner', 'admin', 'accountant', 'sales', 'viewer']);
    return this.state.proformaInvoices.filter((p) => p.businessId === businessId);
  }

  public createProformaInvoice(
    actorUserId: string,
    businessId: string,
    input: {
      clientId: string;
      validUntil: string;
      currency?: CurrencyCode;
      items: Array<{
        description: string;
        unit?: string;
        quantity: string | number;
        unitPrice: string | number;
        discountAmount?: string | number;
        taxRate?: string | number;
      }>;
      notes?: string;
    }
  ): ProformaInvoice {
    const { business } = this.assertBusinessRole(actorUserId, businessId, ['owner', 'admin', 'accountant', 'sales']);
    const settings = this.state.businessSettings.find((s) => s.businessId === businessId)!;
    const calc = this.buildValidatedLineItems(input.items, settings.defaultTaxLabel);
    const proformaNumber = this.generateNextDocumentNumber(actorUserId, businessId, 'proforma');

    const proforma: ProformaInvoice = {
      id: generateId('pro'),
      businessId,
      clientId: input.clientId,
      proformaNumber,
      status: 'sent',
      issueDate: new Date().toISOString().slice(0, 10),
      validUntil: input.validUntil,
      currency: input.currency ?? business.defaultCurrency,
      subtotal: calc.subtotal,
      discountTotal: calc.discountTotal,
      taxTotal: calc.taxTotal,
      grandTotal: calc.grandTotal,
      items: calc.items,
      notes:
        input.notes ??
        'PROFORMA NOTICE: This Proforma Invoice is for customs/quotation purposes only and is NOT a fiscal tax receipt or proof of payment.',
      paymentInstructions: settings.defaultPaymentInstructions,
      createdAt: new Date().toISOString(),
    };

    this.state.proformaInvoices.unshift(proforma);
    this.persist();
    return proforma;
  }

  // ==========================================================================
  // 9. PAYMENTS, PARTIAL ALLOCATIONS, RECEIPTS & REVERSALS
  // ==========================================================================

  private reconcileInvoiceBalanceAndStatus(invoice: Invoice): void {
    const balanceInfo = calculateInvoiceBalance(
      invoice.grandTotal,
      invoice.creditNotesTotal,
      invoice.amountPaid
    );
    invoice.balanceDue = balanceInfo.balanceDue;
    const today = new Date().toISOString().slice(0, 10);

    if (invoice.status !== 'voided' && invoice.status !== 'draft') {
      if (balanceInfo.isFullyPaid || compareMoney(invoice.balanceDue, '0.00') === 0) {
        invoice.status = 'paid';
        this.suppressPendingRemindersForInvoice(
          invoice.businessId,
          invoice.id,
          'Balance reached zero'
        );
      } else if (balanceInfo.isPartiallyPaid) {
        invoice.status = invoice.dueDate < today ? 'overdue' : 'partially_paid';
      } else {
        invoice.status = invoice.dueDate < today ? 'overdue' : 'issued';
      }
    }
    invoice.updatedAt = new Date().toISOString();
  }

  public recordPayment(
    actorUserId: string,
    businessId: string,
    input: {
      invoiceId: string;
      idempotencyKey: string;
      amount: string | number;
      paymentDate?: string;
      paymentMethod: PaymentMethodType;
      providerName?: string;
      transactionReference?: string;
      verificationStatus?: PaymentVerificationStatus;
      notes?: string;
    }
  ): { payment: Payment; receipt: Receipt; updatedInvoice: Invoice; idempotentReplay: boolean } {
    const { user, membership } = this.assertBusinessRole(actorUserId, businessId, [
      'owner',
      'admin',
      'accountant',
    ]);

    if (!input.idempotencyKey.trim()) {
      throw new ValidationError('Idempotency key is required to prevent duplicate payment recording.');
    }

    // Check idempotency key first
    const existingPayment = this.state.payments.find(
      (p) => p.businessId === businessId && p.idempotencyKey === input.idempotencyKey.trim()
    );
    if (existingPayment) {
      const existingReceipt = this.state.receipts.find((r) => r.paymentId === existingPayment.id)!;
      const existingInvoice = this.state.invoices.find((i) => i.id === existingPayment.invoiceId)!;
      return {
        payment: existingPayment,
        receipt: existingReceipt,
        updatedInvoice: existingInvoice,
        idempotentReplay: true,
      };
    }

    const invoice = this.state.invoices.find((i) => i.id === input.invoiceId && i.businessId === businessId);
    if (!invoice) throw new TenantIsolationError('Invoice not found in this business.');
    if (invoice.status === 'draft' || invoice.status === 'voided') {
      throw new ValidationError(`Cannot record payment against a ${invoice.status} invoice.`);
    }

    const paymentAmount = addMoney(input.amount, 0);
    if (compareMoney(paymentAmount, '0.00') <= 0) {
      throw new ValidationError('Payment amount must be greater than zero.');
    }

    const currentBalance = invoice.balanceDue;
    const allocatedAmount =
      compareMoney(paymentAmount, currentBalance) > 0 ? currentBalance : paymentAmount;
    const unallocatedAmount = subtractMoney(paymentAmount, allocatedAmount);

    const receiptNumber = this.generateNextDocumentNumber(actorUserId, businessId, 'receipt');
    const paymentId = generateId('pay');
    const receiptId = generateId('rct');
    const now = new Date().toISOString();

    // Always distinguish manually recorded payments from provider-confirmed transactions
    const verificationStatus: PaymentVerificationStatus =
      input.verificationStatus ?? 'recorded_manual';

    const payment: Payment = {
      id: paymentId,
      businessId,
      clientId: invoice.clientId,
      invoiceId: invoice.id,
      idempotencyKey: input.idempotencyKey.trim(),
      paymentDate: input.paymentDate || now.slice(0, 10),
      amount: paymentAmount,
      allocatedAmount,
      unallocatedAmount,
      currency: invoice.currency,
      paymentMethod: input.paymentMethod,
      providerName: input.providerName?.trim() || '',
      transactionReference: input.transactionReference?.trim() || '',
      verificationStatus,
      notes: input.notes?.trim() || '',
      receiptId,
      receiptNumber,
      createdAt: now,
    };

    const receipt: Receipt = {
      id: receiptId,
      businessId,
      paymentId,
      invoiceId: invoice.id,
      clientId: invoice.clientId,
      receiptNumber,
      issuedAt: now,
      amount: paymentAmount,
      currency: invoice.currency,
      paymentMethod: input.paymentMethod,
      transactionReference: payment.transactionReference,
      verificationStatus,
      isVoided: false,
    };

    this.state.payments.unshift(payment);
    this.state.receipts.unshift(receipt);

    invoice.amountPaid = addMoney(invoice.amountPaid, allocatedAmount);
    this.reconcileInvoiceBalanceAndStatus(invoice);

    this.recordInvoiceEvent(
      businessId,
      invoice.id,
      'payment.recorded',
      user.fullName,
      `Recorded payment of ${invoice.currency} ${paymentAmount} (${verificationStatus === 'recorded_manual' ? 'Manual Entry' : 'Provider Confirmed'}, Receipt ${receiptNumber}). Remaining balance: ${invoice.currency} ${invoice.balanceDue}`
    );

    this.logAudit({
      businessId,
      actorId: user.id,
      actorEmail: user.email,
      actorRole: membership.role,
      action: 'payment.recorded',
      entityType: 'payment',
      entityId: payment.id,
      metadata: {
        invoiceId: invoice.id,
        amount: paymentAmount,
        allocatedAmount,
        unallocatedAmount,
        receiptNumber,
        verificationStatus,
      },
    });

    this.persist();
    return { payment, receipt, updatedInvoice: invoice, idempotentReplay: false };
  }

  public reversePayment(
    actorUserId: string,
    businessId: string,
    paymentId: string,
    reason: string
  ): { payment: Payment; updatedInvoice?: Invoice } {
    const { user, membership } = this.assertBusinessRole(actorUserId, businessId, [
      'owner',
      'admin',
      'accountant',
    ]);
    const payment = this.state.payments.find((p) => p.id === paymentId && p.businessId === businessId);
    if (!payment) throw new TenantIsolationError('Payment not found in this business.');
    if (payment.verificationStatus === 'reversed') {
      throw new ValidationError('This payment has already been reversed.');
    }
    if (!reason.trim()) {
      throw new ValidationError('Reversal reason is required.');
    }

    payment.verificationStatus = 'reversed';
    payment.reversedAt = new Date().toISOString();
    payment.reversalReason = reason.trim();

    const receipt = this.state.receipts.find((r) => r.paymentId === payment.id);
    if (receipt) {
      receipt.isVoided = true;
      receipt.verificationStatus = 'reversed';
    }

    let updatedInvoice: Invoice | undefined;
    if (payment.invoiceId) {
      updatedInvoice = this.state.invoices.find((i) => i.id === payment.invoiceId);
      if (updatedInvoice) {
        updatedInvoice.amountPaid = subtractMoney(updatedInvoice.amountPaid, payment.allocatedAmount);
        this.reconcileInvoiceBalanceAndStatus(updatedInvoice);
        this.recordInvoiceEvent(
          businessId,
          updatedInvoice.id,
          'payment.reversed',
          user.fullName,
          `Reversed payment ${payment.receiptNumber ?? payment.id} (${payment.currency} ${payment.allocatedAmount}): ${reason.trim()}`
        );
      }
    }

    this.logAudit({
      businessId,
      actorId: user.id,
      actorEmail: user.email,
      actorRole: membership.role,
      action: 'payment.reversed',
      entityType: 'payment',
      entityId: payment.id,
      metadata: { reason: reason.trim(), amount: payment.amount },
    });

    this.persist();
    return { payment, updatedInvoice };
  }

  public listPayments(actorUserId: string, businessId: string): Payment[] {
    this.assertBusinessRole(actorUserId, businessId, ['owner', 'admin', 'accountant', 'sales', 'viewer']);
    return this.state.payments.filter((p) => p.businessId === businessId);
  }

  public listReceipts(actorUserId: string, businessId: string): Receipt[] {
    this.assertBusinessRole(actorUserId, businessId, ['owner', 'admin', 'accountant', 'sales', 'viewer']);
    return this.state.receipts.filter((r) => r.businessId === businessId);
  }

  // ==========================================================================
  // 10. EXPENSES (Distinct from Invoice Payments)
  // ==========================================================================

  public listExpenses(actorUserId: string, businessId: string): Expense[] {
    this.assertBusinessRole(actorUserId, businessId, ['owner', 'admin', 'accountant', 'viewer']);
    return this.state.expenses.filter((e) => e.businessId === businessId);
  }

  public createExpense(
    actorUserId: string,
    businessId: string,
    input: {
      categoryName: string;
      projectId?: string;
      vendorName: string;
      expenseDate?: string;
      amount: string | number;
      taxAmount?: string | number;
      currency?: CurrencyCode;
      paymentMethod: PaymentMethodType;
      referenceNumber?: string;
      notes?: string;
      attachmentName?: string;
      isBillable?: boolean;
    }
  ): Expense {
    const { business } = this.assertBusinessRole(actorUserId, businessId, ['owner', 'admin', 'accountant']);
    if (!input.vendorName.trim()) throw new ValidationError('Vendor name is required.');
    const amount = addMoney(input.amount, 0);
    if (compareMoney(amount, '0.00') <= 0) throw new ValidationError('Expense amount must be greater than zero.');

    const expense: Expense = {
      id: generateId('exp'),
      businessId,
      categoryName: input.categoryName.trim() || 'Operating Expense',
      projectId: input.projectId,
      vendorName: input.vendorName.trim(),
      expenseDate: input.expenseDate || new Date().toISOString().slice(0, 10),
      amount,
      taxAmount: addMoney(input.taxAmount ?? '0.00', 0),
      currency: input.currency ?? business.defaultCurrency,
      paymentMethod: input.paymentMethod,
      referenceNumber: input.referenceNumber?.trim() ?? '',
      notes: input.notes?.trim() ?? '',
      attachmentName: input.attachmentName,
      isBillable: Boolean(input.isBillable),
      createdAt: new Date().toISOString(),
    };

    this.state.expenses.unshift(expense);
    this.persist();
    return expense;
  }

  // ==========================================================================
  // 11. PROJECTS, CONTRACTS & BILLABLE TIME ENTRIES
  // ==========================================================================

  public listProjects(actorUserId: string, businessId: string): Project[] {
    this.assertBusinessRole(actorUserId, businessId, ['owner', 'admin', 'accountant', 'sales', 'viewer']);
    return this.state.projects.filter((p) => p.businessId === businessId);
  }

  public createProject(
    actorUserId: string,
    businessId: string,
    input: {
      clientId: string;
      name: string;
      code?: string;
      description?: string;
      currency?: CurrencyCode;
      budgetAmount: string | number;
      hourlyRate: string | number;
      startDate?: string;
      dueDate?: string;
      contractTitle?: string;
      milestones?: Array<{ title: string; amount: string | number; dueDate: string }>;
    }
  ): Project {
    const { business } = this.assertBusinessRole(actorUserId, businessId, ['owner', 'admin', 'sales']);
    this.assertSubscriptionEntitlement(businessId, 'projects');

    const client = this.state.clients.find((c) => c.id === input.clientId && c.businessId === businessId);
    if (!client) throw new TenantIsolationError('Client not found in this business.');
    if (!input.name.trim()) throw new ValidationError('Project name is required.');

    const project: Project = {
      id: generateId('prj'),
      businessId,
      clientId: client.id,
      name: input.name.trim(),
      code: input.code?.trim() || `PRJ-${this.state.projects.length + 1}`,
      description: input.description?.trim() ?? '',
      status: 'active',
      currency: input.currency ?? client.preferredCurrency ?? business.defaultCurrency,
      budgetAmount: addMoney(input.budgetAmount, 0),
      hourlyRate: addMoney(input.hourlyRate, 0),
      startDate: input.startDate || new Date().toISOString().slice(0, 10),
      dueDate: input.dueDate || '',
      contractTitle: input.contractTitle?.trim() || `${input.name.trim()} Master Service Agreement`,
      milestones: (input.milestones ?? []).map((m) => ({
        id: generateId('ms'),
        title: m.title,
        amount: addMoney(m.amount, 0),
        dueDate: m.dueDate,
        status: 'pending',
      })),
      createdAt: new Date().toISOString(),
    };

    this.state.projects.unshift(project);
    this.persist();
    return project;
  }

  public listTimeEntries(actorUserId: string, businessId: string, projectId?: string): TimeEntry[] {
    this.assertBusinessRole(actorUserId, businessId, ['owner', 'admin', 'accountant', 'sales', 'viewer']);
    return this.state.timeEntries.filter(
      (t) => t.businessId === businessId && (!projectId || t.projectId === projectId)
    );
  }

  public logTimeEntry(
    actorUserId: string,
    businessId: string,
    input: {
      projectId: string;
      description: string;
      hours: string | number;
      hourlyRate?: string | number;
      entryDate?: string;
    }
  ): TimeEntry {
    const { user } = this.assertBusinessRole(actorUserId, businessId, ['owner', 'admin', 'accountant', 'sales']);
    this.assertSubscriptionEntitlement(businessId, 'projects');
    const project = this.state.projects.find((p) => p.id === input.projectId && p.businessId === businessId);
    if (!project) throw new TenantIsolationError('Project not found in this business.');

    const rate = input.hourlyRate ?? project.hourlyRate;
    const calc = calculateDocumentTotals([
      { quantity: input.hours, unitPrice: rate, discountAmount: 0, taxRatePercent: 0 },
    ]);

    const entry: TimeEntry = {
      id: generateId('tme'),
      businessId,
      projectId: project.id,
      clientId: project.clientId,
      userId: user.id,
      entryDate: input.entryDate || new Date().toISOString().slice(0, 10),
      description: input.description.trim() || 'Consultancy & delivery hours',
      hours: String(input.hours),
      hourlyRate: addMoney(rate, 0),
      totalAmount: calc.subtotal,
      currency: project.currency,
      approvalStatus: 'pending',
      createdAt: new Date().toISOString(),
    };

    this.state.timeEntries.unshift(entry);
    this.persist();
    return entry;
  }

  public approveTimeEntry(actorUserId: string, businessId: string, timeEntryId: string): TimeEntry {
    this.assertBusinessRole(actorUserId, businessId, ['owner', 'admin', 'accountant']);
    const entry = this.state.timeEntries.find((t) => t.id === timeEntryId && t.businessId === businessId);
    if (!entry) throw new TenantIsolationError('Time entry not found.');
    entry.approvalStatus = 'approved';
    this.persist();
    return entry;
  }

  public convertApprovedTimeEntriesToInvoice(
    actorUserId: string,
    businessId: string,
    projectId: string
  ): Invoice {
    this.assertBusinessRole(actorUserId, businessId, ['owner', 'admin', 'accountant', 'sales']);
    const project = this.state.projects.find((p) => p.id === projectId && p.businessId === businessId);
    if (!project) throw new TenantIsolationError('Project not found.');

    const approvedEntries = this.state.timeEntries.filter(
      (t) => t.businessId === businessId && t.projectId === projectId && t.approvalStatus === 'approved'
    );
    if (approvedEntries.length === 0) {
      throw new ValidationError('No approved unbilled time entries found for this project.');
    }

    const settings = this.state.businessSettings.find((s) => s.businessId === businessId)!;
    const dueDate = new Date(Date.now() + settings.defaultDueDays * 24 * 60 * 60 * 1000)
      .toISOString()
      .slice(0, 10);

    const invoice = this.createInvoice(actorUserId, businessId, {
      clientId: project.clientId,
      projectId: project.id,
      dueDate,
      currency: project.currency,
      items: approvedEntries.map((te) => ({
        description: `${project.name} (${te.entryDate}): ${te.description}`,
        unit: 'hrs',
        quantity: te.hours,
        unitPrice: te.hourlyRate,
        discountAmount: '0.00',
        taxLabel: settings.defaultTaxLabel,
        taxRate: settings.defaultTaxRate,
      })),
      issueImmediately: true,
    });

    for (const te of approvedEntries) {
      te.approvalStatus = 'invoiced';
      te.linkedInvoiceId = invoice.id;
    }
    this.persist();
    return invoice;
  }

  // ==========================================================================
  // 12. CLIENT PORTAL TOKENS (Expiring, Revocable, Scoped Guest Access)
  // ==========================================================================

  public createClientPortalToken(
    actorUserId: string,
    businessId: string,
    documentType: 'invoice' | 'quotation' | 'proforma',
    documentId: string,
    expiresInDays = 14
  ): ClientPortalAccessToken {
    this.assertBusinessRole(actorUserId, businessId, ['owner', 'admin', 'accountant', 'sales']);
    let clientId = '';

    if (documentType === 'invoice') {
      const doc = this.state.invoices.find((i) => i.id === documentId && i.businessId === businessId);
      if (!doc) throw new TenantIsolationError('Invoice not found.');
      clientId = doc.clientId;
    } else if (documentType === 'quotation') {
      const doc = this.state.quotations.find((q) => q.id === documentId && q.businessId === businessId);
      if (!doc) throw new TenantIsolationError('Quotation not found.');
      clientId = doc.clientId;
    } else {
      const doc = this.state.proformaInvoices.find((p) => p.id === documentId && p.businessId === businessId);
      if (!doc) throw new TenantIsolationError('Proforma invoice not found.');
      clientId = doc.clientId;
    }

    const portalToken: ClientPortalAccessToken = {
      id: generateId('prt'),
      businessId,
      clientId,
      documentType,
      documentId,
      token: `ptk_${generateId('sec')}_${generateId('key')}`,
      expiresAt: new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000).toISOString(),
      isRevoked: false,
      accessCount: 0,
      createdAt: new Date().toISOString(),
    };

    this.state.portalTokens.unshift(portalToken);
    this.persist();
    return portalToken;
  }

  public revokeClientPortalToken(actorUserId: string, businessId: string, tokenId: string): ClientPortalAccessToken {
    this.assertBusinessRole(actorUserId, businessId, ['owner', 'admin', 'accountant', 'sales']);
    const rec = this.state.portalTokens.find((t) => t.id === tokenId && t.businessId === businessId);
    if (!rec) throw new TenantIsolationError('Portal token not found.');
    rec.isRevoked = true;
    this.persist();
    return rec;
  }

  public resolvePortalToken(token: string): {
    access: ClientPortalAccessToken;
    business: Business;
    settings: BusinessSettings;
    client: Client;
    invoice?: Invoice;
    quotation?: Quotation;
    proforma?: ProformaInvoice;
    clientInvoices: Invoice[];
    clientPayments: Payment[];
  } {
    const access = this.state.portalTokens.find((t) => t.token === token);
    if (!access) {
      throw new AuthorizationError('Invalid client portal access token.');
    }
    if (access.isRevoked) {
      throw new AuthorizationError('This document sharing link has been revoked by the business.');
    }
    if (new Date(access.expiresAt).getTime() < Date.now()) {
      throw new AuthorizationError('This document sharing link has expired.');
    }

    const business = this.state.businesses.find((b) => b.id === access.businessId)!;
    const settings = this.state.businessSettings.find((s) => s.businessId === access.businessId)!;
    const client = this.state.clients.find((c) => c.id === access.clientId)!;

    access.accessCount += 1;

    // Strictly scope returned records to THIS client and THIS business only
    const clientInvoices = this.state.invoices.filter(
      (i) => i.businessId === access.businessId && i.clientId === access.clientId && i.status !== 'draft'
    );
    const clientPayments = this.state.payments.filter(
      (p) => p.businessId === access.businessId && p.clientId === access.clientId
    );

    const invoice =
      access.documentType === 'invoice'
        ? this.state.invoices.find((i) => i.id === access.documentId && i.businessId === access.businessId)
        : undefined;
    const quotation =
      access.documentType === 'quotation'
        ? this.state.quotations.find((q) => q.id === access.documentId && q.businessId === access.businessId)
        : undefined;
    const proforma =
      access.documentType === 'proforma'
        ? this.state.proformaInvoices.find((p) => p.id === access.documentId && p.businessId === access.businessId)
        : undefined;

    if (quotation && quotation.status === 'sent') {
      quotation.status = 'viewed';
    }

    this.persist();
    return {
      access,
      business,
      settings,
      client,
      invoice,
      quotation,
      proforma,
      clientInvoices,
      clientPayments,
    };
  }

  public portalRespondToQuotation(
    token: string,
    decision: 'accepted' | 'rejected',
    actorName: string,
    reason?: string
  ): Quotation {
    const resolved = this.resolvePortalToken(token);
    if (!resolved.quotation) {
      throw new ValidationError('This portal link is not associated with a quotation.');
    }
    const q = resolved.quotation;
    if (q.status === 'converted') {
      throw new ValidationError('This quotation has already been converted.');
    }
    const now = new Date().toISOString();
    q.status = decision;
    if (decision === 'accepted') {
      q.acceptedAt = now;
      q.acceptedByName = actorName.trim() || resolved.client.name;
    } else {
      q.rejectedAt = now;
      q.rejectionReason = reason?.trim() || 'Declined via Client Portal';
    }
    q.updatedAt = now;
    this.persist();
    return q;
  }

  public portalSubmitPaymentNotification(
    token: string,
    paymentReference: string,
    note?: string
  ): ClientPortalAccessToken {
    const resolved = this.resolvePortalToken(token);
    if (!paymentReference.trim()) {
      throw new ValidationError('Please enter your transaction reference (e.g., M-Pesa or bank reference).');
    }
    resolved.access.submittedPaymentRef = paymentReference.trim();
    resolved.access.submittedPaymentNote = note?.trim() ?? '';
    resolved.access.submittedPaymentAt = new Date().toISOString();

    if (resolved.invoice) {
      this.recordInvoiceEvent(
        resolved.business.id,
        resolved.invoice.id,
        'portal.payment_notification_submitted',
        resolved.client.name,
        `Client submitted payment reference "${paymentReference.trim()}" via Client Portal (Pending verification by business)`
      );
    }
    this.persist();
    return resolved.access;
  }

  // ==========================================================================
  // 13. PAYMENT FOLLOW-UPS, REMINDER QUEUE, DEDUPLICATION & RETRY
  // ==========================================================================

  private suppressPendingRemindersForInvoice(businessId: string, invoiceId: string, reason: string): void {
    for (const job of this.state.notificationJobs) {
      if (job.businessId === businessId && job.invoiceId === invoiceId && job.status === 'queued') {
        job.status = 'suppressed';
        job.lastError = `Automatically suppressed: ${reason}`;
        job.processedAt = new Date().toISOString();
      }
    }
  }

  public queueInvoiceReminder(
    actorUserId: string,
    businessId: string,
    input: {
      invoiceId: string;
      channel: 'email' | 'whatsapp_link';
      reminderStage: 'before_due' | 'on_due' | 'overdue_1' | 'overdue_2' | 'overdue_3' | 'manual';
      customMessage?: string;
    }
  ): NotificationJob {
    this.assertBusinessRole(actorUserId, businessId, ['owner', 'admin', 'accountant', 'sales']);
    const invoice = this.state.invoices.find((i) => i.id === input.invoiceId && i.businessId === businessId);
    if (!invoice) throw new TenantIsolationError('Invoice not found.');

    // Suppress/block reminders if balance is zero or invoice is voided/paid
    if (invoice.status === 'paid' || invoice.status === 'voided' || compareMoney(invoice.balanceDue, '0.00') <= 0) {
      throw new ValidationError(
        `Cannot queue a payment reminder for invoice ${invoice.invoiceNumber} because its balance is ${invoice.currency} ${invoice.balanceDue} (${invoice.status}).`
      );
    }

    const client = this.state.clients.find((c) => c.id === invoice.clientId && c.businessId === businessId)!;
    if (client.reminderOptOut) {
      throw new ValidationError(`Client "${client.name}" has opted out of automated payment reminders.`);
    }

    const today = new Date().toISOString().slice(0, 10);
    const dedupKey = `${businessId}:${invoice.id}:${input.channel}:${input.reminderStage}:${today}`;
    const existing = this.state.notificationJobs.find((j) => j.dedupKey === dedupKey);
    if (existing) {
      return existing; // Deduplicated!
    }

    const business = this.state.businesses.find((b) => b.id === businessId)!;
    const defaultBody =
      client.preferredLanguage === 'sw'
        ? `Habari ${client.name}, tunakukumbusha kuhusu Ankara ${invoice.invoiceNumber} yenye salio la ${invoice.currency} ${invoice.balanceDue} (Tarehe ya mwisho: ${invoice.dueDate}). Asante, ${business.name}.`
        : `Dear ${client.name}, this is a polite reminder regarding Invoice ${invoice.invoiceNumber} with an outstanding balance of ${invoice.currency} ${invoice.balanceDue} (Due: ${invoice.dueDate}). Thank you, ${business.name}.`;

    const job: NotificationJob = {
      id: generateId('ntf'),
      businessId,
      invoiceId: invoice.id,
      clientId: client.id,
      channel: input.channel,
      reminderStage: input.reminderStage,
      dedupKey,
      recipient: input.channel === 'email' ? client.email || 'no-email@client' : client.phone || '',
      subject: `Payment Reminder: Invoice ${invoice.invoiceNumber} (${business.name})`,
      bodyPreview: input.customMessage?.trim() || defaultBody,
      status: 'queued',
      retryCount: 0,
      maxRetries: 3,
      scheduledFor: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };

    this.state.notificationJobs.unshift(job);
    this.persist();
    return job;
  }

  /**
   * Process a queued reminder job with honest provider verification and transient retry handling.
   * Never claims an email or automated WhatsApp message was sent if the provider is not configured.
   */
  public processNotificationJob(
    actorUserId: string,
    businessId: string,
    jobId: string,
    options?: { simulateTransientFailure?: boolean; emailProviderConfigured?: boolean }
  ): NotificationJob {
    this.assertBusinessRole(actorUserId, businessId, ['owner', 'admin', 'accountant', 'sales']);
    const job = this.state.notificationJobs.find((j) => j.id === jobId && j.businessId === businessId);
    if (!job) throw new TenantIsolationError('Notification job not found.');

    const invoice = this.state.invoices.find((i) => i.id === job.invoiceId && i.businessId === businessId);
    if (!invoice || invoice.status === 'paid' || invoice.status === 'voided' || compareMoney(invoice.balanceDue, '0.00') <= 0) {
      job.status = 'suppressed';
      job.lastError = 'Suppressed automatically because invoice balance is now zero or voided.';
      job.processedAt = new Date().toISOString();
      this.persist();
      return job;
    }

    if (options?.simulateTransientFailure) {
      job.retryCount += 1;
      job.status = job.retryCount >= job.maxRetries ? 'failed' : 'queued';
      job.lastError = `Transient provider timeout (Attempt ${job.retryCount} of ${job.maxRetries})`;
      this.persist();
      return job;
    }

    if (job.channel === 'email' && !options?.emailProviderConfigured) {
      job.retryCount += 1;
      job.status = 'failed';
      job.lastError =
        'Email provider (RESEND_API_KEY / SMTP) is not configured in environment. Configure email provider to dispatch live emails.';
      this.persist();
      return job;
    }

    job.status = 'sent';
    job.processedAt = new Date().toISOString();
    job.lastError = undefined;
    this.persist();
    return job;
  }

  public listNotificationJobs(actorUserId: string, businessId: string): NotificationJob[] {
    this.assertBusinessRole(actorUserId, businessId, ['owner', 'admin', 'accountant', 'sales', 'viewer']);
    return this.state.notificationJobs.filter((j) => j.businessId === businessId);
  }

  public updateInvoicePaymentPromiseDate(
    actorUserId: string,
    businessId: string,
    invoiceId: string,
    promiseDate: string
  ): Invoice {
    const { user } = this.assertBusinessRole(actorUserId, businessId, ['owner', 'admin', 'accountant', 'sales']);
    const invoice = this.state.invoices.find((i) => i.id === invoiceId && i.businessId === businessId);
    if (!invoice) throw new TenantIsolationError('Invoice not found.');
    invoice.paymentPromiseDate = promiseDate;
    this.recordInvoiceEvent(
      businessId,
      invoice.id,
      'followup.promise_date_recorded',
      user.fullName,
      `Recorded client payment promise date: ${promiseDate}`
    );
    this.persist();
    return invoice;
  }

  // ==========================================================================
  // 14. SUPPORT TICKETS & SUPER-ADMIN CONSOLE (Privacy-Preserving)
  // ==========================================================================

  public createSupportTicket(
    actorUserId: string,
    businessId: string,
    input: {
      subject: string;
      category: 'billing' | 'technical' | 'compliance' | 'feature_request';
      priority: 'low' | 'normal' | 'high' | 'urgent';
      description: string;
      authorizeAdminDiagnostics?: boolean;
    }
  ): SupportTicket {
    const { user, business } = this.assertBusinessRole(actorUserId, businessId, [
      'owner',
      'admin',
      'accountant',
      'sales',
      'viewer',
    ]);
    if (!input.subject.trim() || !input.description.trim()) {
      throw new ValidationError('Ticket subject and description are required.');
    }

    const ticket: SupportTicket = {
      id: generateId('tkt'),
      businessId,
      businessName: business.name,
      createdBy: user.id,
      creatorEmail: user.email,
      subject: input.subject.trim(),
      category: input.category,
      priority: input.priority,
      status: 'open',
      description: input.description.trim(),
      authorizeAdminDiagnostics: Boolean(input.authorizeAdminDiagnostics),
      createdAt: new Date().toISOString(),
    };
    this.state.supportTickets.unshift(ticket);
    this.persist();
    return ticket;
  }

  public listBusinessSupportTickets(actorUserId: string, businessId: string): SupportTicket[] {
    this.assertBusinessRole(actorUserId, businessId, ['owner', 'admin', 'accountant', 'sales', 'viewer']);
    return this.state.supportTickets.filter((t) => t.businessId === businessId);
  }

  /**
   * Super-Admin Console Overview.
   * Strictly enforces that super-admin only sees operational metrics, subscription status,
   * failed notification jobs, support tickets, and audit logs — NEVER raw customer invoices,
   * client lists, or financial figures.
   */
  public getSuperAdminOverview(actorUserId: string): {
    totalUsers: number;
    totalBusinesses: number;
    activeSubscriptionsByPlan: Record<SubscriptionPlanId, number>;
    businessesSummary: Array<{
      id: string;
      name: string;
      countryCode: string;
      planId: SubscriptionPlanId;
      subscriptionStatus: string;
      isSuspended: boolean;
      createdAt: string;
    }>;
    subscriptionPlans: SubscriptionPlan[];
    supportTickets: SupportTicket[];
    failedNotificationJobs: NotificationJob[];
    recentAuditLogs: AuditLog[];
  } {
    const user = this.getUserById(actorUserId);
    if (!user || !user.isSuperAdmin) {
      throw new AuthorizationError('Platform Super-Administrator privileges are required.');
    }

    const activeSubscriptionsByPlan: Record<SubscriptionPlanId, number> = {
      free: 0,
      starter: 0,
      professional: 0,
      business: 0,
    };

    for (const sub of this.state.subscriptions) {
      activeSubscriptionsByPlan[sub.planId] = (activeSubscriptionsByPlan[sub.planId] ?? 0) + 1;
    }

    const businessesSummary = this.state.businesses.map((b) => {
      const sub = this.state.subscriptions.find((s) => s.businessId === b.id);
      return {
        id: b.id,
        name: b.name,
        countryCode: b.countryCode,
        planId: sub?.planId ?? 'free',
        subscriptionStatus: sub?.status ?? 'active',
        isSuspended: b.isSuspended,
        createdAt: b.createdAt,
      };
    });

    return {
      totalUsers: this.state.users.length,
      totalBusinesses: this.state.businesses.length,
      activeSubscriptionsByPlan,
      businessesSummary,
      subscriptionPlans: this.state.subscriptionPlans,
      supportTickets: this.state.supportTickets,
      failedNotificationJobs: this.state.notificationJobs.filter((j) => j.status === 'failed'),
      recentAuditLogs: this.state.auditLogs.slice(0, 100),
    };
  }

  public superAdminSetBusinessSuspension(
    actorUserId: string,
    targetBusinessId: string,
    suspend: boolean,
    reason: string
  ): Business {
    const admin = this.getUserById(actorUserId);
    if (!admin || !admin.isSuperAdmin) {
      throw new AuthorizationError('Platform Super-Administrator privileges are required.');
    }
    if (!reason.trim()) {
      throw new ValidationError('An explicit operational reason is required to suspend or restore a business.');
    }
    const biz = this.state.businesses.find((b) => b.id === targetBusinessId);
    if (!biz) throw new ValidationError('Target business not found.');

    biz.isSuspended = suspend;
    biz.suspensionReason = suspend ? reason.trim() : undefined;

    this.logAudit({
      businessId: biz.id,
      actorId: admin.id,
      actorEmail: admin.email,
      actorRole: 'super_admin',
      action: suspend ? 'superadmin.business_suspended' : 'superadmin.business_restored',
      entityType: 'business',
      entityId: biz.id,
      metadata: { reason: reason.trim() },
    });
    this.persist();
    return biz;
  }

  public superAdminUpdatePlanConfig(
    actorUserId: string,
    planId: SubscriptionPlanId,
    updates: Partial<SubscriptionPlan>
  ): SubscriptionPlan {
    const admin = this.getUserById(actorUserId);
    if (!admin || !admin.isSuperAdmin) {
      throw new AuthorizationError('Platform Super-Administrator privileges are required.');
    }
    const plan = this.state.subscriptionPlans.find((p) => p.id === planId);
    if (!plan) throw new ValidationError('Subscription plan not found.');

    Object.assign(plan, updates, { id: plan.id });
    this.logAudit({
      actorId: admin.id,
      actorEmail: admin.email,
      actorRole: 'super_admin',
      action: 'superadmin.plan_updated',
      entityType: 'subscription_plan',
      entityId: plan.id,
      metadata: updates,
    });
    this.persist();
    return plan;
  }

  // ==========================================================================
  // 15. DEVELOPMENT WORKSPACE INITIALIZER (For immediate local inspection)
  // ==========================================================================

  public ensureDemoWorkspaceIfEmpty(): void {
    if (this.state.users.length > 0) return;

    // 1. Register primary Tanzanian business owner
    const { user: owner, verificationToken } = this.registerUser({
      email: 'amani@kilimanjarodigital.co.tz',
      password: 'Password123!',
      fullName: 'Amani Mwakasege',
      phone: '+255 754 810 220',
      preferredLanguage: 'en',
      isSuperAdmin: true,
    });
    this.verifyUserEmail(verificationToken);

    const { business } = this.createBusiness(owner.id, {
      name: 'Kilimanjaro Digital & Advisory Ltd',
      legalName: 'Kilimanjaro Digital & Advisory Company Limited',
      countryCode: 'TZ',
      defaultCurrency: 'TZS',
      tinNumber: '139-842-910',
      vrnNumber: '40-029381-W',
      email: 'billing@kilimanjarodigital.co.tz',
      phone: '+255 754 810 220',
      addressLine1: 'Haile Selassie Road, Masaki Peninsula',
      city: 'Dar es Salaam',
      invoicePrefix: 'INV',
      defaultTaxLabel: 'VAT',
      defaultTaxRate: '18.00',
      mobileMoneyNetwork: 'M-Pesa (Vodacom Lipa Namba)',
      mobileMoneyNumber: '5582910',
      mobileMoneyName: 'KILIMANJARO DIGITAL LTD',
      bankName: 'CRDB Bank PLC',
      bankAccountName: 'Kilimanjaro Digital & Advisory Ltd',
      bankAccountNumber: '0150482910200',
      initialPlanId: 'business',
    });

    // 2. Create real Tanzanian clients
    const client1 = this.createClient(owner.id, business.id, {
      clientType: 'company',
      name: 'Serengeti Logistics & Freight TZ Ltd',
      contactPerson: 'Neema Massawe',
      email: 'accounts@serengetilogistics.co.tz',
      phone: '+255 784 330 112',
      tinNumber: '112-409-558',
      vrnNumber: '40-011892-B',
      billingAddress: 'Nyerere Road, Industrial Area, P.O. Box 14209',
      city: 'Dar es Salaam',
      countryCode: 'TZ',
      preferredCurrency: 'TZS',
      preferredLanguage: 'en',
      tags: ['Enterprise', 'Retainer'],
    });

    const client2 = this.createClient(owner.id, business.id, {
      clientType: 'company',
      name: 'Arusha Specialty Coffee Exporters',
      contactPerson: 'Juma Kibwana',
      email: 'finance@arushacoffee.co.tz',
      phone: '+255 767 901 445',
      tinNumber: '128-994-301',
      vrnNumber: '40-044920-K',
      billingAddress: 'Sokoine Road, Clock Tower Commercial Centre',
      city: 'Arusha',
      countryCode: 'TZ',
      preferredCurrency: 'TZS',
      preferredLanguage: 'sw',
      tags: ['Export', 'Agro'],
    });

    const client3 = this.createClient(owner.id, business.id, {
      clientType: 'company',
      name: 'Zanzibar Coastal Hospitality Group',
      contactPerson: 'Fatma Said',
      email: 'payables@zanzibarhospitality.co.tz',
      phone: '+255 777 412 889',
      tinNumber: '145-221-887',
      billingAddress: 'Shangani Street, Stone Town',
      city: 'Zanzibar',
      countryCode: 'TZ',
      preferredCurrency: 'TZS',
      preferredLanguage: 'en',
      tags: ['Hospitality'],
    });

    // 3. Create reusable Products & Services
    const svc1 = this.createProductService(owner.id, business.id, {
      itemType: 'service',
      name: 'ERP & Cloud Billing Integration Consultancy',
      sku: 'SVC-ERP-01',
      description: 'Architecture, API integration, and staff training for digital billing workflow',
      unit: 'project',
      unitPrice: '3500000.00',
      currency: 'TZS',
      taxRate: '18.00',
      taxLabel: 'VAT',
    });

    const svc2 = this.createProductService(owner.id, business.id, {
      itemType: 'service',
      name: 'Monthly Managed Cloud Infrastructure & Support',
      sku: 'SVC-MGD-02',
      description: 'Dedicated SLA support, automated daily backups, and security monitoring',
      unit: 'month',
      unitPrice: '850000.00',
      currency: 'TZS',
      taxRate: '18.00',
      taxLabel: 'VAT',
    });

    const svc3 = this.createProductService(owner.id, business.id, {
      itemType: 'service',
      name: 'Bespoke Web Portal & Mobile UI Design',
      sku: 'SVC-UIX-03',
      description: 'Responsive bilingual (Kiswahili & English) web application interface design',
      unit: 'sprint',
      unitPrice: '1800000.00',
      currency: 'TZS',
      taxRate: '18.00',
      taxLabel: 'VAT',
    });

    // 4. Create Quotations
    this.createQuotation(owner.id, business.id, {
      clientId: client2.id,
      validUntil: '2026-11-25',
      currency: 'TZS',
      status: 'sent',
      items: [
        {
          productServiceId: svc3.id,
          description: svc3.name,
          unit: svc3.unit,
          quantity: 2,
          unitPrice: svc3.unitPrice,
          discountAmount: '100000.00',
          taxLabel: 'VAT',
          taxRate: '18.00',
        },
      ],
      notes: 'Makadirio haya yanajumuisha usanifu wa mfumo kwa Kiswahili na Kiingereza.',
    });

    // 5. Create Issued Invoices & Record Verified Payments
    const inv1 = this.createInvoice(owner.id, business.id, {
      clientId: client1.id,
      issueDate: '2026-10-01',
      dueDate: '2026-10-15',
      currency: 'TZS',
      issueImmediately: true,
      items: [
        {
          productServiceId: svc1.id,
          description: svc1.name,
          unit: svc1.unit,
          quantity: 1,
          unitPrice: svc1.unitPrice,
          discountAmount: '0.00',
          taxLabel: 'VAT',
          taxRate: '18.00',
        },
        {
          productServiceId: svc2.id,
          description: svc2.name,
          unit: svc2.unit,
          quantity: 1,
          unitPrice: svc2.unitPrice,
          discountAmount: '0.00',
          taxLabel: 'VAT',
          taxRate: '18.00',
        },
      ],
    });

    // Record full payment on inv1
    this.recordPayment(owner.id, business.id, {
      invoiceId: inv1.id,
      idempotencyKey: 'seed-pay-inv1-full',
      amount: inv1.grandTotal,
      paymentDate: '2026-10-12',
      paymentMethod: 'bank_transfer',
      providerName: 'CRDB Bank PLC',
      transactionReference: 'CRDB-FT-20261012-8941',
      verificationStatus: 'provider_confirmed',
      notes: 'Full settlement received via CRDB corporate RTGS.',
    });

    // Partially paid overdue invoice
    const inv2 = this.createInvoice(owner.id, business.id, {
      clientId: client2.id,
      issueDate: '2026-10-05',
      dueDate: '2026-10-19',
      currency: 'TZS',
      issueImmediately: true,
      items: [
        {
          productServiceId: svc1.id,
          description: 'Export Traceability Portal Phase 1 Implementation',
          unit: 'project',
          quantity: 1,
          unitPrice: '4200000.00',
          discountAmount: '200000.00',
          taxLabel: 'VAT',
          taxRate: '18.00',
        },
      ],
    });

    this.recordPayment(owner.id, business.id, {
      invoiceId: inv2.id,
      idempotencyKey: 'seed-pay-inv2-partial',
      amount: '2000000.00',
      paymentDate: '2026-10-14',
      paymentMethod: 'mobile_money',
      providerName: 'M-Pesa (Vodacom)',
      transactionReference: 'QJK8921LMP',
      verificationStatus: 'recorded_manual',
      notes: '50% mobilization deposit via Vodacom M-Pesa Lipa Namba.',
    });

    // Issued current invoice
    this.createInvoice(owner.id, business.id, {
      clientId: client3.id,
      issueDate: '2026-10-24',
      dueDate: '2026-11-07',
      currency: 'TZS',
      issueImmediately: true,
      items: [
        {
          productServiceId: svc2.id,
          description: 'Q4 Cloud Infrastructure & Security Retainer',
          unit: 'quarter',
          quantity: 3,
          unitPrice: '850000.00',
          discountAmount: '0.00',
          taxLabel: 'VAT',
          taxRate: '18.00',
        },
      ],
    });

    // 6. Create Business Expenses
    this.createExpense(owner.id, business.id, {
      categoryName: 'Cloud Hosting & Domains',
      vendorName: 'tzNIC & Cloud Infrastructure Provider',
      expenseDate: '2026-10-10',
      amount: '450000.00',
      taxAmount: '68644.07',
      currency: 'TZS',
      paymentMethod: 'card',
      referenceNumber: 'EXP-2026-104',
      notes: 'Monthly production database cluster & .co.tz domain renewals',
    });

    this.createExpense(owner.id, business.id, {
      categoryName: 'Office Connectivity & Utilities',
      vendorName: 'TTCL Fiber Business',
      expenseDate: '2026-10-15',
      amount: '280000.00',
      taxAmount: '42711.86',
      currency: 'TZS',
      paymentMethod: 'mobile_money',
      referenceNumber: 'MPESA-991042',
      notes: 'Dedicated fiber internet for Dar es Salaam office',
    });

    // 7. Create a Project & Billable Time Entry
    const project = this.createProject(owner.id, business.id, {
      clientId: client1.id,
      name: 'Fleet Customs Clearance Automation',
      code: 'PRJ-SER-01',
      description: 'Custom workflow and portal for Dar es Salaam port customs documentation',
      currency: 'TZS',
      budgetAmount: '8500000.00',
      hourlyRate: '120000.00',
      startDate: '2026-10-01',
      dueDate: '2026-12-15',
      milestones: [
        { title: 'Discovery & System Specification', amount: '2500000.00', dueDate: '2026-10-20' },
        { title: 'Portal Build & User Acceptance Testing', amount: '6000000.00', dueDate: '2026-12-15' },
      ],
    });

    const te = this.logTimeEntry(owner.id, business.id, {
      projectId: project.id,
      description: 'Database schema design & TANCIS customs manifest mapping',
      hours: '6.5',
      hourlyRate: '120000.00',
      entryDate: '2026-10-26',
    });
    this.approveTimeEntry(owner.id, business.id, te.id);
  }
}

export const db = new InvoiceProDatabaseEngine();

