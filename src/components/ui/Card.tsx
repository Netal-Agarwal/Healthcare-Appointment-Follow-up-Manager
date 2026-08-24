import React from "react";

export function Card({ children, className = "" }: React.PropsWithChildren<{ className?: string }>) {
  return (
    <div className={`rounded-xl bg-white dark:bg-slate-900 shadow-sm p-6 ${className}`}>
      {children}
    </div>
  );
}

export default Card;
