import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, ArrowLeft, AlertTriangle, Info, CheckCircle } from 'lucide-react';
import { Card, CardContent } from '../components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '../components/ui/alert';

const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen bg-background py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <Link
              to="/login"
              className="inline-flex items-center text-gray-900 dark:text-neutral-50 hover:text-gray-600 dark:hover:text-neutral-400 mb-6 transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Login
            </Link>

            <div className="flex items-center mb-4">
              <Shield className="w-10 h-10 text-gray-900 dark:text-neutral-50 mr-4" />
              <div>
                <h1 className="text-4xl font-bold text-foreground">Privacy Policy</h1>
                <p className="text-sm text-muted-foreground mt-1">Effective Date: October 26, 2025</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Content */}
        <Card>
          <CardContent className="pt-6 space-y-8">

            {/* Introduction */}
            <section>
              <h2 className="text-2xl font-bold text-foreground mb-4">1. Introduction</h2>
              <p className="text-muted-foreground leading-relaxed">
                Welcome to <strong>Clara Platform</strong> ("we," "our," or "us"). Clara is an internal collaboration and workspace management platform developed and operated exclusively for employees and authorized personnel of <strong>Mebit</strong> ("Mebit.io").
              </p>
              <p className="text-muted-foreground leading-relaxed mt-3">
                This Privacy Policy explains how we collect, use, disclose, and safeguard your personal information when you use our platform.
              </p>
              <Alert className="mt-4 border-l-4">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Important</AlertTitle>
                <AlertDescription>
                  Clara Platform is restricted to individuals with <strong>@mebit.io email addresses only</strong>. Access is limited to Mebit employees, contractors, and authorized personnel.
                </AlertDescription>
              </Alert>
            </section>

            {/* Eligibility */}
            <section>
              <h2 className="text-2xl font-bold text-foreground mb-4">2. Eligibility and Access Restriction</h2>
              <h3 className="text-xl font-semibold text-foreground mb-3">2.1 @mebit.io Email Requirement</h3>
              <p className="text-muted-foreground leading-relaxed">
                Clara Platform is <strong>exclusively available</strong> to individuals with valid <strong>@mebit.io</strong> email addresses. This restriction is enforced during:
              </p>
              <ul className="list-disc ml-6 mt-3 text-muted-foreground space-y-2">
                <li>Account Registration - Only @mebit.io email addresses are accepted</li>
                <li>Third-Party Authentication - Google OAuth and Slack OAuth verify @mebit.io domain</li>
                <li>Ongoing Access - Email domain is verified on each authentication request</li>
              </ul>
            </section>

            {/* Information We Collect */}
            <section>
              <h2 className="text-2xl font-bold text-foreground mb-4">3. Information We Collect</h2>

              <h3 className="text-xl font-semibold text-foreground mb-3">3.1 Information You Provide Directly</h3>
              <ul className="list-disc ml-6 text-muted-foreground space-y-2">
                <li><strong>Name:</strong> Your full name as provided during registration</li>
                <li><strong>Email Address:</strong> Your @mebit.io email address (required)</li>
                <li><strong>Password:</strong> Encrypted password for account security</li>
                <li><strong>Workspace Content:</strong> Data you create, upload, or share within workspaces</li>
              </ul>

              <h3 className="text-xl font-semibold text-foreground mb-3 mt-6">3.2 Information Collected Automatically</h3>
              <ul className="list-disc ml-6 text-muted-foreground space-y-2">
                <li><strong>Usage Data:</strong> Pages visited, features used, time spent on platform</li>
                <li><strong>Device Information:</strong> IP address, browser type, device type, user agent</li>
                <li><strong>Security Logs:</strong> Login attempts, authentication events, security actions</li>
              </ul>

              <h3 className="text-xl font-semibold text-foreground mb-3 mt-6">3.3 Information from Third-Party Services</h3>
              <div className="bg-accent/50 border border-border rounded-lg p-4 mt-3">
                <p className="text-foreground font-semibold mb-2">Google OAuth:</p>
                <p className="text-muted-foreground text-sm">Google user ID, name, email address, profile picture, access/refresh tokens</p>

                <p className="text-foreground font-semibold mb-2 mt-4">Slack OAuth:</p>
                <p className="text-muted-foreground text-sm">Slack user ID, team ID, display name, workspace information, access token</p>
              </div>
            </section>

            {/* How We Use Your Information */}
            <section>
              <h2 className="text-2xl font-bold text-foreground mb-4">4. How We Use Your Information</h2>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-muted rounded-lg p-4">
                  <h4 className="font-semibold text-foreground mb-2">Platform Functionality</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Account management</li>
                    <li>• Workspace operations</li>
                    <li>• Feature delivery</li>
                    <li>• Third-party integrations</li>
                  </ul>
                </div>
                <div className="bg-muted rounded-lg p-4">
                  <h4 className="font-semibold text-foreground mb-2">Security & Access Control</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Authentication verification</li>
                    <li>• Account security</li>
                    <li>• Token management</li>
                    <li>• Fraud prevention</li>
                  </ul>
                </div>
              </div>
              <Alert variant="destructive" className="mt-4">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>We do NOT:</AlertTitle>
                <AlertDescription>
                  <ul className="text-sm mt-2 space-y-1">
                    <li>• Sell your personal information to third parties</li>
                    <li>• Use your data for advertising or marketing</li>
                    <li>• Share your information outside of Mebit organization without consent</li>
                  </ul>
                </AlertDescription>
              </Alert>
            </section>

            {/* How We Share Your Information */}
            <section>
              <h2 className="text-2xl font-bold text-foreground mb-4">5. How We Share Your Information</h2>

              <h3 className="text-xl font-semibold text-foreground mb-3">5.1 Within Mebit Organization</h3>
              <p className="text-muted-foreground">Your information may be accessible to:</p>
              <ul className="list-disc ml-6 text-muted-foreground space-y-1 mt-2">
                <li>Workspace members you invite</li>
                <li>Mebit administrators and developers</li>
                <li>IT support for troubleshooting</li>
              </ul>

              <h3 className="text-xl font-semibold text-foreground mb-3 mt-6">5.2 Third-Party Service Providers</h3>
              <div className="space-y-3">
                <div className="border border-border rounded-lg p-4">
                  <h4 className="font-semibold text-foreground">Cloudinary (Image Hosting)</h4>
                  <p className="text-sm text-muted-foreground mt-1">Purpose: Cloud storage and delivery of user-uploaded images</p>
                  <a href="https://cloudinary.com/privacy" target="_blank" rel="noopener noreferrer" className="text-xs text-gray-900 dark:text-neutral-50 hover:text-gray-600 dark:hover:text-neutral-400">Privacy Policy →</a>
                </div>
                <div className="border border-border rounded-lg p-4">
                  <h4 className="font-semibold text-foreground">MongoDB Atlas (Database)</h4>
                  <p className="text-sm text-muted-foreground mt-1">Purpose: Database hosting and management</p>
                  <a href="https://www.mongodb.com/legal/privacy-policy" target="_blank" rel="noopener noreferrer" className="text-xs text-gray-900 dark:text-neutral-50 hover:text-gray-600 dark:hover:text-neutral-400">Privacy Policy →</a>
                </div>
                <div className="border border-border rounded-lg p-4">
                  <h4 className="font-semibold text-foreground">Google Cloud Services</h4>
                  <p className="text-sm text-muted-foreground mt-1">Purpose: OAuth authentication and Google Sheets integration</p>
                  <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="text-xs text-gray-900 dark:text-neutral-50 hover:text-gray-600 dark:hover:text-neutral-400">Privacy Policy →</a>
                </div>
                <div className="border border-border rounded-lg p-4">
                  <h4 className="font-semibold text-foreground">Slack</h4>
                  <p className="text-sm text-muted-foreground mt-1">Purpose: OAuth authentication and messaging integration</p>
                  <a href="https://slack.com/privacy-policy" target="_blank" rel="noopener noreferrer" className="text-xs text-gray-900 dark:text-neutral-50 hover:text-gray-600 dark:hover:text-neutral-400">Privacy Policy →</a>
                </div>
              </div>
            </section>

            {/* Data Security */}
            <section>
              <h2 className="text-2xl font-bold text-foreground mb-4">6. Data Storage and Security</h2>
              <div className="bg-accent/50 border border-border rounded-lg p-4">
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-foreground mb-2">Security Measures:</h4>
                    <ul className="text-muted-foreground text-sm space-y-1">
                      <li>✓ Encryption in Transit (HTTPS/TLS)</li>
                      <li>✓ Encryption at Rest (Database encryption)</li>
                      <li>✓ Password Security (bcrypt hashing with 12+ rounds)</li>
                      <li>✓ Token Security (JWT with 15-minute expiration + refresh rotation)</li>
                      <li>✓ Access Control (Role-based permissions)</li>
                      <li>✓ Account Protection (Lockout after 5 failed attempts)</li>
                    </ul>
                  </div>
                </div>
              </div>
            </section>

            {/* Your Rights */}
            <section>
              <h2 className="text-2xl font-bold text-foreground mb-4">7. Your Rights (GDPR & CCPA Compliance)</h2>
              <div className="space-y-4">
                <div className="border-l-4 border-indigo-500 pl-4">
                  <h4 className="font-semibold text-foreground">Right to Access</h4>
                  <p className="text-sm text-muted-foreground mt-1">Know what personal information we hold about you and receive a copy</p>
                </div>
                <div className="border-l-4 border-indigo-500 pl-4">
                  <h4 className="font-semibold text-foreground">Right to Rectification</h4>
                  <p className="text-sm text-muted-foreground mt-1">Correct inaccurate or update incomplete information</p>
                </div>
                <div className="border-l-4 border-indigo-500 pl-4">
                  <h4 className="font-semibold text-foreground">Right to Erasure</h4>
                  <p className="text-sm text-muted-foreground mt-1">Request deletion of your personal data and account</p>
                </div>
                <div className="border-l-4 border-indigo-500 pl-4">
                  <h4 className="font-semibold text-foreground">Right to Data Portability</h4>
                  <p className="text-sm text-muted-foreground mt-1">Receive your data in a machine-readable format (JSON)</p>
                </div>
              </div>
              <Alert className="mt-4">
                <Info className="h-4 w-4" />
                <AlertTitle>To Exercise Your Rights:</AlertTitle>
                <AlertDescription>
                  <p className="text-sm">Contact: <a href="mailto:support@mebit.io" className="underline">support@mebit.io</a> or <a href="mailto:privacy@mebit.io" className="underline">privacy@mebit.io</a></p>
                  <p className="text-xs mt-2 text-muted-foreground">Response time: Within 30 days as required by GDPR</p>
                </AlertDescription>
              </Alert>
            </section>

            {/* Cookies and Tracking */}
            <section>
              <h2 className="text-2xl font-bold text-foreground mb-4">8. Cookies and Tracking Technologies</h2>

              <h3 className="text-xl font-semibold text-foreground mb-3">8.1 Cookies We Use</h3>
              <div className="space-y-3">
                <div className="border border-border rounded-lg p-4">
                  <h4 className="font-semibold text-foreground mb-2">Essential Cookies (Required)</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Authentication: JWT access/refresh tokens (HTTP-only, secure)</li>
                    <li>• Session: Login session maintenance</li>
                    <li>• Security: CSRF protection tokens</li>
                  </ul>
                </div>
                <div className="border border-border rounded-lg p-4">
                  <h4 className="font-semibold text-foreground mb-2">Functional Cookies (Opt-in)</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• User Preferences: Workspace settings, theme</li>
                    <li>• Tutorial State: Completion tracking</li>
                  </ul>
                </div>
              </div>

              <h3 className="text-xl font-semibold text-foreground mb-3 mt-6">8.2 Cookie Management</h3>
              <p className="text-muted-foreground text-sm">You can control cookies through browser settings or platform settings. Note: Disabling essential cookies will prevent login.</p>
            </section>

            {/* Children's Privacy */}
            <section>
              <h2 className="text-2xl font-bold text-foreground mb-4">9. Children's Privacy</h2>
              <Alert className="border-l-4">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Age Restriction:</AlertTitle>
                <AlertDescription>
                  <ul className="text-sm space-y-1">
                    <li>• Platform not intended for individuals under 18 years</li>
                    <li>• All users must be 18+ years old</li>
                    <li>• All users must have valid @mebit.io email</li>
                    <li>• We do not knowingly collect data from children under 18</li>
                  </ul>
                </AlertDescription>
              </Alert>
            </section>

            {/* International Data Transfers */}
            <section>
              <h2 className="text-2xl font-bold text-foreground mb-4">10. International Data Transfers</h2>
              <p className="text-muted-foreground mb-3">Clara Platform processes data that may be transferred internationally. We ensure appropriate safeguards:</p>
              <div className="grid md:grid-cols-2 gap-3">
                <div className="border border-border rounded-lg p-3">
                  <h4 className="font-semibold text-foreground text-sm">EU-US Transfers</h4>
                  <p className="text-xs text-muted-foreground mt-1">Standard Contractual Clauses (SCCs) for GDPR compliance</p>
                </div>
                <div className="border border-border rounded-lg p-3">
                  <h4 className="font-semibold text-foreground text-sm">Data Protection</h4>
                  <p className="text-xs text-muted-foreground mt-1">Encryption in transit and at rest, DPAs with all processors</p>
                </div>
              </div>
            </section>

            {/* California Privacy Rights (CCPA) */}
            <section id="ccpa">
              <h2 className="text-2xl font-bold text-foreground mb-4">11. California Privacy Rights (CCPA)</h2>
              <p className="text-muted-foreground mb-4">California residents have additional rights under CCPA:</p>
              <div className="space-y-3">
                <div className="border-l-4 border-indigo-500 pl-4">
                  <h4 className="font-semibold text-foreground">Right to Know</h4>
                  <p className="text-sm text-muted-foreground mt-1">Know categories of PI collected, sources, business purposes, and third parties</p>
                </div>
                <div className="border-l-4 border-indigo-500 pl-4">
                  <h4 className="font-semibold text-foreground">Right to Delete</h4>
                  <p className="text-sm text-muted-foreground mt-1">Request deletion of your personal information</p>
                </div>
                <div className="border-l-4 border-indigo-500 pl-4">
                  <h4 className="font-semibold text-foreground">Right to Opt-Out</h4>
                  <p className="text-sm text-muted-foreground mt-1">Opt-out of sale of PI (Note: We do NOT sell personal information)</p>
                </div>
                <div className="border-l-4 border-indigo-500 pl-4">
                  <h4 className="font-semibold text-foreground">Non-Discrimination</h4>
                  <p className="text-sm text-muted-foreground mt-1">No discrimination for exercising CCPA rights</p>
                </div>
              </div>

              <Alert className="mt-4">
                <Info className="h-4 w-4" />
                <AlertTitle>Do Not Sell My Personal Information</AlertTitle>
                <AlertDescription>
                  Clara Platform does NOT sell personal information to third parties. This right is not applicable to our service.
                </AlertDescription>
              </Alert>
            </section>

            {/* Data Breach Notification */}
            <section>
              <h2 className="text-2xl font-bold text-foreground mb-4">12. Data Breach Notification</h2>
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Breach Response Procedure:</AlertTitle>
                <AlertDescription>
                  <ul className="text-sm space-y-2">
                    <li>• <strong>Notification Timeline:</strong> Within 72 hours of breach discovery (GDPR requirement)</li>
                    <li>• <strong>Notification Method:</strong> Email to affected users at their @mebit.io address</li>
                    <li>• <strong>Information Provided:</strong> Nature of breach, affected data, steps taken, remediation actions</li>
                    <li>• <strong>Authority Notification:</strong> Supervisory authorities notified as required by law</li>
                  </ul>
                </AlertDescription>
              </Alert>
            </section>

            {/* DNT Signals */}
            <section>
              <h2 className="text-2xl font-bold text-foreground mb-4">13. Do Not Track (DNT) Signals</h2>
              <p className="text-muted-foreground">Clara Platform does not currently respond to "Do Not Track" (DNT) browser signals. However:</p>
              <ul className="list-disc ml-6 text-muted-foreground text-sm space-y-1 mt-2">
                <li>We do not track users across third-party websites</li>
                <li>We do not sell user data to third parties</li>
                <li>We do not use data for advertising purposes</li>
              </ul>
            </section>

            {/* Data Protection Officer */}
            <section>
              <h2 className="text-2xl font-bold text-foreground mb-4">14. Data Protection Officer</h2>
              <div className="bg-muted rounded-lg p-6">
                <p className="text-muted-foreground mb-4">For GDPR compliance, Mebit has designated a Data Protection Officer (DPO):</p>
                <div className="space-y-2 text-sm">
                  <p className="text-muted-foreground"><strong>Data Protection Officer:</strong> <a href="mailto:dpo@mebit.io" className="text-gray-900 dark:text-neutral-50 hover:text-gray-600 dark:hover:text-neutral-400">dpo@mebit.io</a></p>
                  <p className="text-muted-foreground"><strong>Privacy Inquiries:</strong> <a href="mailto:privacy@mebit.io" className="text-gray-900 dark:text-neutral-50 hover:text-gray-600 dark:hover:text-neutral-400">privacy@mebit.io</a></p>
                  <p className="text-muted-foreground"><strong>General Support:</strong> <a href="mailto:support@mebit.io" className="text-gray-900 dark:text-neutral-50 hover:text-gray-600 dark:hover:text-neutral-400">support@mebit.io</a></p>
                  <p className="text-muted-foreground mt-3"><strong>Response Time:</strong> Within 5 business days</p>
                </div>
              </div>
            </section>

            {/* Supervisory Authority */}
            <section>
              <h2 className="text-2xl font-bold text-foreground mb-4">15. Supervisory Authority</h2>
              <div className="border border-border rounded-lg p-4">
                <p className="text-muted-foreground text-sm mb-3">If you are in the European Union, you have the right to lodge a complaint with your local data protection supervisory authority:</p>
                <div className="space-y-2 text-sm">
                  <p className="text-muted-foreground"><strong>EU Supervisory Authorities:</strong> <a href="https://edpb.europa.eu/about-edpb/board/members_en" target="_blank" rel="noopener noreferrer" className="text-gray-900 dark:text-neutral-50 hover:text-gray-600 dark:hover:text-neutral-400">EDPB Member List</a></p>
                  <p className="text-muted-foreground"><strong>UK ICO:</strong> <a href="https://ico.org.uk/make-a-complaint/" target="_blank" rel="noopener noreferrer" className="text-gray-900 dark:text-neutral-50 hover:text-gray-600 dark:hover:text-neutral-400">Make a Complaint</a></p>
                </div>
              </div>
            </section>

            {/* Contact */}
            <section>
              <h2 className="text-2xl font-bold text-foreground mb-4">16. Contact Information</h2>
              <div className="bg-muted rounded-lg p-6">
                <p className="text-muted-foreground mb-4">For questions, concerns, or requests regarding this Privacy Policy:</p>
                <div className="space-y-2 text-sm">
                  <p className="text-muted-foreground"><strong>General Support:</strong> <a href="mailto:support@mebit.io" className="text-gray-900 dark:text-neutral-50 hover:text-gray-600 dark:hover:text-neutral-400">support@mebit.io</a></p>
                  <p className="text-muted-foreground"><strong>Privacy Email:</strong> <a href="mailto:privacy@mebit.io" className="text-gray-900 dark:text-neutral-50 hover:text-gray-600 dark:hover:text-neutral-400">privacy@mebit.io</a></p>
                  <p className="text-muted-foreground"><strong>Data Protection Officer:</strong> <a href="mailto:dpo@mebit.io" className="text-gray-900 dark:text-neutral-50 hover:text-gray-600 dark:hover:text-neutral-400">dpo@mebit.io</a></p>
                </div>
              </div>
            </section>

            {/* Footer */}
            <div className="border-t border-border pt-6 mt-8">
              <p className="text-sm text-muted-foreground text-center">
                <strong>Last Updated:</strong> October 26, 2025 | <strong>Effective Date:</strong> October 26, 2025
              </p>
              <p className="text-xs text-muted-foreground text-center mt-2">
                © 2025 Mebit. All rights reserved.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Back to Login */}
        <div className="text-center mt-6">
          <Link
            to="/login"
            className="inline-flex items-center px-6 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-700 dark:bg-neutral-800 dark:text-white dark:hover:bg-neutral-700 transition-colors shadow-lg"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
