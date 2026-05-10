

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { AdminUser } from '../types';

interface AdminStore {
  admin:       AdminUser | null;
  setAdmin:    (admin: AdminUser) => void;
  updateAdmin: (partial: Partial<AdminUser>) => void;
  clearAdmin:  () => void;
}

export const useAdminStore = create<AdminStore>()(
  persist(
    (set) => ({
      admin:       null,
      setAdmin:    (admin)   => set({ admin }),
      updateAdmin: (partial) => set(s => ({ admin: s.admin ? { ...s.admin, ...partial } : null })),
      clearAdmin:  ()        => set({ admin: null }),
    }),
    {
      name:    'nexabank_admin_auth',    // separate localStorage key from user 'nexabank_auth'
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ admin: s.admin }),
    },
  ),
);