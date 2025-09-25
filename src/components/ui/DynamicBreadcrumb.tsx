"use client";

import { usePathname } from "next/navigation";
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbSeparator, BreadcrumbLink, BreadcrumbPage } from "@/components/ui/breadcrumb";

export default function DynamicBreadcrumb() {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);
  const paths = segments.map((_, i) => "/" + segments.slice(0, i + 1).join("/"));

  return (
    <Breadcrumb className="mb-4">
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink href="/">Home</BreadcrumbLink>
        </BreadcrumbItem>

        {segments.map((seg, i) => (
          <span key={paths[i]} className="inline-flex items-center">
            <BreadcrumbSeparator>/</BreadcrumbSeparator>
            <BreadcrumbItem>
              {i < segments.length - 1 ? (
                <BreadcrumbLink href={paths[i]}>{decodeURIComponent(seg)}</BreadcrumbLink>
              ) : (
                <BreadcrumbPage>{decodeURIComponent(seg)}</BreadcrumbPage>
              )}
            </BreadcrumbItem>
          </span>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  );
}


