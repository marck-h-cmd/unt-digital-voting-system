import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from "@nestjs/common";
import { Observable } from "rxjs";
import { tap } from "rxjs/operators";
import { GqlExecutionContext } from "@nestjs/graphql";

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger("RequestLogger");

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const startTime = Date.now();
    let method = "HTTP";
    let url = "";

    // Comprobar si es un contexto GraphQL o HTTP normal
    const isGraphQL = context.getType<string>() === "graphql";
    if (isGraphQL) {
      const gqlContext = GqlExecutionContext.create(context);
      const info = gqlContext.getInfo();
      const fieldName = info.fieldName;
      const parentType = info.parentType.name;
      method = "GraphQL";
      url = `${parentType}.${fieldName}`;
    } else {
      const request = context.switchToHttp().getRequest();
      if (request) {
        method = request.method;
        url = request.url;
      }
    }

    return next.handle().pipe(
      tap({
        next: () => {
          const duration = Date.now() - startTime;
          this.logger.log(`[${method}] ${url} - Success in ${duration}ms`);
        },
        error: (err) => {
          const duration = Date.now() - startTime;
          this.logger.error(
            `[${method}] ${url} - Error after ${duration}ms: ${err.message || err}`,
          );
        },
      }),
    );
  }
}
