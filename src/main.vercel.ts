import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/global-exception.filter';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';
import { LocaleMiddleware } from './common/middleware/locale.middleware';

let app: any;

async function createApp() {
  if (!app) {
    try {
      app = await NestFactory.create(AppModule, {
        logger: ['error', 'warn', 'log'],
      });

      const config = app.get(ConfigService);

      const allowedOrigins = [
        (config.get('FRONTEND_URL') as string) ?? 'http://localhost:3001',
        (config.get('DASHBOARD_URL') as string) ?? 'http://localhost:3002',
      ];

      app.enableCors({
        origin: (
          origin: string | undefined,
          callback: (err: Error | null, allow?: boolean) => void,
        ) => {
          if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
          } else {
            callback(new Error('Not allowed by CORS'));
          }
        },
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'Accept-Language'],
      });

      app.setGlobalPrefix('api/v1');
      app.use(cookieParser());

      const localeMiddleware = new LocaleMiddleware();
      app.use(localeMiddleware.use.bind(localeMiddleware));

      app.useGlobalFilters(new HttpExceptionFilter());
      app.useGlobalInterceptors(new ResponseInterceptor());
      app.useGlobalPipes(
        new ValidationPipe({
          whitelist: true,
          forbidNonWhitelisted: true,
          transform: true,
        }),
      );

      await app.init();
      console.log('NestJS app initialized successfully');
    } catch (error) {
      console.error('Failed to initialize NestJS app:', error);
      throw error;
    }
  }
  return app;
}

export default async (req: any, res: any) => {
  try {
    const nestApp = await createApp();
    const server = nestApp.getHttpAdapter().getInstance();
    server(req, res);
  } catch (error) {
    console.error('Serverless function error:', error);
    if (!res.headersSent) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      res.status(500).json({ error: 'Internal server error', message });
    }
  }
};
