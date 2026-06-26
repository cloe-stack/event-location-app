import { supabase, API_URL } from './supabase';
import { publicAnonKey } from '/utils/supabase/info';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
}

export interface SignUpData {
  email: string;
  password: string;
  name: string;
}

export interface SignInData {
  email: string;
  password: string;
}

export const signUp = async (data: SignUpData): Promise<{ success: boolean; error?: string }> => {
  try {
    const response = await fetch(`${API_URL}/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${publicAnonKey}`,
      },
      body: JSON.stringify(data),
    });

    const result = await response.json();
    
    if (!response.ok) {
      return { success: false, error: result.error || 'Error al crear cuenta' };
    }

    return { success: true };
  } catch (error) {
    console.error('Sign up error:', error);
    return { success: false, error: 'Error al conectar con el servidor' };
  }
};

export const signIn = async (data: SignInData): Promise<{ success: boolean; error?: string; accessToken?: string }> => {
  try {
    console.log('Attempting sign in for:', data.email);
    
    const { data: authData, error } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    });

    if (error || !authData.session) {
      console.error('Sign in error:', error);
      return { success: false, error: error?.message || 'Error al iniciar sesión' };
    }

    console.log('Sign in successful, access token received');
    console.log('Session user ID:', authData.session.user.id);
    console.log('Access token (first 30 chars):', authData.session.access_token.substring(0, 30) + '...');
    
    // Verify session was saved
    const { data: sessionData } = await supabase.auth.getSession();
    console.log('Session verification - Session saved:', !!sessionData.session);

    return { 
      success: true, 
      accessToken: authData.session.access_token 
    };
  } catch (error) {
    console.error('Sign in error:', error);
    return { success: false, error: 'Error al conectar con el servidor' };
  }
};

export const signOut = async (): Promise<void> => {
  await supabase.auth.signOut();
  localStorage.removeItem('accessToken');
};

export const getSession = async (): Promise<{ accessToken?: string; user?: AuthUser }> => {
  try {
    const { data, error } = await supabase.auth.getSession();
    
    if (error || !data.session) {
      return {};
    }

    return {
      accessToken: data.session.access_token,
      user: {
        id: data.session.user.id,
        email: data.session.user.email || '',
        name: data.session.user.user_metadata?.name || '',
      }
    };
  } catch (error) {
    console.error('Get session error:', error);
    return {};
  }
};

export const getCurrentUser = async (): Promise<AuthUser | null> => {
  const { user } = await getSession();
  return user || null;
};