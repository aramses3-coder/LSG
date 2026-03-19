"use client";

import { useState } from "react";
import Link from "next/link";
import { registerUser } from "@/server/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function RegisterPage() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setError(null);
    const result = await registerUser(formData);
    if (result?.error) {
      setError(result.error);
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle className="text-emerald-800">Creer un compte</CardTitle>
        <CardDescription>
          Inscrivez-vous pour participer au simulateur
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
            <Label htmlFor="name">Nom complet</Label>
            <Input
              id="name"
              name="name"
              type="text"
              placeholder="Dr. Jean Dupont"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="votre@email.fr"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Mot de passe</Label>
            <Input
              id="password"
              name="password"
              type="password"
              placeholder="Au moins 6 caracteres"
              required
              minLength={6}
            />
          </div>
          <div className="space-y-2">
            <Label>Vous etes</Label>
            <div className="grid grid-cols-2 gap-3">
              <label className="flex items-center gap-2 p-3 border rounded-md cursor-pointer hover:bg-gray-50 has-[:checked]:border-emerald-500 has-[:checked]:bg-emerald-50">
                <input
                  type="radio"
                  name="role"
                  value="PLAYER"
                  defaultChecked
                  className="accent-emerald-600"
                />
                <div>
                  <p className="font-medium text-sm">Joueur</p>
                  <p className="text-xs text-gray-500">Pharmacien</p>
                </div>
              </label>
              <label className="flex items-center gap-2 p-3 border rounded-md cursor-pointer hover:bg-gray-50 has-[:checked]:border-emerald-500 has-[:checked]:bg-emerald-50">
                <input
                  type="radio"
                  name="role"
                  value="TRAINER"
                  className="accent-emerald-600"
                />
                <div>
                  <p className="font-medium text-sm">Formateur</p>
                  <p className="text-xs text-gray-500">Animateur</p>
                </div>
              </label>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-4">
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Creation..." : "Creer mon compte"}
          </Button>
          <p className="text-sm text-gray-500">
            Deja inscrit ?{" "}
            <Link href="/login" className="text-emerald-600 hover:underline">
              Se connecter
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  );
}
