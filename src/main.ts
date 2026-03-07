import { NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as dns from 'dns';

// Fix for Node 17+ resolving IPv6 first and causing ENETUNREACH in Render
dns.setDefaultResultOrder('ipv4first');

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Security Middleware
  app.use(helmet());
  app.enableCors();

  // Global Validation Pipe for DTOs
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  // Swagger OpenAPI Configuration
  const config = new DocumentBuilder()
    .setTitle('Alumni Connect Super App API')
    .setDescription(
      'Production-ready REST API for the Alumni Connect Super App. ' +
      'All routes require Bearer JWT authentication except /auth/register, /auth/login, and /health.',
    )
    .setVersion('1.0')
    .addBearerAuth(
      { type: 'http', scheme: 'bearer', bearerFormat: 'JWT', in: 'header' },
      'access-token',
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`\n🚀 Alumni Connect API running at: http://localhost:${port}`);
  console.log(`📖 Swagger docs:           http://localhost:${port}/api/docs\n`);
}

bootstrap();
