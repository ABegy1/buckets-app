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


interface RecordedShotResult {
  score: number;
  shots_left: number;
  shots_left_dashes: number;
  shots_taken_today: number;
  todays_score: number;
  current_make_streak: number;
  current_miss_streak: number;
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
  const [shotsLeftDashes, setShotsLeftDashes] = useState<number | null>(null); // Remaining dash shots
  const [shotsTakenToday, setShotsTakenToday] = useState<number | null>(null); // Shots taken in the current calendar day
  const [todaysScore, setTodaysScore] = useState<number | null>(null); // Points earned today
  const [useDash, setUseDash] = useState<boolean>(false); // Spend a dash on submit
  const sound = new Howl({ src: ['/sounds/shot.mp3'] }); // Sound effect for shots
  const shotSound = useMemo(() => new Howl({ src: ['/sounds/onfire.mp3'] }), []);
  const sadsound = useMemo(() => new Howl({ src: ['/sounds/sadtrombone.mp3'] }), []); // Sound effect for sad events
  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  const standardRules = useMemo(
    () => ({ dice: 2, practice: 1, attempts: 2 }),
    [],
  );

  const waiverRules = useMemo(
    () => ({ dice: 1, practice: 0, attempts: 1 }),
    [],
  );

  const currentRuleType = useMemo(() => {
    if (shotsTakenToday === null) return 'Standard';
    return shotsTakenToday >= 4 ? 'Waiver' : 'Standard';
  }, [shotsTakenToday]);

  const nextRuleType = useMemo(() => {
    if (shotsTakenToday === null) return 'Standard';
    return shotsTakenToday >= 3 ? 'Waiver' : 'Standard';
  }, [shotsTakenToday]);



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
    setShotsLeftDashes(null);
    setShotsTakenToday(null);
    setTodaysScore(null);
    setUseDash(false);
  };
  /**
   * Plays a notification sound when a shot is successfully recorded.
   */
  const playNotification = () => {
    sound.play();
  };

  /**
   * Fetches the number of shots taken by the player during the current calendar day.
   */
  const fetchShotsTakenToday = useCallback(async (instanceId: number) => {
    try {
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);

      const startOfNextDay = new Date(startOfDay);
      startOfNextDay.setDate(startOfNextDay.getDate() + 1);

      const { data, error } = await supabase
        .from('shots')
        .select('shot_id, result')
        .eq('instance_id', instanceId)
        .gte('shot_date', startOfDay.toISOString())
        .lt('shot_date', startOfNextDay.toISOString());

      if (error) {
        console.error("Error fetching today's shots:", error);
        setShotsTakenToday(null);
        setTodaysScore(null);
        return;
      }

      const todaysShots = data ?? [];
      const todaysTotalScore = todaysShots.reduce(
        (total, shot: { result: number | null }) => total + (Number(shot.result) || 0),
        0,
      );

      setShotsTakenToday(todaysShots.length);
      setTodaysScore(todaysTotalScore);
    } catch (error) {
      console.error("Unexpected error fetching today's shots:", error);
      setShotsTakenToday(null);
      setTodaysScore(null);
    }
  }, []);

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
        .select('player_instance_id, score, shots_left, shots_left_dashes')
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
      setShotsLeftDashes(playerInstance.shots_left_dashes ?? 0);
      fetchShotsTakenToday(playerInstance.player_instance_id);

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
  }, [fetchShotsTakenToday, playerId]);

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
    if (shotsLeft === null) {
      setIsMoneyball(false);
      return;
    }

    const isMoneyballShot = shotsLeft % 10 === 1;
    setIsMoneyball(isMoneyballShot);
  }, [shotsLeft]);

  useEffect(() => {
    if (!shotsLeftDashes) {
      setUseDash(false);
    }
  }, [shotsLeftDashes]);

  const projectedPoints = useMemo(() => {
    if (points === null) return null;

    let finalPoints = points;

    if (isMoneyball) finalPoints *= 2;
    if (isDouble) finalPoints *= 2;

    return finalPoints;
  }, [points, isMoneyball, isDouble]);

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
  
    try {
      const { data: recordedShot, error: recordShotError } = await supabase
        .rpc('record_shot', {
          p_instance_id: playerInstanceId,
          p_tier_id: tierId,
          p_result: finalPoints,
          p_use_dash: useDash,
        })
        .single();
  
      if (recordShotError || !recordedShot) {
        console.error('Error recording shot:', recordShotError);
        return;
      }
  
      const shotResult = recordedShot as RecordedShotResult;
      const updatedScore = Number(shotResult.score) || 0;
      const updatedShotsLeft = Number(shotResult.shots_left) || 0;
      const updatedShotsLeftDashes = Number(shotResult.shots_left_dashes) || 0;
      const newStreak = Number(shotResult.current_make_streak) || 0;
      const missStreak = Number(shotResult.current_miss_streak) || 0;

      setCurrentScore(updatedScore);
      setShotsLeft(updatedShotsLeft);
      setShotsLeftDashes(updatedShotsLeftDashes);
      setShotsTakenToday(Number(shotResult.shots_taken_today) || 0);
      setTodaysScore(Number(shotResult.todays_score) || 0);
  
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
    <div
      className="modal-overlay"
      onClick={handleClose}
      role="dialog"
      aria-modal="true"
      aria-label={`${name} score modal`}
    >
      <div
        className={`modal-content ${isMoneyball ? 'highlight-modal-border' : ''}`}
        onClick={(e) => e.stopPropagation()}
      >
        <button className="close-button" onClick={handleClose} aria-label="Close player modal">
          ×
        </button>

        <h2 className="modal-title">{name}</h2>

        {/* Moneyball Indicator */}
        {isMoneyball && (
          <div className="moneyball-indicator">
            <span>This is a Moneyball Shot!</span>
          </div>
        )}

        <div className="modal-body">
          <div className="score-section">
            <div className="stats-overview">
              <div className="stat-card">
                <p className="stat-label">Shots Left</p>
                <p className={`stat-value ${isMoneyball ? 'highlight-moneyball' : ''}`}>
                  {shotsLeft !== null ? shotsLeft : ''}
                </p>
              </div>
              <div className="stat-card">
                <p className="stat-label">Dashes</p>
                <p className="stat-value">{shotsLeftDashes !== null ? shotsLeftDashes : '...'}</p>
                {shotsLeftDashes !== null && shotsLeftDashes > 0 && (
                  <span className="shots-left-dashes" aria-label={`${shotsLeftDashes} shots left dashes`}>
                    {Array.from({ length: shotsLeftDashes }).map((_, index) => (
                      <span key={index} className="shots-left-dash" />
                    ))}
                  </span>
                )}
              </div>
              <div className="stat-card">
                <p className="stat-label">Shots Taken Today</p>
                <p className="stat-value">{shotsTakenToday !== null ? shotsTakenToday : '...'}</p>
              </div>
              <div className="stat-card">
                <p className="stat-label">Today&apos;s Score</p>
                <p className="stat-value">{todaysScore !== null ? todaysScore : '...'}</p>
              </div>
            </div>
            <div className="points">
              <button className={points === 0 ? 'selected' : ''} onClick={() => setPoints(0)}>0</button>
              <button className={points === 1 ? 'selected' : ''} onClick={() => setPoints(1)}>1</button>
              <button className={points === 2 ? 'selected' : ''} onClick={() => setPoints(2)}>2</button>
            </div>
            <div className="actions">
              <button className={isDouble ? 'selected' : ''} onClick={() => setIsDouble(!isDouble)}>Double</button>
              <button
                className={useDash ? 'selected' : ''}
                onClick={() => setUseDash((prev) => !prev)}
                disabled={!shotsLeftDashes}
              >
                Use Dash
              </button>
            </div>
            <div className="submit-row">
              <button className="submit-button" onClick={handleSubmit}>Submit</button>
              <div className="projected-points" aria-live="polite">
                <span className="projected-label">Point Preview</span>
                <span className="projected-value">{projectedPoints ?? '--'}</span>
              </div>
            </div>
          </div>

          <div className="rules-section">
            <div className={`rule-card ${currentRuleType === 'Waiver' ? 'rule-card-waiver' : ''}`}>
              <p className="rule-heading">Current Shot Rules</p>
              <p className="rule-tag">{currentRuleType}</p>
              <ul>
                <li>
                  <span>Dice</span>
                  <strong>{(currentRuleType === 'Standard' ? standardRules : waiverRules).dice}</strong>
                </li>
                <li>
                  <span>Practice</span>
                  <strong>{(currentRuleType === 'Standard' ? standardRules : waiverRules).practice}</strong>
                </li>
                <li>
                  <span>Attempts</span>
                  <strong>{(currentRuleType === 'Standard' ? standardRules : waiverRules).attempts}</strong>
                </li>
              </ul>
            </div>

            <div className={`rule-card ${nextRuleType === 'Waiver' ? 'rule-card-waiver' : ''}`}>
              <p className="rule-heading">Next Shot Rules</p>
              <p className="rule-tag">{nextRuleType}</p>
              <ul>
                <li>
                  <span>Dice</span>
                  <strong>{(nextRuleType === 'Standard' ? standardRules : waiverRules).dice}</strong>
                </li>
                <li>
                  <span>Practice</span>
                  <strong>{(nextRuleType === 'Standard' ? standardRules : waiverRules).practice}</strong>
                </li>
                <li>
                  <span>Attempts</span>
                  <strong>{(nextRuleType === 'Standard' ? standardRules : waiverRules).attempts}</strong>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Modal;
