import React from 'react';
import { AuthProvider } from '../components/useAuth'; // Adjust the path as needed
import Page from './page'; // Adjust the path as needed

const App = () => {
  return (
    <AuthProvider>
      <Page />
    </AuthProvider>
  );
};

export default App;
