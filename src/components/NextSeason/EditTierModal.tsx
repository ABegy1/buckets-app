'use client';
import React, { useEffect, useState } from 'react';
import styles from './NextSeason.module.css';
import { supabase } from '@/supabaseClient';

interface EditTierModalProps {
  isOpen: boolean;
  onClose: () => void;
  tier: any;
  onUpdate: (tier: any) => void;
}

const EditTierModal: React.FC<EditTierModalProps> = ({ isOpen, onClose, tier, onUpdate }) => {
  const [tierName, setTierName] = useState<string>(tier?.tier_name || '');
  const [color, setColor] = useState<string>(tier?.color || '#000000');

  useEffect(() => {
    if (tier) {
      setTierName(tier.tier_name);
      setColor(tier.color);
    }
  }, [tier]);

  const handleUpdateTier = async () => {
    const { error } = await supabase
      .from('tiers')
      .update({ tier_name: tierName, color })
      .eq('tier_id', tier.tier_id);

    if (error) {
      console.error('Error updating tier:', error);
    } else {
      onUpdate({ ...tier, tier_name: tierName, color });
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className={styles.modalBackdrop} aria-modal="true" role="dialog" tabIndex={-1}>
      <div className={styles.modal}>
        <div className={styles.modalContent}>
          <h2>Edit Tier</h2>
          <label htmlFor="tierName">Tier Name</label>
          <input
            id="tierName"
            type="text"
            value={tierName}
            onChange={(e) => setTierName(e.target.value)}
            placeholder="Enter Tier Name"
            aria-label="Tier Name"
          />
          <label htmlFor="tierColor">Select Tier Color</label>
          <input
            id="tierColor"
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            aria-label="Tier Color"
          />
          <div className={styles.modalActions}>
            <button onClick={handleUpdateTier} className={styles.saveButton}>Save</button>
            <button onClick={onClose} className={styles.cancelButton}>Cancel</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditTierModal;
