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

  const resetForm = () => {
    setPoints(null);
    setIsMoneyball(false);
    setIsDouble(false);
    setPlayerInstanceId(null);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  // useCallback ensures that the function identity doesn't change and fixes the useEffect dependency warning
  const fetchPlayerInstance = useCallback(async () => {
    try {
      // Get the player's instance
      const { data: playerInstance, error: instanceError } = await supabase
        .from('player_instance')
        .select('player_instance_id, score')
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
    } catch (error) {
      console.error('Unexpected error:', error);
    }
  }, [playerId]);

  useEffect(() => {
    if (!isOpen) return;

    // Fetch initial data
    fetchPlayerInstance();

    // Subscribe to real-time changes in player_instance and shots
    const playerInstanceChannel = supabase
      .channel('player-instance-db-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'player_instance' }, fetchPlayerInstance)
      .subscribe();

    const shotChannel = supabase
      .channel('shots-db-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'shots' }, fetchPlayerInstance)
      .subscribe();

    return () => {
      // Cleanup subscriptions
      supabase.removeChannel(playerInstanceChannel);
      supabase.removeChannel(shotChannel);
    };
  }, [isOpen, fetchPlayerInstance]);

  const handleSubmit = async () => {
    if (points === null || playerInstanceId === null) return;

    let finalPoints = points;
    if (isMoneyball) finalPoints *= 2;
    if (isDouble) finalPoints *= 2;

    try {
      // Insert the new shot
      const { error: shotError } = await supabase.from('shots').insert({
        instance_id: playerInstanceId,
        shot_date: new Date().toISOString(),
        result: finalPoints,
      });

      if (shotError) {
        console.error('Error recording shot:', shotError);
        return;
      }

      // Update the player's score by adding the shot's result to the current score
      const newScore = currentScore + finalPoints;

      const { error: updateScoreError } = await supabase
        .from('player_instance')
        .update({ score: newScore })
        .eq('player_instance_id', playerInstanceId);

      if (updateScoreError) {
        console.error('Error updating player score:', updateScoreError);
        return;
      }

      console.log('Score updated successfully');
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
