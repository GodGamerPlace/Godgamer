import { User } from '../types';

const USERS_KEY = 'food_akinator_users_db_v2';
const CURRENT_USER_KEY = 'food_akinator_session';

// Simple hash function for privacy (not military grade, but satisfies requirement)
const hashPassword = (pwd: string) => {
  let hash = 0;
  for (let i = 0; i < pwd.length; i++) {
    const char = pwd.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return hash.toString();
};

// Initialize DB with Owner account if not exists
const initDB = () => {
  const users = getUsers();
  if (!users.some(u => u.role === 'owner')) {
    const owner: User = {
      username: 'Owner',
      passwordHash: hashPassword('123'),
      role: 'owner',
      score: 9999,
      gamesPlayed: 0,
      isBanned: false,
      createdAt: Date.now()
    };
    users.push(owner);
    saveUsers(users);
  }
};

const getUsers = (): User[] => {
  const data = localStorage.getItem(USERS_KEY);
  return data ? JSON.parse(data) : [];
};

const saveUsers = (users: User[]) => {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
};

export const login = (username: string, password: string): { success: boolean; message?: string; user?: User } => {
  initDB();
  const users = getUsers();
  const user = users.find(u => u.username.toLowerCase() === username.toLowerCase());

  if (!user) {
    return { success: false, message: 'Account not found. Please sign up.' };
  }

  if (user.isBanned) {
    return { success: false, message: 'This account has been BANNED by the Owner.' };
  }

  if (user.passwordHash !== hashPassword(password)) {
    return { success: false, message: 'Incorrect password.' };
  }

  localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
  return { success: true, user };
};

export const signup = (username: string, password: string): { success: boolean; message?: string; user?: User } => {
  initDB();
  const users = getUsers();

  if (username.length < 3) return { success: false, message: 'Username too short.' };
  if (password.length < 3) return { success: false, message: 'Password too weak.' };

  if (users.some(u => u.username.toLowerCase() === username.toLowerCase())) {
    return { success: false, message: 'Username already exists.' };
  }

  const newUser: User = {
    username,
    passwordHash: hashPassword(password),
    role: 'user',
    score: 0,
    gamesPlayed: 0,
    isBanned: false,
    createdAt: Date.now()
  };

  users.push(newUser);
  saveUsers(users);
  localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(newUser));
  return { success: true, user: newUser };
};

export const changePassword = (username: string, oldPass: string, newPass: string): { success: boolean; message: string } => {
  if (newPass.length < 3) return { success: false, message: 'New password too weak.' };
  
  const users = getUsers();
  const idx = users.findIndex(u => u.username === username);
  
  if (idx === -1) return { success: false, message: 'User not found.' };
  
  if (users[idx].passwordHash !== hashPassword(oldPass)) {
    return { success: false, message: 'Incorrect current password.' };
  }

  users[idx].passwordHash = hashPassword(newPass);
  saveUsers(users);
  return { success: true, message: 'Password updated successfully.' };
};

export const deleteAccount = (username: string, password: string): { success: boolean; message: string } => {
  const users = getUsers();
  const idx = users.findIndex(u => u.username === username);

  if (idx === -1) return { success: false, message: 'User not found.' };

  if (users[idx].role === 'owner') {
    return { success: false, message: 'Cannot delete the Owner account.' };
  }
  
  if (users[idx].passwordHash !== hashPassword(password)) {
    return { success: false, message: 'Incorrect password.' };
  }

  users.splice(idx, 1);
  saveUsers(users);
  logout();
  return { success: true, message: 'Account deleted.' };
};

export const logout = () => {
  localStorage.removeItem(CURRENT_USER_KEY);
};

export const getCurrentSession = (): User | null => {
  const data = localStorage.getItem(CURRENT_USER_KEY);
  if (!data) return null;
  const user = JSON.parse(data);
  
  // Re-verify ban status from main DB
  const freshUser = getUsers().find(u => u.username === user.username);
  if (freshUser && freshUser.isBanned) {
    logout();
    return null;
  }
  return freshUser || null;
};

// Owner Only Functions
export const updateUserScore = (username: string, newScore: number) => {
  const users = getUsers();
  const idx = users.findIndex(u => u.username === username);
  if (idx !== -1) {
    users[idx].score = newScore;
    users[idx].gamesPlayed += 1;
    saveUsers(users);
    
    // Update session if it's the current user
    const session = getCurrentSession();
    if (session && session.username === username) {
       localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(users[idx]));
    }
  }
};

export const banUser = (targetUsername: string, banStatus: boolean) => {
  const users = getUsers();
  const user = users.find(u => u.username === targetUsername);
  if (user && user.role !== 'owner') {
    user.isBanned = banStatus;
    saveUsers(users);
  }
};

export const getAllUsers = () => getUsers();

// Simulated File System for Owner
export const getGameCode = () => {
  return [
    { name: 'App.tsx', type: 'code', size: '12kb' },
    { name: 'services/auth.ts', type: 'code', size: '4kb' },
    { name: 'services/gemini.ts', type: 'code', size: '5kb' },
    { name: 'components/Avatar.tsx', type: 'code', size: '3kb' },
    { name: 'users_db.json', type: 'data', size: `${JSON.stringify(getUsers()).length} bytes` }
  ];
};