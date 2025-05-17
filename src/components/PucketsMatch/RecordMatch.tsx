'use server'

import { Match } from '@/app/Puckets/page';
import { revalidateTag } from 'next/cache';


const validateMatch = async (match: Match) => {
    //check if the player IDs are valid
    console.log(match);
    if( match.player1.instance_id == match.player2.instance_id){
        console.log("Players cant be identical");
        return "Players can't be identical";
    }

    //check if the scores are valid
    if(match.player1.score < 0 || match.player1.score > 21){
        return "Player 1 score invalid";
    }

    if(match.player2.score < 0 || match.player2.score > 21){
        return "Player 2 score invalid";
    }

    if(match.player1.score == match.player2.score){
        return "Player scores can't be identical";
    }

    if(match.player1.score != 21 && match.player2.score != 21){
        return "One player has to score 21 to win";
    }

    if(match.player1.rating < 0) {
        return "Invalid player1 rating";
    }

    if(match.player2.rating < 0) {
        return "Invalid player2 rating";
    }

    return null;
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

    const error = validateMatch(match);
    if(error){
        return {
            errors: error,
            values: match,
        }
    }
    // revalidateTag("player1.score");
    return {
        success: true,
    };
};


