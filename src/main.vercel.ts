import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import cookieParser from 'cookie-parser';
import serverlessHttp from 'serverless-http';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/global-exception.filter';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';
import { LocaleMiddleware } from './common/middleware/locale.middleware';

let cachedHandler: ReturnType<typeof serverlessHttp>;

async function createHandler() {
  const app = await NestFactory.create(AppModule, { logger: false });
  const config = app.get(ConfigService);

  const allowedOrigins = [
    config.get<string>('FRONTEND_URL') ?? 'http://localhost:3001',
    config.get<string>('DASHBOARD_URL') ?? 'http://localhost:3002',
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
  const expressApp = app.getHttpAdapter().getInstance();
  return serverlessHttp(expressApp);
}

export default async function handler(req: any, res: any) {
  if (!cachedHandler) {
    cachedHandler = await createHandler();
  }
  return cachedHandler(req, res);
}
