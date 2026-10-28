import React, { createContext, useContext, useEffect, useState } from 'react';
import { db } from '../services/database';
import { translateKey } from '../i18n/translations';
import {
  Business,
  BusinessRole,
  BusinessSettings,
  LanguageCode,
  Subscription,
  SubscriptionPlan,
  UserProfile,
} from '../types/domain';

interface ActiveTenantContext {
  business: Business;
  role: BusinessRole;
  settings: BusinessSettings;
  subscription: Subscription;
  plan: SubscriptionPlan;
}

interface AppContextValue {
  currentUser: UserProfile | null;
  userBusinesses: ActiveTenantContext[];
  activeTenant: ActiveTenantContext | null;
  language: LanguageCode;
  theme: 'light' | 'dark';
  refreshTick: number;
  t: (key: string, fallback?: string) => string;
  setLanguage: (lang: LanguageCode) => void;
  toggleTheme: () => void;
  selectBusiness: (businessId: string) => void;
  login: (email: string, password: string) => UserProfile;
  logout: () => void;
  refreshWorkspace: () => void;
}

const SESSION_USER_KEY = 'invoicepro_active_user_id';
const SESSION_BIZ_KEY = 'invoicepro_active_business_id';
const SESSION_LANG_KEY = 'invoicepro_language';
const SESSION_THEME_KEY = 'invoicepro_theme';

const AppContext = createContext<AppContextValue | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [refreshTick, setRefreshTick] = useState(0);
  const [language, setLanguageState] = useState<LanguageCode>(() => {
    const saved = typeof window !== 'undefined' ? window.localStorage.getItem(SESSION_LANG_KEY) : null;
    return saved === 'sw' ? 'sw' : 'en';
  });
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = typeof window !== 'undefined' ? window.localStorage.getItem(SESSION_THEME_KEY) : null;
    return saved === 'dark' ? 'dark' : 'light';
  });

  const [currentUserId, setCurrentUserId] = useState<string | null>(() => {
    db.ensureDemoWorkspaceIfEmpty();
    return typeof window !== 'undefined' ? window.localStorage.getItem(SESSION_USER_KEY) : null;
  });

  const [activeBusinessId, setActiveBusinessId] = useState<string | null>(() => {
    return typeof window !== 'undefined' ? window.localStorage.getItem(SESSION_BIZ_KEY) : null;
  });

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.lang = language;
      if (theme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
  }, [language, theme]);

  const currentUser = currentUserId ? db.getUserById(currentUserId) ?? null : null;
  const userBusinesses = currentUser ? db.getUserBusinesses(currentUser.id) : [];

  const activeTenant =
    userBusinesses.find((b) => b.business.id === activeBusinessId) ?? userBusinesses[0] ?? null;

  const setLanguage = (lang: LanguageCode) => {
    setLanguageState(lang);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(SESSION_LANG_KEY, lang);
    }
    if (currentUser) {
      db.updateUserLanguage(currentUser.id, lang);
    }
  };

  const toggleTheme = () => {
    const next = theme === 'light' ? 'dark' : 'light';
    setTheme(next);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(SESSION_THEME_KEY, next);
    }
  };

  const selectBusiness = (businessId: string) => {
    setActiveBusinessId(businessId);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(SESSION_BIZ_KEY, businessId);
    }
    setRefreshTick((t) => t + 1);
  };

  const login = (email: string, password: string): UserProfile => {
    const user = db.loginUser(email, password);
    setCurrentUserId(user.id);
    setLanguageState(user.preferredLanguage);
    const businesses = db.getUserBusinesses(user.id);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(SESSION_USER_KEY, user.id);
      if (businesses[0]) {
        window.localStorage.setItem(SESSION_BIZ_KEY, businesses[0].business.id);
        setActiveBusinessId(businesses[0].business.id);
      }
    }
    setRefreshTick((t) => t + 1);
    return user;
  };

  const logout = () => {
    setCurrentUserId(null);
    setActiveBusinessId(null);
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(SESSION_USER_KEY);
      window.localStorage.removeItem(SESSION_BIZ_KEY);
    }
    setRefreshTick((t) => t + 1);
  };

  const refreshWorkspace = () => {
    setRefreshTick((t) => t + 1);
  };

  const t = (key: string, fallback?: string) => translateKey(language, key, fallback);

  return (
    <AppContext.Provider
      value={{
        currentUser,
        userBusinesses,
        activeTenant,
        language,
        theme,
        refreshTick,
        t,
        setLanguage,
        toggleTheme,
        selectBusiness,
        login,
        logout,
        refreshWorkspace,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within an AppProvider');
  return ctx;
}

