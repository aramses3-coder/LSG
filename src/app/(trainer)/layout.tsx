import Link from "next/link";
import { auth, signOut } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default async function TrainerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user || session.user.role !== "TRAINER") {
    redirect("/login");
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-white border-b border-gray-200 px-6 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/dashboard" className="flex items-center gap-2">
              <div className="w-7 h-7 bg-emerald-600 rounded-md flex items-center justify-center">
                <span className="text-white font-bold text-xs">L</span>
              </div>
              <span className="font-bold text-emerald-800">LSG</span>
            </Link>
            <nav className="hidden sm:flex gap-4">
              <Link
                href="/dashboard"
                className="text-sm text-gray-600 hover:text-emerald-700 transition-colors"
              >
                Mes parties
              </Link>
              <Link
                href="/games/new"
                className="text-sm text-gray-600 hover:text-emerald-700 transition-colors"
              >
                Nouvelle partie
              </Link>
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <Badge variant="secondary" className="hidden sm:inline-flex">
              Formateur
            </Badge>
            <span className="text-sm text-gray-500 hidden sm:inline">
              {session.user.name}
            </span>
            <form
              action={async () => {
                "use server";
                await signOut({ redirectTo: "/login" });
              }}
            >
              <Button variant="ghost" size="sm" type="submit">
                Deconnexion
              </Button>
            </form>
          </div>
        </div>
      </header>
      <main className="flex-1 bg-gray-50">{children}</main>
    </div>
  );
}
