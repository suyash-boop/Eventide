"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { Calendar, Search, Plus, User, Menu, X, Home, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function Navigation() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const { data: session, status } = useSession();

  const navItems = [
    { href: "/", label: "Home", icon: Home },
    { href: "/discover", label: "Discover", icon: Search },
    { href: "/events/create", label: "Create", icon: Plus },
  ];

  const isActive = (href: string) => {
    if (href === "/") {
      return pathname === "/";
    }
    return pathname.startsWith(href);
  };

  const handleSignOut = async () => {
    await signOut({ callbackUrl: "/" });
  };

  return (
    <nav className="border-b border-zinc-800 bg-black/95 backdrop-blur supports-[backdrop-filter]:bg-black/60 sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <Calendar className="h-8 w-8 text-white" />
            <span className="text-xl font-bold text-white">Eventide</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center space-x-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive(item.href)
                      ? "bg-white text-black"
                      : "text-gray-300 hover:text-white hover:bg-zinc-800"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>

          {/* User Menu */}
          <div className="flex items-center gap-4">
            {status === "loading" ? (
              <div className="w-10 h-10 bg-zinc-800 rounded-full animate-pulse" />
            ) : session?.user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={session.user.image || undefined} />
                      <AvatarFallback className="bg-zinc-700 text-white">
                        {session.user.name?.charAt(0)?.toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent 
                  className="w-56 bg-zinc-900 border-zinc-800" 
                  align="end" 
                  forceMount
                >
                  <div className="flex items-center justify-start gap-2 p-2">
                    <div className="flex flex-col space-y-1 leading-none">
                      <p className="font-medium text-white">{session.user.name}</p>
                      <p className="w-[200px] truncate text-sm text-zinc-400">
                        {session.user.email}
                      </p>
                    </div>
                  </div>
                  <DropdownMenuSeparator className="bg-zinc-800" />
                  <DropdownMenuItem asChild className="text-white hover:bg-zinc-800 cursor-pointer">
                    <Link href="/profile">
                      <User className="mr-2 h-4 w-4" />
                      <span>My Profile</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="text-white hover:bg-zinc-800 cursor-pointer">
                    <Link href="/my-events">
                      <Calendar className="mr-2 h-4 w-4" />
                      <span>My Events</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-zinc-800" />
                  <DropdownMenuItem 
                    className="text-red-400 hover:bg-red-900/20 cursor-pointer"
                    onClick={handleSignOut}
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button asChild className="bg-white text-black hover:bg-gray-200">
                <Link href="/auth/signin">Sign In</Link>
              </Button>
            )}

            {/* Mobile menu button */}
            <Button
              variant="ghost"
              size="sm"
              className="md:hidden text-white hover:bg-zinc-800"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-zinc-800 py-4">
            <div className="space-y-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center space-x-2 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                      isActive(item.href)
                        ? "bg-white text-black"
                        : "text-gray-300 hover:text-white hover:bg-zinc-800"
                    }`}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
              
              {/* Mobile user menu items */}
              {session?.user && (
                <div className="border-t border-zinc-800 pt-4 mt-4">
                  <Link
                    href="/profile"
                    className="flex items-center space-x-2 px-4 py-3 rounded-lg text-sm font-medium text-gray-300 hover:text-white hover:bg-zinc-800"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <User className="h-4 w-4" />
                    <span>My Profile</span>
                  </Link>
                  <Link
                    href="/my-events"
                    className="flex items-center space-x-2 px-4 py-3 rounded-lg text-sm font-medium text-gray-300 hover:text-white hover:bg-zinc-800"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <Calendar className="h-4 w-4" />
                    <span>My Events</span>
                  </Link>
                  <button
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      handleSignOut();
                    }}
                    className="flex items-center space-x-2 px-4 py-3 rounded-lg text-sm font-medium text-red-400 hover:text-red-300 hover:bg-red-900/20 w-full text-left"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Log out</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}