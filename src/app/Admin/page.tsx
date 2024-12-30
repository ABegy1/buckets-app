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
import { Howl } from 'howler';

interface Player {
  player_id: number;
  name: string;
  is_hidden: boolean; // <-- be sure the type includes is_hidden
}

interface TierWithPlayers {
  tier_name: string;
  color: string;
  players: Player[];
}

const AdminPage = () => {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [tiers, setTiers] = useState<TierWithPlayers[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedName, setSelectedName] = useState('');
  const [selectedPlayerId, setSelectedPlayerId] = useState<number | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isCurrentSeasonModalOpen, setIsCurrentSeasonModalOpen] = useState(false);
  const [isNextSeasonModalOpen, setIsNextSeasonModalOpen] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [seasonName, setSeasonName] = useState<string>('');
  const [userView, setUserView] = useState<string>('');
  const sound = new Howl({ src: ['/sounds/onfire.mp3'] });

  const pageOptions = ['Standings', 'FreeAgent', 'Rules'];

  // 1. Verify user is admin
  useEffect(() => {
    const getUserSessionAndRole = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);

      if (session?.user) {
        const { data, error } = await supabase
          .from('users')
          .select('role, View')
          .eq('email', session.user.email)
          .single();

        if (error || data.role !== 'Admin') {
          router.push('/');
        } else {
          setIsAdmin(true);
          setUserView(data.View || 'Standings');
        }
      }
      setLoading(false);
    };

    getUserSessionAndRole();

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (!session?.user) {
        router.push('/');
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
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
        setTiers(tiersData || []);
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
          .is('end_date', null)
          .single();

        if (seasonError || !activeSeason) {
          throw seasonError;
        }

        setSeasonName(activeSeason.season_name);
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
        setUserView(newView);
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
      </main>

      {/* Footer */}
      <footer className={styles.adminFooter}>
        <p>&copy; 2024 Buckets Game. Admin Panel. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default AdminPage;
