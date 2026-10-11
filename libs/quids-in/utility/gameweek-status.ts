import type { Gameweek } from './results.interfaces';

export function isCurrentGameweekInProgress(
  selectedGameweek: Gameweek | undefined,
  latestGameweek: Gameweek | undefined
): boolean {
  return (
    selectedGameweek !== undefined &&
    latestGameweek !== undefined &&
    selectedGameweek.gameweek === latestGameweek.gameweek &&
    selectedGameweek.started === true &&
    selectedGameweek.ended === false
  );
}
