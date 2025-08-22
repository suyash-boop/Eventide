"use client";

import { useSession } from "next-auth/react";
import Link from "next/link";
import { Calendar, Search, Sparkles, Compass } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SignInButton } from "@/components/auth/signin-button";
import { UserNav } from "@/components/auth/user-nav";

export function Header() {
  const { data: session } = useSession();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/5 bg-black/90 backdrop-blur-xl supports-[backdrop-filter]:bg-black/60">
      <div className="container flex h-16 items-center justify-between">
        {/* Logo and Navigation */}
        <div className="flex items-center space-x-8">
          <Link href="/" className="flex items-center space-x-3 group">
            <div className="relative">
              <Calendar className="h-8 w-8 text-primary transition-transform group-hover:scale-110" />
              <Sparkles className="absolute -top-1 -right-1 h-3 w-3 text-primary/60" />
            </div>
            <span className="text-xl font-bold text-white tracking-tight">
              Eventide
            </span>
          </Link>
          
          <nav className="hidden md:flex items-center space-x-1">
            <Link
              href="/discover"
              className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-gray-300 hover:text-white hover:bg-white/5 rounded-lg transition-all duration-200"
            >
              <Compass className="h-4 w-4" />
              <span>Discover</span>
            </Link>
            {session && (
              <>
                <Link
                  href="/events/create"
                  className="px-4 py-2 text-sm font-medium text-gray-300 hover:text-white hover:bg-white/5 rounded-lg transition-all duration-200"
                >
                  Create Event
                </Link>
                <Link
                  href="/"
                  className="px-4 py-2 text-sm font-medium text-gray-300 hover:text-white hover:bg-white/5 rounded-lg transition-all duration-200"
                >
                  My Events
                </Link>
              </>
            )}
          </nav>
        </div>
        
        {/* Search and User Menu */}
        <div className="flex items-center space-x-4">
          {/* Enhanced Search Bar */}
          <div className="relative hidden sm:block">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-gray-500" />
            </div>
            <Input
              placeholder="Search events..."
              className="pl-10 pr-4 w-64 lg:w-80 bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all duration-200"
            />
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
              <kbd className="inline-flex items-center rounded border border-white/10 px-2 py-1 text-xs text-gray-500">
                ⌘K
              </kbd>
            </div>
          </div>

          {/* Mobile Search Button */}
          <Button variant="ghost" size="icon" className="sm:hidden text-gray-400 hover:text-white">
            <Search className="h-5 w-5" />
          </Button>
          
          {/* User Navigation */}
          <div className="flex items-center space-x-2">
            {session ? (
              <div className="flex items-center space-x-3">
                <div className="hidden md:flex items-center space-x-2 px-3 py-1.5 bg-white/5 rounded-full border border-white/10">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="text-xs text-gray-300">Online</span>
                </div>
                <UserNav />
              </div>
            ) : (
              <SignInButton />
            )}
          </div>
        </div>
      </div>

      {/* Mobile Navigation Menu */}
      {session && (
        <div className="md:hidden border-t border-white/5 bg-black/95">
          <div className="container px-4 py-3">
            <nav className="flex items-center space-x-4">
              <Link
                href="/discover"
                className="flex items-center space-x-1 text-sm font-medium text-gray-300 hover:text-white transition-colors"
              >
                <Compass className="h-4 w-4" />
                <span>Discover</span>
              </Link>
              <Link
                href="/events/create"
                className="text-sm font-medium text-gray-300 hover:text-white transition-colors"
              >
                Create
              </Link>
              <Link
                href="/events/my"
                className="text-sm font-medium text-gray-300 hover:text-white transition-colors"
              >
                My Events
              </Link>
            </nav>
          </div>
        </div>
      )}
    </header>
  );
}