"use client";

import React, { useState, useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '@/contexts/AuthContext';
import { NextIntlClientProvider } from 'next-intl';
import { Toaster } from 'sonner';
import { config } from "@fortawesome/fontawesome-svg-core";
import "@fortawesome/fontawesome-svg-core/styles.css";

// Prevent Font Awesome from adding its CSS automatically since we import it above
config.autoAddCss = false;

export default function Providers({
  children,
  locale,
  messages
}: {
  children: React.ReactNode;
  locale: string;
  messages: any;
}) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        retry: 1,
        refetchOnWindowFocus: false,
      },
    },
  }));

  return (
    <QueryClientProvider client={queryClient}>
      <NextIntlClientProvider locale={locale} messages={messages}>
        <AuthProvider>
          {children}
          <Toaster icons={false} />
        </AuthProvider>
      </NextIntlClientProvider>
    </QueryClientProvider>
  );
}
