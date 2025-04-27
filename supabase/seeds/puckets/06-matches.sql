INSERT INTO puckets.matches (   match_id, 
                                season_id,
                                player1_instance_id, 
                                player1_rating, 
                                player2_instance_id, 
                                player2_rating, 
                                match_date, 
                                player1_score, 
                                player1_rating_result, 
                                player2_score, 
                                player2_rating_result
                            )
VALUES  (1, 1, 1, 1000, 2, 1000, '2025/04/22 08:24:55', 11, 1050, 5, 950),
        (2, 1, 3, 1000, 4, 1000, '2025/04/23 11:54:49', 10, 950, 11, 1050),
        (3, 1, 5, 1000, 6, 1000, '2025/04/24 13:02:30', 11, 1050, 2, 950),
        (4, 1, 7, 1000, 8, 1000, '2025/04/25 12:26:12', 9, 950, 11, 1050),
        (5, 1, 9, 1000, 10, 1000, '2025/04/26 16:47:11', 11, 1050, 8, 950);