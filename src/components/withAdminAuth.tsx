import React, { useEffect } from 'react';
import { useRouter } from 'next/router';
import type { User } from '@supabase/supabase-js';

type WithAdminAuthProps = {
  user: User | null;
  role: string | null;
};

const withAdminAuth = <P extends object>(WrappedComponent: React.ComponentType<P>) => {
  const WithAdminAuth: React.FC<P & WithAdminAuthProps> = ({ user, role, ...props }) => {
    const router = useRouter();

    useEffect(() => {
      if (role && role !== 'Admin') {
        router.push('/');
      }
    }, [role, router]);

    if (!user || role !== 'Admin') {
      return <div>Loading...</div>;
    }

    return <WrappedComponent {...(props as P)} />;
  };

  WithAdminAuth.displayName = `WithAdminAuth(${WrappedComponent.displayName || WrappedComponent.name || 'Component'})`;

  return WithAdminAuth;
};

export default withAdminAuth;