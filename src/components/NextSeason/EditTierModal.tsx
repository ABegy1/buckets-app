'use client'; // Required for client-side rendering in Next.js App Router

import React, { useEffect, useState } from 'react';
import styles from './NextSeason.module.css'; // Import CSS module for styling
import { supabase } from '@/supabaseClient'; // Supabase client for database interactions

/**
 * Props interface for the EditTierModal component
 */
interface EditTierModalProps {
  isOpen: boolean; // Determines whether the modal is visible
  onClose: () => void; // Callback function to close the modal
  tier: any; // The tier object to edit
  onUpdate: (tier: any) => void; // Callback function for updating the tier
}

/**
 * EditTierModal Component
 * 
 * A modal for editing tier details, including the tier name and color.
 * The component allows updates to the tier's information and reflects those changes
 * in the database.
 */
const EditTierModal: React.FC<EditTierModalProps> = ({
  isOpen, // Controls modal visibility
  onClose, // Handles modal closure
  tier, // The tier being edited
  onUpdate, // Callback for saving updates to the parent component
}) => {
  // State variables to track tier details
  const [tierName, setTierName] = useState<string>(tier?.tier_name || ''); // Tier name
  const [color, setColor] = useState<string>(tier?.color || '#000000'); // Tier color

  /**
   * Effect: Initialize tier details when the `tier` prop changes.
   */
  useEffect(() => {
    if (tier) {
      setTierName(tier.tier_name); // Set the tier name from the prop
      setColor(tier.color); // Set the tier color from the prop
    }
  }, [tier]);

  /**
   * Updates the tier's details in the database and triggers the `onUpdate` callback.
   */
  const handleUpdateTier = async () => {
    // Update the tier details in the Supabase database
    const { error } = await supabase
      .from('tiers')
      .update({ tier_name: tierName, color }) // Update tier name and color
      .eq('tier_id', tier.tier_id); // Match the tier by its ID

    if (error) {
      console.error('Error updating tier:', error); // Log any errors
    } else {
      // Trigger the `onUpdate` callback with the updated tier data
      onUpdate({ ...tier, tier_name: tierName, color });
      onClose(); // Close the modal after saving
    }
  };

  // Render nothing if the modal is not open
  if (!isOpen) return null;

  return (
    <div className={styles.modalBackdrop} aria-modal="true" role="dialog" tabIndex={-1}>
      <div className={styles.modal}>
        <div className={styles.modalContent}>
          <h2>Edit Tier</h2>

          {/* Input for editing the tier name */}
          <label htmlFor="tierName">Tier Name</label>
          <input
            id="tierName"
            type="text"
            value={tierName} // Controlled input for the tier name
            onChange={(e) => setTierName(e.target.value)} // Update state on input change
            placeholder="Enter Tier Name" // Placeholder text for the input
            aria-label="Tier Name" // Accessibility label
          />

          {/* Input for selecting the tier color */}
          <label htmlFor="tierColor">Select Tier Color</label>
          <input
            id="tierColor"
            type="color"
            value={color} // Controlled input for the tier color
            onChange={(e) => setColor(e.target.value)} // Update state on input change
            aria-label="Tier Color" // Accessibility label
          />

          {/* Action buttons for saving or canceling */}
          <div className={styles.modalActions}>
            <button onClick={handleUpdateTier} className={styles.saveButton}>
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

export default EditTierModal;
