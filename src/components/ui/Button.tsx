"use client";
import React from "react";
import { motion } from "framer-motion";
import { cva } from "class-variance-authority";
import clsx from "clsx";
import { twMerge } from "tailwind-merge";

export type ButtonProps = React.ComponentProps<typeof motion.button> & {
  variant?: "primary" | "secondary" | "ghost" | "destructive";
};

const button = cva(
  "inline-flex min-h-10 items-center justify-center rounded-lg px-4 py-2 text-sm font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-[#006398] focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
  {
    variants: {
      variant: {
        primary: "bg-[#006398] text-white shadow-sm hover:bg-[#004b73]",
        secondary: "border border-slate-200 bg-white text-slate-800 hover:bg-[#eff4ff]",
        ghost: "bg-transparent text-[#006398] hover:bg-[#eff4ff]",
        destructive: "bg-red-600 text-white hover:bg-red-500",
      },
    },
    defaultVariants: {
      variant: "primary",
    },
  }
);

export function Button({ variant = "primary", className, children, ...props }: ButtonProps) {
  return (
    <motion.button whileTap={{ scale: 0.98 }} className={twMerge(clsx(button({ variant }), className))} {...props}>
      {children}
    </motion.button>
  );
}

export default Button;
