"use client";

import { useState } from "react";
import { joinGame } from "@/server/actions/game";
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

export default function JoinPage() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setError(null);
    const result = await joinGame(formData);
    if (result?.error) {
      setError(result.error);
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center justify-center min-h-[80vh]">
      <Card className="w-full max-w-md mx-4">
        <CardHeader className="text-center">
          <CardTitle className="text-emerald-800">Rejoindre une partie</CardTitle>
          <CardDescription>
            Saisissez le code fourni par votre formateur
          </CardDescription>
        </CardHeader>
        <form action={handleSubmit}>
          <CardContent className="space-y-4">
            {error && (
              <div className="bg-red-50 text-red-600 text-sm p-3 rounded-md">
                {error}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="code">Code de la partie</Label>
              <Input
                id="code"
                name="code"
                type="text"
                placeholder="Ex: ABC123"
                maxLength={6}
                className="text-center text-2xl font-mono tracking-widest uppercase"
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Connexion..." : "Rejoindre"}
            </Button>
          </CardContent>
        </form>
      </Card>
    </div>
  );
}
