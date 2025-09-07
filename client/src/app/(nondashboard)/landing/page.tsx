import React from "react";
import { HeroSection } from "@/app/(nondashboard)/landing/hero-section";
import { FeatureSection } from "@/app/(nondashboard)/landing/feature-section";
import { DiscoverSection } from "@/app/(nondashboard)/landing/discover-section";
import { CallToActionSection } from "@/app/(nondashboard)/landing/call-to-action-section";
import { FooterSection } from "@/app/(nondashboard)/landing/footer-section";

const Landing = () => (
  <div>
    <HeroSection />
    <FeatureSection />
    <DiscoverSection />
    <CallToActionSection />
    <FooterSection />
  </div>
);

export default Landing;
