// This file contains TypeScript interfaces for the Puckets application.


export interface Match {
  player1: {
    instance_id: string;
    name: string;
    rating: number;
    score: number;
  };
  player2: {
    instance_id: string;
    name: string;
    rating: number;
    score: number;
  };
  season_id: string;
  date: Date;
}

export interface Season {
  season_id: string;
  season_name: string;
  rules: string;
}

export interface PucketsPlayerWithStats {
  instance_id: string;
  name: string;
  rating: number;
  wins: number;
  losses: number;
  successive_wins: number;
  successive_losses: number;
  tier: number;
  is_hidden: boolean;
  is_inactive: boolean;
}