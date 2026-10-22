import { eq, and, desc } from 'drizzle-orm';
import { db, scrimLobbies, scrimMatchResults, teams } from '../db/index.js';
import { GAME_PRESETS } from '../utils/presets.js';
import { randomUUID } from 'node:crypto';

export class PointsService {
  /**
   * Add match result for a team
   */
  public static async addResult(params: {
    lobbyId: string;
    teamIdentifier: string; // Team name or slot number
    placement: number;
    kills: number;
    matchRound?: number;
  }) {
    const lobby = await db.select().from(scrimLobbies).where(eq(scrimLobbies.lobbyId, params.lobbyId)).get();
    if (!lobby) throw new Error(`Lobby \`${params.lobbyId}\` does not exist.`);

    // Find team by name
    const team = await db.select().from(teams)
      .where(and(eq(teams.guildId, lobby.guildId), eq(teams.name, params.teamIdentifier)))
      .get();

    if (!team) {
      throw new Error(`Team **${params.teamIdentifier}** was not found.`);
    }

    // Calculate placement points based on game preset or standard BGIS rule
    const preset = GAME_PRESETS[lobby.gameType] || GAME_PRESETS.BGMI;
    const placementPoints = preset.defaultPointSystem?.placements[params.placement] || 0;
    const killMultiplier = preset.defaultPointSystem?.killPoints || 1;
    const totalPoints = placementPoints + (params.kills * killMultiplier);

    const resultId = randomUUID().slice(0, 8);
    const round = params.matchRound || 1;

    await db.insert(scrimMatchResults).values({
      resultId,
      lobbyId: params.lobbyId,
      teamId: team.teamId,
      matchRound: round,
      placement: params.placement,
      placementPoints,
      kills: params.kills,
      totalPoints,
    });

    return {
      teamName: team.name,
      placement: params.placement,
      placementPoints,
      kills: params.kills,
      totalPoints,
      round,
    };
  }

  /**
   * Get sorted Points Table leaderboard for a lobby
   */
  public static async getLeaderboard(lobbyId: string, round?: number) {
    const lobby = await db.select().from(scrimLobbies).where(eq(scrimLobbies.lobbyId, lobbyId)).get();
    if (!lobby) throw new Error(`Lobby \`${lobbyId}\` does not exist.`);

    const condition = round 
      ? and(eq(scrimMatchResults.lobbyId, lobbyId), eq(scrimMatchResults.matchRound, round))
      : eq(scrimMatchResults.lobbyId, lobbyId);

    const results = await db.select({
      teamName: teams.name,
      teamTag: teams.tag,
      placement: scrimMatchResults.placement,
      placementPoints: scrimMatchResults.placementPoints,
      kills: scrimMatchResults.kills,
      totalPoints: scrimMatchResults.totalPoints,
      round: scrimMatchResults.matchRound,
    })
      .from(scrimMatchResults)
      .innerJoin(teams, eq(scrimMatchResults.teamId, teams.teamId))
      .where(condition)
      .orderBy(desc(scrimMatchResults.totalPoints), desc(scrimMatchResults.kills))
      .all();

    return {
      lobby,
      results,
    };
  }

  /**
   * Reset points for a lobby
   */
  public static async resetResults(lobbyId: string) {
    await db.delete(scrimMatchResults).where(eq(scrimMatchResults.lobbyId, lobbyId));
  }
}
