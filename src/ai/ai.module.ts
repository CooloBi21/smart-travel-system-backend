import { Module } from '@nestjs/common';

import { AiService } from './ai.service';
import { RuleBasedAiProvider } from './providers/rule-based-ai.provider';

@Module({
  providers: [
    AiService,
    {
      provide: 'AI_PROVIDER',
      useClass: RuleBasedAiProvider,
    },
  ],
  exports: [
    AiService,
  ],
})
export class AiModule {}
