import type { StoryCandidate, StoryEngineResult, StorySignal } from './story-engine';

/**
 * Real Acade voice layer.
 *
 * The statistical engine owns the facts. This layer only reacts to those
 * verified facts with a short, futbolero, cordobés-style chicana. The Picante
 * deliberately avoids restating the headline number: title = fact, subtitle =
 * new context, Picante = reaction.
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
  const key = `${story.id}:${signal.kind}:reaction-v2`;

  switch (signal.kind) {
    case 'winning-streak':
      return pick(key, [
        `¿Quién le corta el mambo a ${name}?`,
        `${name} no afloja. Ya se está poniendo medio gede esto.`,
        `Que alguno avise cuando ${name} piense perder.`,
      ]);
    case 'losing-streak':
      return pick(key, [
        `${name} necesita encontrar el botón de reinicio urgente.`,
        `La próxima para ${name} ya viene con olor a final.`,
        `${name} está para resurrección o más leña al fuego.`,
      ]);
    case 'recent-goals':
      return pick(key, [
        `${name} anda con la mira calibrada. No le den medio metro.`,
        `${name} la está viendo bastante grande. Arquero avisado vale por dos.`,
        `${name} viene facturando lindo. Mejor no regalarle una.`,
      ]);
    case 'mvp-form':
      return pick(key, [
        `${name} está pidiendo cámara propia.`,
        `Perfil bajo para ${name}, justamente, no estaría siendo.`,
        `${name} se acostumbró a salir en la foto. Meeeeta figura.`,
      ]);
    case 'ranking-movement': {
      const movement = factNumber(signal, 'movement');
      return movement > 0
        ? pick(key, [
            `${name} apareció por el retrovisor. Permiso, que viene subiendo.`,
            `${name} viene metiendo presión desde abajo. Se picó la tabla.`,
          ])
        : pick(key, [
            `${name} perdió terreno. La tabla no espera a nadie.`,
            `${name} quedó para remar, hermano.`,
          ]);
    }
    case 'ranking-position':
      return pick(key, [
        `El que quiera bajar a ${name} va a tener que ir a buscarlo.`,
        `${name} tiene a varios mirando para arriba. Linda presión para la próxima.`,
      ]);
    case 'win-rate':
      return pick(key, [
        `Bastante incómodo tener a ${name} enfrente últimamente.`,
        `Los numeritos de ${name} ya empiezan a meter miedo.`,
      ]);
    case 'recent-form': {
      const losses = factNumber(signal, 'losses');
      const wins = factNumber(signal, 'wins');
      return losses === 0
        ? `${name} viene embalado. Está para que alguien le baje un cambio.`
        : wins >= 3
          ? `${name} llega prendido. Ojo que viene con envión.`
          : `${name} viene golpeado. La próxima puede ser resurrección o más leña al fuego.`;
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
