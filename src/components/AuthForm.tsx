"use client";
import Link from "next/link";
import { FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/lib/store";
import { AuthHero } from "./AuthHero";

export default function AuthForm({ mode }: { mode: "login" | "register" }) {
  const reg = mode === "register";
  const { login } = useStore();
  const router = useRouter();

  function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    login();
    router.push("/dashboard");
  }

  return (
    <section className="auth">
      {reg ? (
        <AuthHero
          cardA={{ title: "Owner, Admin, Member, Viewer", subtitle: "Roles for every teammate" }}
          cardB={{ title: "Project health 82", subtitle: "Website redesign" }}
          heading="Set up your team's workspace in minutes."
          description="Create projects, invite people and start assigning tasks today."
        />
      ) : (
        <AuthHero
          cardA={{ title: "Design hero section", subtitle: "In progress, Ali" }}
          cardB={{ title: "Project health 82", subtitle: "Website redesign" }}
          heading="Feel your project's pulse before it flatlines."
          description="Every project shows a live health score, so blockers and overdue work surface early."
        />
      )}
      <div className="fw">
        <form className="form" onSubmit={submit}>
          <div>
            <h1>{reg ? "Create your account" : "Log in to PulseBoard"}</h1>
            <p className="mute">{reg ? "You will be the owner of your workspace." : "Welcome back. Pick up where you left off."}</p>
          </div>
          {reg && (
            <label>
              Full name
              <input name="name" defaultValue="Ali Raza" />
            </label>
          )}
          <label>
            Email
            <input name="email" type="email" defaultValue="ali@team.com" />
          </label>
          <label>
            Password
            <input name="password" type="password" defaultValue="password123" />
          </label>
          <button className="btn">{reg ? "Create account" : "Log in"}</button>
          <p className="mute" style={{ textAlign: "center" }}>
            {reg ? "Already have an account? " : "New to PulseBoard? "}
            <Link className="link" href={reg ? "/login" : "/register"}>
              {reg ? "Log in" : "Create an account"}
            </Link>
          </p>
        </form>
      </div>
    </section>
  );
}
