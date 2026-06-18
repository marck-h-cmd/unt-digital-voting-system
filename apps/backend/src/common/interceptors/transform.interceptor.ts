// backend/src/common/interceptors/transform.interceptor.ts
import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from "@nestjs/common";
import { Observable } from "rxjs";
import { map } from "rxjs/operators";
import { GqlExecutionContext } from "@nestjs/graphql";

export interface Response<T> {
  data: T;
  timestamp: string;
  path: string;
  statusCode: number;
}

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<
  T,
  Response<T>
> {
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<Response<T>> {
    const isGraphQL = context.getType<string>() === "graphql";
    let path = "";
    let statusCode = 200;
    
    if (isGraphQL) {
      const gqlContext = GqlExecutionContext.create(context);
      const info = gqlContext.getInfo();
      path = `${info.parentType.name}.${info.fieldName}`;
    } else {
      const request = context.switchToHttp().getRequest();
      const response = context.switchToHttp().getResponse();
      path = request.url || "";
      statusCode = response.statusCode;
    }

    return next.handle().pipe(
      map((data) => ({
        data,
        timestamp: new Date().toISOString(),
        path,
        statusCode,
      })),
    );
  }
}
