import type { Participant } from './results.interfaces';

/**
 * Formats a plain number (score, position, average) using British locale
 * grouping and at most two decimal places, dropping trailing zeroes.
 */
export function formatNumber(value: number): string {
  return value.toLocaleString('en-GB', { maximumFractionDigits: 2 });
}

/**
 * Formats a number the same way as {@link formatNumber}, but prefixes
 * positive values with an explicit `+` sign (used for variance-style
 * figures where the sign itself is meaningful).
 */
export function formatSignedNumber(value: number): string {
  return value > 0 ? `+${formatNumber(value)}` : formatNumber(value);
}

/**
 * Formats an integer-pennies amount as a GBP currency string with two
 * decimal places and an explicit minus sign for negative values.
 */
export function formatBalance(pennies: number): string {
  return (pennies / 100).toLocaleString('en-GB', {
    currency: 'GBP',
    style: 'currency',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/**
 * Formats a combined squad-value-plus-bank figure (given in tenths of a
 * million pounds, as stored on a Gameweek score) as a `£<n>m` string with
 * at most one decimal place, dropping a trailing `.0`.
 */
export function formatTeamValue(tenthsOfMillion: number): string {
  const millions = tenthsOfMillion / 10;

  return `£${millions.toLocaleString('en-GB', { maximumFractionDigits: 1 })}m`;
}

/**
 * Builds a participant-ID lookup map, used by dashboard cards to resolve a
 * result row's `participantId` back to the participant's name and team.
 */
export function indexParticipantsById(
  participants: Array<Participant>
): Map<number, Participant> {
  return new Map(participants.map((participant) => [participant.id, participant]));
}
