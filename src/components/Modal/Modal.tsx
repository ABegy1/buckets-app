import React, { useEffect, useState } from 'react';
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
  const [tierId, setTierId] = useState<number | null>(null);
  const [shotCount, setShotCount] = useState<number | null>(null); // Updated shotCount to null initially

  const resetForm = () => {
    setPoints(null);
    setIsMoneyball(false);
    setIsDouble(false);
    setShotCount(null);  // Reset shotCount when modal is closed
    setPlayerInstanceId(null);
    setTierId(null);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  useEffect(() => {
    if (!isOpen) return;

    const fetchPlayerInstanceAndTier = async () => {
      try {
        const { data: playerInstance, error: instanceError } = await supabase
          .from('player_instance')
          .select('player_instance_id, season_id')
          .eq('player_id', playerId)
          .order('season_id', { ascending: false })
          .limit(1);

        if (instanceError || !playerInstance || playerInstance.length === 0) {
          console.error('Error fetching player instance:', instanceError);
          return;
        }

        const playerInstanceId = playerInstance[0].player_instance_id;
        setPlayerInstanceId(playerInstanceId);

        const { data: player, error: playerError } = await supabase
          .from('players')
          .select('tier_id')
          .eq('player_id', playerId)
          .single();

        if (playerError || !player) {
          console.error('Error fetching player information:', playerError);
          return;
        }

        const tierId = player.tier_id;
        setTierId(tierId);

        const { data: shots, error: shotsError } = await supabase
          .from('shots')
          .select('*')
          .eq('instance_id', playerInstanceId);

        if (shotsError) {
          console.error('Error fetching shot count:', shotsError);
        } else {
          setShotCount(shots.length); // Update shot count once data is fetched
        }
      } catch (error) {
        console.error('Unexpected error:', error);
      }
    };

    fetchPlayerInstanceAndTier();
  }, [isOpen, playerId]);

  const handleSubmit = async () => {
    if (points === null || playerInstanceId === null || tierId === null) return;
  
    let finalPoints = points;
    if (isMoneyball) finalPoints *= 2;
    if (isDouble) finalPoints *= 2;
  
    try {
      const { error: shotError } = await supabase.from('shots').insert({
        instance_id: playerInstanceId,
        shot_date: new Date().toISOString(),
        result: finalPoints,
        tier_id: tierId,
      });
  
      if (shotError) {
        console.error('Error recording shot:', shotError);
        return;
      }
  
      // Fetch all the shots again
      const { data: shotsData, error: shotsError } = await supabase
        .from('shots')
        .select('result')
        .eq('instance_id', playerInstanceId);
  
      if (shotsError || !shotsData) {
        console.error('Error fetching shots for score calculation:', shotsError);
        return;
      }
  
      // Add up all shots and the manually edited score (if any)
      const newScore = shotsData.reduce(
        (sum: number, shot: { result: number }) => sum + shot.result,
        points || 0 // Include manually edited points in the score
      );
  
      // Update player instance score
      const { error: updateScoreError } = await supabase
        .from('player_instance')
        .update({ score: newScore })
        .eq('player_instance_id', playerInstanceId);
  
      if (updateScoreError) {
        console.error('Error updating player score:', updateScoreError);
        return;
      }
  
      // Fetch current shots_left
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
  
      const { error: updateError } = await supabase
        .from('player_instance')
        .update({ shots_left: newShotsLeft })
        .eq('player_instance_id', playerInstanceId);
  
      if (updateError) {
        console.error('Error updating shots left:', updateError);
      } else {
        console.log('Shots left updated successfully');
        handleClose();
      }
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
          <div>
            {/* Conditionally render shotCount or a loading indicator */}
            <p>Shot#: <span>{shotCount !== null ? shotCount + 1 : 'Loading...'}</span></p>
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
