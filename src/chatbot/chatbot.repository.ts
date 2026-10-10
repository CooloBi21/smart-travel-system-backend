import { Injectable } from '@nestjs/common';

import { DatabaseService } from '../database/database.service';

export interface ChatSessionRecord {
  id: number;
  userId: number | null;
  startedAt: Date | null;
  endedAt: Date | null;
}

export interface ChatMessageRecord {
  id: number;
  sessionId: number;
  senderType: string;
  messageText: string;
  intentDetected: string | null;
  createdAt: Date | null;
}

@Injectable()
export class ChatbotRepository {
  constructor(
    private readonly databaseService: DatabaseService,
  ) {}

  async findSessionByIdForUser(
    sessionId: number,
    userId: number,
  ): Promise<ChatSessionRecord | null> {
    const result =
      await this.databaseService.query<ChatSessionRecord>(
        `
          SELECT
            id,
            user_id AS "userId",
            started_at AS "startedAt",
            ended_at AS "endedAt"
          FROM public.chat_sessions
          WHERE id = $1
            AND user_id = $2
        `,
        [sessionId, userId],
      );

    return result.rows[0] ?? null;
  }

  async createSession(
    userId: number,
  ): Promise<ChatSessionRecord> {
    const result =
      await this.databaseService.query<ChatSessionRecord>(
        `
          INSERT INTO public.chat_sessions (user_id)
          VALUES ($1)
          RETURNING
            id,
            user_id AS "userId",
            started_at AS "startedAt",
            ended_at AS "endedAt"
        `,
        [userId],
      );

    const session = result.rows[0];

    if (!session) {
      throw new Error(
        'Creating a chat session returned no row.',
      );
    }

    return session;
  }

  async saveMessage(
    sessionId: number,
    senderType: string,
    messageText: string,
    intentDetected: string | null,
  ): Promise<ChatMessageRecord> {
    const result =
      await this.databaseService.query<ChatMessageRecord>(
        `
          INSERT INTO public.chat_messages (
            session_id,
            sender_type,
            message_text,
            intent_detected
          )
          VALUES ($1, $2, $3, $4)
          RETURNING
            id,
            session_id AS "sessionId",
            sender_type AS "senderType",
            message_text AS "messageText",
            intent_detected AS "intentDetected",
            created_at AS "createdAt"
        `,
        [
          sessionId,
          senderType,
          messageText,
          intentDetected,
        ],
      );

    const message = result.rows[0];

    if (!message) {
      throw new Error(
        'Saving a chat message returned no row.',
      );
    }

    return message;
  }

  async getMessages(
    sessionId: number,
  ): Promise<ChatMessageRecord[]> {
    const result =
      await this.databaseService.query<ChatMessageRecord>(
        `
          SELECT
            id,
            session_id AS "sessionId",
            sender_type AS "senderType",
            message_text AS "messageText",
            intent_detected AS "intentDetected",
            created_at AS "createdAt"
          FROM public.chat_messages
          WHERE session_id = $1
          ORDER BY created_at ASC, id ASC
        `,
        [sessionId],
      );

    return result.rows;
  }
}
