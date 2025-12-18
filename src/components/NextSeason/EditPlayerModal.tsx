'use client'; // Required for client-side rendering in Next.js App Router
import React, { useEffect, useState } from 'react';
import styles from './NextSeason.module.css'; // Import CSS module for styling

/**
 * Props interface for the EditPlayerModal component
 */
interface EditPlayerModalProps {
  isOpen: boolean; // Determines whether the modal is visible
  onClose: () => void; // Callback function to close the modal
  player: any; // The player object to edit
  tiers: any[]; // Array of available tiers
  teams: any[]; // Array of available teams
  onUpdate: (player: any) => void; // Callback function for updating the player
}

/**
 * EditPlayerModal Component
 * 
 * A modal for editing player details, including their name, tier, team, and statuses like
 * "Free Agent" or "Hidden." The component allows updates to the player's information and
 * reflects those changes in the database.
 */
const EditPlayerModal: React.FC<EditPlayerModalProps> = ({
  isOpen, // Controls modal visibility
  onClose, // Handles modal closure
  player, // The player being edited
  tiers, // Available tiers for selection
  teams, // Available teams for selection
  onUpdate, // Callback for saving updates to the parent component
}) => {
  // State variables for tracking player details
  const [playerName, setPlayerName] = useState<string>(player?.name || ''); // Player's name
  const [tierId, setTierId] = useState<string | number>(player?.tier_id || tiers[0]?.tier_id); // Player's tier
  const [teamId, setTeamId] = useState<string | number>(player?.team_id || teams[0]?.team_id); // Player's team
  const [isFreeAgent, setIsFreeAgent] = useState<boolean>(player?.is_free_agent || false); // Free agent status
  const [isHidden, setIsHidden] = useState<boolean>(player?.is_hidden || false); // Hidden status

  /**
   * Effect: Initialize player details when the player prop changes.
   */
  useEffect(() => {
    if (player) {
      setPlayerName(player.name);
      setTierId(player.tier_id);
      setTeamId(player.team_id);
      setIsFreeAgent(player.is_free_agent);
      setIsHidden(player.is_hidden);
    }
  }, [player, teams]);

  /**
   * Updates the player's information in the database and triggers the onUpdate callback.
   */
  const handleUpdatePlayer = async () => {
    // Trigger the onUpdate callback with the updated player information
    onUpdate({
      ...player,
      name: playerName,
      tier_id: tierId,
      team_id: isFreeAgent ? null : teamId,
      is_free_agent: isFreeAgent,
      is_hidden: isHidden,
    });

    onClose(); // Close the modal after saving
  };

  // Render nothing if the modal is not open
  if (!isOpen) return null;

  return (
    <div className={styles.modalBackdrop} aria-modal="true" role="dialog" tabIndex={-1}>
      <div className={styles.modal}>
        <div className={styles.modalContent}>
          <h2>Edit Player</h2>

          {/* Player Name Input */}
          <label htmlFor="playerName">Player Name</label>
          <input
            id="playerName"
            type="text"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            placeholder="Player Name"
            aria-label="Player Name"
          />

          {/* Tier Selection Dropdown */}
          <label htmlFor="tierSelect">Tier</label>
        <select
          id="tierSelect"
          value={tierId}
          onChange={(e) => setTierId(e.target.value)}
          aria-label="Select Tier"
        >
          {tiers.map((tier) => (
            <option key={tier.tier_id} value={tier.tier_id}>
              {tier.tier_name}
              </option>
            ))}
          </select>

          {/* Team Selection Dropdown */}
        <label htmlFor="teamSelect">Team</label>
        <select
          id="teamSelect"
          value={isFreeAgent ? 'free-agent' : teamId || 'free-agent'}
          onChange={(e) => {
            const value = e.target.value;
            if (value === 'free-agent') {
              setIsFreeAgent(true);
            } else {
              setIsFreeAgent(false);
              setTeamId(value);
            }
          }}
          aria-label="Select Team"
          disabled={isFreeAgent} // Disable if the player is a free agent
        >
          <option value="free-agent">Free Agent</option>
          {teams.map((team) => (
            <option key={team.team_id} value={team.team_id}>
              {team.team_name}
            </option>
          ))}
          </select>

          {/* Free Agent Checkbox */}
          <div>
            <label>
              <input
                type="checkbox"
                checked={isFreeAgent}
                onChange={() => {
                  setIsFreeAgent(!isFreeAgent);
                  if (isFreeAgent) {
                    setTeamId(teams[0]?.team_id || '');
                  }
                }}
              />
              Free Agent
            </label>
          </div>

          {/* Hidden Player Checkbox */}
          <div>
            <label>
              <input
                type="checkbox"
                checked={isHidden}
                onChange={() => setIsHidden(!isHidden)}
              />
              Hide Player
            </label>
          </div>

          {/* Action Buttons */}
          <div className={styles.modalActions}>
            <button onClick={handleUpdatePlayer} className={styles.saveButton}>
              Save
            </button>
            <button onClick={onClose} className={styles.cancelButton}>
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditPlayerModal;
