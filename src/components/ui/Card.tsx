import React from "react";

export function Card({ children, className = "" }: React.PropsWithChildren<{ className?: string }>) {
  return (
    <div className={`rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_4px_24px_-6px_rgba(30,41,59,0.08)] ${className}`}>
      {children}
    </div>
  );
}

export default Card;
