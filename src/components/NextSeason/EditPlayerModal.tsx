'use client';
import React, { useEffect, useState } from 'react';
import styles from './NextSeason.module.css';
import { supabase } from '@/supabaseClient';
import EditTeamModal from './EditTeamModal';
import EditTierModal from './EditTierModal';



interface EditPlayerModalProps {
  isOpen: boolean;
  onClose: () => void;
  player: any;
  tiers: any[];
  teams: any[];
  onUpdate: (player: any) => void;
}

const EditPlayerModal: React.FC<EditPlayerModalProps> = ({ isOpen, onClose, player, tiers, teams, onUpdate }) => {
  const [playerName, setPlayerName] = useState<string>(player?.name || '');
  const [tierId, setTierId] = useState<number>(player?.tier_id || tiers[0]?.tier_id);
  const [teamId, setTeamId] = useState<number>(player?.team_id || teams[0]?.team_id);
  const [isFreeAgent, setIsFreeAgent] = useState<boolean>(player?.is_free_agent || false);

  
  useEffect(() => {
    if (player) {
      setPlayerName(player.name);
      setTierId(player.tier_id);
      setTeamId(player.team_id);
      setIsFreeAgent(player.is_free_agent); 
    }
  }, [player, teams]);

  const handleUpdatePlayer = async () => {
    const { error: playerError } = await supabase
      .from('players')
      .update({ 
        name: playerName, 
        tier_id: tierId, 
        team_id: isFreeAgent ? null : teamId, // Set team_id to null if free agent
        is_free_agent: isFreeAgent // Update free agent status
      })
      .eq('player_id', player.player_id);
  
    if (playerError) {
      console.error('Error updating player:', playerError);
    }
  
    onUpdate({ 
      ...player, 
      name: playerName, 
      tier_id: tierId, 
      team_id: isFreeAgent ? null : teamId, 
      is_free_agent: isFreeAgent 
    });
    onClose();
  };
  
  if (!isOpen) return null;

  return (
    <div className={styles.modalBackdrop}>
      <div className={styles.modal}>
        <div className={styles.modalContent}>
          <h2>Edit Player</h2>
          <input
            type="text"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            placeholder="Player Name"
          />
          <select value={tierId} onChange={(e) => setTierId(Number(e.target.value))}>
            {tiers.map((tier) => (
              <option key={tier.tier_id} value={tier.tier_id}>
                {tier.tier_name}
              </option>
            ))}
          </select>

          {/* Team selection dropdown */}
          <select value={teamId} onChange={(e) => setTeamId(Number(e.target.value))}>
            {teams.map((team) => (
              <option key={team.team_id} value={team.team_id}>
                {team.team_name}
              </option>
            ))}
          </select>

          <div className={styles.modalActions}>
            <button onClick={handleUpdatePlayer}>Save</button>
            <button onClick={onClose}>Cancel</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditPlayerModal;