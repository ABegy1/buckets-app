import React, { useEffect, useState, useCallback } from 'react';
import './modal.css';
import { supabase } from '@/supabaseClient';
import { Howl } from 'howler';


interface ModalProps {
  name: string;
  isOpen: boolean;
  onClose: () => void;
  playerId: number;  // Pass player ID to the modal
}

const Modal: React.FC<ModalProps> = ({ name, isOpen, onClose, playerId }) => {
  const [points, setPoints] = useState<number | null>(null);
  const [isMoneyball, setIsMoneyball] = useState<boolean>(false);
  const [isDouble, setIsDouble] = useState<boolean>(false);
  const [playerInstanceId, setPlayerInstanceId] = useState<number | null>(null);
  const [currentScore, setCurrentScore] = useState<number>(0);
  const [tierId, setTierId] = useState<number | null>(null);
  const [shotsLeft, setShotsLeft] = useState<number | null>(null); // Track shots left
  const sound = new Howl({ src: ['/sounds/shot.mp3'] });
  const resetForm = () => {
    setPoints(null);
    setIsMoneyball(false);
    setIsDouble(false);
    setPlayerInstanceId(null);
    setTierId(null);
    setShotsLeft(null); // Reset shots left
  };
  const playNotification = () => {
    sound.play();
  };
  const handleClose = () => {
    resetForm();
    onClose();
  };

  // Fetch player instance and tier information
  const fetchPlayerInstanceAndTier = useCallback(async () => {
    try {
      // Step 1: Fetch the current season
      const { data: currentSeason, error: seasonError } = await supabase
        .from('seasons')
        .select('season_id')
        .is('end_date', null)
        .single();
  
      if (seasonError || !currentSeason) {
        console.error('Error fetching current season:', seasonError);
        return;
      }
  
      // Step 2: Fetch player instance for the current season
      const { data: playerInstance, error: instanceError } = await supabase
        .from('player_instance')
        .select('player_instance_id, score, shots_left, player_id')
        .eq('player_id', playerId)
        .eq('season_id', currentSeason.season_id) // Ensure it's the current season
        .single();
  
      if (instanceError || !playerInstance) {
        console.error('Error fetching player instance:', instanceError);
        return;
      }
  
      const instanceId = playerInstance.player_instance_id;
      setPlayerInstanceId(instanceId);
      setCurrentScore(playerInstance.score); // Set the current score
      setShotsLeft(playerInstance.shots_left); // Set shots left
  
      // Fetch player's tier_id
      const { data: player, error: playerError } = await supabase
        .from('players')
        .select('tier_id')
        .eq('player_id', playerId)
        .single();
  
      if (playerError || !player) {
        console.error('Error fetching player information:', playerError);
        return;
      }
  
      setTierId(player.tier_id); // Set tier_id
    } catch (error) {
      console.error('Unexpected error:', error);
    }
  }, [playerId]);

  useEffect(() => {
    if (!isOpen) return;

    // Fetch initial data
    fetchPlayerInstanceAndTier();

    // Subscribe to real-time changes in player_instance
    const playerInstanceChannel = supabase
      .channel('player-instance-db-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'player_instance' }, fetchPlayerInstanceAndTier)
      .subscribe();

    return () => {
      // Cleanup subscriptions
      supabase.removeChannel(playerInstanceChannel);
    };
  }, [isOpen, fetchPlayerInstanceAndTier]);

  useEffect(() => {
    // Automatically toggle Moneyball if shotsLeft is 1, 11, 21, 31, or 41
    const isMoneyballShot = shotsLeft === 1 || shotsLeft === 11 || shotsLeft === 21 || shotsLeft === 31 || shotsLeft === 41;
    setIsMoneyball(isMoneyballShot);
  }, [shotsLeft]);  // Trigger this effect whenever shotsLeft changes

  const handleSubmit = async () => {
    if (points === null || playerInstanceId === null || tierId === null) return;
  
    // Play notification only if the points are 1 or 2 and the Moneyball is selected
    if ((points === 1 || points === 2) && isMoneyball) {
      playNotification();
    }
  
    let finalPoints = points;
    if (isMoneyball) finalPoints *= 2;
    if (isDouble) finalPoints *= 2;
  
    try {
      // Insert new shot with tier_id
      const { error: shotError } = await supabase.from('shots').insert({
        instance_id: playerInstanceId,
        shot_date: new Date().toISOString(),
        result: finalPoints,
        tier_id: tierId, // Include tier_id in shot record
      });
  
      if (shotError) {
        console.error('Error recording shot:', shotError);
        return;
      }
  
      // Update player instance with the new score and shots left
      const newScore = currentScore + finalPoints;
      const newShotsLeft = shotsLeft !== null ? shotsLeft - 1 : 0;
  
      const { error: updateScoreError } = await supabase
        .from('player_instance')
        .update({ 
          score: newScore, 
          shots_left: newShotsLeft 
        })
        .eq('player_instance_id', playerInstanceId);
  
      if (updateScoreError) {
        console.error('Error updating player score and shots_left:', updateScoreError);
        return;
      }
  
      console.log('Score and shots_left updated successfully');
      handleClose();
    } catch (error) {
      console.error('Unexpected error:', error);
    }
  };
  

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={handleClose}>
      {/* Add a conditional class to apply a red border if it's a moneyball shot */}
      <div className={`modal-content ${isMoneyball ? 'highlight-modal-border' : ''}`} onClick={(e) => e.stopPropagation()}>
        <button className="close-button" onClick={handleClose}>X</button>
    
        <h2>{name}</h2>
         {/* Moneyball Indicator */}
    {isMoneyball && (
      <div className="moneyball-indicator">
        <span>This is a Moneyball Shot!</span>
      </div>
    )}
        <div className="modal-body">
          <div>
            {/* Display shots left and highlight specific shots (1, 11, 21, 31, 41) */}
            <p className={isMoneyball ? 'highlight-moneyball' : ''}>
              Shots Left: <span>{shotsLeft !== null ? shotsLeft : ''}</span>
            </p>
          </div>
          <div className="points">
            <button
              className={points === 0 ? 'selected' : ''}
              onClick={() => setPoints(0)}
            >
              0
            </button>
            <button
              className={points === 1 ? 'selected' : ''}
              onClick={() => setPoints(1)}
            >
              1
            </button>
            <button
              className={points === 2 ? 'selected' : ''}
              onClick={() => setPoints(2)}
            >
              2
            </button>
          </div>
          <div className="actions">
  <div className="button-row">

    <button
      className={isDouble ? 'selected' : ''}
      onClick={() => setIsDouble(!isDouble)}
    >
      Double
    </button>
  </div>
  
</div>
          <button onClick={handleSubmit}>Submit</button>
        </div>
      </div>
    </div>
  );
};

export default Modal;
