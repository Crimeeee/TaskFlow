import { Link } from "react-router-dom";

export default function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-page px-4 text-center">
      <p className="text-5xl font-bold tracking-tight text-muted">404</p>
      <h1 className="text-xl font-semibold text-strong">Page not found</h1>
      <p className="max-w-sm text-sm text-muted">
        The page you are looking for does not exist or has moved.
      </p>
      <Link to="/" className="mt-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-on-accent hover:bg-accent">
        Back to dashboard
      </Link>
    </div>
  );
}
