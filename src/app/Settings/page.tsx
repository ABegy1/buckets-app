'use client';

import React, { useState } from 'react';
import { useSettings } from '@/components/useSettings';

const SettingsPage: React.FC = () => {
  const { shotsPerDay, setShotsPerDay } = useSettings();
  const [value, setValue] = useState<number>(shotsPerDay);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setShotsPerDay(value);
  };

  return (
    <div className="max-w-md mx-auto">
      <h2 className="text-xl mb-4">Gameplay Settings</h2>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <label className="flex flex-col">
          Shots per Day
          <input
            type="number"
            className="border p-2"
            value={value}
            min={1}
            onChange={(e) => setValue(parseInt(e.target.value, 10))}
          />
        </label>
        <button type="submit" className="bg-blue-500 text-white p-2 rounded">
          Save
        </button>
      </form>
    </div>
  );
};

export default SettingsPage;

