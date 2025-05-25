'use server'

import { Match } from '@/app/Puckets/page';
import { revalidateTag } from 'next/cache';
import { supabase } from '@/supabaseClient'; // Supabase client import
import { ConsoleLogWriter } from 'drizzle-orm';
import { PucketsPlayerWithStats } from '@/app/Puckets/types';




const validateMatch = (match: Match) => {
    //check if the player IDs are valid
    console.log(match);
    if( match.player1.instance_id == match.player2.instance_id){
        console.log("Players cant be identical");
        return "Players can't be identical";
    }

    //check if the scores are valid
    if(match.player1.score < 0){
        return "Player 1 score invalid";
    }

    if(match.player2.score < 0){
        return "Player 2 score invalid";
    }

    if(match.player1.score < 21 && match.player2.score < 21){
        return "One player has to score 21 or above to win";
    }

    if(match.player1.score == match.player2.score){
        return "Player scores can't be identical";
    }

    if(Math.abs(match.player1.score - match.player2.score) < 2)
    {
        return "Matches must be won by a 2 point lead"
    }

    // if(match.player1.rating < 0) {
    //     return "Invalid player1 rating";
    // }

    // if(match.player2.rating < 0) {
    //     return "Invalid player2 rating";
    // }
    return null;
};

// Function to calculate new ratings for players after a match
// This uses the Elo rating system documented here: https://en.wikipedia.org/wiki/Elo_rating_system#Mathematical_details
const calculateNewRatingsEloSingles = (match: Match) => {
    const kFactor = 32; // K-factor for Elo rating system
    const player1ExpectedScore = 1 / (1 + Math.pow(10, (match.player2.rating - match.player1.rating) / 400));
    const player2ExpectedScore = 1 / (1 + Math.pow(10, (match.player1.rating - match.player2.rating) / 400));

    let player1NewRating = match.player1.rating + kFactor * (match.player1.score > match.player2.score ? 1 : 0 - player1ExpectedScore);
    let player2NewRating = match.player2.rating + kFactor * (match.player2.score > match.player1.score ? 1 : 0 - player2ExpectedScore);

    return {
        player1NewRating: Math.round(player1NewRating),
        player2NewRating: Math.round(player2NewRating)
    };
};

export async function recordMatch(prevState: any, formdata: FormData){
    // console.log('formData:\n', formdata);

    const match: Match = {
        player1: {
          instance_id: Number(formdata.get("player1.instance_id")),
          name: 'string',
          rating: 0,
          score: Number(formdata.get("player1.score")),
        },
        player2: {
          instance_id: Number(formdata.get("player2.instance_id")),
          name: 'string',
          rating: 0,
          score: Number(formdata.get("player2.score")),
        },
        season_id: 1,
        date: new Date()
      };

    console.log("match:\n", match);
    
    // Check if the form data is valid before hitting the db
    const error = validateMatch(match);
    if(error){
        console.log("Form submission error: ", error);
        return {
            errors: error,
            values: match,
            success: false,
        }
    }

    // Form data is valid, get the latest player data from the db
    console.log("Form submission has valid data");
    try {
        // Fetch active season details

        const { data: activeSeason, error: seasonError } = await supabase
        .schema('puckets')
        .from('seasons')
        .select('season_id, season_name, rules')
        .is('end_date', null)
        .single();

        if (seasonError || !activeSeason) throw seasonError;

        const activeSeasonId = activeSeason.season_id;

        // Fetch players

        const { data: playerData, error: playerError } = await supabase
        .schema('puckets')
        .from('player_instance')
        .select('player_instance_id, season_id, rating, losses, wins, successive_loss, successive_wins, players (name)')
        .eq('season_id', activeSeasonId);

        if (playerError) throw playerError;
        // console.log("playerData:\n", playerData);
        const playerStats: PucketsPlayerWithStats[] = await Promise.all(
        playerData.map(async (player: any) => {
                return {
                instance_id: player.player_instance_id,
                name: player.players.name,
                rating: player.rating,
                wins: player.wins,
                losses: player.losses,
                successive_wins: player.successive_wins,
                successive_losses: player.successive_loss,
                tier: 0,
                is_hidden: false,
                is_inactive: false
                };
            })
            );

            // Sort players by their score, descending
            playerStats.sort((a, b) => b.rating - a.rating);
        console.log("playerDate: \n", playerData);

        for( var player in playerData){
            if(playerData[player].player_instance_id == match.player1.instance_id){
                match.player1.rating = playerData[player].rating;
            }
            if(playerData[player].player_instance_id == match.player2.instance_id){
                match.player2.rating = playerData[player].rating;
            }
        }

        console.log("player 1 rating: ", match.player1.rating);
        console.log("player 2 rating: ", match.player2.rating);


    } catch (error) {
        console.error('Error fetching teams, players, and season info:', error);
    }

    // revalidateTag("player1.score");
    return {
        errors: null,
        values: {},
        success: true,
    };
};


