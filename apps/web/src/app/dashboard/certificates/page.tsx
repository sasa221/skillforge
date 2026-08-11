'use client';

import { useQuery } from '@tanstack/react-query';
import { Download, Award, Share2, CheckCircle } from 'lucide-react';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { progressApi } from '@/lib/api/endpoints';

export default function CertificatesPage() {
  const { data: certificates, isLoading } = useQuery({
    queryKey: ['certificates'],
    queryFn: () => progressApi.certificates(),
  });

  if (isLoading) {
    return <div className="flex justify-center p-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>;
  }

  if (!certificates || certificates.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center border rounded-xl bg-card text-card-foreground">
        <Award className="w-16 h-16 mb-4 text-muted-foreground" />
        <h2 className="text-2xl font-bold mb-2">No Certificates Yet</h2>
        <p className="text-muted-foreground mb-6 max-w-md">
          Complete courses to earn certificates and showcase your skills.
        </p>
        <Link href="/courses">
          <Button>Browse Courses</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">My Certificates</h1>
        <p className="text-muted-foreground">
          View and download your earned certificates.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {certificates.map((cert) => (
          <div key={cert.code} className="border rounded-xl p-6 bg-card text-card-foreground flex flex-col h-full">
            <div className="flex-1">
              <Award className="w-10 h-10 text-primary mb-4" />
              <h3 className="font-bold text-xl mb-2 line-clamp-2">{cert.courseName}</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Completed on {new Date(cert.completedAt).toLocaleDateString()}
              </p>
            </div>
            
            <div className="space-y-3 mt-6">
              <a 
                href={`${process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:3200'}/progress/certificates/${cert.code}/pdf`} 
                target="_blank" 
                rel="noreferrer"
                className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors bg-primary text-primary-foreground hover:opacity-90 h-10 px-4 py-2 w-full"
              >
                <Download className="w-4 h-4 mr-2" />
                Download PDF
              </a>
              
              <div className="grid grid-cols-2 gap-2">
                <a 
                  href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(
                    `${typeof window !== 'undefined' ? window.location.origin : ''}/certificates/verify/${cert.code}`
                  )}`}
                  target="_blank" 
                  rel="noreferrer"
                  className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors border bg-background hover:bg-muted h-10 px-4 py-2 w-full text-xs"
                >
                  <Share2 className="w-3 h-3 mr-2" />
                  Share
                </a>
                <Link 
                  href={`/certificates/verify/${cert.code}`}
                  className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors border bg-background hover:bg-muted h-10 px-4 py-2 w-full text-xs"
                >
                  <CheckCircle className="w-3 h-3 mr-2" />
                  Verify
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
