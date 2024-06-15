"use client";
import React from 'react';
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';

const CLIENT_ID = '157780287523-f05ch2ac1t1c6aivr6g11vm9gc3e2f65.apps.googleusercontent.com';

const GoogleAuth = () => {
  const handleLoginSuccess = (response) => {
    console.log('Login Success:', response);
    // handle successful login
  };

  const handleLoginFailure = (response) => {
    console.log('Login Failed:', response);
    // handle failed login
  };

  return (
    <GoogleOAuthProvider clientId={CLIENT_ID}>
      <div>
        <GoogleLogin
          onSuccess={handleLoginSuccess}
          onError={handleLoginFailure}
          useOneTap
        />
      </div>
    </GoogleOAuthProvider>
  );
};

export default GoogleAuth;
