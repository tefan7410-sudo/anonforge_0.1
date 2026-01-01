import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Layers } from 'lucide-react';

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto max-w-4xl px-4 py-8">
        <Link to="/" className="inline-flex items-center gap-2 mb-8">
          <Button variant="ghost" size="icon" className="h-10 w-10">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <Layers className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-display font-bold">AnonForge</span>
          </div>
        </Link>

        <div className="prose prose-invert max-w-none">
          <h1 className="font-display text-4xl font-bold mb-2">Terms of Service</h1>
          <p className="text-muted-foreground mb-8">Last updated: January 1, 2026</p>

          <section className="mb-8">
            <h2 className="font-display text-2xl font-semibold mb-4">1. Acceptance of Terms</h2>
            <p className="text-muted-foreground">
              By accessing or using AnonForge ("the Service"), you agree to be bound by these
              Terms of Service. If you do not agree to these terms, please do not use the
              Service.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="font-display text-2xl font-semibold mb-4">2. Description of Service</h2>
            <p className="text-muted-foreground">
              AnonForge is a web-based platform that allows users to create unique profile
              pictures and digital art by combining customizable layers. The Service provides
              tools for uploading, organizing, and generating layered artwork.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="font-display text-2xl font-semibold mb-4">3. User Accounts</h2>
            <p className="text-muted-foreground mb-4">
              To use certain features of the Service, you must create an account. You agree to:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2">
              <li>Provide accurate and complete registration information</li>
              <li>Maintain the security of your account credentials</li>
              <li>Notify us immediately of any unauthorized use of your account</li>
              <li>Accept responsibility for all activities that occur under your account</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="font-display text-2xl font-semibold mb-4">4. Intellectual Property Rights</h2>
            <p className="text-muted-foreground mb-4">
              <strong>Your Content:</strong> You retain all rights to the artwork, images, and
              other content you upload to the Service. By uploading content, you grant us a
              limited license to store, display, and process your content solely for the
              purpose of providing the Service.
            </p>
            <p className="text-muted-foreground">
              <strong>Our Content:</strong> The Service, including its original content,
              features, and functionality, is owned by AnonForge and is protected by
              international copyright, trademark, and other intellectual property laws.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="font-display text-2xl font-semibold mb-4">5. User Generated Content</h2>
            <p className="text-muted-foreground mb-4">You are solely responsible for the content you upload. You agree not to upload content that:</p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2">
              <li>Infringes on any third party's intellectual property rights</li>
              <li>Contains illegal, harmful, threatening, or offensive material</li>
              <li>Contains malware, viruses, or other harmful code</li>
              <li>Violates any applicable laws or regulations</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="font-display text-2xl font-semibold mb-4">6. Prohibited Uses</h2>
            <p className="text-muted-foreground mb-4">You may not use the Service to:</p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2">
              <li>Violate any laws or regulations</li>
              <li>Infringe upon the rights of others</li>
              <li>Transmit harmful or malicious code</li>
              <li>Attempt to gain unauthorized access to our systems</li>
              <li>Interfere with or disrupt the Service</li>
              <li>Use automated systems to access the Service without permission</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="font-display text-2xl font-semibold mb-4">7. Limitation of Liability</h2>
            <p className="text-muted-foreground">
              To the maximum extent permitted by law, AnonForge shall not be liable for any
              indirect, incidental, special, consequential, or punitive damages, including
              without limitation, loss of profits, data, use, goodwill, or other intangible
              losses resulting from your use of the Service.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="font-display text-2xl font-semibold mb-4">8. Termination</h2>
            <p className="text-muted-foreground">
              We may terminate or suspend your account and access to the Service immediately,
              without prior notice or liability, for any reason, including breach of these
              Terms. Upon termination, your right to use the Service will immediately cease.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="font-display text-2xl font-semibold mb-4">9. Changes to Terms</h2>
            <p className="text-muted-foreground">
              We reserve the right to modify these Terms at any time. We will notify users of
              any material changes by posting the new Terms on this page and updating the
              "Last updated" date. Your continued use of the Service after such modifications
              constitutes acceptance of the updated Terms.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="font-display text-2xl font-semibold mb-4">10. Governing Law</h2>
            <p className="text-muted-foreground">
              These Terms shall be governed by and construed in accordance with applicable
              laws, without regard to conflict of law principles.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="font-display text-2xl font-semibold mb-4">11. Contact Information</h2>
            <p className="text-muted-foreground">
              If you have any questions about these Terms, please contact us through the
              Service.
            </p>
          </section>
        </div>

        <div className="mt-12 pt-8 border-t border-border">
          <Link to="/register">
            <Button>Back to Registration</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
