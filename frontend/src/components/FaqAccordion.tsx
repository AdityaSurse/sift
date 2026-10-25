import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';

interface FaqItem {
  id: string;
  question: string;
  answer: string;
}

const FAQ_ITEMS: FaqItem[] = [
  {
    id: 'how-sift-finds-jobs',
    question: 'How does Sift find job openings?',
    answer:
      'Sift polls public ATS endpoints and verified company career directories directly (Greenhouse, Lever, Ashby, and company career portals). We do not scrape secondary job boards, aggregator feeds, or social networks like LinkedIn or Indeed. Every listing is pulled straight from source.',
  },
  {
    id: 'why-direct-links',
    question: 'Why do results link directly to company career pages?',
    answer:
      'We believe the job application experience should be direct and unmediated. Sift never asks you to register an applicant profile or submit resumes through our servers. Clicking "Apply" redirects you straight to the employer’s authentic submission form.',
  },
  {
    id: 'refresh-rate',
    question: 'How often does Sift refresh its data?',
    answer:
      'Our ingestion workflows run continuous verification cycles across indexed companies. Newly opened positions are ingested and enriched in near real-time, and roles missing across consecutive crawl passes are promptly marked closed to eliminate ghost listings.',
  },
  {
    id: 'is-sift-free',
    question: 'Is Sift free to use?',
    answer:
      'Yes, 100% free and open-source. There are no subscriptions, paywalls, recruiter bounties, or sponsored job placement algorithms. Relevance is purely determined by semantic and filter alignment.',
  },
  {
    id: 'robots-txt-compliance',
    question: 'How does Sift respect robots.txt and crawl etiquette?',
    answer:
      'Sift is engineered as a polite crawler. We strictly obey robots.txt directives, enforce conservative per-domain rate limiting, identify with an explicit User-Agent (SiftJobBot/1.0), and prioritize public API feeds whenever exposed by ATS vendors.',
  },
];

/**
 * Editorial FAQ Accordion
 * Why: Addresses candidate questions on transparency, data provenance, and crawl ethics.
 */
export const FaqAccordion: React.FC = () => {
  const [openId, setOpenId] = useState<string | null>(FAQ_ITEMS[0].id);

  const toggleItem = (id: string): void => {
    setOpenId((prev) => (prev === id ? null : id));
  };

  return (
    <section className="py-16 sm:py-24 border-t border-border/80">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-12 sm:mb-16">
          <span className="font-mono text-12 text-accent uppercase tracking-widest font-medium">
            Frequently Asked
          </span>
          <h2 className="font-serif text-36 sm:text-44 text-text font-normal tracking-tight mt-2 mb-3">
            Questions & <span className="italic">answers</span>.
          </h2>
          <p className="font-sans text-15 text-text-muted">
            Everything you need to know about Sift's engine, crawl etiquette, and indexing principles.
          </p>
        </div>

        <div className="rounded-surface border border-border/80 divide-y divide-border/60 bg-surface/40">
          {FAQ_ITEMS.map((item) => {
            const isOpen = openId === item.id;
            return (
              <div key={item.id} className="transition-colors duration-150 ease-editorial">
                <button
                  type="button"
                  onClick={() => toggleItem(item.id)}
                  aria-expanded={isOpen}
                  className="w-full flex items-center justify-between gap-4 p-5 sm:p-6 text-left hover:bg-surface/80 transition-colors duration-150 ease-editorial focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent"
                >
                  <span className="font-sans text-15 sm:text-16 font-medium text-text">
                    {item.question}
                  </span>
                  <ChevronDown
                    size={16}
                    strokeWidth={1.5}
                    className={`text-text-muted flex-shrink-0 transition-transform duration-150 ease-editorial ${
                      isOpen ? 'rotate-180 text-accent' : ''
                    }`}
                  />
                </button>

                {isOpen && (
                  <div className="px-5 sm:px-6 pb-6 pt-1 font-sans text-14 text-text-muted leading-relaxed border-t border-border/30 bg-surface/30">
                    {item.answer}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default FaqAccordion;
