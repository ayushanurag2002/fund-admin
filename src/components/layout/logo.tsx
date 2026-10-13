export function LogoMark({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <span className={`inline-flex shrink-0 items-center justify-center rounded-[9px] bg-brand text-brand-fg ${className}`}>
      <svg viewBox="0 0 32 32" fill="none" className="h-[62%] w-[62%]" aria-hidden="true">
        <path d="M6 26 16 6l10 20" stroke="currentColor" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M10.6 19h10.8" stroke="currentColor" strokeWidth="3.4" strokeLinecap="round" />
      </svg>
    </span>
  );
}
