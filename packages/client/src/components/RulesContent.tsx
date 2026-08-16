import type { Insect } from '@hive/shared';
import { INSECT_META, pieceImageSrc } from '../insects.js';

function PieceIcon({ insect }: { insect: Insect }) {
  return <img className="rules-piece-icon" src={pieceImageSrc(insect, 'WHITE')} alt={INSECT_META[insect].label} />;
}

export function RulesContent() {
  return (
    <div className="rules-content">
      <section>
        <h3>Mål</h3>
        <p>
          Omringa motståndarens <PieceIcon insect="QUEEN" /> Bidrottning helt — alla sex angränsande rutor
          fyllda med valfri pjäs, oavsett färg — så vinner du. Om ett drag omringar båda bidrottningarna
          samtidigt blir det oavgjort.
        </p>
      </section>

      <section>
        <h3>Uppställning</h3>
        <p>
          Varje spelare har 11 pjäser: 1 Bidrottning, 2 Skalbaggar, 3 Gräshoppor, 2 Spindlar, 3 Soldatmyror. Vit
          börjar. På din tur väljer du antingen att placera en ny pjäs från ditt förråd, eller att flytta en
          pjäs som redan ligger på kupan — aldrig båda.
        </p>
      </section>

      <section>
        <h3>Att placera pjäser</h3>
        <ul>
          <li>Den första pjäsen i spelet får placeras var som helst. Svarts första pjäs måste röra vid Vits.</li>
          <li>
            Därefter måste varje ny pjäs röra vid minst en pjäs av din egen färg, och får aldrig röra vid en
            motståndarpjäs.
          </li>
          <li>
            Du måste placera din Bidrottning senast i ditt fjärde drag — har du inte gjort det innan dess är
            draget tvingat.
          </li>
          <li>Du får inte flytta någon av dina pjäser förrän din egen Bidrottning är placerad på kupan.</li>
        </ul>
      </section>

      <section>
        <h3>Hur varje pjäs rör sig</h3>
        <ul className="rules-piece-list">
          <li className="rules-piece-row">
            <PieceIcon insect="QUEEN" />
            <div>
              <strong>Bidrottning</strong> — ett steg till ett angränsande tomrum.
            </div>
          </li>
          <li className="rules-piece-row">
            <PieceIcon insect="BEETLE" />
            <div>
              <strong>Skalbagge</strong> — ett steg, och kan klättra ovanpå en angränsande pjäs (egen eller
              motståndarens). En pjäs med en skalbagge ovanpå är låst — den kan inte flyttas, och nya pjäser
              kan inte placeras mot den (bara mot det skalbaggen själv rör vid just då).
            </div>
          </li>
          <li className="rules-piece-row">
            <PieceIcon insect="GRASSHOPPER" />
            <div>
              <strong>Gräshoppa</strong> — hoppar i rät linje över en eller flera pjäser och landar i det
              första tomrummet på andra sidan. Den behöver inget fritt utrymme för att flytta, bara en rad att
              hoppa över.
            </div>
          </li>
          <li className="rules-piece-row">
            <PieceIcon insect="SPIDER" />
            <div>
              <strong>Spindel</strong> — flyttar exakt tre steg längs kupans kant, i en sammanhängande rörelse,
              utan att gå tillbaka över en ruta den redan passerat.
            </div>
          </li>
          <li className="rules-piece-row">
            <PieceIcon insect="ANT" />
            <div>
              <strong>Soldatmyra</strong> — glider valfritt antal steg längs kupans ytterkant.
            </div>
          </li>
        </ul>
      </section>

      <section>
        <h3>De två grundlagarna</h3>
        <ul>
          <li>
            <strong>En kupa</strong> — alla pjäser på bordet måste hela tiden utgöra en enda sammanhängande
            grupp. Du får aldrig göra ett drag som delar kupan i två delar, ens tillfälligt.
          </li>
          <li>
            <strong>Rörelsefrihet</strong> — en pjäs kan bara glida in i en öppning som är tillräckligt bred.
            Om båda pjäserna som flankerar öppningen är upptagna är den blockerad och inget kan glida igenom
            (skalbaggens klättring och gräshoppans hopp följer inte denna regel).
          </li>
        </ul>
      </section>

      <section>
        <h3>Inget giltigt drag?</h3>
        <p>
          Om du varken har en giltig placering eller ett giltigt drag på din tur måste du passa — turen går
          tillbaka till din motståndare.
        </p>
      </section>
    </div>
  );
}
