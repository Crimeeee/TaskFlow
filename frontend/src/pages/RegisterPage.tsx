import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { LayoutDashboard } from "lucide-react";
import Button from "../components/Button";
import { Input } from "../components/Input";
import { useAuth } from "../context/AuthContext";
import { errorMessage } from "../lib/api";

interface Errors {
  name?: string;
  email?: string;
  password?: string;
  form?: string;
}

export default function RegisterPage() {
  const { user, register } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<Errors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (user) return <Navigate to="/" replace />;

  const validate = (): Errors => {
    const next: Errors = {};
    if (name.trim().length < 2) next.name = "Name must be at least 2 characters";
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim())) next.email = "Enter a valid email address";
    if (password.length < 6) next.password = "Password must be at least 6 characters";
    return next;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const next = validate();
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setIsSubmitting(true);
    try {
      await register({ name: name.trim(), email: email.trim(), password });
      navigate("/", { replace: true });
    } catch (error) {
      setErrors({ form: errorMessage(error, "Could not create your account") });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center gap-2 text-center">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-600 text-white">
            <LayoutDashboard size={22} />
          </span>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Create your account</h1>
          <p className="text-sm text-slate-500">Start a team and ship work together.</p>
        </div>

        <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          {errors.form ? (
            <p role="alert" className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">
              {errors.form}
            </p>
          ) : null}
          <Input
            label="Full name"
            autoComplete="name"
            value={name}
            error={errors.name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ada Lovelace"
          />
          <Input
            label="Email"
            type="email"
            autoComplete="email"
            value={email}
            error={errors.email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
          />
          <Input
            label="Password"
            type="password"
            autoComplete="new-password"
            value={password}
            error={errors.password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="At least 6 characters"
          />
          <Button type="submit" isLoading={isSubmitting} className="mt-1 w-full">
            Create account
          </Button>
        </form>

        <p className="mt-4 text-center text-sm text-slate-500">
          Already registered?{" "}
          <Link to="/login" className="font-medium text-indigo-600 hover:text-indigo-500">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
