"use client";

import { useSession } from "next-auth/react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { User, Settings, Calendar, PlusCircle, LogOut, Crown } from "lucide-react";
import { signOut } from "next-auth/react";
import Link from "next/link";

export function UserNav() {
  const { data: session } = useSession();

  if (!session?.user) {
    return null;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-10 w-10 rounded-full ring-2 ring-white/10 hover:ring-primary/30 transition-all duration-200">
          <Avatar className="h-9 w-9">
            <AvatarImage src={session.user.image || ""} alt={session.user.name || ""} />
            <AvatarFallback className="bg-primary/20 text-primary font-semibold">
              {session.user.name?.[0]?.toUpperCase()}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-64 bg-gray-900/95 border-gray-800 backdrop-blur-xl" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-2 p-2">
            <div className="flex items-center space-x-2">
              <Crown className="h-4 w-4 text-primary" />
              <p className="text-sm font-medium leading-none text-white">{session.user.name}</p>
            </div>
            <p className="text-xs leading-none text-gray-400">
              {session.user.email}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-gray-800" />
        <DropdownMenuItem asChild className="text-gray-300 hover:text-white hover:bg-white/5 cursor-pointer">
          <Link href="/profile">
            <User className="mr-3 h-4 w-4" />
            <span>Profile</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild className="text-gray-300 hover:text-white hover:bg-white/5 cursor-pointer">
          <Link href="/events/create">
            <PlusCircle className="mr-3 h-4 w-4" />
            <span>Create Event</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild className="text-gray-300 hover:text-white hover:bg-white/5 cursor-pointer">
          <Link href="/events/my">
            <Calendar className="mr-3 h-4 w-4" />
            <span>My Events</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild className="text-gray-300 hover:text-white hover:bg-white/5 cursor-pointer">
          <Link href="/settings">
            <Settings className="mr-3 h-4 w-4" />
            <span>Settings</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator className="bg-gray-800" />
        <DropdownMenuItem 
          onClick={() => signOut()}
          className="text-red-400 hover:text-red-300 hover:bg-red-500/10 cursor-pointer"
        >
          <LogOut className="mr-3 h-4 w-4" />
          <span>Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}