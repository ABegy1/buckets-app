import React, { useEffect, useState, useCallback, useMemo } from 'react';
import './modal.css'; // Import CSS for modal styling
import { supabase } from '@/supabaseClient'; // Supabase client for database interactions
import { Howl } from 'howler'; // Audio library for sound effects

// Props definition for the Modal component
interface ModalProps {
  name: string; // Name of the player
  isOpen: boolean; // Determines whether the modal is visible
  onClose: () => void; // Callback function to close the modal
  playerId: number; // Player ID associated with the modal
}

/**
 * Modal Component
 * 
 * This component serves as an interactive modal for managing player stats, recording shots,
 * and handling specific shot scenarios like Moneyball or Double points.
 */
const Modal: React.FC<ModalProps> = ({ name, isOpen, onClose, playerId }) => {
  // State variables for managing modal interactions and player data
  const [points, setPoints] = useState<number | null>(null); // Points for the shot
  const [isMoneyball, setIsMoneyball] = useState<boolean>(false); // Tracks if the current shot is a Moneyball
  const [isDouble, setIsDouble] = useState<boolean>(false); // Tracks if the shot has double points
  const [playerInstanceId, setPlayerInstanceId] = useState<number | null>(null); // Player instance ID
  const [currentScore, setCurrentScore] = useState<number>(0); // Current score of the player
  const [tierId, setTierId] = useState<number | null>(null); // Tier ID of the player
  const [shotsLeft, setShotsLeft] = useState<number | null>(null); // Remaining shots for the player
  const sound = new Howl({ src: ['/sounds/shot.mp3'] }); // Sound effect for shots
  const shotSound = useMemo(() => new Howl({ src: ['/sounds/onfire.mp3'] }), []);
  const sadsound = useMemo(() => new Howl({ src: ['/sounds/sadtrombone.mp3'] }), []); // Sound effect for sad events
  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));



  /**
   * Resets the form to its initial state when the modal is closed.
   */
  const resetForm = () => {
    setPoints(null);
    setIsMoneyball(false);
    setIsDouble(false);
    setPlayerInstanceId(null);
    setTierId(null);
    setShotsLeft(null);
  };
  const calculateShotsMadeInRow = async (playerInstanceId: number) => {
    try {
      const { data: shots, error: shotsError } = await supabase
        .from('shots')
        .select('result')
        .eq('instance_id', playerInstanceId)
        .order('shot_date', { ascending: true });
  
      if (shotsError || !shots) throw shotsError;
  
      let currentStreak = 0;
  
      for (let i = shots.length - 1; i >= 0; i--) {
        const result = Number(shots[i].result);
        if (result !== 0) {
          currentStreak++;
        } else {
          break;
        }
      }
  
      return currentStreak;
    } catch (error) {
      console.error('Error calculating shots made in a row:', error);
      return 0;
    }
  };
  
  

  const calculateShotsMissedInRow = async (playerInstanceId: number) => {
    try {
      const { data: shots, error: shotsError } = await supabase
        .from('shots')
        .select('result')
        .eq('instance_id', playerInstanceId)
        .order('shot_date', { ascending: true });
  
      if (shotsError || !shots) throw shotsError;
  
      let missStreak = 0;
  
      for (let i = shots.length - 1; i >= 0; i--) {
        const result = Number(shots[i].result);
        if (result === 0) {
          missStreak++;
        } else {
          break;
        }
      }
  
      return missStreak;
    } catch (error) {
      return 0;
    }
  };
  
  /**
   * Plays a notification sound when a shot is successfully recorded.
   */
  const playNotification = () => {
    sound.play();
  };

  /**
   * Handles closing the modal and resetting its state.
   */
  const handleClose = () => {
    resetForm();
    onClose();
  };

  /**
   * Fetches player instance and tier information for the current season.
   */
  const fetchPlayerInstanceAndTier = useCallback(async () => {
    try {
      // Fetch the current season
      const { data: currentSeason, error: seasonError } = await supabase
        .from('seasons')
        .select('season_id')
        .is('end_date', null)
        .single();

      if (seasonError || !currentSeason) {
        console.error('Error fetching current season:', seasonError);
        return;
      }

      // Fetch player instance details
      const { data: playerInstance, error: instanceError } = await supabase
        .from('player_instance')
        .select('player_instance_id, score, shots_left')
        .eq('player_id', playerId)
        .eq('season_id', currentSeason.season_id)
        .single();

      if (instanceError || !playerInstance) {
        console.error('Error fetching player instance:', instanceError);
        return;
      }

      // Update state with player instance data
      setPlayerInstanceId(playerInstance.player_instance_id);
      setCurrentScore(playerInstance.score);
      setShotsLeft(playerInstance.shots_left);

      // Fetch the player's tier ID
      const { data: player, error: playerError } = await supabase
        .from('players')
        .select('tier_id')
        .eq('player_id', playerId)
        .single();

      if (playerError || !player) {
        console.error('Error fetching player information:', playerError);
        return;
      }

      setTierId(player.tier_id);
    } catch (error) {
      console.error('Unexpected error:', error);
    }
  }, [playerId]);

  /**
   * Fetch data when the modal is opened and set up real-time updates for player instance changes.
   */
  useEffect(() => {
    if (!isOpen) return;

    fetchPlayerInstanceAndTier();

    const playerInstanceChannel = supabase
      .channel('player-instance-db-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'player_instance' }, fetchPlayerInstanceAndTier)
      .subscribe();

    return () => {
      supabase.removeChannel(playerInstanceChannel);
    };
  }, [isOpen, fetchPlayerInstanceAndTier]);

  /**
   * Automatically set the Moneyball flag based on specific shot counts.
   */
  useEffect(() => {
    const isMoneyballShot = [1, 11, 21, 31, 41].includes(shotsLeft || 0);
    setIsMoneyball(isMoneyballShot);
  }, [shotsLeft]);

  /**
   * Handles the submission of the shot and updates player data in the database.
   */
  const handleSubmit = async () => {
    if (points === null || playerInstanceId === null || tierId === null) return;
  
    const shouldPlayNotification = (points === 1 || points === 2) && isMoneyball;
  
    // Adjust points for Moneyball and Double scenarios
    let finalPoints = points;
    if (isMoneyball) finalPoints *= 2;
    if (isDouble) finalPoints *= 2;
  
    const shotId = parseInt(`${Date.now()}${Math.floor(Math.random() * 1000)}`.slice(-9), 10);
  
    try {
      const { error: shotError } = await supabase.from('shots').insert({
        instance_id: playerInstanceId,
        shot_date: new Date().toISOString(),
        result: finalPoints,
        tier_id: tierId,
        shot_id: shotId,
      });
  
      if (shotError) {
        console.error('Error recording shot:', shotError);
        return;
      }
  
      const newScore = currentScore + finalPoints;
      const newShotsLeft = (shotsLeft || 0) - 1;
  
      const { error: updateScoreError } = await supabase
        .from('player_instance')
        .update({ score: newScore, shots_left: newShotsLeft })
        .eq('player_instance_id', playerInstanceId);
  
      if (updateScoreError) {
        console.error('Error updating player:', updateScoreError);
        return;
      }
  
      const newStreak = await calculateShotsMadeInRow(playerInstanceId);
      const missStreak = await calculateShotsMissedInRow(playerInstanceId);
  
      if (missStreak === 4) {
        sadsound.play();
      } else {
        if (shouldPlayNotification && newStreak === 3) {
          playNotification();
          await delay(2000);
          shotSound.play();
        } else {
          if (shouldPlayNotification) {
            playNotification();
          }
          if (newStreak === 3) {
            shotSound.play();
          }
        }
      }
  
      handleClose();
    } catch (error) {
      console.error('Unexpected error:', error);
    }
  };

  // Render nothing if the modal is not open
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={handleClose}>
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
          <p className={isMoneyball ? 'highlight-moneyball' : ''}>
            Shots Left: <span>{shotsLeft !== null ? shotsLeft : ''}</span>
          </p>
          <div className="points">
            <button className={points === 0 ? 'selected' : ''} onClick={() => setPoints(0)}>0</button>
            <button className={points === 1 ? 'selected' : ''} onClick={() => setPoints(1)}>1</button>
            <button className={points === 2 ? 'selected' : ''} onClick={() => setPoints(2)}>2</button>
          </div>
          <div className="actions">
            <button className={isDouble ? 'selected' : ''} onClick={() => setIsDouble(!isDouble)}>Double</button>
          </div>
          <button onClick={handleSubmit}>Submit</button>
        </div>
      </div>
    </div>
  );
};

export default Modal;
