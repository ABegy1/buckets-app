import { supabase } from '@/supabaseClient';

/**
 * Calculate the current streak of consecutive made shots for a player instance.
 * @param playerInstanceId ID of the player_instance to check.
 * @returns Number of consecutive made shots.
 */
export const calculateCurrentShotStreak = async (playerInstanceId: number) => {
  try {
    const { data: shots, error: shotsError } = await supabase
      .from('shots')
      .select('result')
      .eq('instance_id', playerInstanceId)
      .order('shot_date', { ascending: true });

    if (shotsError || !shots) throw shotsError;

    let currentStreak = 0;
    for (const shot of shots) {
      if (shot.result !== 0) {
        currentStreak++;
      } else {
        currentStreak = 0;
      }
    }

    return currentStreak;
  } catch (error) {
    console.error('Error calculating current shot streak:', error);
    return 0;
  }
};

