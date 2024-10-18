import React, { useEffect, useState, useCallback } from 'react';
import './modal.css';
import { supabase } from '@/supabaseClient';

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
  const [totalShotsTaken, setTotalShotsTaken] = useState<number>(0); // Track total shots taken

  const resetForm = () => {
    setPoints(null);
    setIsMoneyball(false);
    setIsDouble(false);
    setPlayerInstanceId(null);
    setTierId(null);
    setShotsLeft(null);
    setTotalShotsTaken(0); // Reset total shots taken
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  // Fetch player instance and tier information
  const fetchPlayerInstanceAndTier = useCallback(async () => {
    try {
      // Fetch player instance
      const { data: playerInstance, error: instanceError } = await supabase
        .from('player_instance')
        .select('player_instance_id, score, shots_left, total_shots, player_id')
        .eq('player_id', playerId)
        .order('season_id', { ascending: false })
        .limit(1);

      if (instanceError || !playerInstance || playerInstance.length === 0) {
        console.error('Error fetching player instance:', instanceError);
        return;
      }

      const instanceId = playerInstance[0].player_instance_id;
      setPlayerInstanceId(instanceId);
      setCurrentScore(playerInstance[0].score); // Set the current score
      setShotsLeft(playerInstance[0].shots_left); // Set shots left
      setTotalShotsTaken(playerInstance[0].total_shots); // Set total shots taken

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

  const handleSubmit = async () => {
    if (points === null || playerInstanceId === null || tierId === null) return;

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
      const newTotalShots = totalShotsTaken + 1;

      const { error: updateScoreError } = await supabase
        .from('player_instance')
        .update({ 
          score: newScore, 
          shots_left: newShotsLeft,
          total_shots: newTotalShots 
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

  const currentShotNumber = totalShotsTaken + 1;
  
  const isMoneyballShot = currentShotNumber % 10 === 0;

  console.log(currentShotNumber, isMoneyballShot);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="close-button" onClick={handleClose}>X</button>
    
        <h2>{name}</h2>
        <div className="modal-body">
          <div>
            <p className={isMoneyballShot ? 'highlight-moneyball' : ''}>
              Shot Number: <span>{currentShotNumber}</span>
            </p>
            <p>Shots Left: <span>{shotsLeft !== null ? shotsLeft : ''}</span></p>
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
            <button
              className={isMoneyball ? 'selected' : ''}
              onClick={() => setIsMoneyball(!isMoneyball)}
            >
              Moneyball
            </button>
            <button
              className={isDouble ? 'selected' : ''}
              onClick={() => setIsDouble(!isDouble)}
            >
              Double
            </button>
          </div>
          <button onClick={handleSubmit}>Submit</button>
        </div>
      </div>
    </div>
  );
};

export default Modal;
