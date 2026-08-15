"use client";

import { useRouter } from "next/navigation";

export default function BackToMenuButton() {
  const router = useRouter();

  return (
    <button
      onClick={() => router.push("/menu")}
      className="absolute top-4 right-4 text-sm font-medium text-gray-600 hover:text-gray-900 bg-white border border-gray-300 rounded-md px-3 py-1.5 shadow-sm"
    >
      ← Voltar
    </button>
  );
}
