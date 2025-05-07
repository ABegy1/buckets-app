'use client'; 
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from './adminPage.module.css'; // Import the combined CSS module
import Modal from '@/components/Modal/Modal';
import Sidebar from '@/components/Sidebar/Sidebar';
import CurrentSeasonModal from '@/components/CurrentSeason/CurrentSeasonModal';
import NextSeasonModal from '@/components/NextSeason/NextSeason';
import PucketsMatchModal from '@/components/PucketsMatch/PucketsMatchModal'
import { supabase } from '@/supabaseClient'; // Import the Supabase client
import { User } from '@supabase/supabase-js';

interface Player {
  player_id: number;
  name: string;
  is_hidden: boolean; 
}

interface TierWithPlayers {
  tier_name: string;
  color: string;
  players: Player[];
}
/**
 * AdminPage Component
 * 
 * This component serves as the admin dashboard for managing various aspects of the application.
 * It displays the current season's standings, allows the admin to view player details.
 */
const AdminPage = () => {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null); // Tracks logged-in user
  const [tiers, setTiers] = useState<TierWithPlayers[]>([]); // Stores tiers and players
  const [isModalOpen, setIsModalOpen] = useState(false); // Modal visibility
  const [selectedName, setSelectedName] = useState(''); // Selected player's name for modal
  const [selectedPlayerId, setSelectedPlayerId] = useState<number | null>(null); // Selected player's ID for modal
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // Sidebar visibility
  const [isCurrentSeasonModalOpen, setIsCurrentSeasonModalOpen] = useState(false); // Current season modal visibility
  const [isNextSeasonModalOpen, setIsNextSeasonModalOpen] = useState<boolean>(false); // Next season modal visibility
  const [isPucketsMatchModalOpen, setIsPucketsMatchModalOpen] = useState(false); // Puckets match modal visibility
  const [loading, setLoading] = useState(true); // Page loading state
  const [isAdmin, setIsAdmin] = useState<boolean>(false); // Admin check
  const [seasonName, setSeasonName] = useState<string>(''); // Active season name
  const [userView, setUserView] = useState<string>(''); // User's current view setting

  const pageOptions = ['Standings', 'FreeAgent', 'Rules'];

  // 1. Verify user is admin
  useEffect(() => {
    const getUserSessionAndRole = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);

      if (session?.user) {
          // Check if the user has the 'Admin' role

        const { data, error } = await supabase
          .from('users')
          .select('role, View')
          .eq('email', session.user.email)
          .single();

        if (error || data.role !== 'Admin') {
          // Redirect non-admins to the homepage
          router.push('/');
        } else {
          setIsAdmin(true);
          setUserView(data.View || 'Standings'); // Set default user view
        }
      }
      setLoading(false);// Mark loading as complete
    };

    getUserSessionAndRole();
     // Listen for authentication state changes
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (!session?.user) {
        router.push('/'); // Redirect unauthenticated users
      }
    });

    return () => {
      authListener.subscription.unsubscribe(); // Cleanup subscription
    };
  }, [router]);

  // 2. Fetch tiers and players (and include is_hidden in the select)
  useEffect(() => {
    const fetchTiersAndPlayers = async () => {
      const { data: tiersData, error: tiersError } = await supabase
        .from('tiers')
        .select(`
          tier_name,
          color,
          players (
            player_id,
            name,
            is_hidden
          )
        `);

      if (tiersError) {
        console.error('Error fetching tiers:', tiersError);
      } else {
        setTiers(tiersData || []); // Update state with fetched data
      }
    };

    fetchTiersAndPlayers();

    // 3. Set up realtime channels to refresh when tiers/players change
    const tiersChannel = supabase
      .channel('tiers-db-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tiers' }, fetchTiersAndPlayers)
      .subscribe();

    const playersChannel = supabase
      .channel('players-db-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'players' }, fetchTiersAndPlayers)
      .subscribe();

    return () => {
      supabase.removeChannel(tiersChannel);
      supabase.removeChannel(playersChannel);
    };
  }, []);

  // 4. Fetch the active season name
  useEffect(() => {
    const fetchSeasonName = async () => {
      try {
        const { data: activeSeason, error: seasonError } = await supabase
          .from('seasons')
          .select('season_name')
          .is('end_date', null) // Fetch active season
          .single();

        if (seasonError) {
          throw seasonError;
        }
        else if(!activeSeason){
          setSeasonName('No Active Season');
        }
        else setSeasonName(activeSeason.season_name);

      } catch (error) {
        console.error('Error fetching current season:', error);
      }
    };

    fetchSeasonName();
  }, []);

  // Modal handlers
  const handleOpenModal = (playerId: number, name: string) => {
    setSelectedName(name);
    setSelectedPlayerId(playerId);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  // Sidebar handlers
  const handleOpenSidebar = () => {
    setIsSidebarOpen(true);
  };

  const handleCloseSidebar = () => {
    setIsSidebarOpen(false);
  };

  // Update user "View" in the DB
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
        setUserView(newView); // Update local state
        console.log(`User view updated to ${newView}`);
      }
    } catch (err) {
      console.error('Error handling view update:', err);
    }
  };

  // Dropdown selection handler
  const handleSelectChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedView = event.target.value;
    handleViewUpdate(selectedView);
  };

  // CurrentSeasonModal handlers
  const handleOpenCurrentSeasonModal = () => {
    setIsCurrentSeasonModalOpen(true);
    setIsSidebarOpen(false);
  };

  const handleCloseCurrentSeasonModal = () => {
    setIsCurrentSeasonModalOpen(false);
  };

  // NextSeasonModal handlers
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


   // PucketsMatchModal handlers
   const handleOpenPucketsMatchModal = () => {
    setIsPucketsMatchModalOpen(true);
    setIsSidebarOpen(false);
  };

  const handleClosePucketsMatchModal = () => {
    setIsPucketsMatchModalOpen(false);
  };

  // SignOut handler
  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Error signing out:', error.message);
    } else {
      router.push('/');
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className={styles.adminContainer}>
      {/* Header */}
      <header className={styles.navbar}>
        <h1 className={styles.navbarTitle}>Admin Dashboard</h1>
        <button className={styles.signOutButton} onClick={handleSignOut}>
          Sign Out
        </button>
      </header>

      {/* Main Content */}
      <main className={styles.adminContent}>
        <div className={styles.container}>
          <h2>{seasonName} Standings</h2>
          <div className={styles.secondaryScreenOptions}>
            <button className={styles.button} onClick={handleOpenSidebar}>
              Settings
            </button>
            <button className={styles.button} onClick={handleOpenPucketsMatchModal}>
              Puckets Match
            </button>

            {/* Dropdown for Page Options */}
            <select
              className={styles.dropdown}
              value={userView}
              onChange={handleSelectChange}
            >
              {pageOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>

          {/* 5. Display only players where is_hidden === false */}
          <div className={styles.players}>
            {tiers.map((tier) => (
              <div key={tier.tier_name} className={styles.column}>
                <div className={styles.header}>{tier.tier_name}</div>
                {tier.players
                  .filter((player) => !player.is_hidden) // only show players who are NOT hidden
                  .map((player) => (
                    <div
                      key={player.player_id}
                      className={styles.box}
                      onClick={() => handleOpenModal(player.player_id, player.name)}
                      style={{ color: tier.color }} // Apply tier color to player name
                    >
                      {player.name}
                    </div>
                  ))}
              </div>
            ))}
          </div>
        </div>

        {/* Modals */}
        <Modal
          name={selectedName}
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          playerId={selectedPlayerId ?? 0}
        />
        <Sidebar
          isOpen={isSidebarOpen}
          onClose={handleCloseSidebar}
          onCurrentSeasonClick={handleOpenCurrentSeasonModal}
          onStartSeasonClick={handleOpenNextSeasonModal}
        />
        <CurrentSeasonModal
          isOpen={isCurrentSeasonModalOpen}
          onClose={handleCloseCurrentSeasonModal}
        />
        <NextSeasonModal
          isOpen={isNextSeasonModalOpen}
          onClose={handleCloseNextSeasonModal}
          onStartSeason={handleStartSeason}
        />
        <PucketsMatchModal
          isOpen={isPucketsMatchModalOpen}
          onClose={handleClosePucketsMatchModal}
        />
      </main>

      {/* Footer */}
      <footer className={styles.adminFooter}>
        <p>&copy; 2025 Buckets Game. Admin Panel. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default AdminPage;
