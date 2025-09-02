import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api');

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );

  // Swagger/OpenAPI setup
  const config = new DocumentBuilder()
    .setTitle('Unara Travel Planning API')
    .setDescription(
      'A comprehensive travel planning application API that allows users to create trips, manage luggage, organize items, and collaborate with trip participants.',
    )
    .setVersion('1.0')
    .addTag(
      'auth',
      'Authentication endpoints for user registration, login, and profile management',
    )
    .addTag(
      'trips',
      'Trip management endpoints for creating, updating, and managing travel trips',
    )
    .addTag(
      'luggage',
      'Luggage management endpoints for organizing travel luggage',
    )
    .addTag(
      'items',
      'Item management endpoints for planning and tracking travel items',
    )
    .addTag('users', 'User management endpoints for profile and user discovery')
    .addTag(
      'categories',
      'Category management for organizing luggage and items',
    )
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token',
        in: 'header',
      },
      'JWT-auth',
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    customSiteTitle: 'Unara API Documentation',
    customfavIcon: '/favicon.ico',
    customCss: '.swagger-ui .topbar { display: none }',
    swaggerOptions: {
      persistAuthorization: true,
      docExpansion: 'none',
      filter: true,
      showRequestDuration: true,
    },
  });

  await app.listen(process.env.PORT ?? 3002);
}
bootstrap();
