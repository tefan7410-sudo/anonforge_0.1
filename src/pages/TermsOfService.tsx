import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Layers } from 'lucide-react';
import { PageTransition } from '@/components/PageTransition';

export default function TermsOfService() {
  const navigate = useNavigate();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <PageTransition>
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
            <p className="text-muted-foreground mb-8">Last updated: January 2, 2026</p>

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
              <p className="text-muted-foreground mb-4">
                AnonForge is a comprehensive web-based platform for creating, managing, and launching NFT collections on the Cardano blockchain. The Service provides tools for:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 mb-4">
                <li>Uploading and organizing image layers with customizable traits</li>
                <li>Configuring rarity weights for trait distribution</li>
                <li>Generating unique NFT combinations through random or manual selection</li>
                <li>Managing metadata for NFT collections</li>
                <li>Integrating with NMKR for Cardano blockchain minting</li>
                <li>Creating customizable product pages for collection marketing</li>
                <li>Team collaboration with role-based access control</li>
                <li>Marketplace listing for public collection discovery</li>
                <li>Royalty configuration for secondary sales</li>
              </ul>
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
                <li>Not share your account credentials with others</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="font-display text-2xl font-semibold mb-4">4. NFT Creation and Minting</h2>
              <p className="text-muted-foreground mb-4">
                When using our NFT generation and minting features:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2">
                <li>You retain full ownership of the artwork and content you upload</li>
                <li>You are responsible for ensuring you have rights to all uploaded content</li>
                <li>Blockchain transactions are irreversible once confirmed</li>
                <li>Gas fees and minting costs are your responsibility</li>
                <li>We do not guarantee the value or marketability of any NFTs created</li>
                <li>Generated metadata and combinations are stored on our servers until minted</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="font-display text-2xl font-semibold mb-4">5. Third-Party Integrations (NMKR)</h2>
              <p className="text-muted-foreground mb-4">
                Our Service integrates with NMKR for Cardano blockchain minting:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2">
                <li>NMKR is a third-party service with its own terms and conditions</li>
                <li>Your NMKR API key is encrypted and stored securely</li>
                <li>We are not responsible for NMKR service availability or performance</li>
                <li>Any fees charged by NMKR are separate from our Service</li>
                <li>You must comply with NMKR's terms when using their integration</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="font-display text-2xl font-semibold mb-4">6. Team Collaboration</h2>
              <p className="text-muted-foreground mb-4">
                When using team collaboration features:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2">
                <li>Project owners are responsible for managing team member access</li>
                <li>Different roles (Admin, Editor, Viewer) have different permissions</li>
                <li>Team invitations expire after 7 days if not accepted</li>
                <li>Owners can remove team members at any time</li>
                <li>Actions taken by team members are logged for accountability</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="font-display text-2xl font-semibold mb-4">7. Marketplace Listing</h2>
              <p className="text-muted-foreground mb-4">
                When listing your collection on our Marketplace:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2">
                <li>Listings require admin approval before becoming public</li>
                <li>We reserve the right to reject or remove listings that violate our guidelines</li>
                <li>You must provide accurate information about your collection</li>
                <li>Listings may be hidden or scheduled for future launch</li>
                <li>We do not facilitate direct sales; buy buttons link to external minting services</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="font-display text-2xl font-semibold mb-4">8. Royalties and Payments</h2>
              <p className="text-muted-foreground mb-4">
                Regarding royalty configuration:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2">
                <li>Royalty percentages are set by you and embedded in NFT metadata</li>
                <li>Royalty enforcement depends on marketplace compliance with standards</li>
                <li>We do not guarantee royalty collection or payment</li>
                <li>You are responsible for providing correct wallet addresses</li>
                <li>Royalty settings cannot be changed after minting</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="font-display text-2xl font-semibold mb-4">9. Intellectual Property Rights</h2>
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
              <h2 className="font-display text-2xl font-semibold mb-4">10. User Generated Content</h2>
              <p className="text-muted-foreground mb-4">You are solely responsible for the content you upload. You agree not to upload content that:</p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2">
                <li>Infringes on any third party's intellectual property rights</li>
                <li>Contains illegal, harmful, threatening, or offensive material</li>
                <li>Contains malware, viruses, or other harmful code</li>
                <li>Violates any applicable laws or regulations</li>
                <li>Impersonates others or misrepresents affiliation</li>
                <li>Contains copyrighted material without authorization</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="font-display text-2xl font-semibold mb-4">11. Prohibited Uses</h2>
              <p className="text-muted-foreground mb-4">You may not use the Service to:</p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2">
                <li>Violate any laws or regulations</li>
                <li>Infringe upon the rights of others</li>
                <li>Transmit harmful or malicious code</li>
                <li>Attempt to gain unauthorized access to our systems</li>
                <li>Interfere with or disrupt the Service</li>
                <li>Use automated systems to access the Service without permission</li>
                <li>Create fraudulent or misleading NFT collections</li>
                <li>Circumvent any security measures</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="font-display text-2xl font-semibold mb-4">12. Data Storage and Privacy</h2>
              <p className="text-muted-foreground mb-4">
                Regarding your data:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2">
                <li>Your uploaded layers and generated images are stored securely</li>
                <li>API keys are encrypted before storage</li>
                <li>We retain generation history for project management</li>
                <li>Account deletion will remove all associated project data</li>
                <li>Minted NFTs remain on the blockchain regardless of account status</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="font-display text-2xl font-semibold mb-4">13. Limitation of Liability</h2>
              <p className="text-muted-foreground">
                To the maximum extent permitted by law, AnonForge shall not be liable for any
                indirect, incidental, special, consequential, or punitive damages, including
                without limitation, loss of profits, data, use, goodwill, or other intangible
                losses resulting from your use of the Service. This includes but is not limited to:
                failed blockchain transactions, minting errors, metadata issues, or third-party
                service failures.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="font-display text-2xl font-semibold mb-4">14. Termination</h2>
              <p className="text-muted-foreground">
                We may terminate or suspend your account and access to the Service immediately,
                without prior notice or liability, for any reason, including breach of these
                Terms. Upon termination, your right to use the Service will immediately cease.
                You may also delete your account at any time through account settings.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="font-display text-2xl font-semibold mb-4">15. Changes to Terms</h2>
              <p className="text-muted-foreground">
                We reserve the right to modify these Terms at any time. We will notify users of
                any material changes by posting the new Terms on this page and updating the
                "Last updated" date. Your continued use of the Service after such modifications
                constitutes acceptance of the updated Terms.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="font-display text-2xl font-semibold mb-4">16. Governing Law</h2>
              <p className="text-muted-foreground">
                These Terms shall be governed by and construed in accordance with applicable
                laws, without regard to conflict of law principles.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="font-display text-2xl font-semibold mb-4">17. Contact Information</h2>
              <p className="text-muted-foreground">
                If you have any questions about these Terms, please contact us through the
                Service.
              </p>
            </section>
          </div>

          <div className="mt-12 pt-8 border-t border-border">
            <Button onClick={() => navigate(-1)}>Go Back</Button>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}