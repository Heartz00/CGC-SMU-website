export class AdminError extends Error {
  constructor(
    public kind:
      | "authentication"
      | "permission"
      | "connection"
      | "conflict"
      | "validation",
    message: string,
  ) {
    super(message);
  }
}
