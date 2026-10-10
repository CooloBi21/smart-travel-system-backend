import { Module } from '@nestjs/common';

import { ChatbotController } from './chatbot.controller';
import { ChatbotRepository } from './chatbot.repository';
import { ChatbotService } from './chatbot.service';
import { AiModule } from '../ai/ai.module';

@Module({
  imports: [
    AiModule,
  ],
  controllers: [
    ChatbotController,
  ],
  providers: [
    ChatbotRepository,
    ChatbotService,
  ],
  exports: [
    ChatbotService,
  ],
})
export class ChatbotModule {}
