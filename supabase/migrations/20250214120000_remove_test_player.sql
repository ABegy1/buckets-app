DELETE FROM players
WHERE name = 'Test'
  AND team_id = (
    SELECT team_id
    FROM teams
    WHERE team_name = 'Direwolves'
    LIMIT 1
  );
