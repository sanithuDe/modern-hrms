"use client";

import { Bell, Search } from "lucide-react";

interface HeaderProps {
  email: string;
  role: string;
}

export default function Header({
  email,
  role,
}: HeaderProps) {
  return (
    <header className="flex h-20 items-center justify-between border-b border-slate-200 bg-white px-8">
      <div>
        <h2 className="text-xl font-semibold text-slate-900">
          Dashboard
        </h2>

        <p className="text-sm text-slate-500">
          Welcome back to your HR workspace
        </p>
      </div>

      <div className="flex items-center gap-4">
        <div className="hidden items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 md:flex">
          <Search size={17} className="text-slate-400" />

          <input
            type="search"
            placeholder="Search"
            className="w-44 bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
          />
        </div>

        <button
          type="button"
          className="rounded-full border border-slate-200 p-2 text-slate-600"
        >
          <Bell size={18} />
        </button>

        <div className="text-right">
          <p className="text-sm font-medium text-slate-900">
            {email}
          </p>

          <p className="text-xs text-slate-500">
            {role.replaceAll("_", " ")}
          </p>
        </div>
      </div>
    </header>
  );
}