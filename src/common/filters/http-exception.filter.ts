import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus } from '@nestjs/common';
import type { Response } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const response = host.switchToHttp().getResponse<Response>();

    const status =
      exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;

    const body = exception instanceof HttpException ? exception.getResponse() : null;

    const message =
      body && typeof body === 'object' && 'message' in body
        ? (body as { message: unknown }).message
        : typeof body === 'string'
          ? body
          : exception instanceof Error
            ? exception.message
            : 'Internal server error';

    // ValidationPipe's exceptionFactory (main.ts) shapes validation failures
    // as an array of { property, message }; CLAUDE.md's Error Format has no
    // `data` field for that case, only for the general response envelope.
    if (Array.isArray(message)) {
      response.status(status).json({ statusCode: status, message });
      return;
    }

    response.status(status).json({ statusCode: status, message, data: {} });
  }
}
