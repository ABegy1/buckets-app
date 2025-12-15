import Header from '@/components/Header';
import styles from './BucketsBracket.module.css';

const BucketsBracketPage = () => {
  return (
    <div className={styles.page}>
      <Header />
      <main className={styles.content}>
        <h1 className={styles.title}>Buckets Bracket</h1>

        <section className={styles.card}>
          <h2>Project Overview</h2>
          <p>
            Build a web app that creates and manages single-elimination tournament brackets similar to BracketHQ, including setup and live phases, auto sizing with byes, and live previews during setup.
          </p>
        </section>

        <section className={styles.card}>
          <h2>Goal</h2>
          <p>
            Provide single-elimination bracket creation with player setup, seeding support, automatic bracket sizing with byes, and real-time updates while matches are scored and advanced.
          </p>
        </section>

        <section className={styles.card}>
          <h2>Core Requirements</h2>
          <ul>
            <li>Single elimination brackets for 2 to 128+ players.</li>
            <li>Bracket sizing picks the next power of two and fills remaining slots with BYE entries that automatically advance opponents.</li>
            <li>Setup phase lets organizers create tournaments, add players with optional metadata, seed any subset of players, and randomize unseeded slots.</li>
            <li>Live preview updates instantly, showing seeds and placements and preventing invalid seeds.</li>
            <li>Transition from draft to live locks player lists by default.</li>
            <li>Live phase supports score entry, automatic advancement, validation against ties, and rollback when scores are cleared.</li>
            <li>Viewer experience updates in real time via shareable links.</li>
            <li>Persistent navigation button linking back to another page on the domain.</li>
          </ul>
        </section>

        <section className={styles.card}>
          <h2>Bracket Generation Rules</h2>
          <ul>
            <li>Determine bracket size, generate matches for all rounds, and wire winners to subsequent rounds.</li>
            <li>Place seeded players into standard seed positions; distribute unseeded players randomly into remaining slots.</li>
            <li>Fill leftover slots with BYE entries and auto-advance players paired against BYEs.</li>
            <li>Ensure placement keeps top seeds separated following traditional single-elimination pairing.</li>
          </ul>
        </section>

        <section className={styles.card}>
          <h2>Live Phase + Viewer Experience</h2>
          <ul>
            <li>Organizer score entry sets winners based on higher scores and advances them immediately.</li>
            <li>Ties are invalid and should surface an error.</li>
            <li>Clearing a score rolls back downstream advancements.</li>
            <li>Public tournament pages reflect live updates through WebSockets or SSE.</li>
          </ul>
        </section>

        <section className={styles.card}>
          <h2>Data Model</h2>
          <p>The model includes Tournament, Player, Match, and handling for BYE slots.</p>
          <ul>
            <li>Tournament: id, name, status (DRAFT/LIVE/COMPLETED), timestamps.</li>
            <li>Player: id, tournamentId, name, seed (nullable), metadata such as team or notes.</li>
            <li>Match: roundNumber, matchNumber, slot players, scores, winner tracking, and pointers to the next match/slot.</li>
            <li>BYE handling uses null player slots and auto-advancement when a player faces a BYE.</li>
          </ul>
        </section>

        <section className={styles.card}>
          <h2>Routes</h2>
          <ul>
            <li>/tournaments/new – create tournament and preview bracket.</li>
            <li>/tournaments/:id/setup – edit draft tournaments.</li>
            <li>/tournaments/:id/live – organizer scoring UI.</li>
            <li>/tournaments/:id – public viewer bracket page.</li>
          </ul>
        </section>

        <section className={styles.card}>
          <h2>Acceptance Criteria</h2>
          <ul>
            <li>Create tournaments with any player count, seeding only some, and randomizing the rest.</li>
            <li>Bracket preview updates instantly and displays names plus seeds.</li>
            <li>Bracket sizing adds BYEs correctly and advances players paired with BYEs.</li>
            <li>Starting the tournament locks setup and enables live scoring.</li>
            <li>Score entry advances winners automatically; clearing scores rolls back progression.</li>
            <li>Viewer pages update live without refresh.</li>
            <li>Header includes a clear link back to another page on the site.</li>
          </ul>
        </section>
      </main>
    </div>
  );
};

export default BucketsBracketPage;
