import { ForumError, studentEmail } from "./validation";

type AuthResult = {
  data: { user: { email?: string } | null; session: unknown };
  error: { status?: number } | null;
};
type PasswordClient = {
  auth: {
    signUp: (credentials: {
      email: string;
      password: string;
    }) => Promise<AuthResult>;
    signInWithPassword: (credentials: {
      email: string;
      password: string;
    }) => Promise<AuthResult>;
  };
};

export async function passwordForumAuth(
  client: PasswordClient,
  credentials: { email: string; password: string },
  creating: boolean,
  signupReady = false,
) {
  if (creating && !signupReady)
    throw new ForumError(
      "Account registration is not available yet. Please contact the council.",
    );
  const { data, error } = creating
    ? await client.auth.signUp(credentials)
    : await client.auth.signInWithPassword(credentials);
  if (error || !data.session || !data.user)
    throw new ForumError(
      error?.status === 429
        ? "Please wait before trying again."
        : creating
          ? "Could not create your account. If you already have one, try signing in."
          : "Could not sign in. Check your email and forum password.",
    );
  if (studentEmail(data.user.email) !== credentials.email)
    throw new ForumError("Use your SMU email account.");
}
