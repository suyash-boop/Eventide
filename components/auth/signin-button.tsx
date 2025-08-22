"use client";

import { signIn, signOut, useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { LogIn, LogOut, Loader2 } from "lucide-react";

export function SignInButton() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return (
      <Button disabled variant="ghost" size="sm">
        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
        Loading...
      </Button>
    );
  }

  if (session) {
    return (
      <Button
        onClick={() => signOut()}
        variant="ghost"
        size="sm"
        className="text-gray-300 hover:text-white hover:bg-white/5"
      >
        <LogOut className="w-4 h-4 mr-2" />
        Sign Out
      </Button>
    );
  }

  return (
    <div className="flex items-center space-x-2">
      <Button
        onClick={() => signIn("google")}
        variant="outline"
        size="sm"
        className="border-white/20 text-white hover:bg-white hover:text-black transition-all duration-200"
      >
        <LogIn className="w-4 h-4 mr-2" />
        Sign In
      </Button>
    </div>
  );
}