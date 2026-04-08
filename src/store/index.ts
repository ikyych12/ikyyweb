import * as React from "react";
import { User, Device, WithdrawRequest, ReferralRecord, AdminLog, SystemSettings } from '../types';

const STORAGE_KEY = 'blastwa_data';

interface AppData {
  users: User[];
  currentUser: User | null;
  devices: Device[];
  withdraws: WithdrawRequest[];
  referrals: ReferralRecord[];
  adminLogs: AdminLog[];
  settings: SystemSettings;
}

const initialAdmin: User = {
  id: 'admin-001',
  email: 'admin@blast.com',
  username: 'Admin',
  password: 'admin123',
  role: 'admin',
  referralCode: 'ADMIN_ROOT',
  balance: 0,
  totalChats: 0,
  totalReferrals: 0,
  createdAt: new Date().toISOString(),
};

const defaultData: AppData = {
  users: [initialAdmin],
  currentUser: null,
  devices: [],
  withdraws: [],
  referrals: [],
  adminLogs: [],
  settings: {
    maintenanceMode: false,
    maintenanceMessage: "Sistem sedang dalam pemeliharaan. Silakan coba lagi nanti.",
    blastNumbers: ["628123456789", "628987654321", "628111222333", "628444555666", "628777888999"],
    blastMessage: "Halo, ini adalah pesan blast otomatis dari sistem BlastWA!",
  },
};

export const getStore = (): AppData => {
  const data = localStorage.getItem(STORAGE_KEY);
  if (!data) return defaultData;
  try {
    const parsed = JSON.parse(data);
    // Merge with defaultData to ensure new properties like 'settings' exist
    return {
      ...defaultData,
      ...parsed,
      settings: { 
        ...defaultData.settings, 
        ...(parsed.settings || {}),
        blastNumbers: parsed.settings?.blastNumbers || defaultData.settings.blastNumbers,
        blastMessage: parsed.settings?.blastMessage || defaultData.settings.blastMessage
      }
    };
  } catch (e) {
    return defaultData;
  }
};

export const saveStore = (data: AppData) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
};

export const useStore = () => {
  const [data, setData] = React.useState(getStore());

  React.useEffect(() => {
    const handleUpdate = () => {
      setData(getStore());
    };
    window.addEventListener('storage_update', handleUpdate);
    return () => window.removeEventListener('storage_update', handleUpdate);
  }, []);

  const updateData = (newData: Partial<AppData>) => {
    const currentData = getStore();
    const updated = { ...currentData, ...newData };
    saveStore(updated);
    window.dispatchEvent(new Event('storage_update'));
  };

  return {
    ...data,
    login: (email: string, pass: string) => {
      const user = data.users.find(u => u.email.toLowerCase() === email.toLowerCase() && u.password === pass);
      if (user) {
        updateData({ currentUser: user });
        return user;
      }
      return null;
    },
    logout: () => {
      updateData({ currentUser: null });
    },
    register: (email: string, username: string, pass: string, refCode?: string) => {
      if (data.users.find(u => u.email.toLowerCase() === email.toLowerCase())) return { error: 'Email already exists' };
      
      let initialBalance = 0;
      const updatedUsers = [...data.users];
      const updatedReferrals = [...data.referrals];

      if (refCode) {
        const referrerIndex = updatedUsers.findIndex(u => u.referralCode === refCode);
        if (referrerIndex !== -1) {
          const referrer = updatedUsers[referrerIndex];
          
          // If referred by admin, new user gets 2000 bonus
          if (referrer.role === 'admin') {
            initialBalance = 2000;
          }

          // Referrer gets 500 bonus (existing logic)
          updatedUsers[referrerIndex].balance += 500;
          updatedUsers[referrerIndex].totalReferrals += 1;
          
          updatedReferrals.push({
            id: `ref-${Date.now()}`,
            referrerId: referrer.id,
            referredId: `user-temp-${Date.now()}`, // Will be updated below
            referredUsername: username,
            bonusAmount: 500,
            createdAt: new Date().toISOString(),
          });
        }
      }

      const newUser: User = {
        id: `user-${Date.now()}`,
        email,
        username,
        password: pass,
        role: 'user',
        referralCode: Math.random().toString(36).substring(2, 8).toUpperCase(),
        referredBy: refCode,
        balance: initialBalance,
        totalChats: 0,
        totalReferrals: 0,
        createdAt: new Date().toISOString(),
      };

      // Update the referral record with the real user ID
      const lastRefIndex = updatedReferrals.length - 1;
      if (refCode && lastRefIndex >= 0 && updatedReferrals[lastRefIndex].referredId.startsWith('user-temp-')) {
        updatedReferrals[lastRefIndex].referredId = newUser.id;
      }

      updatedUsers.push(newUser);
      updateData({ users: updatedUsers, referrals: updatedReferrals });
      return { user: newUser };
    },
    addDevice: (name: string, phoneNumber: string, method: 'qr' | 'pairing') => {
      if (!data.currentUser) return;
      const newDevice: Device = {
        id: `dev-${Date.now()}`,
        userId: data.currentUser.id,
        name,
        phoneNumber,
        status: 'disconnected',
        connectionMethod: method,
        pairingCode: method === 'pairing' ? Math.random().toString(36).substring(2, 10).toUpperCase() : undefined,
        qrCode: method === 'qr' ? `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=WA_AUTH_${Date.now()}` : undefined,
        createdAt: new Date().toISOString(),
      };
      updateData({ devices: [...data.devices, newDevice] });
    },
    toggleDeviceStatus: (deviceId: string) => {
      const updatedDevices = data.devices.map(d => 
        d.id === deviceId ? { ...d, status: (d.status === 'connected' ? 'disconnected' : 'connected') as 'connected' | 'disconnected' } : d
      );
      updateData({ devices: updatedDevices });
    },
    deleteDevice: (deviceId: string) => {
      updateData({ devices: data.devices.filter(d => d.id !== deviceId) });
    },
    processBlast: (userId: string, count: number) => {
      const updatedUsers = data.users.map(u => {
        if (u.id === userId) {
          const commission = count * 5000;
          return {
            ...u,
            balance: u.balance + commission,
            totalChats: u.totalChats + count
          };
        }
        return u;
      });
      
      const currentUser = updatedUsers.find(u => u.id === data.currentUser?.id) || null;
      updateData({ users: updatedUsers, currentUser });
    },
    requestWithdraw: (amount: number, method: string, details: string) => {
      if (!data.currentUser || amount < 10000 || data.currentUser.balance < amount) return false;
      
      const newRequest: WithdrawRequest = {
        id: `wd-${Date.now()}`,
        userId: data.currentUser.id,
        username: data.currentUser.username,
        amount,
        method,
        details,
        status: 'pending',
        createdAt: new Date().toISOString(),
      };

      const updatedUsers = data.users.map(u => 
        u.id === data.currentUser?.id ? { ...u, balance: u.balance - amount } : u
      );
      
      const currentUser = updatedUsers.find(u => u.id === data.currentUser?.id) || null;
      updateData({ 
        users: updatedUsers, 
        currentUser,
        withdraws: [...data.withdraws, newRequest]
      });
      return true;
    },
    adminActionWithdraw: (requestId: string, action: 'approve' | 'reject') => {
      const request = data.withdraws.find(r => r.id === requestId);
      if (!request) return;

      const updatedWithdraws = data.withdraws.map(r => 
        r.id === requestId ? { ...r, status: (action === 'approve' ? 'approved' : 'rejected') as 'pending' | 'approved' | 'rejected' } : r
      );

      let updatedUsers = [...data.users];
      if (action === 'reject') {
        updatedUsers = updatedUsers.map(u => 
          u.id === request.userId ? { ...u, balance: u.balance + request.amount } : u
        );
      }

      const currentUser = updatedUsers.find(u => u.id === data.currentUser?.id) || null;
      updateData({ withdraws: updatedWithdraws, users: updatedUsers, currentUser });
    },
    adminAdjustBalance: (userId: string, amount: number) => {
      if (!data.currentUser || data.currentUser.role !== 'admin') return;
      
      const updatedUsers = data.users.map(u => {
        if (u.id === userId) {
          const newBalance = Math.max(0, u.balance + amount);
          const chatsAdded = amount > 0 ? Math.floor(amount / 5000) : 0;
          return {
            ...u,
            balance: newBalance,
            totalChats: u.totalChats + chatsAdded
          };
        }
        return u;
      });

      const targetUser = data.users.find(u => u.id === userId);
      const newLog: AdminLog = {
        id: `log-${Date.now()}`,
        adminId: data.currentUser.id,
        targetUserId: userId,
        targetUsername: targetUser?.username || 'Unknown',
        action: amount > 0 ? 'credit' : 'debit',
        amount: Math.abs(amount),
        chatsAdded: amount > 0 ? Math.floor(amount / 5000) : 0,
        timestamp: new Date().toISOString(),
      };

      const currentUser = updatedUsers.find(u => u.id === data.currentUser?.id) || null;
      updateData({ 
        users: updatedUsers, 
        currentUser,
        adminLogs: [...data.adminLogs, newLog]
      });
    },
    updateProfile: (bankInfo?: any, walletInfo?: any) => {
      if (!data.currentUser) return;
      const updatedUsers = data.users.map(u => 
        u.id === data.currentUser?.id ? { ...u, bankInfo, walletInfo } : u
      );
      const currentUser = updatedUsers.find(u => u.id === data.currentUser?.id) || null;
      updateData({ users: updatedUsers, currentUser });
    },
    resetPassword: (email: string, newPass: string) => {
      const userIndex = data.users.findIndex(u => u.email.toLowerCase() === email.toLowerCase());
      if (userIndex === -1) return false;
      
      const updatedUsers = [...data.users];
      updatedUsers[userIndex] = { ...updatedUsers[userIndex], password: newPass };
      updateData({ users: updatedUsers });
      return true;
    },
    updateSettings: (settings: Partial<SystemSettings>) => {
      updateData({ settings: { ...data.settings, ...settings } });
    }
  };
};
