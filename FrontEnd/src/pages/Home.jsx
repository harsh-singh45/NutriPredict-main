import {
  ArrowRight,
  Battery,
  FlaskConical,
  HeartPulse,
  Lightbulb,
  LineChart,
  PlayCircle,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Target,
  TrendingDown,
  UserCheck2,
  UserRoundPlus,
} from 'lucide-react';
import { Link } from 'react-router-dom';

import ctaProducePhoto from '../assets/images/cta-produce.jpg';
import heroIngredientsPhoto from '../assets/images/hero-ingredients.jpg';
import nutritionBowlPhoto from '../assets/images/nutrition-bowl.jpg';
import DietComparisonTable from '../components/home/DietComparisonTable';
import FeatureCard from '../components/home/FeatureCard';
import NutritionBowl from '../components/home/NutritionBowl';
import PredictionPreview from '../components/home/PredictionPreview';
import StepCard from '../components/home/StepCard';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import { PageContainer } from '../components/ui/Card';
import DataMetric from '../components/ui/DataMetric';
import ImageWithFallback from '../components/ui/ImageWithFallback';
import LeafAccent from '../components/ui/LeafAccent';
import { MiniBars, MiniRing, MiniSparkline } from '../components/ui/MiniChart';
import Reveal from '../components/ui/Reveal';
import SectionHeading from '../components/ui/SectionHeading';
import TrustBadge from '../components/ui/TrustBadge';
import { getUser } from '../utils/auth';

export default function Home() {
  return (
    <div className="flex flex-col">
      <HeroSection />
      <CorePredictionsSection />
      <NutritionIsPersonalSection />
      <HowItWorksSection />
      <DietComparisonSection />
      <FinalCtaSection />
      <SiteFooter />
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/* 1. HERO                                                                 */
/* ---------------------------------------------------------------------- */

function HeroSection() {
  return (
    <section className="relative bg-[#F7F6F1] pt-14 pb-20 sm:pt-20 sm:pb-28 overflow-hidden">
      <LeafAccent className="hidden lg:block absolute left-0 bottom-0 w-40 h-40 pointer-events-none" />

      {/* Food photo bleeding off the right edge, echoing the reference layout */}
      <div className="hidden xl:block absolute top-16 right-0 w-72 h-[26rem] rounded-l-[2rem] overflow-hidden shadow-[var(--shadow-card)]">
        <ImageWithFallback
          src={heroIngredientsPhoto}
          alt="Fresh almonds, avocado, and spinach"
          className="w-full h-full object-cover"
          fallback={<div className="w-full h-full bg-[#DDE8D8]" />}
        />
      </div>

      <PageContainer className="relative grid lg:grid-cols-2 gap-14 lg:gap-10 items-center">
        {/* Left column */}
        <Reveal className="max-w-xl">
          <Badge icon={Sparkles} tone="sage">
            AI-Powered Nutrition Prediction
          </Badge>

          <h1 className="mt-6 text-4xl sm:text-5xl lg:text-[3.25rem] font-semibold text-[#1D2A22] leading-[1.1] text-balance">
            Personalized nutrition.
            <br />
            Predicted <em className="italic text-[#1F5A3F]" style={{ fontFamily: 'var(--font-display)' }}>before</em> you commit.
          </h1>

          <p className="mt-6 text-lg text-[#6B7280] leading-relaxed max-w-lg">
            NutriPredict uses AI to simulate how your body may respond to different
            diets — weight, energy, and metabolism — before you change a single meal.
          </p>

          <div className="mt-9 flex flex-col sm:flex-row gap-4">
            <PredictionButton variant="primary" size="lg" icon={ArrowRight}>
              Start Your Prediction
            </PredictionButton>
            <Button href="#how-it-works" variant="secondary" size="lg" icon={PlayCircle} iconPosition="left">
              See How It Works
            </Button>
          </div>

          <div className="mt-9">
            <TrustBadge />
          </div>
        </Reveal>

        {/* Right column — dashboard preview */}
        <Reveal delay={150} className="flex justify-center lg:justify-end">
          <PredictionPreview />
        </Reveal>
      </PageContainer>
    </section>
  );
}

/* ---------------------------------------------------------------------- */
/* 2. CORE PREDICTIONS                                                     */
/* ---------------------------------------------------------------------- */

function CorePredictionsSection() {
  return (
    <section className="py-20 sm:py-28 bg-white border-y border-[#E7E3D8]">
      <PageContainer>
        <SectionHeading
          eyebrow="What we forecast"
          title="Your diet, before you live it."
          description="Instead of simply recommending a diet, NutriPredict forecasts what could actually happen — so you can choose with evidence, not guesswork."
        />

        <div className="mt-14 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <Reveal delay={0}>
            <FeatureCard
              icon={TrendingDown}
              title="Weight Trajectory"
              description="Predict how your weight could change over time on a given plan."
              visual={<MiniSparkline direction="down" />}
            />
          </Reveal>
          <Reveal delay={80}>
            <FeatureCard
              icon={Battery}
              title="Energy Forecast"
              description="Understand potential energy patterns throughout your diet."
              visual={<MiniBars values={[35, 55, 45, 70, 60]} color="#C08A2E" />}
            />
          </Reveal>
          <Reveal delay={160}>
            <FeatureCard
              icon={HeartPulse}
              title="Metabolic Impact"
              description="See how dietary choices may affect metabolic outcomes."
              visual={<MiniSparkline direction="up" color="#2E6E8E" />}
            />
          </Reveal>
          <Reveal delay={240}>
            <FeatureCard
              icon={Target}
              title="Adherence Score"
              description="Estimate how sustainable a diet may be for your lifestyle."
              visual={<MiniRing percent={87} />}
            />
          </Reveal>
        </div>
      </PageContainer>
    </section>
  );
}

/* ---------------------------------------------------------------------- */
/* 3. NUTRITION IS PERSONAL                                                */
/* ---------------------------------------------------------------------- */

function NutritionIsPersonalSection() {
  return (
    <section className="relative py-20 sm:py-28 bg-[#F7F6F1] overflow-hidden">
      <LeafAccent flip className="hidden lg:block absolute right-0 bottom-0 w-40 h-40 pointer-events-none" />

      <PageContainer className="relative grid lg:grid-cols-2 gap-14 lg:gap-16 items-center">
        {/* Image with floating chips */}
        <Reveal className="relative max-w-md mx-auto lg:mx-0 w-full">
          <div className="rounded-[1.75rem] overflow-hidden border border-[#E7E3D8] shadow-[var(--shadow-card)] aspect-[4/5]">
            <ImageWithFallback
              src={nutritionBowlPhoto}
              alt="Fresh, balanced bowl of leafy greens, avocado, tomatoes, cucumber, chickpeas, and grains"
              className="w-full h-full object-cover"
              fallback={<NutritionBowl />}
            />
          </div>

          <div className="absolute -left-6 top-10 hidden sm:block animate-float-chip">
            <DataMetric icon={FlaskConical} label="Protein" value="82g" />
          </div>
          <div className="absolute -right-5 top-1/2 -translate-y-1/2 hidden sm:block animate-float-chip" style={{ animationDelay: '1.2s' }}>
            <DataMetric icon={Battery} label="Energy" value="+18%" tone="amber" />
          </div>
          <div className="absolute -left-4 bottom-8 hidden sm:block animate-float-chip" style={{ animationDelay: '2.4s' }}>
            <DataMetric icon={Target} label="Adherence" value="87%" tone="sky" />
          </div>
        </Reveal>

        {/* Copy */}
        <Reveal delay={120} className="max-w-lg">
          <span className="section-label">Nutrition Is Personal</span>
          <h2 className="mt-4 text-3xl sm:text-4xl font-semibold text-[#1D2A22] leading-[1.15] text-balance">
            Better choices start with better predictions.
          </h2>
          <p className="mt-5 text-[#6B7280] text-lg leading-relaxed">
            Every person responds differently to the same diet. NutriPredict factors
            in your profile, lifestyle, and history to generate forecasts that are
            actually yours — not a generic average.
          </p>

          <ul className="mt-8 space-y-4">
            <ValuePoint icon={FlaskConical} text="Science-based models" />
            <ValuePoint icon={UserCheck2} text="Personalized to your profile" />
            <ValuePoint icon={LineChart} text="Predictions, not guesses" />
            <ValuePoint icon={Lightbulb} text="Actionable insights" />
          </ul>
        </Reveal>
      </PageContainer>
    </section>
  );
}

function ValuePoint({ icon, text }) {
  const Icon = icon;
  return (
    <li className="flex items-center gap-3">
      <div className="w-8 h-8 rounded-lg bg-[#1F5A3F]/10 flex items-center justify-center text-[#1F5A3F] shrink-0">
        <Icon className="w-4 h-4" />
      </div>
      <span className="text-[#1D2A22] font-medium">{text}</span>
    </li>
  );
}

/* ---------------------------------------------------------------------- */
/* 4. HOW IT WORKS                                                         */
/* ---------------------------------------------------------------------- */

function HowItWorksSection() {
  return (
    <section id="how-it-works" className="py-20 sm:py-28 bg-white border-y border-[#E7E3D8]">
      <PageContainer>
        <SectionHeading
          eyebrow="The process"
          title="Three simple steps to smarter nutrition."
        />

        <div className="mt-16 relative">
          {/* connecting line (desktop only) */}
          <div className="hidden md:block absolute top-6 left-[8%] right-[8%] h-px divider-line" />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-8 relative">
            <Reveal delay={0}>
              <StepCard
                number="01"
                icon={UserRoundPlus}
                title="Create Your Profile"
                description="Tell us about your body, lifestyle, preferences, and goals."
              />
            </Reveal>
            <Reveal delay={120}>
              <StepCard
                number="02"
                icon={SlidersHorizontal}
                title="Compare Diets"
                description="Choose different diets and let our system analyze how they may affect you."
              />
            </Reveal>
            <Reveal delay={240}>
              <StepCard
                number="03"
                icon={LineChart}
                title="Get Your Prediction"
                description="See personalized predictions and compare potential outcomes."
              />
            </Reveal>
          </div>
        </div>
      </PageContainer>
    </section>
  );
}

/* ---------------------------------------------------------------------- */
/* 5. DIET COMPARISON                                                      */
/* ---------------------------------------------------------------------- */

function DietComparisonSection() {
  return (
    <section className="py-20 sm:py-28 bg-[#F7F6F1]">
      <PageContainer className="grid lg:grid-cols-[0.85fr_1.15fr] gap-12 lg:gap-16 items-center">
        <Reveal>
          <span className="section-label">Compare Diets</span>
          <h2 className="mt-4 text-3xl sm:text-4xl font-semibold text-[#1D2A22] leading-[1.15] text-balance">
            Compare. Predict. Choose.
          </h2>
          <p className="mt-5 text-[#6B7280] text-lg leading-relaxed max-w-md">
            See how Keto, Low-Carb, and Plant-Based plans could each play out for
            your specific profile — side by side, before you commit to one.
          </p>
          <div className="mt-8">
            <PredictionButton variant="primary" size="lg" icon={ArrowRight}>
              Compare Your Diets
            </PredictionButton>
          </div>
        </Reveal>

        <Reveal delay={150}>
          <DietComparisonTable />
        </Reveal>
      </PageContainer>
    </section>
  );
}

/* ---------------------------------------------------------------------- */
/* 6. FINAL CTA                                                            */
/* ---------------------------------------------------------------------- */

function FinalCtaSection() {
  return (
    <section className="relative py-20 sm:py-28 bg-[#123D2A] overflow-hidden">
      {/* subtle leaf motif, decorative only */}
      <svg
        className="absolute -right-16 -top-16 w-72 h-72 opacity-[0.08] pointer-events-none"
        viewBox="0 0 200 200"
        fill="none"
        aria-hidden="true"
      >
        <path
          d="M100 10 C 150 10 190 50 190 100 C 190 150 150 190 100 190 C 100 130 100 70 100 10 Z"
          fill="#FFFFFF"
        />
      </svg>
      <svg
        className="absolute -left-20 -bottom-20 w-80 h-80 opacity-[0.06] pointer-events-none"
        viewBox="0 0 200 200"
        fill="none"
        aria-hidden="true"
      >
        <circle cx="100" cy="100" r="90" fill="#FFFFFF" />
      </svg>

      {/* Natural-color produce photography with soft inner-edge fades */}
      <div className="hidden md:block absolute left-0 bottom-0 w-60 h-60 pointer-events-none">
        <ImageWithFallback
          src={heroIngredientsPhoto}
          alt=""
          className="w-full h-full object-cover object-[35%_75%] rounded-tr-[3rem]"
          fallback={<div />}
        />
        <div className="absolute inset-0 rounded-tr-[3rem] bg-gradient-to-tr from-transparent via-transparent to-[#123D2A]" />
      </div>
      <div className="hidden md:block absolute right-0 top-0 w-60 h-60 pointer-events-none">
        <ImageWithFallback
          src={ctaProducePhoto}
          alt=""
          className="w-full h-full object-cover rounded-bl-[3rem]"
          fallback={<div />}
        />
        <div className="absolute inset-0 rounded-bl-[3rem] bg-gradient-to-bl from-transparent via-transparent to-[#123D2A]" />
      </div>

      <Reveal>
        <PageContainer className="relative text-center max-w-2xl">
          <h2 className="text-3xl sm:text-4xl font-semibold text-white leading-[1.2] text-balance">
            Make your next diet decision with more than guesswork.
          </h2>
          <p className="mt-5 text-[#DDE8D8] text-lg leading-relaxed">
            Start your personalized nutrition prediction and understand potential
            outcomes before committing to a diet.
          </p>
          <div className="mt-9 flex justify-center">
            <PredictionButton
              variant="light"
              size="lg"
              icon={ArrowRight}
              className="!bg-white !text-[#123D2A] !border-transparent hover:!bg-[#F7F6F1]"
            >
              Start Your Prediction
            </PredictionButton>
          </div>
        </PageContainer>
      </Reveal>
    </section>
  );
}

function PredictionButton(props) {
  return <Button to={getUser() ? '/predict' : '/login'} {...props} />;
}

/* ---------------------------------------------------------------------- */
/* 7. FOOTER                                                               */
/* ---------------------------------------------------------------------- */

function SiteFooter() {
  return (
    <footer className="bg-white border-t border-[#E7E3D8] py-10">
      <PageContainer className="flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#1F5A3F] flex items-center justify-center">
            <ShieldCheck className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="font-semibold text-[#1D2A22] leading-none" style={{ fontFamily: 'var(--font-display)' }}>
              NutriPredict
            </p>
            <p className="text-xs text-[#6B7280] mt-1">AI-powered nutrition outcome prediction.</p>
          </div>
        </div>

        <nav className="flex items-center gap-6 text-sm text-[#6B7280]">
          <Link to="/" className="hover:text-[#1D2A22] transition-colors">Home</Link>
          <Link to="/predict" className="hover:text-[#1D2A22] transition-colors">Predict</Link>
          <Link to="/compare" className="hover:text-[#1D2A22] transition-colors">Compare</Link>
          <Link to="/login" className="hover:text-[#1D2A22] transition-colors">Sign In</Link>
        </nav>

        <p className="text-xs text-[#6B7280]">© 2026 NutriPredict</p>
      </PageContainer>
    </footer>
  );
}
