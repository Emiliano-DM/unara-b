import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api');

  // Enable CORS for WebSocket and HTTP
  app.enableCors({
    origin: true, // Allow all origins in development
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
    })
  );

  const port = process.env.PORT ?? 3000;
  await app.listen(port, '0.0.0.0'); // Listen on all network interfaces
  console.log(`🚀 Application is running on: http://localhost:${port}`);
  console.log(`📡 WebSocket server ready on: ws://localhost:${port}`);
  console.log(`📱 Mobile devices can connect to: http://192.168.1.133:${port}`);
}
bootstrap();
