import { Suspense } from "react";
import AuthForm from "@/components/AuthForm";

// useSearchParams (OAuth error / 2FA step) needs a Suspense boundary on a static page
export default function Page() {
  return (
    <Suspense>
      <AuthForm mode="register" />
    </Suspense>
  );
}
