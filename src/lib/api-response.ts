// Réponses JSON des Route Handlers (T014) : format d'erreur standard de contracts/api.md,
// `{ "errors": { "<champ>": "<message>" } }`.
export type ApiErrors = Record<string, string>;

export function jsonError(errors: ApiErrors, status: number): Response {
  return Response.json({ errors }, { status });
}

export function jsonOk<T>(data: T, status = 200): Response {
  return Response.json(data, { status });
}
