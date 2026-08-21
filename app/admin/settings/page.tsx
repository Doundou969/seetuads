import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Settings, Bell, Shield, Database } from "lucide-react";

export const dynamic = 'force-dynamic';

export default function SettingsPage() {
  const settings = [
    {
      icon: Bell,
      title: "Notifications",
      description: "Configurer les alertes email et SMS",
      status: "Actif",
    },
    {
      icon: Shield,
      title: "Securite",
      description: "Gestion des acces et permissions",
      status: "Actif",
    },
    {
      icon: Database,
      title: "Base de donnees",
      description: "Sauvegardes et maintenance",
      status: "Actif",
    },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Parametres</h1>
      <p className="text-gray-600 mb-6">Configuration du systeme SeetuAds</p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {settings.map((setting) => {
          const Icon = setting.icon;
          return (
            <Card key={setting.title}>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary-50 rounded-lg">
                    <Icon className="w-5 h-5 text-primary-600" />
                  </div>
                  <CardTitle className="text-lg">{setting.title}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-3">{setting.description}</p>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  {setting.status}
                </span>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="mt-8 p-6 bg-white rounded-xl border">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Informations systeme</h2>
        <div className="space-y-3 text-sm">
          <div className="flex justify-between py-2 border-b">
            <span className="text-gray-500">Version</span>
            <span className="font-medium">1.0.0</span>
          </div>
          <div className="flex justify-between py-2 border-b">
            <span className="text-gray-500">Environnement</span>
            <span className="font-medium">Production</span>
          </div>
          <div className="flex justify-between py-2 border-b">
            <span className="text-gray-500">Region</span>
            <span className="font-medium">Dakar, Senegal</span>
          </div>
          <div className="flex justify-between py-2">
            <span className="text-gray-500">Fuseau horaire</span>
            <span className="font-medium">UTC+0</span>
          </div>
        </div>
      </div>
    </div>
  );
}