import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { AppException } from '../exceptions/app.exception';
import { translate, MessageKey } from '../i18n/messages';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const request = ctx.getRequest<Request>();
    const response = ctx.getResponse<Response>();

    const locale: string = request.locale ?? 'en';

    let statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = translate('INTERNAL_ERROR', locale);
    let errors: Array<{ field?: string; en: string; ar: string }> | null = null;

    if (exception instanceof AppException) {
      statusCode = exception.getStatus();
      message = translate(exception.messageKey, locale, exception.params);
    } else if (exception instanceof HttpException) {
      statusCode = exception.getStatus();
      const body = exception.getResponse();

      if (typeof body === 'object' && body !== null && 'message' in body) {
        const rawMessage = (body as { message: unknown }).message;
        if (Array.isArray(rawMessage)) {
          message = translate('VALIDATION_FAILED', locale);
          errors = rawMessage.map((msg: unknown) => {
            if (typeof msg === 'string') {
              try {
                const parsed = JSON.parse(msg) as { field?: string; en: string; ar: string };
                return parsed;
              } catch {
                return { en: msg, ar: msg };
              }
            }
            return { en: String(msg), ar: String(msg) };
          });
        } else if (typeof rawMessage === 'string') {
          message = rawMessage;
        }
      } else if (typeof body === 'string') {
        message = body;
      }
    } else {
      this.logger.error(exception);
    }

    response.status(statusCode).json({
      success: false,
      statusCode,
      message,
      errors,
      data: null,
      meta: null,
    });
  }
}

// Re-export under old name for backwards compat within this session
export { HttpExceptionFilter as GlobalExceptionFilter };
