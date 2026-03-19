import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50">
      {/* Header */}
      <header className="px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">L</span>
            </div>
            <span className="font-bold text-emerald-800 text-lg">LSG</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost" size="sm">
                Se connecter
              </Button>
            </Link>
            <Link href="/register">
              <Button size="sm">Creer un compte</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-12">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 bg-emerald-100 text-emerald-700 text-sm px-3 py-1 rounded-full mb-6">
            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
            Business Game pour pharmaciens
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight">
            Le Simulateur
            <br />
            <span className="text-emerald-600">de Gestion</span>
          </h1>
          <p className="text-lg text-gray-600 max-w-xl mx-auto mb-8">
            Prenez les commandes d&apos;une pharmacie d&apos;officine et
            affrontez d&apos;autres pharmaciens. Decisions strategiques, KPI
            realistes, classement multi-criteres.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register">
              <Button
                size="lg"
                className="w-full sm:w-auto text-base px-8 py-6"
              >
                Commencer gratuitement
              </Button>
            </Link>
            <Link href="/login">
              <Button
                size="lg"
                variant="outline"
                className="w-full sm:w-auto text-base px-8 py-6"
              >
                J&apos;ai deja un compte
              </Button>
            </Link>
          </div>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-5xl mx-auto w-full">
          <FeatureCard
            icon="&#x1f3e5;"
            title="Simulation realiste"
            description="Bilan comptable, compte de resultat, gestion des stocks et du personnel"
          />
          <FeatureCard
            icon="&#x1f4ca;"
            title="11 KPI detailles"
            description="CA, marge, tresorerie, satisfaction, part de marche, productivite..."
          />
          <FeatureCard
            icon="&#x1f3c6;"
            title="Competition"
            description="2 a 100 joueurs par session, classement en temps reel et podium"
          />
          <FeatureCard
            icon="&#x1f393;"
            title="Formation"
            description="Anime en presentiel par un formateur qui controle le rythme"
          />
        </div>

        {/* How it works */}
        <div className="max-w-4xl mx-auto w-full mt-16">
          <h2 className="text-2xl font-bold text-center text-gray-900 mb-8">
            Comment ca marche ?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <StepCard
              step={1}
              title="Rejoignez"
              description="Le formateur cree une session et partage un code d'acces a 6 caracteres."
            />
            <StepCard
              step={2}
              title="Decidez"
              description="A chaque round (= 1 an), prenez des decisions : RH, achats, prix, marketing, investissements, finance."
            />
            <StepCard
              step={3}
              title="Comparez"
              description="Consultez vos resultats, comparez-vous aux autres et grimpez dans le classement !"
            />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="px-6 py-6 text-center text-sm text-gray-400">
        LSG &mdash; Le Simulateur de Gestion &copy; {new Date().getFullYear()}
      </footer>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: string;
  title: string;
  description: string;
}) {
  return (
    <div className="bg-white/70 backdrop-blur-sm rounded-xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
      <div className="text-2xl mb-3">{icon}</div>
      <h3 className="font-semibold text-gray-800 mb-1">{title}</h3>
      <p className="text-sm text-gray-500 leading-relaxed">{description}</p>
    </div>
  );
}

function StepCard({
  step,
  title,
  description,
}: {
  step: number;
  title: string;
  description: string;
}) {
  return (
    <div className="text-center">
      <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 font-bold text-lg mb-3">
        {step}
      </div>
      <h3 className="font-semibold text-gray-800 mb-2">{title}</h3>
      <p className="text-sm text-gray-500">{description}</p>
    </div>
  );
}
