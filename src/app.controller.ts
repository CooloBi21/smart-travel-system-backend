import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
  @Get('health')
  health() {
    return {
      status: 'success',
      service: 'Smart Travel System API',
      architecture: 'NestJS V2',
    };
  }
}
