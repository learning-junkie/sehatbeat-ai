import { HeroSection } from "@/components/home/HeroSection";
import { FeatureCard } from "@/components/home/FeatureCard";

import { 
  ShoppingCart, 
  Bell, 
  TestTube, 
  Stethoscope, 
  Activity,
  FileText,
  Shield,
  Clock,
  Users
} from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

const Index = () => {
  const { t } = useLanguage();

  const features = [
    {
      title: t("home.card1Title"),
      description: t("home.card1Desc"),
      icon: ShoppingCart,
      stats: t("home.card1Badge"),
      featureKey: "Medicine Ordering" as const,
    },
    {
      title: t("home.card2Title"),
      description: t("home.card2Desc"),
      icon: Bell,
      stats: t("home.card2Badge"),
      featureKey: "Smart Reminders" as const,
    },
    {
      title: t("home.card3Title"),
      description: t("home.card3Desc"),
      icon: TestTube,
      stats: t("home.card3Badge"),
      featureKey: "Lab Tests" as const,
    },
    {
      title: t("home.card4Title"),
      description: t("home.card4Desc"),
      icon: Stethoscope,
      stats: t("home.card4Badge"),
      featureKey: "Doctor Directory" as const,
    },
    {
      title: t("home.card5Title"),
      description: t("home.card5Desc"),
      icon: Activity,
      stats: t("home.card5Badge"),
      featureKey: "SehatBeat AI Checker" as const,
    },
    {
      title: t("home.card6Title"),
      description: t("home.card6Desc"),
      icon: FileText,
      isHighlighted: true,
      stats: t("home.card6Badge"),
      featureKey: "Clinical Documentation" as const,
    },
  ];

  const trustFeatures = [
    {
      icon: Shield,
      title: t("home.stat1Title"),
      description: t("home.stat1Desc"),
    },
    {
      icon: Clock,
      title: t("home.stat2Title"),
      description: t("home.stat2Desc"),
    },
    {
      icon: Users,
      title: t("home.stat3Title"),
      description: t("home.stat3Desc"),
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <HeroSection />

      {/* Features Section */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center space-y-4 mb-16">
            <div className="inline-flex items-center gap-2 bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-800 text-orange-700 dark:text-orange-300 text-sm font-semibold px-4 py-1.5 rounded-full mb-2">
              🇮🇳 {t("home.indiaOS")}
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground">
              {t("home.featuresTitle")}
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              {t("home.featuresSub")}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <div key={feature.featureKey} className="animate-slide-up" style={{ animationDelay: `${index * 0.1}s` }}>
                <FeatureCard
                  title={feature.title}
                  description={feature.description}
                  icon={feature.icon}
                  isHighlighted={feature.isHighlighted}
                  stats={feature.stats}
                  featureKey={feature.featureKey}
                  buttonLabel={feature.isHighlighted ? t("home.card6Button") : t("home.getStartedBtn")}
                  comingSoonLabel={t("home.comingSoon")}
                  newLabel={t("home.newBadge")}
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust Section */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground">
              {t("home.trustTitle")}
            </h2>
            <p className="text-lg text-muted-foreground">
              {t("home.trustSub")}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {trustFeatures.map((feature, index) => (
              <div key={index} className="text-center space-y-4">
                <div className="mx-auto w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center">
                  <feature.icon className="w-8 h-8 text-primary-foreground" />
                </div>
                <h3 className="text-xl font-semibold text-foreground">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Index;
