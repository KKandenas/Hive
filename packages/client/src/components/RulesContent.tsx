export function RulesContent() {
  return (
    <div className="rules-content">
      <section>
        <h3>Objective</h3>
        <p>
          Completely surround the opponent's Queen Bee 🐝 — all six neighboring cells filled with any piece,
          either color — and you win. If a move surrounds both queens at once, the game is a draw.
        </p>
      </section>

      <section>
        <h3>Setup</h3>
        <p>
          Each player has 11 pieces: 1 Queen Bee, 2 Beetles, 3 Grasshoppers, 2 Spiders, 3 Soldier Ants. White
          moves first. On your turn you either place a new piece from your reserve, or move a piece already on
          the board — never both.
        </p>
      </section>

      <section>
        <h3>Placing pieces</h3>
        <ul>
          <li>The first piece of the game can go anywhere. Black's first piece must touch White's piece.</li>
          <li>
            After that, every new piece must touch at least one piece of your own color, and may never touch an
            opponent piece.
          </li>
          <li>
            You must place your Queen Bee by your 4th placement at the latest — if you haven't placed her by
            then, it's forced.
          </li>
          <li>You can't move any of your pieces until your own Queen Bee is on the board.</li>
        </ul>
      </section>

      <section>
        <h3>How each piece moves</h3>
        <ul>
          <li>
            <strong>Queen Bee 🐝</strong> — one step to an adjacent empty space.
          </li>
          <li>
            <strong>Beetle 🪲</strong> — one step, and can climb on top of any adjacent piece (friend or foe).
            A piece with a beetle on top is pinned — it can't move, and new pieces can't be placed against it
            (only against whatever the beetle itself is currently touching).
          </li>
          <li>
            <strong>Grasshopper 🦗</strong> — jumps in a straight line over one or more pieces, landing in the
            first empty space beyond them. It doesn't need free space to move, only a line to jump.
          </li>
          <li>
            <strong>Spider 🕷️</strong> — moves exactly 3 steps along the edge of the hive, in one continuous
            direction, without doubling back over a space it already crossed.
          </li>
          <li>
            <strong>Soldier Ant 🐜</strong> — slides any number of steps around the outside of the hive.
          </li>
        </ul>
      </section>

      <section>
        <h3>The two golden rules</h3>
        <ul>
          <li>
            <strong>One Hive</strong> — all pieces on the board must stay in one connected group at all times.
            You may never make a move that would split the hive in two, even for a moment.
          </li>
          <li>
            <strong>Freedom to Move</strong> — a piece can only slide into a gap that's wide enough for it. If
            both neighboring pieces on either side of the gap are occupied, it's pinched shut and nothing can
            slide through (Beetles climbing and Grasshoppers jumping ignore this rule).
          </li>
        </ul>
      </section>

      <section>
        <h3>No legal move?</h3>
        <p>
          If you have no legal placement and no legal move on your turn, you must pass — play returns to your
          opponent.
        </p>
      </section>
    </div>
  );
}
