import React from 'react';
import { calculateCurrentShotStreak } from '@/utils/shotStreak';
import { supabase } from '@/supabaseClient';
import { render } from '@testing-library/react';

jest.mock('@/supabaseClient', () => ({
  supabase: {
    from: jest.fn(),
  },
}));

describe('calculateCurrentShotStreak', () => {
  it('increments streak for consecutive made shots', async () => {
    render(React.createElement('div'));
    const mockOrder = jest.fn().mockResolvedValue({
      data: [{ result: 1 }, { result: 1 }, { result: 1 }],
      error: null,
    });
    (supabase.from as jest.Mock).mockReturnValue({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      order: mockOrder,
    });

    const streak = await calculateCurrentShotStreak(1);
    expect(streak).toBe(3);
  });

  it('resets streak to zero after a miss', async () => {
    const mockOrder = jest.fn().mockResolvedValue({
      data: [{ result: 1 }, { result: 1 }, { result: 0 }],
      error: null,
    });
    (supabase.from as jest.Mock).mockReturnValue({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      order: mockOrder,
    });

    const streak = await calculateCurrentShotStreak(1);
    expect(streak).toBe(0);
  });
});
