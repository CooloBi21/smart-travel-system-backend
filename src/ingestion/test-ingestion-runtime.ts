import { NestFactory } from '@nestjs/core';

import { AppModule } from '../app.module';
import { IngestionService } from './ingestion.service';

async function main() {
  const app = await NestFactory.createApplicationContext(AppModule);

  try {
    const ingestionService = app.get(IngestionService);

    console.log('=== M5.5 INGESTION RUNTIME TEST ===');
    console.log('Source: VNTOURISM_DEST');
    console.log('Page: 1');

    const result =
      await ingestionService.ingestVietnamTourismPage(1);

    console.log('\n=== RESULT ===');
    console.dir(result, { depth: null });
  } catch (error) {
    console.error('\n=== INGESTION FAILED ===');
    console.error(error);
    process.exitCode = 1;
  } finally {
    await app.close();
  }
}

void main();
