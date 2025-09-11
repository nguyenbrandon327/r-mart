'use client';

import { GoogleLogin } from '@react-oauth/google';
import { useAuthStore } from '../store';
import { useState } from 'react';

export default function GoogleLoginButton({ onSuccessRedirect = '/' }) {
  const { loginWithGoogle } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);

  return (
    <div className="w-full flex justify-center">
      <GoogleLogin
        onSuccess={async (credentialResponse) => {
          try {
            setIsLoading(true);
            await loginWithGoogle(credentialResponse.credential);
            // Navigation is handled by auth pages after state updates
          } catch (e) {
            // Swallow; error displayed by store consumers
          } finally {
            setIsLoading(false);
          }
        }}
        onError={() => {
          // noop; UI errors handled by store consumers
        }}
        useOneTap
        theme="filled_blue"
        width="360"
        size="large"
        text="continue_with"
        logo_alignment="left"
        shape="pill"
        cancel_on_tap_outside
      />
    </div>
  );
}


