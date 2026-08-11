'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { Home, RefreshCcw, ShieldAlert } from 'lucide-react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: '100vh',
          background:
            'radial-gradient(circle at top, rgba(47,155,255,0.14), transparent 30%), #f4f8fc',
          color: '#10192d',
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        <main
          style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '32px',
          }}
        >
          <section
            style={{
              width: '100%',
              maxWidth: '760px',
              border: '1px solid #dbe6f2',
              borderRadius: '28px',
              background: '#ffffff',
              boxShadow: '0 24px 54px rgba(15,31,56,0.08)',
              padding: '40px',
              textAlign: 'center',
            }}
          >
            <div
              style={{
                margin: '0 auto',
                display: 'flex',
                height: '84px',
                width: '84px',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '24px',
                background: '#e7f3ff',
                color: '#2f9bff',
              }}
            >
              <ShieldAlert size={42} />
            </div>

            <h1 style={{ marginTop: '24px', marginBottom: '0', fontSize: '44px', lineHeight: 1.05 }}>
              Critical page error
            </h1>
            <p
              style={{
                margin: '20px auto 0',
                maxWidth: '620px',
                fontSize: '20px',
                lineHeight: 1.8,
                color: '#5c7393',
              }}
            >
              A top-level application error interrupted this route. We can retry from here or move
              back home.
            </p>

            <div
              style={{
                marginTop: '28px',
                display: 'flex',
                flexWrap: 'wrap',
                justifyContent: 'center',
                gap: '16px',
              }}
            >
              <button
                onClick={() => reset()}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '10px',
                  borderRadius: '999px',
                  border: 'none',
                  background: '#2f9bff',
                  color: '#ffffff',
                  padding: '16px 24px',
                  fontSize: '18px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                <RefreshCcw size={18} />
                Try Again
              </button>

              <Link
                href="/"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '10px',
                  borderRadius: '999px',
                  border: '1px solid #dbe6f2',
                  background: '#ffffff',
                  color: '#10192d',
                  padding: '16px 24px',
                  fontSize: '18px',
                  fontWeight: 600,
                  textDecoration: 'none',
                }}
              >
                <Home size={18} />
                Back Home
              </Link>
            </div>

            <div
              style={{
                marginTop: '28px',
                borderRadius: '20px',
                background: '#f8fbff',
                padding: '18px 20px',
                textAlign: 'left',
                color: '#5c7393',
                fontSize: '14px',
                lineHeight: 1.8,
              }}
            >
              {error.message || 'Unknown application error'}
            </div>
          </section>
        </main>
      </body>
    </html>
  );
}
