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
  const [seasonName, setSeasonName] = useState<string>(''); // State to store the current season name
  const [userView, setUserView] = useState<string>(''); // New state for user view

  // Fetch user session and role
  useEffect(() => {
    const getUserSessionAndRole = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);

      if (session?.user) {
        const { data, error } = await supabase
          .from('users') // Adjust if needed to match your actual users table
          .select('role, View')
          .eq('email', session.user.email)
          .single();

        if (error || data.role !== 'Admin') {
          router.push('/'); // Redirect if not an admin
        } else {
          setIsAdmin(true); // Set as admin if role matches
          setUserView(data.View || ''); // Set the current view
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

  // Fetch the current season name
  useEffect(() => {
    const fetchSeasonName = async () => {
      try {
        const { data: activeSeason, error: seasonError } = await supabase
          .from('seasons')
          .select('season_name')
          .is('end_date', null)
          .single();

        if (seasonError || !activeSeason) {
          throw seasonError;
        }

        setSeasonName(activeSeason.season_name); // Set the season name
      } catch (error) {
        console.error('Error fetching current season:', error);
      }
    };

    fetchSeasonName();
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

  const handleViewUpdate = async (newView: string) => {
    if (!user) return;

    try {
      const { error: updateError } = await supabase
        .from('users')
        .update({ View: newView })
        .eq('email', user.email);

      if (updateError) {
        console.error('Error updating user view:', updateError);
      } else {
        setUserView(newView); // Update local state with new view
        console.log(`User view updated to ${newView}`);
      }
    } catch (err) {
      console.error('Error handling view update:', err);
    }
  };

  const handleToggleView = () => {
    const newView = userView === 'Standings' ? 'FreeAgent' : 'Standings';
    handleViewUpdate(newView);
  };

  const handleRulesClick = () => {
    handleViewUpdate('Rules');
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
        <button className={styles.btn} onClick={handleSignOut}>Sign Out</button>

        <div className={styles.container}>
          <h2>{seasonName} Standings</h2> {/* Display the current season name */}
          <div className={styles.secondaryScreenOptions}>
            <button className={styles.button} onClick={handleOpenSidebar}>Settings</button>
            <button className={styles.button} onClick={handleToggleView}>
              {userView === 'Standings' ? 'Free Agency' : 'Standings'}
            </button>
            <button className={styles.button} onClick={handleRulesClick}>Rules</button>
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
