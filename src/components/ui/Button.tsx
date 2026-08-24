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
  "inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50",
  {
    variants: {
      variant: {
        primary: "bg-teal-700 text-white hover:bg-teal-600 focus:ring-teal-400",
        secondary: "bg-slate-100 text-slate-900 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-100",
        ghost: "bg-transparent text-teal-700 hover:bg-slate-50 dark:text-teal-300",
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
