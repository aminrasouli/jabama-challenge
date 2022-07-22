import { NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { ClassSerializerInterceptor, Logger, ValidationPipe } from '@nestjs/common';
import { utilities as nestWinstonModuleUtilities, WinstonModule } from 'nest-winston';
import * as winston from 'winston';
import { default as Sentry } from 'winston-transport-sentry-node';

async function bootstrap() {
  const configService: ConfigService = new ConfigService();

  const isSentryEnabled = configService.get('SENTRY_ENABLED') === 'true';
  const isLoggedFileEnabled = configService.get('LOG_FILE_ENABLED') === 'true';

  const app = await NestFactory.create(AppModule, {
    logger: WinstonModule.createLogger({
      transports: [
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.ms(),
            nestWinstonModuleUtilities.format.nestLike('App', {
              colors: true,
            }),
          ),
        }),
        ...(isLoggedFileEnabled
          ? [
              new winston.transports.File({
                filename: configService.get('LOG_FILE'),
                format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
              }),
            ]
          : []),
        ...(isSentryEnabled
          ? [
              new Sentry({
                sentry: {
                  dsn: configService.get('SENTRY_DSN'),
                },
                level: 'error',
              }),
            ]
          : []),
      ],
    }),
  });

  const logger = new Logger('Bootstrap');

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)));

  app.setGlobalPrefix('api');

  const config = new DocumentBuilder()
    .setTitle('Jabama Challenge Api')
    .setDescription('Jabama Challenge Api Based on documentation')
    .setExternalDoc('OpenAPI Json Schema', '/api/docs-json')
    .setVersion('0.1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = configService.get<number>('PORT') || 3000;
  await app.listen(Number(port));
  logger.log(`App listening on port ${port}`);
}

bootstrap();
