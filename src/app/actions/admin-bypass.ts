'use server';

import { cookies } from 'next/headers';

/**
 * LOG IN: Compares input to .env and sets a 24-hour cookie
 */
export async function loginAdminBypass(formData: FormData) {
  const username = formData.get('username') as string;
  const password = formData.get('password') as string;

  const validUser = process.env.ADMIN_PORTAL_USER;
  const validPass = process.env.ADMIN_PORTAL_SECRET;

  if (username === validUser && password === validPass) {
    const cookieStore = await cookies();
    
    // Set a secure, HTTP-only cookie that the browser can't steal
    cookieStore.set('admin_session', 'verified_access_granted', {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      maxAge: 60 * 60 * 24, // 24 hours
      path: '/',
    });

    return { success: true };
  }

  return { error: "Security Breach: Invalid Credentials" };
}

/**
 * AUTH CHECK: Verifies the cookie exists
 */
export async function checkAdminBypass() {
  const cookieStore = await cookies();
  const session = cookieStore.get('admin_session');

  return session?.value === 'verified_access_granted';
}

/**
 * LOGOUT: Clears the cookie
 */
export async function logoutAdminBypass() {
  const cookieStore = await cookies();
  cookieStore.delete('admin_session');
}