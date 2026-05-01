import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { logger } from '@/lib/logger';

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const GOOGLE_REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI;

interface GoogleTokenResponse {
  access_token: string;
  expires_in: number;
  refresh_token?: string;
  scope: string;
  token_type: string;
  id_token?: string;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');
    
    // Get stored state from cookie
    const cookieStore = await cookies();
    const storedState = cookieStore.get('oauth_state')?.value;

    // Clear the state cookie immediately
    cookieStore.delete('oauth_state');

    // 1. Validate state to prevent CSRF
    if (!state || !storedState || state !== storedState) {
      logger.error('OAuth state mismatch', new Error('State mismatch'), { action: 'googleAuthCallback' });
      return NextResponse.redirect(new URL('/dashboard?error=invalid_state', process.env.NEXT_PUBLIC_APP_URL || request.url));
    }

    // Handle user denial or errors
    if (error) {
      logger.error('Google OAuth error', new Error(error), { action: 'googleAuthCallback', error_code: error });
      return NextResponse.redirect(new URL('/dashboard?error=google_auth_denied', process.env.NEXT_PUBLIC_APP_URL || request.url));
    }

    if (!code) {
      return NextResponse.json(
        { error: 'Missing authorization code' },
        { status: 400 }
      );
    }

    if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET || !GOOGLE_REDIRECT_URI) {
      return NextResponse.json(
        { error: 'Google OAuth is not configured' },
        { status: 500 }
      );
    }

    // Exchange code for tokens using fetch
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        code,
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        redirect_uri: GOOGLE_REDIRECT_URI,
        grant_type: 'authorization_code',
      }),
    });

    if (!tokenResponse.ok) {
      const errorBody = await tokenResponse.text();
      logger.error('Google token exchange error', new Error(errorBody), { action: 'googleAuthCallback' });
      return NextResponse.json(
        { error: 'Failed to exchange authorization code for tokens' },
        { status: 500 }
      );
    }

    const tokens: GoogleTokenResponse = await tokenResponse.json();

    // Set tokens in secure HTTP-only cookies
    cookieStore.set('google_access_token', tokens.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: tokens.expires_in,
      path: '/',
    });

    if (tokens.refresh_token) {
      cookieStore.set('google_refresh_token', tokens.refresh_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 30, // 30 days
        path: '/',
      });
    }

    // 2. Use safe absolute redirect to prevent Open Redirect vulnerabilities
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || '';
    const redirectUrl = new URL('/dashboard/calendar?google_connected=true', appUrl || request.url);
    
    return NextResponse.redirect(redirectUrl);
  } catch (error) {
    logger.error('Google OAuth callback error', error as Error, { action: 'googleAuthCallback' });
    return NextResponse.json(
      { error: 'Failed to complete Google OAuth' },
      { status: 500 }
    );
  }
}
