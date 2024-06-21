import React from 'react';
import withAdminAuth from '@/components/withAdminAuth';
import type { User } from '@supabase/supabase-js';

type ContactProps = {
  user: User;
  role: string;
};

const Contact: React.FC<ContactProps> = ({ user, role }) => {
  return (
    <div>
      <h1>Contact Page</h1>
      <p>This is the contact page.</p>
    </div>
  );
};

Contact.displayName = 'Contact';

export default withAdminAuth(Contact);
