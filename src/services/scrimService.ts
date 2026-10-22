import { eq, and, sql, asc } from 'drizzle-orm';
import { db, scrimLobbies, slotRegistrations, teams, guilds } from '../db/index.js';
import { randomUUID } from 'node:crypto';

export class ScrimService {
  /**
   * Ensure guild configuration exists in database
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

    const lobbyId = randomUUID().slice(0, 8);

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
   * Cancel a Scrim Lobby
   */
  public static async cancelLobby(lobbyId: string) {
    const lobby = await db.select().from(scrimLobbies).where(eq(scrimLobbies.lobbyId, lobbyId)).get();
    if (!lobby) throw new Error(`Lobby \`${lobbyId}\` does not exist.`);

    await db.update(scrimLobbies)
      .set({ status: 'CANCELLED' })
      .where(eq(scrimLobbies.lobbyId, lobbyId));

    return lobby;
  }

  /**
   * Update Status for a Lobby (e.g. OPEN, LIVE, COMPLETED, SCHEDULED, CANCELLED)
   */
  public static async setStatus(lobbyId: string, status: string) {
    const lobby = await db.select().from(scrimLobbies).where(eq(scrimLobbies.lobbyId, lobbyId)).get();
    if (!lobby) throw new Error("Lobby `" + lobbyId + "` does not exist.");

    await db.update(scrimLobbies)
      .set({ status })
      .where(eq(scrimLobbies.lobbyId, lobbyId));

    return lobby;
  }

  /**
   * Pre-reserve a Slot for an Invited / VIP Team
   */
  public static async reserveSlot(params: {
    guildId: string;
    lobbyId: string;
    slotNumber: number;
    teamName: string;
    captainDiscordId: string;
  }) {
    const lobby = await db.select().from(scrimLobbies).where(eq(scrimLobbies.lobbyId, params.lobbyId)).get();
    if (!lobby) throw new Error(`Lobby \`${params.lobbyId}\` does not exist.`);

    if (params.slotNumber > lobby.totalSlots || params.slotNumber < 1) {
      throw new Error(`Slot number must be between 1 and ${lobby.totalSlots}.`);
    }

    // Check if slot is already occupied
    const occupied = await db.select().from(slotRegistrations)
      .where(and(eq(slotRegistrations.lobbyId, params.lobbyId), eq(slotRegistrations.slotNumber, params.slotNumber)))
      .get();

    if (occupied) {
      throw new Error(`Slot #${params.slotNumber} is already occupied!`);
    }

    // Get or create team
    let team = await db.select().from(teams)
      .where(and(eq(teams.guildId, params.guildId), eq(teams.name, params.teamName)))
      .get();

    if (!team) {
      const teamId = randomUUID().slice(0, 8);
      await db.insert(teams).values({
        teamId,
        guildId: params.guildId,
        name: params.teamName,
        captainDiscordId: params.captainDiscordId,
      });
      team = {
        teamId,
        guildId: params.guildId,
        name: params.teamName,
        tag: null,
        captainDiscordId: params.captainDiscordId,
        logoUrl: null,
        createdAt: new Date().toISOString(),
      };
    }

    const registrationId = randomUUID().slice(0, 8);
    await db.insert(slotRegistrations).values({
      registrationId,
      lobbyId: params.lobbyId,
      teamId: team.teamId,
      slotNumber: params.slotNumber,
      isWaitlist: false,
      isReserved: true,
      checkedIn: true, // Reserved teams are pre-checked
    });

    // Increment reserved count
    await db.update(scrimLobbies)
      .set({ reservedSlotsCount: sql`${scrimLobbies.reservedSlotsCount} + 1` })
      .where(eq(scrimLobbies.lobbyId, params.lobbyId));

    return {
      slotNumber: params.slotNumber,
      teamName: params.teamName,
    };
  }

  /**
   * Register a Team (with slot rush concurrency & waitlist overflow)
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

    // 3. Find next available slot number (skipping reserved slots)
    const confirmedSlots = await db.select()
      .from(slotRegistrations)
      .where(and(eq(slotRegistrations.lobbyId, params.lobbyId), eq(slotRegistrations.isWaitlist, false)))
      .all();

    const currentCount = confirmedSlots.length;
    const registrationId = randomUUID().slice(0, 8);

    if (currentCount < lobby.totalSlots) {
      // Find lowest unfilled slot number from 1 to totalSlots
      const takenSlotNumbers = new Set(confirmedSlots.map((s) => s.slotNumber));
      let availableSlot = 1;
      while (takenSlotNumbers.has(availableSlot) && availableSlot <= lobby.totalSlots) {
        availableSlot++;
      }

      await db.insert(slotRegistrations).values({
        registrationId,
        lobbyId: params.lobbyId,
        teamId: team.teamId,
        slotNumber: availableSlot,
        isWaitlist: false,
        isReserved: false,
        checkedIn: false,
      });

      return {
        status: 'CONFIRMED' as const,
        slotNumber: availableSlot,
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
        isReserved: false,
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
   * Leave / Forfeit Slot (Auto-promotes Waitlist #1)
   */
  public static async leaveTeam(lobbyId: string, captainDiscordId: string) {
    // Find team registered under this captain
    const reg = await db.select({
      registrationId: slotRegistrations.registrationId,
      slotNumber: slotRegistrations.slotNumber,
      isWaitlist: slotRegistrations.isWaitlist,
      teamId: teams.teamId,
      teamName: teams.name,
    })
      .from(slotRegistrations)
      .innerJoin(teams, eq(slotRegistrations.teamId, teams.teamId))
      .where(and(eq(slotRegistrations.lobbyId, lobbyId), eq(teams.captainDiscordId, captainDiscordId)))
      .get();

    if (!reg) {
      throw new Error('You do not have any registered team in this lobby to withdraw.');
    }

    // Delete the registration
    await db.delete(slotRegistrations).where(eq(slotRegistrations.registrationId, reg.registrationId));

    let promotedTeam: { name: string; captainId: string; slotNumber: number } | null = null;

    // If a confirmed slot left, promote Waitlist #1
    if (!reg.isWaitlist && reg.slotNumber) {
      const firstWaitlist = await db.select({
        registrationId: slotRegistrations.registrationId,
        teamId: teams.teamId,
        teamName: teams.name,
        captainId: teams.captainDiscordId,
      })
        .from(slotRegistrations)
        .innerJoin(teams, eq(slotRegistrations.teamId, teams.teamId))
        .where(and(eq(slotRegistrations.lobbyId, lobbyId), eq(slotRegistrations.isWaitlist, true)))
        .orderBy(asc(slotRegistrations.waitlistPosition))
        .get();

      if (firstWaitlist) {
        await db.update(slotRegistrations)
          .set({
            isWaitlist: false,
            slotNumber: reg.slotNumber,
            waitlistPosition: null,
          })
          .where(eq(slotRegistrations.registrationId, firstWaitlist.registrationId));

        promotedTeam = {
          name: firstWaitlist.teamName,
          captainId: firstWaitlist.captainId,
          slotNumber: reg.slotNumber,
        };
      }
    }

    return {
      leftTeamName: reg.teamName,
      freedSlotNumber: reg.slotNumber,
      promotedTeam,
    };
  }

  /**
   * Admin Kick Team (Auto-promotes Waitlist #1)
   */
  public static async kickTeam(lobbyId: string, targetIdentifier: string) {
    // Search by slot number if numeric, or team name
    const slotNum = parseInt(targetIdentifier, 10);

    const condition = !isNaN(slotNum)
      ? and(eq(slotRegistrations.lobbyId, lobbyId), eq(slotRegistrations.slotNumber, slotNum))
      : and(eq(slotRegistrations.lobbyId, lobbyId), eq(teams.name, targetIdentifier));

    const reg = await db.select({
      registrationId: slotRegistrations.registrationId,
      slotNumber: slotRegistrations.slotNumber,
      isWaitlist: slotRegistrations.isWaitlist,
      teamName: teams.name,
      captainId: teams.captainDiscordId,
    })
      .from(slotRegistrations)
      .innerJoin(teams, eq(slotRegistrations.teamId, teams.teamId))
      .where(condition)
      .get();

    if (!reg) {
      throw new Error(`Team or Slot \`${targetIdentifier}\` was not found in lobby \`${lobbyId}\`.`);
    }

    // Delete registration
    await db.delete(slotRegistrations).where(eq(slotRegistrations.registrationId, reg.registrationId));

    let promotedTeam: { name: string; captainId: string; slotNumber: number } | null = null;

    if (!reg.isWaitlist && reg.slotNumber) {
      const firstWaitlist = await db.select({
        registrationId: slotRegistrations.registrationId,
        teamId: teams.teamId,
        teamName: teams.name,
        captainId: teams.captainDiscordId,
      })
        .from(slotRegistrations)
        .innerJoin(teams, eq(slotRegistrations.teamId, teams.teamId))
        .where(and(eq(slotRegistrations.lobbyId, lobbyId), eq(slotRegistrations.isWaitlist, true)))
        .orderBy(asc(slotRegistrations.waitlistPosition))
        .get();

      if (firstWaitlist) {
        await db.update(slotRegistrations)
          .set({
            isWaitlist: false,
            slotNumber: reg.slotNumber,
            waitlistPosition: null,
          })
          .where(eq(slotRegistrations.registrationId, firstWaitlist.registrationId));

        promotedTeam = {
          name: firstWaitlist.teamName,
          captainId: firstWaitlist.captainId,
          slotNumber: reg.slotNumber,
        };
      }
    }

    return {
      kickedTeamName: reg.teamName,
      slotNumber: reg.slotNumber,
      promotedTeam,
    };
  }

  /**
   * Check-in Team
   */
  public static async checkInTeam(lobbyId: string, captainDiscordId: string) {
    const reg = await db.select({
      registrationId: slotRegistrations.registrationId,
      slotNumber: slotRegistrations.slotNumber,
      checkedIn: slotRegistrations.checkedIn,
      teamName: teams.name,
    })
      .from(slotRegistrations)
      .innerJoin(teams, eq(slotRegistrations.teamId, teams.teamId))
      .where(and(
        eq(slotRegistrations.lobbyId, lobbyId),
        eq(teams.captainDiscordId, captainDiscordId),
        eq(slotRegistrations.isWaitlist, false)
      ))
      .get();

    if (!reg) {
      throw new Error('Only captains with a confirmed slot can check in.');
    }

    if (reg.checkedIn) {
      return { alreadyChecked: true, teamName: reg.teamName, slotNumber: reg.slotNumber };
    }

    await db.update(slotRegistrations)
      .set({ checkedIn: true })
      .where(eq(slotRegistrations.registrationId, reg.registrationId));

    return { alreadyChecked: false, teamName: reg.teamName, slotNumber: reg.slotNumber };
  }

  /**
   * Ephemeral Room ID & Password retrieval (Feature 1: Secure IDP delivery)
   */
  public static async getRoomCredentialsForUser(lobbyId: string, userId: string) {
    const lobby = await db.select().from(scrimLobbies).where(eq(scrimLobbies.lobbyId, lobbyId)).get();
    if (!lobby) throw new Error(`Lobby \`${lobbyId}\` does not exist.`);

    if (!lobby.roomId || !lobby.roomPassword) {
      throw new Error('Room credentials (ID & Password) have not been posted yet by the event organizers.');
    }

    // Verify if user is captain of a confirmed slot
    const reg = await db.select({
      slotNumber: slotRegistrations.slotNumber,
      teamName: teams.name,
    })
      .from(slotRegistrations)
      .innerJoin(teams, eq(slotRegistrations.teamId, teams.teamId))
      .where(and(
        eq(slotRegistrations.lobbyId, lobbyId),
        eq(teams.captainDiscordId, userId),
        eq(slotRegistrations.isWaitlist, false)
      ))
      .get();

    if (!reg) {
      throw new Error('Access denied: You are not a verified captain of a confirmed slot in this lobby.');
    }

    return {
      lobbyTitle: lobby.title,
      roomId: lobby.roomId,
      roomPassword: lobby.roomPassword,
      teamName: reg.teamName,
      slotNumber: reg.slotNumber,
    };
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
      isReserved: slotRegistrations.isReserved,
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
