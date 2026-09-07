import type { HTMLAttributes } from "react";

export function BrandMark({ compact = false, className = "" }: { compact?: boolean; className?: string }) {
  return (
    <div className={`inline-flex items-center gap-3 ${className}`} aria-label="3DOT">
      <svg aria-hidden="true" viewBox="0 0 48 48" className="h-10 w-10 shrink-0">
        <path d="M7 15.5 24 6l17 9.5v17L24 42 7 32.5Z" fill="none" stroke="currentColor" strokeWidth="2.2" />
        <path d="M7 15.5 24 25l17-9.5M24 25v17" fill="none" stroke="currentColor" strokeWidth="2.2" />
        <circle cx="17" cy="19" r="3.2" fill="#B76E42" /><circle cx="24" cy="25" r="3.2" fill="#B76E42" /><circle cx="31" cy="19" r="3.2" fill="#B76E42" />
      </svg>
      {!compact && <span className="text-lg font-black tracking-[.18em]">3DOT</span>}
    </div>
  );
}

export function BrandConceptImage(props: HTMLAttributes<HTMLImageElement>) {
  return <img src="/brand/3dot-logo-concept.png" alt="3DOT logo concept" {...props} />;
}
