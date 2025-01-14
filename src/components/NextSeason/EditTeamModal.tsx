'use client'; // Required for client-side rendering in Next.js App Router

import React, { useEffect, useState } from 'react';
import styles from './NextSeason.module.css'; // Import CSS module for styling
import { supabase } from '@/supabaseClient'; // Supabase client for database interactions

/**
 * Props interface for the EditTeamModal component
 */
interface EditTeamModalProps {
  isOpen: boolean; // Determines whether the modal is visible
  onClose: () => void; // Callback function to close the modal
  team: any; // The team object to edit
  onUpdate: (team: any) => void; // Callback function for updating the team
}

/**
 * EditTeamModal Component
 * 
 * A modal for editing team details, including the team name. The component allows
 * updates to the team's information and reflects those changes in the database.
 */
const EditTeamModal: React.FC<EditTeamModalProps> = ({
  isOpen, // Controls modal visibility
  onClose, // Handles modal closure
  team, // The team being edited
  onUpdate, // Callback for saving updates to the parent component
}) => {
  // State variable to track the team's name
  const [teamName, setTeamName] = useState<string>(team?.team_name || '');

  /**
   * Effect: Initialize team name when the `team` prop changes.
   */
  useEffect(() => {
    if (team) {
      setTeamName(team.team_name); // Set the team name from the prop
    }
  }, [team]);

  /**
   * Updates the team's name in the database and triggers the `onUpdate` callback.
   */
  const handleUpdateTeam = async () => {
    // Update the team name in the Supabase database
    const { error } = await supabase
      .from('teams')
      .update({ team_name: teamName }) // Update only the team name
      .eq('team_id', team.team_id); // Match the team by its ID

    if (error) {
      console.error('Error updating team:', error); // Log any errors
    } else {
      // Trigger the `onUpdate` callback with the updated team data
      onUpdate({ ...team, team_name: teamName });
      onClose(); // Close the modal after saving
    }
  };

  // Render nothing if the modal is not open
  if (!isOpen) return null;

  return (
    <div className={styles.modalBackdrop} aria-modal="true" role="dialog" tabIndex={-1}>
      <div className={styles.modal}>
        <div className={styles.modalContent}>
          <h2>Edit Team</h2>

          {/* Input for editing the team name */}
          <label htmlFor="teamName">Team Name</label>
          <input
            id="teamName"
            type="text"
            value={teamName} // Controlled input for the team name
            onChange={(e) => setTeamName(e.target.value)} // Update state on input change
            placeholder="Enter Team Name" // Placeholder text for the input
            aria-label="Team Name" // Accessibility label
          />

          {/* Action buttons for saving or canceling */}
          <div className={styles.modalActions}>
            <button onClick={handleUpdateTeam} className={styles.saveButton}>
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

export default EditTeamModal;
