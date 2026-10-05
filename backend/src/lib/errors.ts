export class HttpError extends Error {
  constructor(readonly status: number, message: string) {
    super(message);
  }
}

export const badRequest = (m: string) => new HttpError(400, m);
export const unauthorized = (m = "Not authenticated") => new HttpError(401, m);
export const forbidden = (m = "Not allowed") => new HttpError(403, m);
export const notFound = (m = "Not found") => new HttpError(404, m);
export const conflict = (m: string) => new HttpError(409, m);
export const unprocessable = (m: string) => new HttpError(422, m);
