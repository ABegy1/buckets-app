'use client'; // Required in Next.js App Router
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from './adminPage.module.css'; // Import the combined CSS module
import Modal from '@/components/Modal/Modal';
import Sidebar from '@/components/Sidebar/Sidebar';
import CurrentSeasonModal from '@/components/CurrentSeason/CurrentSeasonModal';
import NextSeasonModal from '@/components/NextSeason/NextSeason';
import { supabase } from '@/supabaseClient'; // Import the Supabase client
import { User } from '@supabase/supabase-js';

interface TierWithPlayers {
  tier_name: string;
  color: string;
  players: {
    name: string;
    player_id: number;
  }[];
}

const AdminPage = () => {
  const router = useRouter(); // Use router for navigation
  const [user, setUser] = useState<User | null>(null);
  const [tiers, setTiers] = useState<TierWithPlayers[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedName, setSelectedName] = useState('');
  const [selectedPlayerId, setSelectedPlayerId] = useState<number | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isCurrentSeasonModalOpen, setIsCurrentSeasonModalOpen] = useState(false);
  const [isNextSeasonModalOpen, setIsNextSeasonModalOpen] = useState<boolean>(false);
  const [loading, setLoading] = useState(true); // For handling loading state of role check
  const [isAdmin, setIsAdmin] = useState<boolean>(false); // To store the admin role check

  // Fetch user session and role
  useEffect(() => {
    const getUserSessionAndRole = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);

      if (session?.user) {
        const { data, error } = await supabase
          .from('users') // Adjust if needed to match your actual users table
          .select('role')
          .eq('email', session.user.email)
          .single();

        if (error || data.role !== 'Admin') {
          router.push('/'); // Redirect if not an admin
        } else {
          setIsAdmin(true); // Set as admin if role matches
        }
      }
      setLoading(false); // Loading complete
    };

    getUserSessionAndRole();

    // Listen to auth state changes (e.g., sign-out)
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (!session?.user) {
        router.push('/'); // Redirect to sign-in page after sign out
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [router]);

  // Fetch tiers and players
  useEffect(() => {
    const fetchTiersAndPlayers = async () => {
      const { data: tiersData, error: tiersError } = await supabase
        .from('tiers')
        .select('tier_name, color, players(name, player_id)');

      if (tiersError) {
        console.error('Error fetching tiers:', tiersError);
      } else {
        setTiers(tiersData || []);
      }
    };

    fetchTiersAndPlayers();
  }, []);

  // Modal and sidebar handlers
  const handleOpenModal = (playerId: number, name: string) => {
    setSelectedName(name);
    setSelectedPlayerId(playerId);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const handleOpenSidebar = () => {
    setIsSidebarOpen(true);
  };

  const handleStandings = async () => {
    let newView: string | undefined = undefined;
    // Logic to toggle between views (if needed)
  };

  const handleCloseSidebar = () => {
    setIsSidebarOpen(false);
  };

  const handleOpenCurrentSeasonModal = () => {
    setIsCurrentSeasonModalOpen(true);
    setIsSidebarOpen(false);
  };

  const handleCloseCurrentSeasonModal = () => {
    setIsCurrentSeasonModalOpen(false);
  };

  const handleOpenNextSeasonModal = () => {
    setIsNextSeasonModalOpen(true);
    setIsCurrentSeasonModalOpen(false);
  };

  const handleCloseNextSeasonModal = () => {
    setIsNextSeasonModalOpen(false);
  };

  const handleStartSeason = () => {
    console.log("Start Season clicked");
    setIsNextSeasonModalOpen(false);
  };

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Error signing out:', error.message);
    } else {
      router.push('/'); // Redirect to sign-in page after successful sign-out
    }
  };

  // Show loading while role check is in progress
  if (loading) {
    return <div>Loading...</div>;
  }

  // Return null if the user is not an admin
  if (!isAdmin) {
    return null;
  }

  return (
    <div className={styles.adminContainer}>
      <header className={styles.adminHeader}>
        <h1>Admin Dashboard</h1>
      </header>
      <main className={styles.adminContent}>
        <p>Welcome, Admin! You have successfully been redirected to the admin dashboard.</p>
        <button className={styles.btn} onClick={handleSignOut}>Sign Out</button>

        <div className={styles.container}>
          <div className={styles.secondaryScreenOptions}>
            <button className={styles.button} onClick={handleOpenSidebar}>Settings</button>
            <button className={styles.button} onClick={handleStandings}>Standings</button>
          </div>

          <div className={styles.players}>
            {tiers.map((tier) => (
              <div key={tier.tier_name} className={styles.column}>
                <div className={styles.header}>{tier.tier_name}</div>
                {tier.players.map((player) => (
                  <div key={player.player_id} className={styles.box} onClick={() => handleOpenModal(player.player_id, player.name)}>
                    {player.name}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>

        <Modal name={selectedName} isOpen={isModalOpen} onClose={handleCloseModal} playerId={selectedPlayerId ?? 0} />
        <Sidebar
          isOpen={isSidebarOpen}
          onClose={handleCloseSidebar}
          onCurrentSeasonClick={handleOpenCurrentSeasonModal}
          onStartSeasonClick={handleOpenNextSeasonModal}
        />
        <CurrentSeasonModal isOpen={isCurrentSeasonModalOpen} onClose={handleCloseCurrentSeasonModal} />
        <NextSeasonModal
          isOpen={isNextSeasonModalOpen}
          onClose={handleCloseNextSeasonModal}
          onStartSeason={handleStartSeason}
        />
      </main>
      <footer className={styles.adminFooter}>
        <p>&copy; 2024 Buckets Game. Admin Panel. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default AdminPage;
