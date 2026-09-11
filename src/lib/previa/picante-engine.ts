import type { StoryCandidate, StoryEngineResult, StorySignal } from './story-engine';

/**
 * Real Acade voice layer.
 *
 * The statistical engine owns the facts. This layer only turns those already
 * verified facts into a short, futbolero, cordobés-style chicana. It never
 * creates a number, streak, ranking or achievement that is not present in a
 * StorySignal.
 *
 * Keep this separate from StoryScore so we can tune the group's voice without
 * changing which story deserves to be the headline.
 */

const stableIndex = (key: string, length: number) => {
  let hash = 0;
  for (let index = 0; index < key.length; index++) hash = ((hash << 5) - hash + key.charCodeAt(index)) | 0;
  return Math.abs(hash) % length;
};

const pick = (key: string, options: string[]) => options[stableIndex(key, options.length)];
const factNumber = (signal: StorySignal, key: string) => Number(signal.facts[key] ?? 0);

function fromSignal(story: StoryCandidate, signal: StorySignal): string {
  const name = story.playerName;
  const key = `${story.id}:${signal.kind}`;

  switch (signal.kind) {
    case 'winning-streak': {
      const streak = factNumber(signal, 'streak');
      return pick(key, [
        `${name} ya lleva ${streak} al hilo. ¿Quién le corta el mambo?`,
        `${streak} seguidas para ${name}. Se está poniendo medio gede esto.`,
        `${name} no afloja: ${streak} victorias seguidas. Que alguno avise cuando piense perder.`,
      ]);
    }
    case 'losing-streak': {
      const streak = factNumber(signal, 'streak');
      return pick(key, [
        `${name} acumula ${streak} derrotas al hilo. Urge encontrar el botón de reinicio.`,
        `${streak} caídas seguidas para ${name}. El próximo partido ya viene con olor a final.`,
        `${name} lleva ${streak} sin poder festejar. Se picó la remontada.`,
      ]);
    }
    case 'recent-goals': {
      const goals = factNumber(signal, 'goals');
      const appearances = factNumber(signal, 'appearances');
      return pick(key, [
        `${name} anda con la mira calibrada: ${goals} goles en ${appearances}. No le den medio metro.`,
        `${goals} goles en ${appearances} para ${name}. La está viendo bastante grande.`,
        `${name} viene facturando: ${goals} en ${appearances}. Arquero avisado vale por dos.`,
      ]);
    }
    case 'mvp-form': {
      const mvps = factNumber(signal, 'mvps');
      return pick(key, [
        `${name} ya metió ${mvps} MVP recientes. Está pidiendo cámara propia.`,
        `${mvps} MVP para ${name} en este tramo. Perfil bajo, justamente, no estaría siendo.`,
        `${name} se acostumbró al MVP: ya van ${mvps}. Meeeeta figura.`,
      ]);
    }
    case 'ranking-movement': {
      const previous = factNumber(signal, 'previousRank');
      const rank = factNumber(signal, 'rank');
      const movement = factNumber(signal, 'movement');
      return movement > 0
        ? pick(key, [
            `${name} saltó del #${previous} al #${rank}. Permiso, que viene subiendo.`,
            `${name} apareció por el retrovisor y ya está #${rank}. Se picó la tabla.`,
          ])
        : pick(key, [
            `${name} pasó del #${previous} al #${rank}. La tabla no espera a nadie.`,
            `${name} perdió terreno y quedó #${rank}. Toca remar, hermano.`,
          ]);
    }
    case 'ranking-position': {
      const rank = factNumber(signal, 'rank');
      return pick(key, [
        `${name} está #${rank}. El que quiera ese lugar va a tener que ir a buscarlo.`,
        `${name} mira a varios desde el #${rank}. Linda presión para la próxima fecha.`,
      ]);
    }
    case 'win-rate': {
      const percentage = factNumber(signal, 'winPercentage');
      return pick(key, [
        `${name} gana el ${percentage}% de lo que juega. Bastante incómodo tenerlo enfrente.`,
        `${percentage}% de victorias para ${name}. Los numeritos empiezan a meter miedo.`,
      ]);
    }
    case 'recent-form': {
      const wins = factNumber(signal, 'wins');
      const losses = factNumber(signal, 'losses');
      return losses === 0
        ? `${name} viene invicto y con ${wins} triunfos recientes. Está para que alguien le baje un cambio.`
        : wins >= 3
          ? `${name} llega con ${wins} victorias recientes. Ojo que viene embalado.`
          : `${name} viene golpeado. La próxima fecha puede ser resurrección o más leña al fuego.`;
    }
    default:
      return `Se movieron los números y ${name} quedó en el centro de la escena. Se picó la próxima fecha.`;
  }
}

export function generatePicante(result: StoryEngineResult): string {
  if (!result.headlineId) return '';
  const headline = result.candidates.find(candidate => candidate.id === result.headlineId);
  if (!headline?.signals.length) return '';
  return fromSignal(headline, headline.signals[0]);
}
