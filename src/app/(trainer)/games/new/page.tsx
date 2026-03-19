"use client";

import { useState } from "react";
import { createGame } from "@/server/actions/game";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function NewGamePage() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setError(null);
    const result = await createGame(formData);
    if (result?.error) {
      setError(result.error);
      setLoading(false);
    }
  }

  return (
    <div className="max-w-xl mx-auto px-6 py-8">
      <Card>
        <CardHeader>
          <CardTitle>Creer une nouvelle partie</CardTitle>
          <CardDescription>
            Configurez votre session de simulation
          </CardDescription>
        </CardHeader>
        <form action={handleSubmit}>
          <CardContent className="space-y-6">
            {error && (
              <div className="bg-red-50 text-red-600 text-sm p-3 rounded-md">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="name">Nom de la partie</Label>
              <Input
                id="name"
                name="name"
                placeholder="Ex: Formation Mars 2026"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="maxRounds">Nombre de rounds (annees)</Label>
              <Input
                id="maxRounds"
                name="maxRounds"
                type="number"
                min={1}
                max={10}
                defaultValue={5}
                required
              />
              <p className="text-xs text-gray-500">
                Chaque round correspond a une annee d&apos;exercice comptable
              </p>
            </div>

            <div className="bg-emerald-50 p-4 rounded-lg">
              <h3 className="font-medium text-emerald-800 mb-2">
                Configuration de depart
              </h3>
              <p className="text-sm text-emerald-700">
                Pharmacie de centre-ville standard : CA ~1,8M, 5 employes,
                stock ~180k. Tous les joueurs partent de la meme situation.
              </p>
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Creation..." : "Creer la partie"}
            </Button>
          </CardContent>
        </form>
      </Card>
    </div>
  );
}
