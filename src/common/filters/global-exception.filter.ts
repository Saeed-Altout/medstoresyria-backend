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
import { translate, getLocaleFromHeader, MessageKey } from '../i18n/messages';

interface ErrorResponse {
  success: false;
  statusCode: number;
  message: string;
  errors: string[] | null;
  data: null;
  meta: null;
}

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const request = ctx.getRequest<Request>();
    const response = ctx.getResponse<Response>();

    const locale = getLocaleFromHeader(request.headers['accept-language']);

    let statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = translate('INTERNAL_ERROR', locale);
    let errors: string[] | null = null;

    if (exception instanceof AppException) {
      statusCode = exception.getStatus();
      message = translate(exception.messageKey, locale);
    } else if (exception instanceof HttpException) {
      statusCode = exception.getStatus();
      const body = exception.getResponse();

      if (typeof body === 'object' && body !== null && 'message' in body) {
        const rawMessage = (body as { message: unknown }).message;
        if (Array.isArray(rawMessage)) {
          message = translate('VALIDATION_FAILED', locale);
          errors = rawMessage as string[];
        } else if (typeof rawMessage === 'string') {
          message = rawMessage;
        }
      } else if (typeof body === 'string') {
        message = body;
      }
    } else {
      this.logger.error(exception);
    }

    const body: ErrorResponse = {
      success: false,
      statusCode,
      message,
      errors,
      data: null,
      meta: null,
    };

    response.status(statusCode).json(body);
  }
}
