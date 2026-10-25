import React from 'react';
import { CheckCircle2, ExternalLink, Link2, ShieldCheck, Sparkles } from 'lucide-react';

/**
 * HowItWorksMockup Component
 * Why: Demonstrates Sift's 3-step value prop using real interactive UI mockups
 * modeled on Simplify's showcase layout, styled with Aegean Marine Teal and Caspian Slate tokens.
 */
export const HowItWorksMockup: React.FC = () => {
  return (
    <section className="py-20 sm:py-28 border-t border-border/70 bg-surface-subdued/40">
      <div className="max-w-6xl mx-auto px-4 sm:px-8">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-16 sm:mb-24">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-accent/30 bg-accent-subdued px-3.5 py-1 font-sans text-12 font-medium text-accent uppercase tracking-wider">
            <Sparkles size={13} strokeWidth={2} />
            <span>High-Signal Ingestion Engine</span>
          </span>
          <h2 className="font-serif text-36 sm:text-48 text-text font-normal tracking-tight mt-3 mb-4">
            How Sift discovers <span className="italic">signal</span> in the noise.
          </h2>
          <p className="font-sans text-16 text-text-muted leading-relaxed">
            Built from scratch for candidates who want direct access to genuine engineering openings,
            free from sponsored placement algorithms or recruiter spam.
          </p>
        </div>

        {/* Step 1: Natural Search & Intent Extraction */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16 items-center mb-24 sm:mb-32">
          <div className="lg:col-span-5 space-y-4">
            <span className="font-mono text-12 text-accent font-semibold tracking-wider">STEP 01</span>
            <h3 className="font-sans text-26 sm:text-32 font-semibold text-text tracking-tight leading-tight">
              Search naturally, without boolean gymnastics.
            </h3>
            <p className="font-sans text-15 text-text-muted leading-relaxed">
              Type full sentences, target locations, or tenure bounds. Sift decomposes your natural intent
              into structured query facets and 768-dimensional semantic vectors in milliseconds.
            </p>
            <div className="pt-2 flex items-center gap-2 font-sans text-13 font-medium text-accent">
              <CheckCircle2 size={16} strokeWidth={2} />
              <span>Zero boolean operators or keyword tricks needed</span>
            </div>
          </div>

          <div className="lg:col-span-7">
            {/* Component Mockup: Intent Extractor Card with Ambient Accent Backing */}
            <div className="rounded-2xl border border-border/80 bg-surface p-6 sm:p-8 shadow-card">
              <div className="flex items-center justify-between pb-4 border-b border-border font-sans text-12 text-text-muted">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  <span className="font-medium text-text">Intent Extractor</span>
                  <span className="text-text-muted/60">· Live Pydantic Validator</span>
                </div>
                <span className="font-mono text-11 text-accent bg-accent-subdued px-2 py-0.5 rounded-full">FastAPI</span>
              </div>

              {/* Simulated Search Input */}
              <div className="mt-5 p-3.5 rounded-xl border border-border bg-surface-subdued font-sans text-14 text-text flex items-center justify-between">
                <span className="truncate pr-2">6 month embedded firmware internship in Bangalore, fresher</span>
                <span className="font-mono text-11 text-text-muted border border-border bg-surface px-2 py-0.5 rounded-md flex-shrink-0">
                  ⏎ Enter
                </span>
              </div>

              {/* Extracted Structured Tokens */}
              <div className="mt-5 pt-4 border-t border-border/60">
                <span className="font-sans text-12 font-medium text-text-muted block mb-2.5">
                  Parsed Query Facets:
                </span>
                <div className="flex flex-wrap gap-2 font-mono text-12">
                  <span className="rounded-full border border-accent/40 bg-accent-subdued px-3 py-1 text-accent font-medium">
                    role: Embedded / Firmware
                  </span>
                  <span className="rounded-full border border-border bg-surface px-3 py-1 text-text-muted">
                    type: Internship
                  </span>
                  <span className="rounded-full border border-border bg-surface px-3 py-1 text-text-muted">
                    tenure: &le; 6 mo
                  </span>
                  <span className="rounded-full border border-border bg-surface px-3 py-1 text-text-muted">
                    city: Bangalore
                  </span>
                  <span className="rounded-full border border-border bg-surface px-3 py-1 text-text-muted">
                    level: Fresher / Intern
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Step 2: AI Semantic Enrichment & Explainability */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16 items-center mb-24 sm:mb-32">
          <div className="lg:col-span-7 order-2 lg:order-1">
            {/* Component Mockup: Dense JobRow with Match Explanation */}
            <div className="rounded-2xl border border-border/80 bg-surface p-6 sm:p-8 shadow-card space-y-4">
              <div className="flex items-center justify-between pb-4 border-b border-border">
                <div className="flex items-center gap-2 font-sans text-12 text-text-muted">
                  <span className="font-semibold text-text">Verified Opening</span>
                  <span>· Greenhouse Direct</span>
                </div>
                <span className="font-mono text-12 text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1.5 bg-emerald-500/10 px-2.5 py-0.5 rounded-full">
                  <CheckCircle2 size={13} strokeWidth={2} />
                  <span>98% Semantic Fit</span>
                </span>
              </div>

              {/* Row Preview */}
              <div className="rounded-xl border border-border bg-surface-subdued/60 p-5 space-y-3">
                <div className="flex items-center gap-3.5">
                  <div className="flex-shrink-0 flex items-center justify-center h-10 w-10 rounded-xl bg-btn-primary text-btn-primary-text font-bold text-15 select-none shadow-sm">
                    N
                  </div>
                  <div>
                    <h4 className="font-sans text-16 font-semibold text-text leading-snug">
                      Firmware Engineer Intern — Embedded Systems
                    </h4>
                    <p className="font-sans text-13 text-text-muted">NVIDIA · Bangalore, India</p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 pt-1 font-mono text-12 text-text-muted">
                  <span className="rounded-full bg-surface border border-border px-2.5 py-0.5">Internship</span>
                  <span className="rounded-full bg-surface border border-border px-2.5 py-0.5">6 mo contract</span>
                  <span className="rounded-full bg-surface border border-border px-2.5 py-0.5">Onsite</span>
                </div>

                {/* Match Reason Banner */}
                <div className="mt-3 pt-3 border-t border-border/60 flex items-center gap-2 font-sans text-12 text-accent font-medium">
                  <span className="h-2 w-2 rounded-full bg-accent" />
                  <span>Matches internship contract · Tenure: 6 mo · Seniority: Intern</span>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-5 order-1 lg:order-2 space-y-4">
            <span className="font-mono text-12 text-accent font-semibold tracking-wider">STEP 02</span>
            <h3 className="font-sans text-26 sm:text-32 font-semibold text-text tracking-tight leading-tight">
              Enriched by AI, explained with total transparency.
            </h3>
            <p className="font-sans text-15 text-text-muted leading-relaxed">
              Every raw career page posting is normalized and enriched with structured Pydantic schemas.
              Sift surfaces the exact why behind every result—from contract durations to verified technical competencies.
            </p>
            <div className="pt-2 flex items-center gap-2 font-sans text-13 font-medium text-accent">
              <CheckCircle2 size={16} strokeWidth={2} />
              <span>Full explanation behind every match score</span>
            </div>
          </div>
        </div>

        {/* Step 3: Direct Apply Linkout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16 items-center">
          <div className="lg:col-span-5 space-y-4">
            <span className="font-mono text-12 text-accent font-semibold tracking-wider">STEP 03</span>
            <h3 className="font-sans text-26 sm:text-32 font-semibold text-text tracking-tight leading-tight">
              Directly to the company career portal. Zero middlemen.
            </h3>
            <p className="font-sans text-15 text-text-muted leading-relaxed">
              No locked accounts, no resume hijacking, and no auto-apply black boxes. When you find an opening,
              Sift links you straight to the employer’s authentic ATS application form.
            </p>
            <div className="pt-2 flex items-center gap-2 font-sans text-13 font-medium text-accent">
              <ShieldCheck size={16} strokeWidth={2} />
              <span>Pure canonical linkouts with no tracking cookies</span>
            </div>
          </div>

          <div className="lg:col-span-7">
            {/* Component Mockup: Direct ATS Redirection Card */}
            <div className="rounded-2xl border border-border/80 bg-surface p-6 sm:p-8 shadow-card space-y-4">
              <div className="flex items-center justify-between pb-4 border-b border-border">
                <div className="flex items-center gap-2 font-sans text-12 font-medium text-text-muted">
                  <Link2 size={14} strokeWidth={2} className="text-accent" />
                  <span>Canonical ATS Destination</span>
                </div>
                <span className="font-mono text-11 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                  Verified 2h ago
                </span>
              </div>

              <div className="rounded-xl border border-border bg-surface-subdued/60 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="min-w-0">
                  <span className="font-sans text-11 text-text-muted block mb-0.5">Application Endpoint:</span>
                  <p className="font-mono text-13 font-semibold text-text truncate">
                    boards.greenhouse.io/nvidia/jobs/482910
                  </p>
                </div>

                <div className="flex-shrink-0 flex items-center">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-btn-primary px-5 py-2 font-sans text-13 font-medium text-btn-primary-text select-none shadow-sm">
                    <span>Apply on Greenhouse</span>
                    <ExternalLink size={13} strokeWidth={2} />
                  </span>
                </div>
              </div>

              <p className="font-sans text-12 text-text-muted text-center">
                Never a redirected affiliate link. Always the canonical employer URL.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorksMockup;
