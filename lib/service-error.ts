import type { ContentfulStatusCode } from "hono/utils/http-status";

/**
 * Thrown by the service layer for known, client-facing failures.
 * Route handlers catch this and map it to a JSON response, so business
 * logic never has to know about Hono's `Context`.
 */
export class ServiceError extends Error {
  constructor(
    message: string,
    public status: ContentfulStatusCode = 400,
  ) {
    super(message);
    this.name = "ServiceError";
  }
}

export function isServiceError(error: unknown): error is ServiceError {
  return error instanceof ServiceError;
}
