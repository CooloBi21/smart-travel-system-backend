import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { IngestionService } from './ingestion.service';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(
    AppModule,
  );

  try {
    const ingestionService =
      app.get(IngestionService);

    const result =
      await ingestionService.ingestNominatimDestinations();

    console.log(
      JSON.stringify(result, null, 2),
    );
  } finally {
    await app.close();
  }
}

bootstrap().catch((error) => {
  console.error(error);
});
