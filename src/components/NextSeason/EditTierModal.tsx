'use client';
import React, { useEffect, useState } from 'react';
import styles from './NextSeason.module.css';
import { supabase } from '@/supabaseClient';

// EditTierModal Component
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
      <div className={styles.modalBackdrop}>
        <div className={styles.modal}>
          <div className={styles.modalContent}>
            <h2>Edit Tier</h2>
            <input
              type="text"
              value={tierName}
              onChange={(e) => setTierName(e.target.value)}
              placeholder="Tier Name"
            />
            <input
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
            />
            <div className={styles.modalActions}>
              <button onClick={handleUpdateTier}>Save</button>
              <button onClick={onClose}>Cancel</button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  export default EditTierModal;