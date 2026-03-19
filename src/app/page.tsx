import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-emerald-50 to-teal-100">
      <div className="text-center max-w-2xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-5xl font-bold text-emerald-800 mb-4">LSG</h1>
          <p className="text-xl text-emerald-700 font-medium">
            Le Simulateur de Gestion
          </p>
          <p className="text-gray-600 mt-2">
            Business game pour pharmaciens d&apos;officine
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
          <p className="text-gray-700 mb-6">
            Prenez les commandes de votre pharmacie et affrontez d&apos;autres
            pharmaciens en prenant des decisions strategiques : RH, achats,
            marketing, investissements... Le meilleur gestionnaire
            l&apos;emporte !
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/login">
              <Button size="lg" className="w-full sm:w-auto">
                Se connecter
              </Button>
            </Link>
            <Link href="/register">
              <Button size="lg" variant="outline" className="w-full sm:w-auto">
                Creer un compte
              </Button>
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
          <div className="bg-white/60 rounded-lg p-4">
            <div className="text-2xl mb-2">&#x1f3e5;</div>
            <p className="font-medium text-gray-800">Simulation realiste</p>
            <p className="text-gray-500">Bilan, stocks, RH, marketing...</p>
          </div>
          <div className="bg-white/60 rounded-lg p-4">
            <div className="text-2xl mb-2">&#x1f3c6;</div>
            <p className="font-medium text-gray-800">Competition</p>
            <p className="text-gray-500">2 a 100 joueurs par partie</p>
          </div>
          <div className="bg-white/60 rounded-lg p-4">
            <div className="text-2xl mb-2">&#x1f4ca;</div>
            <p className="font-medium text-gray-800">KPI detailles</p>
            <p className="text-gray-500">Classement multi-criteres</p>
          </div>
        </div>
      </div>
    </div>
  );
}
