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
  const [currentScore, setCurrentScore] = useState<number>(0);  // Keep track of current score
  const [tierId, setTierId] = useState<number | null>(null);  // Track tier_id

  const resetForm = () => {
    setPoints(null);
    setIsMoneyball(false);
    setIsDouble(false);
    setPlayerInstanceId(null);
    setTierId(null);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  // Fetch player instance and tier information
  const fetchPlayerInstanceAndTier = useCallback(async () => {
    try {
      // Get the player's instance and tier_id from the players table
      const { data: playerInstance, error: instanceError } = await supabase
        .from('player_instance')
        .select('player_instance_id, score, player_id')
        .eq('player_id', playerId)
        .order('season_id', { ascending: false })
        .limit(1);

      if (instanceError || !playerInstance || playerInstance.length === 0) {
        console.error('Error fetching player instance:', instanceError);
        return;
      }

      const instanceId = playerInstance[0].player_instance_id;
      setPlayerInstanceId(instanceId);
      setCurrentScore(playerInstance[0].score);  // Set the current score for this instance

      // Fetch tier information from the players table using playerId
      const { data: player, error: playerError } = await supabase
        .from('players')
        .select('tier_id')
        .eq('player_id', playerId)
        .single();

      if (playerError || !player) {
        console.error('Error fetching player information:', playerError);
        return;
      }

      setTierId(player.tier_id);  // Set the tier_id for this player
    } catch (error) {
      console.error('Unexpected error:', error);
    }
  }, [playerId]);

  useEffect(() => {
    if (!isOpen) return;

    // Fetch initial data
    fetchPlayerInstanceAndTier();

    // Subscribe to real-time changes in player_instance and shots
    const playerInstanceChannel = supabase
      .channel('player-instance-db-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'player_instance' }, fetchPlayerInstanceAndTier)
      .subscribe();

    const shotChannel = supabase
      .channel('shots-db-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'shots' }, fetchPlayerInstanceAndTier)
      .subscribe();

    return () => {
      // Cleanup subscriptions
      supabase.removeChannel(playerInstanceChannel);
      supabase.removeChannel(shotChannel);
    };
  }, [isOpen, fetchPlayerInstanceAndTier]);

  const handleSubmit = async () => {
    if (points === null || playerInstanceId === null || tierId === null) return;

    let finalPoints = points;
    if (isMoneyball) finalPoints *= 2;
    if (isDouble) finalPoints *= 2;

    try {
      // Insert the new shot, now including tier_id
      const { error: shotError } = await supabase.from('shots').insert({
        instance_id: playerInstanceId,
        shot_date: new Date().toISOString(),
        result: finalPoints,
        tier_id: tierId,  // Include the tier_id here
      });

      if (shotError) {
        console.error('Error recording shot:', shotError);
        return;
      }

      // Fetch the current shots_left value
      const { data: playerInstance, error: fetchError } = await supabase
        .from('player_instance')
        .select('shots_left')
        .eq('player_instance_id', playerInstanceId)
        .single();

      if (fetchError || !playerInstance) {
        console.error('Error fetching current shots_left:', fetchError);
        return;
      }

      const newShotsLeft = playerInstance.shots_left - 1;

      // Update the player's score by adding the shot's result to the current score
      const newScore = currentScore + finalPoints;

      // Update player_instance with the new score and shots_left
      const { error: updateScoreError } = await supabase
        .from('player_instance')
        .update({ 
          score: newScore, 
          shots_left: newShotsLeft  // Decrement shots_left by 1
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
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="close-button" onClick={handleClose}>X</button>

        <h2>{name}</h2>
        <div className="modal-body">
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
