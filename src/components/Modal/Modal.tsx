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
  const [shotCount, setShotCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true); // Loading state

  const resetForm = () => {
    setPoints(null);
    setIsMoneyball(false);
    setIsDouble(false);
    setShotCount(0);
    setPlayerInstanceId(null);
    setTierId(null);
    setLoading(true); // Reset loading state when modal is closed
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  useEffect(() => {
    if (!isOpen) return;

    const fetchPlayerInstanceAndTier = async () => {
      setLoading(true);  // Start loading when fetching data
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
          setShotCount(shots.length);
        }

        setLoading(false);  // Data fetched successfully
      } catch (error) {
        console.error('Unexpected error:', error);
        setLoading(false);  // Ensure loading is stopped on error
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
        result: finalPoints,  // Note: result should be a number, not a string
        tier_id: tierId,
      });

      if (shotError) {
        console.error('Error recording shot:', shotError);
        return;
      }

      const { data: shotsData, error: shotsError } = await supabase
        .from('shots')
        .select('result')
        .eq('instance_id', playerInstanceId);

      if (shotsError || !shotsData) {
        console.error('Error fetching shots for score calculation:', shotsError);
        return;
      }

      const newScore = shotsData.reduce((sum: number, shot: { result: number }) => sum + shot.result, 0);

      const { error: updateScoreError } = await supabase
        .from('player_instance')
        .update({ score: newScore })
        .eq('player_instance_id', playerInstanceId);

      if (updateScoreError) {
        console.error('Error updating player score:', updateScoreError);
        return;
      }

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

  // Render loading indicator if still fetching data
  if (loading) {
    return (
      <div className="modal-overlay" onClick={handleClose}>
        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
          <button className="close-button" onClick={handleClose}>X</button>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  // Render modal content after loading completes
  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="close-button" onClick={handleClose}>X</button>

        <h2>{name}</h2>
        <div className="modal-body">
          <div>
            <p>Shot#: <span>{shotCount + 1}</span></p>
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
