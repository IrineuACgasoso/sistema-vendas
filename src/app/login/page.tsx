import LoginForm from "@/components/login/LoginForm";

export default function LoginPage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-8 px-4">
      <h1 className="text-2xl font-bold text-gray-900">Sistema de Vendas</h1>
      <LoginForm />
    </main>
  );
}
