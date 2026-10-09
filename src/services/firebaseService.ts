import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  sendPasswordResetEmail,
  onAuthStateChanged,
  User as FirebaseUser,
} from 'firebase/auth';
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  getDocs,
  deleteDoc,
  query,
  orderBy,
} from 'firebase/firestore';
import { auth, db, handleFirestoreError, OperationType } from '../firebase';
import { AppUser, DailyLog, ReminderSettings, NotificationTemplate, Gender, ActivityLevel } from '../types';

export const FIRST_ADMIN_EMAIL = 'buidiu31006@gmail.com';

/**
 * Register a new user with Email and Password
 * Default role is strictly 'member'
 */
export async function registerWithEmail(
  email: string,
  pass: string,
  displayName: string,
  weight: number,
  gender: Gender,
  activityLevel: ActivityLevel
): Promise<AppUser> {
  const userCredential = await createUserWithEmailAndPassword(auth, email.trim(), pass);
  const user = userCredential.user;

  const isBootstrap = email.trim().toLowerCase() === FIRST_ADMIN_EMAIL.toLowerCase();
  const role = isBootstrap ? 'admin' : 'member';

  const newUser: AppUser = {
    uid: user.uid,
    email: user.email || email.trim(),
    displayName: displayName.trim() || email.split('@')[0],
    role: 'member', // Firestore rules mandate role == 'member' on create
    weight: weight || 60,
    gender: gender || 'female',
    activityLevel: activityLevel || 'moderate',
    isConfigured: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const userPath = `users/${user.uid}`;
  try {
    await setDoc(doc(db, 'users', user.uid), newUser);
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, userPath);
  }

  // If initial authorized admin email, also register in /admins collection and upgrade role
  if (isBootstrap) {
    try {
      await setDoc(doc(db, 'admins', user.uid), {
        uid: user.uid,
        email: user.email || email.trim(),
        grantedAt: new Date().toISOString(),
        grantedBy: 'system-bootstrap',
      });
      await updateDoc(doc(db, 'users', user.uid), {
        role: 'admin',
        updatedAt: new Date().toISOString(),
      });
      newUser.role = 'admin';
    } catch (err) {
      console.warn('Bootstrap admin setup note:', err);
    }
  }

  return newUser;
}

/**
 * Sign in user with Email and Password
 */
export async function loginWithEmail(email: string, pass: string): Promise<AppUser> {
  const userCredential = await signInWithEmailAndPassword(auth, email.trim(), pass);
  const user = userCredential.user;
  return await fetchAppUser(user.uid);
}

/**
 * Sign in or sign up with Google Provider via popup
 */
export async function loginWithGoogle(
  fallbackWeight = 60,
  fallbackGender: Gender = 'female',
  fallbackActivity: ActivityLevel = 'moderate'
): Promise<AppUser> {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });
  const result = await signInWithPopup(auth, provider);
  const user = result.user;

  const userDocRef = doc(db, 'users', user.uid);
  const userDoc = await getDoc(userDocRef);

  if (!userDoc.exists()) {
    // New Google user: strictly default to 'member' role per security requirements
    const isBootstrap = user.email?.trim().toLowerCase() === FIRST_ADMIN_EMAIL.toLowerCase();

    const newUser: AppUser = {
      uid: user.uid,
      email: user.email || '',
      displayName: user.displayName || user.email?.split('@')[0] || 'Thành viên',
      role: 'member', // Default to member role
      weight: fallbackWeight || 60,
      gender: fallbackGender || 'female',
      activityLevel: fallbackActivity || 'moderate',
      isConfigured: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const userPath = `users/${user.uid}`;
    try {
      await setDoc(userDocRef, newUser);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, userPath);
    }

    // Bootstrap first admin if owner email
    if (isBootstrap) {
      try {
        await setDoc(doc(db, 'admins', user.uid), {
          uid: user.uid,
          email: user.email,
          grantedAt: new Date().toISOString(),
          grantedBy: 'system-bootstrap-google',
        });
        await updateDoc(userDocRef, {
          role: 'admin',
          updatedAt: new Date().toISOString(),
        });
        newUser.role = 'admin';
      } catch (err) {
        console.warn('Bootstrap admin setup note for Google user:', err);
      }
    }

    return newUser;
  } else {
    // Existing user: preserve their existing role ('admin' or 'member')
    const existingData = userDoc.data() as AppUser;

    // Check if user is in /admins to verify admin role
    const adminDoc = await getDoc(doc(db, 'admins', user.uid));
    if (adminDoc.exists() && existingData.role !== 'admin') {
      existingData.role = 'admin';
    }

    return existingData;
  }
}

/**
 * Send password reset email
 */
export async function sendResetPassword(email: string): Promise<void> {
  await sendPasswordResetEmail(auth, email.trim());
}

/**
 * Sign out current user
 */
export async function logoutUser(): Promise<void> {
  await signOut(auth);
}

/**
 * Fetch AppUser profile from Firestore
 */
export async function fetchAppUser(uid: string): Promise<AppUser> {
  const path = `users/${uid}`;
  try {
    const userDoc = await getDoc(doc(db, 'users', uid));
    if (!userDoc.exists()) {
      // Fallback default
      const defaultUser: AppUser = {
        uid,
        email: auth.currentUser?.email || '',
        displayName: auth.currentUser?.email?.split('@')[0] || 'Thành viên',
        role: 'member',
        weight: 60,
        gender: 'female',
        activityLevel: 'moderate',
        isConfigured: false,
        createdAt: new Date().toISOString(),
      };
      await setDoc(doc(db, 'users', uid), defaultUser);
      return defaultUser;
    }
    const data = userDoc.data() as AppUser;

    // Check if user is in /admins collection for verified role
    const adminDoc = await getDoc(doc(db, 'admins', uid));
    if (adminDoc.exists() && data.role !== 'admin') {
      data.role = 'admin';
    }

    return data;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

/**
 * Check if a UID has admin privileges
 */
export async function verifyAdminStatus(uid: string): Promise<boolean> {
  try {
    const adminDoc = await getDoc(doc(db, 'admins', uid));
    return adminDoc.exists();
  } catch {
    return false;
  }
}

/**
 * Bootstrap First Admin if user is the authorized app owner
 */
export async function claimBootstrapAdmin(uid: string, email: string): Promise<boolean> {
  if (email.toLowerCase() !== FIRST_ADMIN_EMAIL.toLowerCase()) {
    return false;
  }

  try {
    await setDoc(doc(db, 'admins', uid), {
      uid,
      email,
      grantedAt: new Date().toISOString(),
      grantedBy: 'bootstrap-owner',
    });
    await updateDoc(doc(db, 'users', uid), {
      role: 'admin',
      updatedAt: new Date().toISOString(),
    });
    return true;
  } catch (error) {
    console.error('Error claiming bootstrap admin:', error);
    return false;
  }
}

/**
 * Save daily log to Firestore (/users/{uid}/dailyLogs/{date})
 */
export async function syncDailyLogToFirestore(uid: string, log: DailyLog): Promise<void> {
  const path = `users/${uid}/dailyLogs/${log.date}`;
  try {
    await setDoc(
      doc(db, 'users', uid, 'dailyLogs', log.date),
      {
        ...log,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

/**
 * Load all daily logs for user from Firestore
 */
export async function fetchDailyLogsFromFirestore(uid: string): Promise<Record<string, DailyLog>> {
  const path = `users/${uid}/dailyLogs`;
  try {
    const querySnapshot = await getDocs(collection(db, 'users', uid, 'dailyLogs'));
    const logs: Record<string, DailyLog> = {};
    querySnapshot.forEach((d) => {
      logs[d.id] = d.data() as DailyLog;
    });
    return logs;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

/**
 * Save user reminder settings to Firestore
 */
export async function syncReminderSettingsToFirestore(
  uid: string,
  settings: ReminderSettings
): Promise<void> {
  const path = `users/${uid}/settings/reminders`;
  try {
    await setDoc(
      doc(db, 'users', uid, 'settings', 'reminders'),
      {
        ...settings,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

/**
 * Fetch reminder settings from Firestore
 */
export async function fetchReminderSettingsFromFirestore(
  uid: string
): Promise<ReminderSettings | null> {
  const path = `users/${uid}/settings/reminders`;
  try {
    const snap = await getDoc(doc(db, 'users', uid, 'settings', 'reminders'));
    if (snap.exists()) {
      return snap.data() as ReminderSettings;
    }
    return null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

/**
 * Update user personal profile
 */
export async function updateUserProfileFirestore(
  uid: string,
  data: Partial<AppUser>
): Promise<void> {
  const path = `users/${uid}`;
  try {
    await updateDoc(doc(db, 'users', uid), {
      ...data,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

/**
 * --- ADMIN CAPABILITIES ---
 */

/**
 * Admin: Fetch all registered members
 */
export async function adminFetchAllMembers(): Promise<AppUser[]> {
  const path = 'users';
  try {
    const snap = await getDocs(collection(db, 'users'));
    const users: AppUser[] = [];
    snap.forEach((d) => {
      users.push(d.data() as AppUser);
    });
    return users;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

/**
 * Admin: Grant Admin role to another member
 */
export async function adminGrantRole(
  targetUid: string,
  targetEmail: string,
  grantedByUid: string
): Promise<void> {
  const adminPath = `admins/${targetUid}`;
  try {
    await setDoc(doc(db, 'admins', targetUid), {
      uid: targetUid,
      email: targetEmail,
      grantedAt: new Date().toISOString(),
      grantedBy: grantedByUid,
    });
    await updateDoc(doc(db, 'users', targetUid), {
      role: 'admin',
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, adminPath);
  }
}

/**
 * Admin: Revoke Admin role
 */
export async function adminRevokeRole(targetUid: string): Promise<void> {
  const adminPath = `admins/${targetUid}`;
  try {
    await deleteDoc(doc(db, 'admins', targetUid));
    await updateDoc(doc(db, 'users', targetUid), {
      role: 'member',
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, adminPath);
  }
}

/**
 * Admin: Fetch notification message templates
 */
export async function adminFetchNotificationTemplates(): Promise<NotificationTemplate[]> {
  const path = 'notificationTemplates';
  try {
    const q = query(collection(db, 'notificationTemplates'), orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);
    const templates: NotificationTemplate[] = [];
    snap.forEach((d) => {
      templates.push(d.data() as NotificationTemplate);
    });
    return templates;
  } catch {
    // If empty or index not created yet, fallback
    try {
      const snap = await getDocs(collection(db, 'notificationTemplates'));
      const templates: NotificationTemplate[] = [];
      snap.forEach((d) => templates.push(d.data() as NotificationTemplate));
      return templates;
    } catch (e) {
      handleFirestoreError(e, OperationType.LIST, path);
    }
  }
}

/**
 * Admin: Save notification template
 */
export async function adminSaveNotificationTemplate(
  template: NotificationTemplate
): Promise<void> {
  const path = `notificationTemplates/${template.id}`;
  try {
    await setDoc(doc(db, 'notificationTemplates', template.id), template, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

/**
 * Admin: Delete notification template
 */
export async function adminDeleteNotificationTemplate(id: string): Promise<void> {
  const path = `notificationTemplates/${id}`;
  try {
    await deleteDoc(doc(db, 'notificationTemplates', id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}
