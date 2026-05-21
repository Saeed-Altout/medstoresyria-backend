import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, map } from 'rxjs';
import { Request } from 'express';
import { translate, MessageKey } from '../i18n/messages';

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ApiResponse<T> {
  success: true;
  statusCode: number;
  message: string;
  data: T;
  meta: PaginationMeta | null;
}

export interface HandlerResult<T> {
  messageKey?: MessageKey;
  data: T;
  meta?: PaginationMeta;
  statusCode?: number;
}

@Injectable()
export class ResponseInterceptor<T>
  implements NestInterceptor<HandlerResult<T>, ApiResponse<T>>
{
  intercept(
    context: ExecutionContext,
    next: CallHandler<HandlerResult<T>>,
  ): Observable<ApiResponse<T>> {
    const request = context.switchToHttp().getRequest<Request>();
    const locale: string = request.locale ?? 'en';
    const httpResponse = context.switchToHttp().getResponse<{ statusCode: number }>();

    return next.handle().pipe(
      map((result) => ({
        success: true,
        statusCode: result.statusCode ?? httpResponse.statusCode,
        message: result.messageKey ? translate(result.messageKey, locale) : translate('SUCCESS', locale),
        data: result.data,
        meta: result.meta ?? null,
      })),
    );
  }
}
