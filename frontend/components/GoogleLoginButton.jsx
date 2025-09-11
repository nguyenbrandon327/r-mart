'use client';

import { GoogleLogin } from '@react-oauth/google';
import { useAuthStore } from '../store';
import { useState } from 'react';

export default function GoogleLoginButton({ onSuccessRedirect = '/', agreedToTerms = true, onTermsError }) {
  const { loginWithGoogle } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);

  const handleGoogleLogin = async (credentialResponse) => {
    // Check terms agreement before proceeding
    if (agreedToTerms !== undefined && !agreedToTerms) {
      if (onTermsError) {
        onTermsError();
      }
      return;
    }

    try {
      setIsLoading(true);
      await loginWithGoogle(credentialResponse.credential);
      // Navigation is handled by auth pages after state updates
    } catch (e) {
      // Swallow; error displayed by store consumers
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full">
      <GoogleLogin
        onSuccess={handleGoogleLogin}
        onError={() => {
          // noop; UI errors handled by store consumers
        }}
        useOneTap
        theme="filled_blue"
        width="100%"
        size="large"
        text="continue_with"
        logo_alignment="left"
        shape="pill"
        cancel_on_tap_outside
      />
    </div>
  );
}


