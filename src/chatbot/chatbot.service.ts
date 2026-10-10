import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { AiService } from '../ai/ai.service';

import { ChatbotRepository } from './chatbot.repository';

@Injectable()
export class ChatbotService {
  constructor(
    private readonly aiService: AiService,
    private readonly chatbotRepository: ChatbotRepository,
  ) {}

  async generateResponse(
    userId: number,
    message: string,
    sessionId?: number,
  ) {
    const normalizedMessage = message.trim();

    if (!normalizedMessage) {
      throw new BadRequestException(
        'Vui lòng nhập nội dung cần tư vấn.',
      );
    }

    let activeSessionId = sessionId;

    if (activeSessionId === undefined) {
      const session =
        await this.chatbotRepository.createSession(userId);

      activeSessionId = session.id;
    } else {
      const session =
        await this.chatbotRepository.findSessionByIdForUser(
          activeSessionId,
          userId,
        );

      if (!session) {
        throw new NotFoundException(
          'Không tìm thấy cuộc hội thoại.',
        );
      }
    }

    await this.chatbotRepository.saveMessage(
      activeSessionId,
      'CUSTOMER',
      normalizedMessage,
      null,
    );

    const aiResult = await this.aiService.recommend({
      interests: [normalizedMessage],
    });

    const response = this.buildResponse(
      aiResult.reasons,
    );

    await this.chatbotRepository.saveMessage(
      activeSessionId,
      'AI_ASSISTANT',
      response,
      null,
    );

    return {
      sessionId: activeSessionId,
      message: response,
      source: 'RULE_BASED',
      score: aiResult.score,
      generatedAt: new Date().toISOString(),
    };
  }

  private buildResponse(
    reasons: string[],
  ): string {
    if (reasons.length === 0) {
      return 'Tôi cần thêm thông tin về sở thích của bạn để đưa ra gợi ý phù hợp.';
    }

    return [
      'Dựa trên thông tin bạn cung cấp, tôi có một số gợi ý:',
      ...reasons.map(
        (reason, index) =>
          `${index + 1}. ${reason}`,
      ),
    ].join('\n');
  }
}
