import { OAUTH } from "@/auth";
import LoginForm from "@/components/auth/LoginForm";

// Only three ways in: Apple, Google, or email + password.
export default function LoginPage() {
  return <LoginForm oauth={OAUTH} />;
}
