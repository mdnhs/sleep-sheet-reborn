/**
 * HTTP status codes the service layer is allowed to signal. Restricted to
 * error codes (no 2xx) so Hono's RPC client can still narrow `response.ok`
 * and drop the error shape from typed `response.json()` results.
 */
export type ErrorStatusCode = 400 | 401 | 402 | 403 | 404 | 405 | 409 | 410 | 422 | 429 | 500 | 502 | 503;

/**
 * Thrown by the service layer for known, client-facing failures.
 * Route handlers catch this and map it to a JSON response, so business
 * logic never has to know about Hono's `Context`.
 */
export class ServiceError extends Error {
  constructor(
    message: string,
    public status: ErrorStatusCode = 400,
  ) {
    super(message);
    this.name = "ServiceError";
  }
}

export function isServiceError(error: unknown): error is ServiceError {
  return error instanceof ServiceError;
}
