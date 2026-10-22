import { eq, and, sql, asc } from 'drizzle-orm';
import { db, scrimLobbies, slotRegistrations, teams, guilds } from '../db/index.js';
import { randomUUID } from 'node:crypto';

export class ScrimService {
  /**
   * Ensure guild exists in database
   */
  public static async ensureGuild(guildId: string, guildName: string) {
    const existing = await db.select().from(guilds).where(eq(guilds.guildId, guildId)).get();
    if (!existing) {
      await db.insert(guilds).values({
        guildId,
        name: guildName,
      });
    }
  }

  /**
   * Create a new Scrim Lobby
   */
  public static async createLobby(params: {
    guildId: string;
    guildName: string;
    title: string;
    tier: string;
    gameType: string;
    totalSlots: number;
    scheduledAt?: string;
  }) {
    await this.ensureGuild(params.guildId, params.guildName);

    const lobbyId = randomUUID().slice(0, 8); // Clean 8-char identifier

    await db.insert(scrimLobbies).values({
      lobbyId,
      guildId: params.guildId,
      title: params.title,
      tier: params.tier,
      gameType: params.gameType,
      totalSlots: params.totalSlots,
      status: 'SCHEDULED',
      scheduledAt: params.scheduledAt,
    });

    return lobbyId;
  }

  /**
   * Open Registration for a Lobby
   */
  public static async openRegistration(lobbyId: string, channelId: string) {
    const lobby = await db.select().from(scrimLobbies).where(eq(scrimLobbies.lobbyId, lobbyId)).get();
    if (!lobby) throw new Error(`Lobby \`${lobbyId}\` does not exist.`);

    await db.update(scrimLobbies)
      .set({
        status: 'OPEN',
        registrationChannelId: channelId,
      })
      .where(eq(scrimLobbies.lobbyId, lobbyId));

    return lobby;
  }

  /**
   * Close Registration for a Lobby
   */
  public static async closeRegistration(lobbyId: string) {
    const lobby = await db.select().from(scrimLobbies).where(eq(scrimLobbies.lobbyId, lobbyId)).get();
    if (!lobby) throw new Error(`Lobby \`${lobbyId}\` does not exist.`);

    await db.update(scrimLobbies)
      .set({ status: 'CLOSED' })
      .where(eq(scrimLobbies.lobbyId, lobbyId));

    return lobby;
  }

  /**
   * Register a Team into a Scrim Lobby (Handles slot rush & waitlists)
   */
  public static async registerTeam(params: {
    guildId: string;
    lobbyId: string;
    teamName: string;
    teamTag?: string;
    captainDiscordId: string;
  }) {
    const lobby = await db.select().from(scrimLobbies).where(eq(scrimLobbies.lobbyId, params.lobbyId)).get();
    if (!lobby) throw new Error(`Lobby \`${params.lobbyId}\` does not exist.`);
    if (lobby.status !== 'OPEN') throw new Error(`Registration is currently ${lobby.status} for lobby \`${params.lobbyId}\`.`);

    // 1. Get or create the team
    let team = await db.select().from(teams)
      .where(and(eq(teams.guildId, params.guildId), eq(teams.name, params.teamName)))
      .get();

    if (!team) {
      const teamId = randomUUID().slice(0, 8);
      await db.insert(teams).values({
        teamId,
        guildId: params.guildId,
        name: params.teamName,
        tag: params.teamTag,
        captainDiscordId: params.captainDiscordId,
      });
      team = {
        teamId,
        guildId: params.guildId,
        name: params.teamName,
        tag: params.teamTag || null,
        captainDiscordId: params.captainDiscordId,
        logoUrl: null,
        createdAt: new Date().toISOString(),
      };
    }

    // 2. Check if already registered in this lobby
    const existingReg = await db.select().from(slotRegistrations)
      .where(and(eq(slotRegistrations.lobbyId, params.lobbyId), eq(slotRegistrations.teamId, team.teamId)))
      .get();

    if (existingReg) {
      throw new Error(`Team **${params.teamName}** is already registered in this lobby!`);
    }

    // 3. Count currently confirmed slots
    const confirmedSlots = await db.select({ count: sql<number>`count(*)` })
      .from(slotRegistrations)
      .where(and(eq(slotRegistrations.lobbyId, params.lobbyId), eq(slotRegistrations.isWaitlist, false)))
      .get();

    const currentConfirmed = confirmedSlots?.count || 0;
    const registrationId = randomUUID().slice(0, 8);

    if (currentConfirmed < lobby.totalSlots) {
      // Confirmed Slot allocation
      const nextSlotNumber = currentConfirmed + 1;
      await db.insert(slotRegistrations).values({
        registrationId,
        lobbyId: params.lobbyId,
        teamId: team.teamId,
        slotNumber: nextSlotNumber,
        isWaitlist: false,
        checkedIn: false,
      });

      return {
        status: 'CONFIRMED' as const,
        slotNumber: nextSlotNumber,
        teamName: params.teamName,
      };
    } else {
      // Overflow into Waitlist
      const waitlistSlots = await db.select({ count: sql<number>`count(*)` })
        .from(slotRegistrations)
        .where(and(eq(slotRegistrations.lobbyId, params.lobbyId), eq(slotRegistrations.isWaitlist, true)))
        .get();

      const waitlistPos = (waitlistSlots?.count || 0) + 1;
      await db.insert(slotRegistrations).values({
        registrationId,
        lobbyId: params.lobbyId,
        teamId: team.teamId,
        slotNumber: null,
        isWaitlist: true,
        waitlistPosition: waitlistPos,
        checkedIn: false,
      });

      return {
        status: 'WAITLIST' as const,
        waitlistPosition: waitlistPos,
        teamName: params.teamName,
      };
    }
  }

  /**
   * Fetch full slotlist for a lobby
   */
  public static async getSlotlist(lobbyId: string) {
    const lobby = await db.select().from(scrimLobbies).where(eq(scrimLobbies.lobbyId, lobbyId)).get();
    if (!lobby) throw new Error(`Lobby \`${lobbyId}\` does not exist.`);

    const confirmed = await db.select({
      slotNumber: slotRegistrations.slotNumber,
      teamName: teams.name,
      teamTag: teams.tag,
      captainId: teams.captainDiscordId,
      checkedIn: slotRegistrations.checkedIn,
    })
      .from(slotRegistrations)
      .innerJoin(teams, eq(slotRegistrations.teamId, teams.teamId))
      .where(and(eq(slotRegistrations.lobbyId, lobbyId), eq(slotRegistrations.isWaitlist, false)))
      .orderBy(asc(slotRegistrations.slotNumber))
      .all();

    const waitlist = await db.select({
      position: slotRegistrations.waitlistPosition,
      teamName: teams.name,
      captainId: teams.captainDiscordId,
    })
      .from(slotRegistrations)
      .innerJoin(teams, eq(slotRegistrations.teamId, teams.teamId))
      .where(and(eq(slotRegistrations.lobbyId, lobbyId), eq(slotRegistrations.isWaitlist, true)))
      .orderBy(asc(slotRegistrations.waitlistPosition))
      .all();

    return {
      lobby,
      confirmed,
      waitlist,
    };
  }

  /**
   * Set Room ID & Password (IDP)
   */
  public static async setRoomCredentials(lobbyId: string, roomId: string, roomPassword: string) {
    const lobby = await db.select().from(scrimLobbies).where(eq(scrimLobbies.lobbyId, lobbyId)).get();
    if (!lobby) throw new Error(`Lobby \`${lobbyId}\` does not exist.`);

    await db.update(scrimLobbies)
      .set({ roomId, roomPassword })
      .where(eq(scrimLobbies.lobbyId, lobbyId));

    return lobby;
  }
}
