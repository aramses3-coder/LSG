import Link from "next/link";
import { getTrainerGames } from "@/server/actions/game";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const statusLabels: Record<string, { label: string; variant: "default" | "secondary" | "warning" | "destructive" }> = {
  LOBBY: { label: "En attente", variant: "secondary" },
  IN_PROGRESS: { label: "En cours", variant: "default" },
  ROUND_ACTIVE: { label: "Round actif", variant: "warning" },
  COMPUTING: { label: "Calcul...", variant: "warning" },
  ROUND_DONE: { label: "Round terminé", variant: "default" },
  FINISHED: { label: "Terminée", variant: "destructive" },
};

export default async function TrainerDashboard() {
  const games = await getTrainerGames();

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Mes parties</h1>
          <p className="text-gray-500 mt-1">
            Gerez vos sessions de simulation
          </p>
        </div>
        <Link href="/games/new">
          <Button>Creer une partie</Button>
        </Link>
      </div>

      {games.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-gray-500 mb-4">
              Vous n&apos;avez pas encore cree de partie
            </p>
            <Link href="/games/new">
              <Button>Creer ma premiere partie</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {games.map((game) => {
            const status = statusLabels[game.status] ?? {
              label: game.status,
              variant: "secondary" as const,
            };
            return (
              <Link key={game.id} href={`/games/${game.id}/control`}>
                <Card className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{game.name}</CardTitle>
                      <Badge variant={status.variant}>{status.label}</Badge>
                    </div>
                    <CardDescription>
                      Code : <span className="font-mono font-bold">{game.code}</span>
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex gap-4 text-sm text-gray-500">
                      <span>{game._count.players} joueur(s)</span>
                      <span>
                        Round {game.currentRound}/{game.maxRounds}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
