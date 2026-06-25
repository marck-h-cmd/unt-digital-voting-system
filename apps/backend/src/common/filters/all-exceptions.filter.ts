// backend/src/common/filters/all-exceptions.filter.ts
import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from "@nestjs/common";
import { GqlArgumentsHost } from "@nestjs/graphql";

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = "Error interno del servidor";
    let details = null;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();
      message =
        typeof exceptionResponse === "string"
          ? exceptionResponse
          : (exceptionResponse as any).message || message;
      details = (exceptionResponse as any).details || null;
    } else if (exception instanceof Error) {
      message = exception.message;
    }

    // Loggear error
    this.logger.error({
      status,
      message,
      path: request.url,
      method: request.method,
      ip: request.ip,
      stack: exception instanceof Error ? exception.stack : undefined,
    });

    if (host.getType() === "http") {
      response.status(status).json({
        statusCode: status,
        message,
        details,
        timestamp: new Date().toISOString(),
        path: request.url,
      });
    } else {
      // GraphQL
      const gqlHost = GqlArgumentsHost.create(host);
      return {
        statusCode: status,
        message,
        details,
        timestamp: new Date().toISOString(),
      };
    }
  }
}
