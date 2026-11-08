"use client";

import { useRouter } from "next/navigation";
import { authClient } from "../lib/auth-client";

export default function LogoutButton() {
  const router = useRouter();

  const handleLogout = async () => {
    const { error } = await authClient.signOut();

    if (error) {
      alert(error.message);
      return;
    }

    router.replace("/login");
    router.refresh();
  };

  return (
    <button
      onClick={handleLogout}
      className="rounded-lg bg-red-600 px-5 py-2 text-white"
    >
      Logout
    </button>
  );
}