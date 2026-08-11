import { CheckCircle, XCircle, Award, Calendar, Hash, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

import { env } from '@/lib/env';
import { Button } from '@/components/ui/button';
import { ShareOnSocialButtons } from './ShareOnSocialButtons';

async function verifyCertificate(code: string) {
  try {
    const res = await fetch(`${env.NEXT_PUBLIC_API_BASE_URL}/progress/certificates/verify/${code}`, {
      cache: 'no-store'
    });
    if (!res.ok) return { valid: false };
    return res.json();
  } catch (err) {
    return { valid: false };
  }
}

export default async function VerifyCertificatePage({ params }: { params: Promise<{ code: string }> }) {
  const resolvedParams = await params;
  const data = await verifyCertificate(resolvedParams.code);

  return (
    <div className="min-h-screen bg-muted/30 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <div className="mb-8">
          <Link href="/">
            <Button variant="ghost" className="pl-0 text-muted-foreground hover:text-foreground">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to SkillForge
            </Button>
          </Link>
        </div>

        {data?.valid ? (
          <div className="bg-card text-card-foreground border rounded-2xl shadow-sm overflow-hidden">
            <div className="bg-primary/10 p-8 text-center border-b">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/20 text-primary mb-4">
                <CheckCircle className="w-8 h-8" />
              </div>
              <h1 className="text-3xl font-bold mb-2 text-primary">Certificate Verified</h1>
              <p className="text-muted-foreground">This is a valid SkillForge certificate.</p>
            </div>
            
            <div className="p-8 space-y-6">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-1">Student</h3>
                <p className="text-xl font-medium">{data.studentName}</p>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-1">Course Completed</h3>
                <div className="flex items-start">
                  <Award className="w-5 h-5 mr-2 mt-0.5 text-primary" />
                  <p className="text-xl font-medium">{data.courseName}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t">
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-1">Date</h3>
                  <div className="flex items-center text-foreground font-medium">
                    <Calendar className="w-4 h-4 mr-2 text-muted-foreground" />
                    {new Date(data.completedAt).toLocaleDateString(undefined, { 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-1">Certificate ID</h3>
                  <div className="flex items-center text-foreground font-medium font-mono">
                    <Hash className="w-4 h-4 mr-2 text-muted-foreground" />
                    {data.code}
                  </div>
                </div>
              </div>

              <ShareOnSocialButtons
                code={data.code}
                studentName={data.studentName}
                courseName={data.courseName}
              />
            </div>
          </div>
        ) : (
          <div className="bg-card text-card-foreground border rounded-2xl shadow-sm overflow-hidden text-center p-12">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-destructive/10 text-destructive mb-6">
              <XCircle className="w-8 h-8" />
            </div>
            <h1 className="text-2xl font-bold mb-2">Certificate Not Found</h1>
            <p className="text-muted-foreground mb-8">
              We couldn't verify this certificate. The code might be invalid or the certificate doesn't exist.
            </p>
            <div className="font-mono text-sm bg-muted p-3 rounded-lg mb-8 break-all">
              Code: {resolvedParams.code}
            </div>
            <Link href="/">
              <Button>Go to Homepage</Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
