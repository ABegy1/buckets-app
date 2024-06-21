import React from 'react';
import withAdminAuth from '@/components/withAdminAuth';
import { useAuth } from '../page';

const About = () => {
  const { user, role } = useAuth();
  return (
    <div>
      <h1>About Page</h1>
      <p>This is the about page.</p>
    </div>
  );
};

About.displayName = 'About';

export default withAdminAuth(About);
