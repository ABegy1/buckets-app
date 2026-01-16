'use server'

import { Match } from '@/app/Puckets/Standings/page';
import { revalidateTag } from 'next/cache';
import { supabase } from '@/supabaseClient'; // Supabase client import
import { ConsoleLogWriter } from 'drizzle-orm';
import { PucketsPlayerWithStats } from '@/app/Puckets/types';




const validateMatch = (match: Match) => {
    //check if the player IDs are valid
    console.log(match);
    if( match.players[0].instance_id == match.players[1].instance_id){
        console.log("Players cant be identical");
        return "Players can't be identical";
    }

    //check if the scores are valid
    if(match.players[0].score < 0){
        return "Player 1 score invalid";
    }

    if(match.players[1].score < 0){
        return "Player 2 score invalid";
    }

    if(match.players[0].score < 21 && match.players[1].score < 21){
        return "One player has to score 21 or above to win";
    }

    if(match.players[0].score == match.players[1].score){
        return "Player scores can't be identical";
    }

    if(Math.abs(match.players[0].score - match.players[1].score) < 2)
    {
        return "Matches must be won by a 2 point lead"
    }
    return null;
};

// Function to calculate new ratings for players after a match
// This uses the Elo rating system documented here: https://en.wikipedia.org/wiki/Elo_rating_system#Mathematical_details
const calculateNewRatingsEloSingles = (match: Match) => {
    const kFactor = 32; // K-factor for Elo rating system
    const player1ExpectedScore = 1 / (1 + Math.pow(10, (match.players[1].rating - match.players[0].rating) / 400));
    const player2ExpectedScore = 1 / (1 + Math.pow(10, (match.players[0].rating - match.players[1].rating) / 400));

    let player1NewRating = match.players[0].rating + kFactor * (match.players[0].score > match.players[1].score ? 1 : 0 - player1ExpectedScore);
    let player2NewRating = match.players[1].rating + kFactor * (match.players[1].score > match.players[0].score ? 1 : 0 - player2ExpectedScore);

    return {
        player1NewRating: Math.round(player1NewRating),
        player2NewRating: Math.round(player2NewRating)
    };
};

export async function recordMatch(prevState: any, formdata: FormData){
    // console.log('formData:\n', formdata);

    const match: Match = {
        players: [{
          instance_id: String(formdata.get("player1.instance_id")),
          name: 'string',
          rating: 0,
          score: Number(formdata.get("player1.score")),
        },
        {
          instance_id: String(formdata.get("player2.instance_id")),
          name: 'string',
          rating: 0,
          score: Number(formdata.get("player2.score")),
        }],
        type: 1, // TODO: Singles match only for now
        season_id: 1,
        date: new Date()
      };
    // Sort to ensure consistent order to align with playerStats later
    match.players.sort((a, b) => a.instance_id.localeCompare(b.instance_id));
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
        console.log("activeSeasonId: ", activeSeasonId);

        // Fetch players
        const { data: playerData, error: playerError } = await supabase
        .schema('puckets')
        .from('player_instance')
        .select('player_instance_id, season_id, rating, losses, wins, successive_loss, successive_wins, players (name)')
        .in('player_instance_id', [match.players[0].instance_id, match.players[1].instance_id])
        .eq('season_id', activeSeasonId);

        if (playerError) throw playerError;

        if(!playerData || playerData.length < 2){
            throw new Error("One or both players not found in the database for the active season.");
        }

        // Map player data to include stats
        const playerStats: PucketsPlayerWithStats[] = await Promise.all(
        playerData.map(async (player: any) => {
                return {
                instance_id: player.player_instance_id,
                name: player.players.name,
                rating: player.rating,
                wins: player.wins,
                losses: player.losses,
                draws: player.draws,
                successive_wins: player.successive_wins,
                successive_losses: player.successive_loss,
                tier: 0,
                is_hidden: false,
                is_inactive: false
                };
            })
            );
        playerStats.sort((a, b) => a.instance_id.localeCompare(b.instance_id));
        console.log("playerData: \n", playerData);
        
        // Assign current ratings to match players
        if(playerStats[0].instance_id == match.players[0].instance_id){
            match.players[0].rating = playerStats[0].rating;
        }
        else throw new Error("Player 1 data mismatch.");

        if(playerStats[1].instance_id == match.players[1].instance_id){
            match.players[1].rating = playerStats[1].rating;
        }
        else throw new Error("Player 2 data mismatch.");

        console.log("player 1 rating: ", match.players[0].rating);
        console.log("player 2 rating: ", match.players[1].rating);


        // Calculate new ratings
        const { player1NewRating, player2NewRating } = calculateNewRatingsEloSingles(match);
        console.log(`New Ratings - Player 1: ${player1NewRating}, Player 2: ${player2NewRating}`);
        
        // Record the match in the database
        const { data: matchData, error: matchError } = await supabase
        .schema('puckets')
        .from('matches')
        .insert([
            {
                season_id: activeSeasonId,
                player1_instance_id: match.players[0].instance_id,
                player2_instance_id: match.players[1].instance_id,
                player1_score: match.players[0].score,
                player2_score: match.players[1].score,
                player1_rating: match.players[0].rating,
                player2_rating: match.players[1].rating,
                player1_rating_result: player1NewRating,
                player2_rating_result: player2NewRating,
                match_date: new Date(),
            },
        ])
        .select();

        if (matchError) throw matchError;

        console.log("Recorded Match Data:\n", matchData);

        // Update player ratings in the database
        const { error: updateError } = await supabase
        .schema('puckets')
        .from('player_instance')
        .update([
            {   rating: player1NewRating,
                wins: match.players[0].score > match.players[1].score ? playerStats[0].wins + 1 : playerStats[0].wins,
                losses: match.players[0].score < match.players[1].score ? playerStats[0].losses + 1 : playerStats[0].losses,
                draws: match.players[0].score == match.players[1].score ? playerStats[0].draws + 1 : playerStats[0].draws,
                successive_wins: match.players[0].score > match.players[1].score ? playerStats[0].successive_wins + 1 : 0,
                successive_loss: match.players[0].score < match.players[1].score ? playerStats[0].successive_losses + 1 : 0,
            },
        ])
        .eq('player_instance_id', match.players[0].instance_id);

        if (updateError) throw updateError;

        const { error: updateError2 } = await supabase
        .schema('puckets')
        .from('player_instance')
        .update([
            {   rating: player2NewRating,
                wins: match.players[1].score > match.players[0].score ? playerStats[1].wins + 1 : playerStats[1].wins,
                losses: match.players[1].score < match.players[0].score ? playerStats[1].losses + 1 : playerStats[1].losses,
                draws: match.players[1].score == match.players[0].score ? playerStats[1].draws + 1 : playerStats[1].draws,
                successive_wins: match.players[1].score > match.players[0].score ? playerStats[1].successive_wins + 1 : 0,
                successive_loss: match.players[1].score < match.players[0].score ? playerStats[1].successive_losses + 1 : 0,
            },
        ])
        .eq('player_instance_id', match.players[1].instance_id);

        if (updateError2) throw updateError2;

        console.log("Player ratings updated successfully.");


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


