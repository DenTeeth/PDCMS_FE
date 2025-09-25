"use client";

import * as React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronRight } from "@fortawesome/free-solid-svg-icons";

export function Breadcrumb({ className, ...props }: React.HTMLAttributes<HTMLElement>) {
	return (
		<nav aria-label="Breadcrumb" className={cn("w-full", className)} {...props} />
	);
}

export function BreadcrumbList({ className, ...props }: React.HTMLAttributes<HTMLOListElement>) {
	return (
		<ol className={cn("flex items-center gap-1 text-sm text-slate-500", className)} {...props} />
	);
}

export function BreadcrumbItem({ className, ...props }: React.LiHTMLAttributes<HTMLLIElement>) {
	return <li className={cn("inline-flex items-center", className)} {...props} />;
}

export function BreadcrumbSeparator({ className, ...props }: React.HTMLAttributes<HTMLSpanElement>) {
	return (
		<span aria-hidden className={cn("px-1 text-slate-400", className)} {...props}>
			<FontAwesomeIcon icon={faChevronRight} className="h-4 w-4" />
		</span>
	);
}

export function BreadcrumbLink({ className, href = "#", children, ...props }: React.ComponentProps<typeof Link>) {
	return (
		<Link href={href} className={cn("hover:text-slate-700 transition-colors", className)} {...props}>
			{children}
		</Link>
	);
}

export function BreadcrumbPage({ className, ...props }: React.HTMLAttributes<HTMLSpanElement>) {
	return (
		<span aria-current="page" className={cn("font-medium text-slate-700", className)} {...props} />
	);
}
