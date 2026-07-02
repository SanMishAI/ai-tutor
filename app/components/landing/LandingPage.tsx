"use client"

import LandingNav from "./LandingNav"
import HeroSection from "./HeroSection"
import StatsBar from "./StatsBar"
import HowItWorks from "./HowItWorks"
import ModesTabs from "./ModesTabs"
import ProofBlock from "./ProofBlock"
import ExamGrid from "./ExamGrid"
import FounderSection from "./FounderSection"
import PricingSection from "./PricingSection"
import FAQSection from "./FAQSection"
import FinalCTA from "./FinalCTA"
import LandingFooter from "./LandingFooter"
import MobileBottomBar from "./MobileBottomBar"

interface LandingPageProps {
  onOpenApp: () => void
  onStudentLogin: () => void
  isSignedIn: boolean
}

export default function LandingPage({
  onOpenApp,
  onStudentLogin,
  isSignedIn,
}: LandingPageProps) {
  return (
    <div className="min-h-screen bg-white">
      <LandingNav
        onOpenApp={onOpenApp}
        onStudentLogin={onStudentLogin}
        isSignedIn={isSignedIn}
      />
      <HeroSection
        onOpenApp={onOpenApp}
        onStudentLogin={onStudentLogin}
        isSignedIn={isSignedIn}
      />
      <StatsBar />
      <HowItWorks />
      <ModesTabs />
      <ProofBlock />
      <ExamGrid />
      <FounderSection />
      <PricingSection onOpenApp={onOpenApp} />
      <FAQSection />
      <FinalCTA onOpenApp={onOpenApp} />
      <LandingFooter />
      <MobileBottomBar onOpenApp={onOpenApp} />
    </div>
  )
}
