'use client';
import React from 'react';
import { AuthProvider } from '../components/useAuth';
import RootLayout from './layout'; 
import '../styles/globals.css';

const App = ({ Component, pageProps }: { Component: React.ElementType, pageProps: any }) => {
  return (
    <AuthProvider>
      <RootLayout>
        <Component {...pageProps} />
      </RootLayout>
    </AuthProvider>
  );
};

export default App;
