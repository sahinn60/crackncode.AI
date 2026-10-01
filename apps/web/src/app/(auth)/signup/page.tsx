import { redirect } from 'next/navigation';

// /signup is an alias for /register — redirect to keep one canonical registration flow
export default function SignupPage() {
  redirect('/register');
}
