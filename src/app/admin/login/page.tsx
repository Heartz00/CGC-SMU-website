import Link from "next/link";
import { redirect } from "next/navigation";
import { adminConfigured, signedIn } from "@/lib/admin/auth";
import { login } from "../actions";
import { Notice } from "@/components/admin/shared";
import { SubmitButton } from "@/components/admin/submit";
import { site } from "@/lib/site";
export default async function Login({
  searchParams,
}: {
  searchParams: Promise<{ notice?: string }>;
}) {
  if (await signedIn()) redirect("/admin");
  const { notice } = await searchParams;
  return (
    <section className="container admin-login">
      <div className="admin-login-intro">
        <p className="eyebrow">Council workspace</p>
        <h1>
          A simpler way
          <br />
          to keep us connected.
        </h1>
        <p>Keep the council connected.</p>
        <Link href="/">← Back to the public website</Link>
      </div>
      <div className="admin-login-card">
        <h2>Sign in to manage content.</h2>
        {adminConfigured() ? (
          <>
            <Notice kind={notice} />
            <form action={login}>
              <label className="admin-field">
                <span>Username</span>
                <input
                  name="username"
                  autoComplete="username"
                  required
                  maxLength={100}
                />
              </label>
              <label className="admin-field">
                <span>Application password</span>
                <input
                  name="password"
                  type="password"
                  autoComplete="off"
                  required
                  maxLength={100}
                />
                <small>Use your application password.</small>
              </label>
              <SubmitButton label="Sign in" pending="Signing in..." />
            </form>
            <details className="admin-help">
              <summary>How do I get an application password?</summary>
              <p>
                Open your profile, find Application Passwords, and create one
                named “CGC Website”. Enter it here. Each officer uses their own
                account and password.
              </p>
              <a
                className="text-link"
                href={`${site.wordpress}/wp-admin/profile.php`}
              >
                Open my profile
              </a>
            </details>
          </>
        ) : (
          <div className="admin-notice">
            <h3>Sign-in is unavailable.</h3>
            <p>Contact the site administrator.</p>
            <a className="text-link" href={`${site.wordpress}/wp-admin/`}>
              Open account settings
            </a>
          </div>
        )}
      </div>
    </section>
  );
}
