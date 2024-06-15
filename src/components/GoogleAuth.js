// src/components/GoogleAuth.js (or GoogleAuth.tsx)
import React from 'react';
import { GoogleLogin, GoogleLogout } from '@leecheuk/react-google-login';

const CLIENT_ID = '157780287523-f05ch2ac1t1c6aivr6g11vm9gc3e2f65.apps.googleusercontent.com';

const GoogleAuth = () => {
  const onSuccess = (response) => {
    console.log('Login Success: currentUser:', response.profileObj);
    // handle successful login
  };

  const onFailure = (response) => {
    console.log('Login failed: res:', response);
    // handle failed login
  };

  const onLogoutSuccess = () => {
    console.log('Logout made successfully');
    // handle logout
  };

  return (
    <div>
      <GoogleLogin
        clientId={CLIENT_ID}
        buttonText="Login with Google"
        onSuccess={onSuccess}
        onFailure={onFailure}
        cookiePolicy={'single_host_origin'}
        style={{ marginTop: '100px' }}
        isSignedIn={true}
      />
      <GoogleLogout
        clientId={CLIENT_ID}
        buttonText="Logout"
        onLogoutSuccess={onLogoutSuccess}
      />
    </div>
  );
};

export default GoogleAuth;
