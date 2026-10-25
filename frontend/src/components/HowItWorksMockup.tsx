import { CheckCircle2, ExternalLink, Link2, ShieldCheck, Sparkles } from 'lucide-react';

/**
 * HowItWorksMockup Component
 * Why: Demonstrates Sift's 3-step value prop using real interactive UI mockups
 * instead of marketing screenshots or stock graphics, adhering strictly to the design system.
 */
export const HowItWorksMockup: React.FC = () => {
  return (
    <section className="py-16 sm:py-24 border-t border-border/80">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-16 sm:mb-20">
          <span className="font-mono text-12 text-accent uppercase tracking-widest font-medium">
            Transparent Pipeline
          </span>
          <h2 className="font-serif text-36 sm:text-44 text-text font-normal tracking-tight mt-2 mb-4">
            How Sift discovers <span className="italic">signal</span> in the noise.
          </h2>
          <p className="font-sans text-15 text-text-muted leading-relaxed">
            Built from scratch for candidates who want direct access to genuine engineering openings,
            free from sponsored placement algorithms or recruiter spam.
          </p>
        </div>

        {/* Step 1: Natural Search & Intent Extraction */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center mb-20 sm:mb-28">
          <div className="lg:col-span-5 space-y-3">
            <span className="font-mono text-12 text-text-muted/70">Step 01</span>
            <h3 className="font-sans text-24 sm:text-28 font-medium text-text tracking-tight">
              Search naturally, without boolean gymnastics.
            </h3>
            <p className="font-sans text-14 sm:text-15 text-text-muted leading-relaxed">
              Type full sentences, target locations, or tenure bounds. Sift decomposes your natural intent
              into structured query facets and 768-dimensional semantic vectors in milliseconds.
            </p>
            <div className="pt-2 flex items-center gap-2 font-mono text-12 text-accent">
              <Sparkles size={14} strokeWidth={1.5} />
              <span>Zero keyword trickery required</span>
            </div>
          </div>

          <div className="lg:col-span-7">
            {/* Real Component Mockup: Search Intent Parsing Box */}
            <div className="rounded-surface border border-border/80 bg-surface p-5 sm:p-6">
              <div className="flex items-center gap-2 pb-3 border-b border-border/60 font-mono text-11 text-text-muted">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                <span>Intent Extractor · Live Pydantic Validator</span>
              </div>

              {/* Simulated Search Input */}
              <div className="mt-4 p-3 rounded-control border border-border-strong bg-bg font-sans text-14 text-text flex items-center justify-between">
                <span>6 month embedded firmware internship in Bangalore, fresher</span>
                <span className="font-mono text-11 text-text-muted border border-border px-1.5 py-0.5 rounded">⏎ Enter</span>
              </div>

              {/* Extracted Structured Tokens */}
              <div className="mt-4 pt-3 border-t border-border/40">
                <span className="font-mono text-11 text-text-muted block mb-2">Parsed Query Constraints:</span>
                <div className="flex flex-wrap gap-1.5 font-mono text-12">
                  <span className="rounded border border-accent/40 bg-accent-subdued px-2.5 py-0.5 text-accent">
                    role: Embedded / Firmware
                  </span>
                  <span className="rounded border border-border bg-bg px-2.5 py-0.5 text-text-muted">
                    type: Internship
                  </span>
                  <span className="rounded border border-border bg-bg px-2.5 py-0.5 text-text-muted">
                    tenure: &le; 6 mo
                  </span>
                  <span className="rounded border border-border bg-bg px-2.5 py-0.5 text-text-muted">
                    city: Bangalore
                  </span>
                  <span className="rounded border border-border bg-bg px-2.5 py-0.5 text-text-muted">
                    level: Fresher / Intern
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Step 2: AI Semantic Enrichment & Explainability */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center mb-20 sm:mb-28">
          <div className="lg:col-span-7 order-2 lg:order-1">
            {/* Real Component Mockup: Dense JobRow with Match Explanation */}
            <div className="rounded-surface border border-border/80 bg-surface p-5 sm:p-6 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-border/60">
                <span className="font-mono text-11 text-text-muted">Verified Opening · Greenhouse Direct</span>
                <span className="font-mono text-11 text-emerald-500 flex items-center gap-1">
                  <CheckCircle2 size={12} strokeWidth={1.5} />
                  <span>98% Semantic Fit</span>
                </span>
              </div>

              {/* Row Preview */}
              <div className="rounded-control border border-border/80 bg-bg p-4 space-y-2">
                <div className="flex items-center gap-3">
                  <div className="flex-shrink-0 flex items-center justify-center h-8 w-8 rounded border border-border bg-surface font-mono text-13 font-medium text-text">
                    N
                  </div>
                  <div>
                    <h4 className="font-sans text-15 font-medium text-text">
                      Firmware Engineer Intern — Embedded Systems
                    </h4>
                    <p className="font-sans text-13 text-text-muted">NVIDIA · Bangalore, India</p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 pt-1 font-mono text-12 text-text-muted">
                  <span className="rounded bg-surface border border-border px-2 py-0.5">Internship</span>
                  <span className="rounded bg-surface border border-border px-2 py-0.5">6 mo contract</span>
                  <span className="rounded bg-surface border border-border px-2 py-0.5">Onsite</span>
                </div>

                {/* Match Reason Banner */}
                <div className="mt-2 pt-2 border-t border-border/40 flex items-center gap-2 font-mono text-11 text-accent">
                  <span className="h-1.5 w-1.5 rounded-full bg-accent" />
                  <span>Matches internship contract · Tenure: 6 mo · Seniority: Intern</span>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-5 order-1 lg:order-2 space-y-3">
            <span className="font-mono text-12 text-text-muted/70">Step 02</span>
            <h3 className="font-sans text-24 sm:text-28 font-medium text-text tracking-tight">
              Enriched by AI, explained with total transparency.
            </h3>
            <p className="font-sans text-14 sm:text-15 text-text-muted leading-relaxed">
              Every raw career page posting is normalized and enriched. Sift surfaces the exact why behind
              every result—from contract durations to verified technical competencies.
            </p>
            <div className="pt-2 flex items-center gap-2 font-mono text-12 text-accent">
              <CheckCircle2 size={14} strokeWidth={1.5} />
              <span>Full explanation behind every match score</span>
            </div>
          </div>
        </div>

        {/* Step 3: Direct Apply Linkout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          <div className="lg:col-span-5 space-y-3">
            <span className="font-mono text-12 text-text-muted/70">Step 03</span>
            <h3 className="font-sans text-24 sm:text-28 font-medium text-text tracking-tight">
              Directly to the company career portal. Zero middlemen.
            </h3>
            <p className="font-sans text-14 sm:text-15 text-text-muted leading-relaxed">
              No locked accounts, no resume hijacking, and no auto-apply black boxes. When you find an opening,
              Sift links you straight to the employer’s authentic ATS application form.
            </p>
            <div className="pt-2 flex items-center gap-2 font-mono text-12 text-accent">
              <ShieldCheck size={14} strokeWidth={1.5} />
              <span>Pure canonical linkouts with no tracking cookies</span>
            </div>
          </div>

          <div className="lg:col-span-7">
            {/* Real Component Mockup: Direct ATS Redirection Card */}
            <div className="rounded-surface border border-border/80 bg-surface p-5 sm:p-6 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-border/60">
                <div className="flex items-center gap-2 font-mono text-11 text-text-muted">
                  <Link2 size={13} strokeWidth={1.5} className="text-accent" />
                  <span>Canonical ATS Destination</span>
                </div>
                <span className="font-mono text-11 text-text-muted">Verified 2h ago</span>
              </div>

              <div className="rounded-control border border-border/80 bg-bg p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="min-w-0">
                  <span className="font-mono text-11 text-text-muted block mb-0.5">Application Endpoint:</span>
                  <p className="font-mono text-12 text-text truncate">
                    boards.greenhouse.io/nvidia/jobs/482910
                  </p>
                </div>

                <div className="flex-shrink-0 flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-control bg-accent px-4 py-2 font-sans text-13 font-medium text-white select-none">
                    <span>Apply on Greenhouse</span>
                    <ExternalLink size={13} strokeWidth={1.5} />
                  </span>
                </div>
              </div>

              <p className="font-mono text-11 text-text-muted/60 text-center">
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
