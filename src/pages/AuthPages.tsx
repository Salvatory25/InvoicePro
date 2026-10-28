import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Building2, CheckCircle2, KeyRound, Lock, Mail, ShieldCheck, Upload } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { db } from '../services/database';
import { EAST_AFRICA_COUNTRIES, LanguageCode } from '../types/domain';
import { CurrencyCode } from '../lib/money';

export const AuthPages: React.FC<{ mode: 'login' | 'register' | 'reset' | 'onboarding' }> = ({ mode }) => {
  const navigate = useNavigate();
  const { currentUser, login, selectBusiness, setLanguage, refreshWorkspace } = useApp();

  // Login State
  const [loginEmail, setLoginEmail] = useState('amani@kilimanjarodigital.co.tz');
  const [loginPassword, setLoginPassword] = useState('Password123!');

  // Register State
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('+255 ');
  const [regPassword, setRegPassword] = useState('');
  const [regLang, setRegLang] = useState<LanguageCode>('en');
  const [pendingVerifyToken, setPendingVerifyToken] = useState<string | null>(null);

  // Password Reset State
  const [resetEmail, setResetEmail] = useState('');
  const [generatedResetToken, setGeneratedResetToken] = useState<string | null>(null);
  const [newResetPassword, setNewResetPassword] = useState('');

  // Business Onboarding Wizard State
  const [bizName, setBizName] = useState('');
  const [bizCountry, setBizCountry] = useState<'TZ' | 'KE' | 'UG' | 'RW'>('TZ');
  const [bizCurrency, setBizCurrency] = useState<CurrencyCode>('TZS');
  const [bizTin, setBizTin] = useState('');
  const [bizVrn, setBizVrn] = useState('');
  const [bizCity, setBizCity] = useState('Dar es Salaam');
  const [bizAddress, setBizAddress] = useState('');
  const [bizInvoicePrefix, setBizInvoicePrefix] = useState('INV');
  const [bizTaxLabel, setBizTaxLabel] = useState('VAT');
  const [bizTaxRate, setBizTaxRate] = useState('18.00');
  const [bizMobileMoney, setBizMobileMoney] = useState('M-Pesa (Vodacom Lipa Namba)');
  const [bizMobileNumber, setBizMobileNumber] = useState('');
  const [bizBankName, setBizBankName] = useState('CRDB Bank PLC');
  const [bizBankAcc, setBizBankAcc] = useState('');
  const [bizLogoDataUrl, setBizLogoDataUrl] = useState<string | undefined>(undefined);

  const [error, setError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const handleLogoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml'].includes(file.type)) {
      setError('Logo must be a valid PNG, JPEG, WebP, or SVG image.');
      return;
    }
    if (file.size > 512 * 1024) {
      setError('Logo file size must not exceed 512 KB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setBizLogoDataUrl(reader.result);
        setError(null);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      const user = login(loginEmail, loginPassword);
      const businesses = db.getUserBusinesses(user.id);
      if (businesses.length === 0) {
        navigate('/onboarding');
      } else {
        navigate('/app');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign-in failed');
    }
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      const { verificationToken } = db.registerUser({
        email: regEmail,
        password: regPassword,
        fullName: regName,
        phone: regPhone,
        preferredLanguage: regLang,
      });
      setLanguage(regLang);
      setPendingVerifyToken(verificationToken);
      setStatusMessage(
        'Account created! Verify your email below to continue to the fast business setup wizard.'
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed');
    }
  };

  const handleConfirmEmailVerification = () => {
    if (!pendingVerifyToken) return;
    setError(null);
    try {
      db.verifyUserEmail(pendingVerifyToken);
      login(regEmail, regPassword);
      navigate('/onboarding');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Verification failed');
    }
  };

  const handleResetRequest = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      const { resetToken } = db.requestPasswordReset(resetEmail);
      setGeneratedResetToken(resetToken);
      setStatusMessage('Password reset token issued. Set your new password below.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Reset request failed');
    }
  };

  const handleCompleteReset = (e: React.FormEvent) => {
    e.preventDefault();
    if (!generatedResetToken) return;
    setError(null);
    try {
      db.resetPassword(generatedResetToken, newResetPassword);
      setStatusMessage('Password updated successfully! You may now sign in.');
      setGeneratedResetToken(null);
      setTimeout(() => navigate('/login'), 1000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Password update failed');
    }
  };

  const handleOnboardingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      navigate('/login');
      return;
    }
    setError(null);
    try {
      const { business } = db.createBusiness(currentUser.id, {
        name: bizName,
        countryCode: bizCountry,
        defaultCurrency: bizCurrency,
        tinNumber: bizTin,
        vrnNumber: bizVrn,
        city: bizCity,
        addressLine1: bizAddress,
        invoicePrefix: bizInvoicePrefix,
        defaultTaxLabel: bizTaxLabel,
        defaultTaxRate: bizTaxRate,
        mobileMoneyNetwork: bizMobileMoney,
        mobileMoneyNumber: bizMobileNumber,
        bankName: bizBankName,
        bankAccountNumber: bizBankAcc,
        logoDataUrl: bizLogoDataUrl,
        initialPlanId: 'professional',
      });
      selectBusiness(business.id);
      refreshWorkspace();
      navigate('/app/invoices');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Business creation failed');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-xl">
        <div className="flex justify-center">
          <Link to="/" className="inline-flex items-center gap-2.5 font-extrabold text-xl text-slate-900 dark:text-white">
            <span className="h-10 w-10 rounded-xl bg-slate-900 text-teal-400 flex items-center justify-center">
              IP
            </span>
            <span>InvoicePro</span>
          </Link>
        </div>

        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          {error && (
            <div role="alert" className="mb-5 rounded-xl border border-red-200 bg-red-50 p-3.5 text-xs font-medium text-red-800">
              {error}
            </div>
          )}
          {statusMessage && (
            <div className="mb-5 rounded-xl border border-teal-200 bg-teal-50 p-3.5 text-xs font-medium text-teal-900">
              {statusMessage}
            </div>
          )}

          {mode === 'login' && (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <h1 className="text-xl font-bold text-slate-900 dark:text-white">Sign in to InvoicePro</h1>
                <p className="text-xs text-slate-500 mt-1">
                  Access your business workspace, quotations, invoices, and receivables.
                </p>
              </div>

              <div>
                <label htmlFor="login-email" className="block text-xs font-semibold uppercase text-slate-600 dark:text-slate-300 mb-1">
                  Email Address
                </label>
                <input
                  id="login-email"
                  type="email"
                  required
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
                />
              </div>

              <div>
                <label htmlFor="login-password" className="block text-xs font-semibold uppercase text-slate-600 dark:text-slate-300 mb-1">
                  Password
                </label>
                <input
                  id="login-password"
                  type="password"
                  required
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
                />
              </div>

              <button
                type="submit"
                className="w-full rounded-xl bg-teal-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-teal-700 transition"
              >
                Sign In to Workspace
              </button>

              <div className="rounded-xl bg-slate-50 border border-slate-200 p-3 text-xs text-slate-600 dark:bg-slate-800/50 dark:border-slate-700 dark:text-slate-300">
                <div className="font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <ShieldCheck className="h-4 w-4 text-teal-600" />
                  Pre-Configured Tanzania Business Account
                </div>
                <div className="mt-1">
                  Email: <code>amani@kilimanjarodigital.co.tz</code> • Password: <code>Password123!</code>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 text-xs font-medium text-teal-600">
                <Link to="/register" className="hover:underline">Create new account</Link>
                <Link to="/reset-password" className="hover:underline">Forgot password?</Link>
              </div>
            </form>
          )}

          {mode === 'register' && (
            <div className="space-y-4">
              <div>
                <h1 className="text-xl font-bold text-slate-900 dark:text-white">Create Your InvoicePro Account</h1>
                <p className="text-xs text-slate-500 mt-1">
                  Start creating professional English & Kiswahili invoices and tracking receivables.
                </p>
              </div>

              {pendingVerifyToken ? (
                <div className="space-y-4 rounded-xl border border-teal-200 bg-teal-50/70 p-4">
                  <div className="flex items-center gap-2 text-teal-800 font-semibold text-sm">
                    <Mail className="h-5 w-5" />
                    Email Verification Required
                  </div>
                  <p className="text-xs text-slate-700">
                    Verification token generated for <strong>{regEmail}</strong>: <code>{pendingVerifyToken}</code>
                  </p>
                  <button
                    type="button"
                    onClick={handleConfirmEmailVerification}
                    className="w-full rounded-xl bg-teal-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-teal-700"
                  >
                    Verify Email & Launch Business Setup Wizard
                  </button>
                </div>
              ) : (
                <form onSubmit={handleRegisterSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold uppercase text-slate-600 dark:text-slate-300 mb-1">
                      Full Name
                    </label>
                    <input
                      required
                      value={regName}
                      onChange={(e) => setRegName(e.target.value)}
                      placeholder="e.g. Neema Massawe"
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
                    />
                  </div>
                  <div className="grid sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold uppercase text-slate-600 dark:text-slate-300 mb-1">
                        Work Email
                      </label>
                      <input
                        type="email"
                        required
                        value={regEmail}
                        onChange={(e) => setRegEmail(e.target.value)}
                        placeholder="you@company.co.tz"
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold uppercase text-slate-600 dark:text-slate-300 mb-1">
                        Phone Number
                      </label>
                      <input
                        value={regPhone}
                        onChange={(e) => setRegPhone(e.target.value)}
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
                      />
                    </div>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold uppercase text-slate-600 dark:text-slate-300 mb-1">
                        Password (min 8 chars)
                      </label>
                      <input
                        type="password"
                        required
                        minLength={8}
                        value={regPassword}
                        onChange={(e) => setRegPassword(e.target.value)}
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold uppercase text-slate-600 dark:text-slate-300 mb-1">
                        Preferred Interface Language
                      </label>
                      <select
                        value={regLang}
                        onChange={(e) => setRegLang(e.target.value as LanguageCode)}
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
                      >
                        <option value="en">English (EN)</option>
                        <option value="sw">Kiswahili (SW)</option>
                      </select>
                    </div>
                  </div>
                  <button
                    type="submit"
                    className="w-full rounded-xl bg-teal-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-teal-700"
                  >
                    Register & Verify Email
                  </button>
                  <div className="text-center text-xs text-slate-500">
                    Already registered? <Link to="/login" className="text-teal-600 font-semibold hover:underline">Sign In</Link>
                  </div>
                </form>
              )}
            </div>
          )}

          {mode === 'reset' && (
            <div className="space-y-4">
              <h1 className="text-xl font-bold flex items-center gap-2">
                <KeyRound className="h-5 w-5 text-teal-600" />
                Reset Account Password
              </h1>
              {!generatedResetToken ? (
                <form onSubmit={handleResetRequest} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">Account Email</label>
                    <input
                      type="email"
                      required
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
                    />
                  </div>
                  <button type="submit" className="w-full rounded-xl bg-teal-600 px-4 py-2.5 text-sm font-semibold text-white">
                    Request Password Reset Token
                  </button>
                </form>
              ) : (
                <form onSubmit={handleCompleteReset} className="space-y-4">
                  <div className="text-xs text-slate-500">
                    Active Reset Token: <code>{generatedResetToken}</code>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">New Password</label>
                    <input
                      type="password"
                      required
                      minLength={8}
                      value={newResetPassword}
                      onChange={(e) => setNewResetPassword(e.target.value)}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
                    />
                  </div>
                  <button type="submit" className="w-full rounded-xl bg-teal-600 px-4 py-2.5 text-sm font-semibold text-white">
                    Confirm New Password
                  </button>
                </form>
              )}
              <div className="text-xs text-center">
                <Link to="/login" className="text-teal-600 hover:underline">Back to Sign In</Link>
              </div>
            </div>
          )}

          {mode === 'onboarding' && (
            <form onSubmit={handleOnboardingSubmit} className="space-y-4">
              <div>
                <h1 className="text-xl font-bold flex items-center gap-2 text-slate-900 dark:text-white">
                  <Building2 className="h-5 w-5 text-teal-600" />
                  Business Setup Wizard
                </h1>
                <p className="text-xs text-slate-500 mt-1">
                  Configure your country, currency, tax settings, and payment instructions to create your first invoice immediately.
                </p>
              </div>

              <div className="grid sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">Business Name *</label>
                  <input
                    required
                    value={bizName}
                    onChange={(e) => setBizName(e.target.value)}
                    placeholder="e.g. Victoria Engineering & Advisory Ltd"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">Country</label>
                  <select
                    value={bizCountry}
                    onChange={(e) => {
                      const code = e.target.value as 'TZ' | 'KE' | 'UG' | 'RW';
                      setBizCountry(code);
                      const profile = EAST_AFRICA_COUNTRIES[code];
                      setBizCurrency(profile.defaultCurrency);
                      setBizTaxLabel(profile.defaultTaxLabel);
                      setBizTaxRate(profile.defaultTaxRate);
                      setBizMobileMoney(profile.mobileMoneyNetworks[0]);
                    }}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
                  >
                    <option value="TZ">Tanzania (TZ)</option>
                    <option value="KE">Kenya (KE)</option>
                    <option value="UG">Uganda (UG)</option>
                    <option value="RW">Rwanda (RW)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">Default Currency</label>
                  <select
                    value={bizCurrency}
                    onChange={(e) => setBizCurrency(e.target.value as CurrencyCode)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
                  >
                    <option value="TZS">TZS — Tanzanian Shilling (TSh)</option>
                    <option value="KES">KES — Kenyan Shilling (KSh)</option>
                    <option value="UGX">UGX — Ugandan Shilling (USh)</option>
                    <option value="RWF">RWF — Rwandan Franc (FRw)</option>
                    <option value="USD">USD — US Dollar ($)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">TIN / Tax ID (Optional)</label>
                  <input
                    value={bizTin}
                    onChange={(e) => setBizTin(e.target.value)}
                    placeholder="e.g. 139-842-910"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">VRN / VAT Reg (Optional)</label>
                  <input
                    value={bizVrn}
                    onChange={(e) => setBizVrn(e.target.value)}
                    placeholder="e.g. 40-029381-W"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">Invoice Prefix</label>
                  <input
                    value={bizInvoicePrefix}
                    onChange={(e) => setBizInvoicePrefix(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
                    Configurable {bizTaxLabel} Rate (%)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={bizTaxRate}
                    onChange={(e) => setBizTaxRate(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">Mobile Money Lipa Namba</label>
                  <input
                    value={bizMobileNumber}
                    onChange={(e) => setBizMobileNumber(e.target.value)}
                    placeholder="e.g. 5582910 (M-Pesa / Mixx)"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">Bank Account Number</label>
                  <input
                    value={bizBankAcc}
                    onChange={(e) => setBizBankAcc(e.target.value)}
                    placeholder="e.g. CRDB 0150482910200"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
                    Business Logo (Max 512 KB PNG/JPG/SVG)
                  </label>
                  <div className="flex items-center gap-3">
                    <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold hover:bg-slate-50 dark:border-slate-700">
                      <Upload className="h-4 w-4 text-teal-600" />
                      Upload Logo
                      <input type="file" accept="image/*" onChange={handleLogoFileChange} className="hidden" />
                    </label>
                    {bizLogoDataUrl && (
                      <span className="inline-flex items-center gap-1 text-xs text-teal-600 font-semibold">
                        <CheckCircle2 className="h-4 w-4" /> Logo ready
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <button
                type="submit"
                className="w-full rounded-xl bg-teal-600 px-4 py-3 text-sm font-semibold text-white hover:bg-teal-700"
              >
                Complete Setup & Create First Invoice
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

