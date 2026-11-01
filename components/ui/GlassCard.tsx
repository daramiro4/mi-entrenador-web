import type { HTMLAttributes } from "react";

interface GlassCardProps extends HTMLAttributes<HTMLElement> {
  as?: "section" | "div" | "article";
  hoverable?: boolean;
}

export function GlassCard({ as: Tag = "section", hoverable = false, className = "", ...props }: GlassCardProps) {
  return <Tag className={`glass-card ${hoverable ? "is-hoverable" : ""} ${className}`} {...props} />;
}
