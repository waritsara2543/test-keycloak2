"use client";
import { useAuth } from "@/lib/context/auth";
import Link from "next/link";

export default function Home() {
  const { isAuthenticated, user, logout } = useAuth();
  return (
    <main className="flex min-h-screen w-full items-center justify-center">
      {!isAuthenticated ? (
        "Not authenticated"
      ) : (
        <div className="text-center">
          <div>{user?.name}</div>
          <div>{user?.email}</div>
          <Link href={`${process.env.NEXT_PUBLIC_DOMAIN_TWO}`}>
            <a className="mt-5 text-blue-600">Go to another domain</a>
          </Link>
          <button
            className="mt-5 bg-red-600 text-white px-6 py-2"
            onClick={() => logout()}
          >
            Logout
          </button>
        </div>
      )}
    </main>
  );
}
