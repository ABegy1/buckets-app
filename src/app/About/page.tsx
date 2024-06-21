import React from 'react';
import withAdminAuth from '@/components/withAdminAuth';
import type { User } from '@supabase/supabase-js';

type AboutProps = {
  user: User;
  role: string;
};

const About: React.FC<AboutProps> = ({ user, role }) => {
  return (
    <div>
      <h1>About Page</h1>
      <p>This is the about page.</p>
    </div>
  );
};

About.displayName = 'About';

export default withAdminAuth(About);
