import React from 'react';
import withAdminAuth from '@/components/withAdminAuth';
import { useAuth } from '../page';

const Contact = () => {
  const { user, role } = useAuth();
  return (
    <div>
      <h1>Contact Page</h1>
      <p>This is the contact page.</p>
    </div>
  );
};

Contact.displayName = 'Contact';

export default withAdminAuth(Contact);
