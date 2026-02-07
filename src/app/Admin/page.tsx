'use client'; 
import React, { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from './adminPage.module.css'; // Import the combined CSS module
import Modal from '@/components/Modal/Modal';
import Sidebar from '@/components/Sidebar/Sidebar';
import CurrentSeasonModal from '@/components/CurrentSeason/CurrentSeasonModal';
import NextSeasonModal from '@/components/NextSeason/NextSeason';
import AddPlayers from '@/components/AddPlayers';
import AdminShotHistory from '@/components/AdminShotHistory';
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

interface FreeAgentPlayer {
  player_id: number;
  name: string;
  is_hidden: boolean;
  tier_color: string;
}

const getSortableLastName = (name: string) => {
  const trimmedName = name.trim();
  const nameParts = trimmedName.split(/\s+/);

  if (nameParts.length === 1) return trimmedName;

  return nameParts[nameParts.length - 1];
};

const sortPlayersByName = <T extends { name: string }>(players: T[] = []) =>
  [...players].sort((a, b) => {
    const lastNameComparison = getSortableLastName(a.name).localeCompare(
      getSortableLastName(b.name),
      undefined,
      { sensitivity: 'base' },
    );

    if (lastNameComparison !== 0) return lastNameComparison;

    return a.name.localeCompare(b.name);
  });
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
  const [isAddPlayerModalOpen, setIsAddPlayerModalOpen] = useState(false);
  const [loading, setLoading] = useState(true); // Page loading state
  const [isAdmin, setIsAdmin] = useState<boolean>(false); // Admin check
  const [seasonName, setSeasonName] = useState<string>(''); // Active season name
  const [userView, setUserView] = useState<string>(''); // User's current view setting
  const [waiverByPlayerId, setWaiverByPlayerId] = useState<Record<number, boolean>>({});
  const [freeAgents, setFreeAgents] = useState<FreeAgentPlayer[]>([]);

  const pageOptions = ['Standings', 'FreeAgent', 'Rules', 'Shot History'];

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
  const fetchTiersAndPlayers = useCallback(async () => {
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
      const sortedTiers = (tiersData || []).map((tier) => ({
        ...tier,
        players: sortPlayersByName(tier.players || []),
      }));

      setTiers(sortedTiers); // Update state with fetched data
    }
  }, []);

  const fetchFreeAgents = useCallback(async () => {
    const { data: freeAgentData, error: freeAgentError } = await supabase
      .from('players')
      .select('player_id, name, is_hidden, tiers(color)')
      .eq('is_free_agent', true);

    if (freeAgentError) {
      console.error('Error fetching free agents:', freeAgentError);
      return;
    }

    const freeAgentPlayers = (freeAgentData || [])
      .map((player) => ({
        player_id: player.player_id,
        name: player.name,
        is_hidden: player.is_hidden,
        tier_color: player.tiers?.[0]?.color ?? '#333',
      }))
      .filter((player) => !player.is_hidden);

    setFreeAgents(sortPlayersByName(freeAgentPlayers));
  }, []);

  useEffect(() => {
    fetchTiersAndPlayers();
    fetchFreeAgents();

    // 3. Set up realtime channels to refresh when tiers/players change
    const tiersChannel = supabase
      .channel('tiers-db-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tiers' }, () => {
        fetchTiersAndPlayers();
        fetchFreeAgents();
      })
      .subscribe();

    const playersChannel = supabase
      .channel('players-db-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'players' }, () => {
        fetchTiersAndPlayers();
        fetchFreeAgents();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(tiersChannel);
      supabase.removeChannel(playersChannel);
    };
  }, [fetchFreeAgents, fetchTiersAndPlayers]);

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

  const fetchWaiverStatus = useCallback(async () => {
    try {
      const { data: activeSeason, error: seasonError } = await supabase
        .from('seasons')
        .select('season_id')
        .is('end_date', null)
        .maybeSingle();

      if (seasonError) {
        throw seasonError;
      }

      if (!activeSeason) {
        setWaiverByPlayerId({});
        return;
      }

      const { data: instances, error: instanceError } = await supabase
        .from('player_instance')
        .select('player_instance_id, player_id')
        .eq('season_id', activeSeason.season_id);

      if (instanceError) {
        throw instanceError;
      }

      if (!instances || instances.length === 0) {
        setWaiverByPlayerId({});
        return;
      }

      const instanceIds = instances.map((instance) => instance.player_instance_id);
      const instanceToPlayer = new Map(
        instances.map((instance) => [instance.player_instance_id, instance.player_id]),
      );

      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);
      const startOfNextDay = new Date(startOfDay);
      startOfNextDay.setDate(startOfNextDay.getDate() + 1);

      const { data: shots, error: shotsError } = await supabase
        .from('shots')
        .select('instance_id')
        .in('instance_id', instanceIds)
        .gte('shot_date', startOfDay.toISOString())
        .lt('shot_date', startOfNextDay.toISOString());

      if (shotsError) {
        throw shotsError;
      }

      const shotsByPlayer = new Map<number, number>();
      (shots || []).forEach((shot) => {
        const playerId = instanceToPlayer.get(shot.instance_id);
        if (!playerId) return;
        shotsByPlayer.set(playerId, (shotsByPlayer.get(playerId) || 0) + 1);
      });

      const nextWaiverByPlayer: Record<number, boolean> = {};
      shotsByPlayer.forEach((count, playerId) => {
        nextWaiverByPlayer[playerId] = count >= 4;
      });

      setWaiverByPlayerId(nextWaiverByPlayer);
    } catch (error) {
      console.error('Error fetching waiver status:', error);
    }
  }, []);

  useEffect(() => {
    fetchWaiverStatus();

    const shotsChannel = supabase
      .channel('waiver-status-shot-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'shots' }, fetchWaiverStatus)
      .subscribe();

    const instanceChannel = supabase
      .channel('waiver-status-instance-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'player_instance' }, fetchWaiverStatus)
      .subscribe();

    return () => {
      supabase.removeChannel(shotsChannel);
      supabase.removeChannel(instanceChannel);
    };
  }, [fetchWaiverStatus]);

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

  const handleOpenAddPlayerModal = () => {
    setIsAddPlayerModalOpen(true);
  };

  const handleCloseAddPlayerModal = () => {
    setIsAddPlayerModalOpen(false);
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
          <h2>{userView === 'Shot History' ? 'Shot History' : `${seasonName} Standings`}</h2>
          <div className={styles.secondaryScreenOptions}>
            <div className={styles.secondaryButtons}>
              <button className={styles.button} onClick={handleOpenSidebar}>
                Settings
              </button>
              <button className={styles.button} onClick={handleOpenAddPlayerModal}>
                Add Player
              </button>
            </div>

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

          {userView === 'Shot History' ? (
            <AdminShotHistory />
          ) : userView === 'FreeAgent' ? (
            <div className={styles.players}>
              <div className={styles.column}>
                <div className={styles.header}>Free Agents</div>
                {freeAgents.length === 0 ? (
                  <div className={styles.emptyState}>No free agents available.</div>
                ) : (
                  freeAgents.map((player) => (
                    <div
                      key={player.player_id}
                      className={styles.box}
                      onClick={() => handleOpenModal(player.player_id, player.name)}
                      style={{ color: player.tier_color }}
                    >
                      <span className={styles.playerName}>{player.name}</span>
                      {waiverByPlayerId[player.player_id] && (
                        <span className={styles.waiverBadge} aria-label="Waiver shot" title="Waiver shot">
                          W
                        </span>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          ) : (
            <div className={styles.players}>
              {tiers
                .filter((tier) => tier.players.some((player) => !player.is_hidden))
                .map((tier) => (
                  <div key={tier.tier_name} className={styles.column}>
                    <div className={styles.header}>{tier.tier_name}</div>
                    {tier.players
                      .filter((player) => !player.is_hidden)
                      .map((player) => (
                        <div
                          key={player.player_id}
                          className={styles.box}
                          onClick={() => handleOpenModal(player.player_id, player.name)}
                          style={{ color: tier.color }}
                        >
                          <span className={styles.playerName}>{player.name}</span>
                          {waiverByPlayerId[player.player_id] && (
                            <span className={styles.waiverBadge} aria-label="Waiver shot" title="Waiver shot">
                              W
                            </span>
                          )}
                        </div>
                      ))}
                  </div>
                ))}
            </div>
          )}
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
        {isAddPlayerModalOpen && (
          <div className={styles.addPlayerOverlay} role="dialog" aria-modal="true" aria-label="Add player">
            <div className={styles.addPlayerModal}>
              <button
                className={styles.modalCloseButton}
                onClick={handleCloseAddPlayerModal}
                aria-label="Close add player"
              >
                ×
              </button>
              <AddPlayers isOpen={isAddPlayerModalOpen} />
            </div>
          </div>
        )}
        <NextSeasonModal
          isOpen={isNextSeasonModalOpen}
          onClose={handleCloseNextSeasonModal}
          onStartSeason={handleStartSeason}
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
