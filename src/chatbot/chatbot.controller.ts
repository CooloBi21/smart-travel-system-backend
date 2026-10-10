import {
  Body,
  Controller,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';

import { ChatbotService } from './chatbot.service';
import { SendMessageDto } from './dto/send-message.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('chatbot')
@UseGuards(JwtAuthGuard)
export class ChatbotController {
  constructor(
    private readonly chatbotService: ChatbotService,
  ) {}

  @Post('messages')
  async sendMessage(
    @Req() request: {
      user: {
        id: number;
      };
    },
    @Body() dto: SendMessageDto,
  ) {
    return this.chatbotService.generateResponse(
      request.user.id,
      dto.message,
      dto.sessionId,
    );
  }
}
