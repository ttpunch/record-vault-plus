import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface PurpleGradientCardProps {
  children: ReactNode;
  className?: string;
  variant?: "default" | "subtle" | "glow";
}

export function PurpleGradientCard({ 
  children, 
  className, 
  variant = "default" 
}: PurpleGradientCardProps) {
  const variants = {
    default: "bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900 border border-purple-200 dark:border-purple-800",
    subtle: "bg-gradient-to-br from-white to-purple-50 dark:from-gray-900 dark:to-purple-950 border border-purple-100 dark:border-purple-800",
    glow: "bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900 border border-purple-200 dark:border-purple-800 shadow-glow"
  };

  return (
    <div className={cn(
      "rounded-lg p-6 transition-all duration-300 hover:shadow-lg",
      variants[variant],
      className
    )}>
      {children}
    </div>
  );
}
