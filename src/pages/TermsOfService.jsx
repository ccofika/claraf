import React from 'react';
import { Link } from 'react-router-dom';
import { FileText, ArrowLeft, AlertTriangle, Info, CheckCircle } from 'lucide-react';
import { Card, CardContent } from '../components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '../components/ui/alert';

const TermsOfService = () => {
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
              <FileText className="w-10 h-10 text-gray-900 dark:text-neutral-50 mr-4" />
              <div>
                <h1 className="text-4xl font-bold text-foreground">Terms of Service</h1>
                <p className="text-sm text-muted-foreground mt-1">Effective Date: October 26, 2025</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Content */}
        <Card>
          <CardContent className="pt-6 space-y-8">

            {/* Agreement */}
            <section>
              <h2 className="text-2xl font-bold text-foreground mb-4">1. Agreement to Terms</h2>
              <p className="text-muted-foreground leading-relaxed">
                By accessing or using <strong>Clara Platform</strong> ("Service," "Platform," "we," "our," or "us"), you agree to be bound by these Terms of Service ("Terms"). If you do not agree to these Terms, you may not access or use the Service.
              </p>
              <p className="text-muted-foreground leading-relaxed mt-3">
                Clara Platform is an internal collaboration and workspace management tool developed and operated exclusively for <strong>Mebit</strong> ("Company," "Mebit.io") employees, contractors, and authorized personnel.
              </p>
              <Alert className="mt-4 border-l-4">
                <Info className="h-4 w-4" />
                <AlertTitle>Important</AlertTitle>
                <AlertDescription>
                  These Terms constitute a legally binding agreement between you and Mebit.
                </AlertDescription>
              </Alert>
            </section>

            {/* Eligibility */}
            <section>
              <h2 className="text-2xl font-bold text-foreground mb-4">2. Eligibility and Access Restriction</h2>
              <h3 className="text-xl font-semibold text-foreground mb-3">2.1 @mebit.io Email Requirement</h3>
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Access Restrictions:</AlertTitle>
                <AlertDescription>
                  <ul className="text-sm space-y-1">
                    <li>✓ You must have a valid, active @mebit.io email address</li>
                    <li>✓ You must be a current Mebit employee, contractor, or authorized personnel</li>
                    <li>✓ You must be at least 18 years of age</li>
                    <li>✓ You must be authorized by Mebit management</li>
                  </ul>
                </AlertDescription>
              </Alert>

              <h3 className="text-xl font-semibold text-foreground mb-3 mt-6">2.3 Unauthorized Access Prohibited</h3>
              <Alert className="border-l-4">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>You may NOT:</AlertTitle>
                <AlertDescription>
                  <ul className="text-sm space-y-1">
                    <li>• Create an account without a @mebit.io email address</li>
                    <li>• Attempt to bypass the email domain restriction</li>
                    <li>• Impersonate another person or use someone else's credentials</li>
                    <li>• Share your account access with individuals outside Mebit</li>
                  </ul>
                  <p className="text-xs mt-3 font-semibold">
                    Violation will result in immediate account termination and may lead to legal action.
                  </p>
                </AlertDescription>
              </Alert>
            </section>

            {/* Account Security */}
            <section>
              <h2 className="text-2xl font-bold text-foreground mb-4">3. Account Security</h2>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-muted rounded-lg p-4">
                  <h4 className="font-semibold text-foreground mb-2">Your Responsibilities</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Maintain password confidentiality</li>
                    <li>• Monitor account activity</li>
                    <li>• Report unauthorized access</li>
                    <li>• Follow security best practices</li>
                  </ul>
                </div>
                <div className="bg-muted rounded-lg p-4">
                  <h4 className="font-semibold text-foreground mb-2">Authentication Methods</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Email/Password authentication</li>
                    <li>• Google OAuth SSO</li>
                    <li>• Slack OAuth authentication</li>
                    <li>• All verify @mebit.io domain</li>
                  </ul>
                </div>
              </div>
              <Alert className="mt-4">
                <Info className="h-4 w-4" />
                <AlertTitle>Account Lockout Protection:</AlertTitle>
                <AlertDescription>
                  Your account will be locked for 30 minutes after 5 failed login attempts. Contact IT support if you need assistance.
                </AlertDescription>
              </Alert>
            </section>

            {/* Acceptable Use */}
            <section>
              <h2 className="text-2xl font-bold text-foreground mb-4">4. Acceptable Use Policy</h2>

              <h3 className="text-xl font-semibold text-foreground mb-3">4.1 Permitted Use</h3>
              <div className="bg-accent/50 border border-border rounded-lg p-4">
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-foreground mb-2">You may use Clara Platform for:</p>
                    <ul className="text-muted-foreground text-sm space-y-1">
                      <li>✓ Business collaboration with colleagues</li>
                      <li>✓ Content management and organization</li>
                      <li>✓ Team communication</li>
                      <li>✓ Data lookup for business purposes</li>
                      <li>✓ Integration with authorized services</li>
                    </ul>
                  </div>
                </div>
              </div>

              <h3 className="text-xl font-semibold text-foreground mb-3 mt-6">4.2 Prohibited Conduct</h3>
              <div className="space-y-3">
                <Alert variant="destructive" className="border-l-4">
                  <AlertTitle>Content Violations</AlertTitle>
                  <AlertDescription>
                    Do not upload illegal, harmful, threatening, abusive, defamatory, infringing, pornographic, or discriminatory content
                  </AlertDescription>
                </Alert>
                <Alert variant="destructive" className="border-l-4">
                  <AlertTitle>Security Violations</AlertTitle>
                  <AlertDescription>
                    Do not attempt unauthorized access, interfere with service, use bots/scrapers, reverse engineer, or bypass security measures
                  </AlertDescription>
                </Alert>
                <Alert variant="destructive" className="border-l-4">
                  <AlertTitle>Data Misuse</AlertTitle>
                  <AlertDescription>
                    Do not scrape data, share workspace content with unauthorized individuals, or use platform data for personal commercial gain
                  </AlertDescription>
                </Alert>
              </div>

              <h3 className="text-xl font-semibold text-foreground mb-3 mt-6">4.3 Enforcement</h3>
              <div className="bg-muted rounded-lg p-4">
                <p className="text-muted-foreground text-sm mb-2">Violations may result in:</p>
                <ol className="list-decimal ml-6 text-muted-foreground text-sm space-y-1">
                  <li>Warning (first-time minor violations)</li>
                  <li>Temporary Suspension (repeated violations)</li>
                  <li>Account Termination (severe violations)</li>
                  <li>Legal Action (criminal activity)</li>
                  <li>Employment Consequences (as determined by Mebit HR)</li>
                </ol>
              </div>
            </section>

            {/* Intellectual Property */}
            <section>
              <h2 className="text-2xl font-bold text-foreground mb-4">5. Intellectual Property Rights</h2>

              <h3 className="text-xl font-semibold text-foreground mb-3">5.1 Platform Ownership</h3>
              <p className="text-muted-foreground leading-relaxed">
                Clara Platform, including all code, design, features, and content, is owned by <strong>Mebit</strong> and protected by copyright, trademark, patent, and trade secret laws.
              </p>
              <Alert className="mt-3">
                <Info className="h-4 w-4" />
                <AlertDescription>
                  You are granted a <strong>limited, non-exclusive, non-transferable license</strong> to access and use the platform solely for authorized business purposes.
                </AlertDescription>
              </Alert>

              <h3 className="text-xl font-semibold text-foreground mb-3 mt-6">5.2 User-Generated Content</h3>
              <Alert>
                <Info className="h-4 w-4" />
                <AlertTitle>Content Ownership</AlertTitle>
                <AlertDescription>
                  <p className="text-sm mb-2">
                    <strong>You retain ownership</strong> of content you create or upload (workspace content, notes, images, bookmarks).
                  </p>
                  <p className="text-sm mt-2">
                    By uploading content, you grant Mebit a <strong>non-exclusive, worldwide, royalty-free license</strong> to use, reproduce, modify, and display your content solely for operating and improving the Service.
                  </p>
                </AlertDescription>
              </Alert>
            </section>

            {/* Third-Party Services */}
            <section>
              <h2 className="text-2xl font-bold text-foreground mb-4">6. Third-Party Services</h2>
              <p className="text-muted-foreground mb-4">Clara Platform integrates with third-party services:</p>
              <div className="grid md:grid-cols-2 gap-3">
                <div className="border border-border rounded-lg p-3">
                  <p className="font-semibold text-foreground text-sm">Google Services</p>
                  <p className="text-xs text-muted-foreground mt-1">OAuth, Google Sheets</p>
                  <a href="https://policies.google.com/terms" target="_blank" rel="noopener noreferrer" className="text-xs text-gray-900 dark:text-neutral-50 hover:text-gray-600 dark:hover:text-neutral-400">Terms →</a>
                </div>
                <div className="border border-border rounded-lg p-3">
                  <p className="font-semibold text-foreground text-sm">Slack</p>
                  <p className="text-xs text-muted-foreground mt-1">OAuth, Messaging</p>
                  <a href="https://slack.com/terms-of-service" target="_blank" rel="noopener noreferrer" className="text-xs text-gray-900 dark:text-neutral-50 hover:text-gray-600 dark:hover:text-neutral-400">Terms →</a>
                </div>
                <div className="border border-border rounded-lg p-3">
                  <p className="font-semibold text-foreground text-sm">Cloudinary</p>
                  <p className="text-xs text-muted-foreground mt-1">Image Hosting</p>
                  <a href="https://cloudinary.com/tos" target="_blank" rel="noopener noreferrer" className="text-xs text-gray-900 dark:text-neutral-50 hover:text-gray-600 dark:hover:text-neutral-400">Terms →</a>
                </div>
                <div className="border border-border rounded-lg p-3">
                  <p className="font-semibold text-foreground text-sm">OKLink</p>
                  <p className="text-xs text-muted-foreground mt-1">Blockchain Data</p>
                  <a href="https://www.oklink.com/terms-of-service" target="_blank" rel="noopener noreferrer" className="text-xs text-gray-900 dark:text-neutral-50 hover:text-gray-600 dark:hover:text-neutral-400">Terms →</a>
                </div>
              </div>
              <p className="text-muted-foreground text-sm mt-4">
                Mebit is not responsible for third-party services, their availability, or compliance with privacy laws.
              </p>
            </section>

            {/* Service Availability */}
            <section>
              <h2 className="text-2xl font-bold text-foreground mb-4">7. Service Availability and Modifications</h2>
              <Alert className="border-l-4">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Service "AS IS" and "AS AVAILABLE"</AlertTitle>
                <AlertDescription>
                  We do not guarantee uninterrupted or error-free service, 100% uptime, or that all bugs will be fixed. We may perform maintenance with advance notice when possible.
                </AlertDescription>
              </Alert>
              <p className="text-muted-foreground mt-4 text-sm">
                We reserve the right to modify, suspend, or discontinue any feature or the entire Service. Material changes will be communicated via email or platform notification at least 30 days in advance.
              </p>
            </section>

            {/* Account Termination */}
            <section>
              <h2 className="text-2xl font-bold text-foreground mb-4">8. Account Termination</h2>

              <h3 className="text-xl font-semibold text-foreground mb-3">8.1 Termination by You</h3>
              <p className="text-muted-foreground text-sm">
                You may terminate your account at any time using the "Delete Account" feature or by contacting support@mebit.io
              </p>

              <h3 className="text-xl font-semibold text-foreground mb-3 mt-4">8.2 Termination by Mebit</h3>
              <div className="space-y-2">
                <Alert variant="destructive">
                  <AlertTitle className="text-sm">Immediate Termination (No Notice):</AlertTitle>
                  <AlertDescription className="text-xs">
                    Violation of Terms, security threats, unauthorized access, illegal activity
                  </AlertDescription>
                </Alert>
                <Alert className="border-l-4">
                  <AlertTitle className="text-sm">Employment-Based Termination:</AlertTitle>
                  <AlertDescription className="text-xs">
                    When you leave Mebit or your @mebit.io email is deactivated
                  </AlertDescription>
                </Alert>
              </div>
            </section>

            {/* Disclaimers */}
            <section>
              <h2 className="text-2xl font-bold text-foreground mb-4">9. Disclaimer of Warranties</h2>
              <div className="bg-muted border border-border rounded-lg p-4">
                <p className="text-foreground font-semibold mb-2">TO THE MAXIMUM EXTENT PERMITTED BY LAW:</p>
                <p className="text-muted-foreground text-sm">
                  Clara Platform is provided <strong>"AS IS," "AS AVAILABLE," WITHOUT WARRANTIES OF ANY KIND</strong>, either express or implied, including but not limited to merchantability, fitness for a particular purpose, non-infringement, accuracy, security, or availability.
                </p>
              </div>
            </section>

            {/* Limitation of Liability */}
            <section>
              <h2 className="text-2xl font-bold text-foreground mb-4">10. Limitation of Liability</h2>
              <Alert variant="destructive" className="border-2">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>IMPORTANT LIABILITY LIMITATION:</AlertTitle>
                <AlertDescription>
                  <p className="text-sm">
                    Mebit shall NOT BE LIABLE for any indirect, consequential, incidental, or punitive damages resulting from your use of the Service.
                  </p>
                  <p className="text-sm mt-2 font-semibold">
                    Maximum Liability: €100 (one hundred euros) or the amount you paid in the past 12 months, whichever is greater.
                  </p>
                </AlertDescription>
              </Alert>
            </section>

            {/* Contact */}
            <section>
              <h2 className="text-2xl font-bold text-foreground mb-4">11. Contact Information</h2>
              <div className="bg-muted rounded-lg p-6">
                <p className="text-muted-foreground mb-4">For questions or concerns regarding these Terms:</p>
                <div className="space-y-2 text-sm">
                  <p className="text-muted-foreground"><strong>General Support:</strong> <a href="mailto:support@mebit.io" className="text-gray-900 dark:text-neutral-50 hover:text-gray-600 dark:hover:text-neutral-400">support@mebit.io</a></p>
                  <p className="text-muted-foreground"><strong>Legal Inquiries:</strong> <a href="mailto:legal@mebit.io" className="text-gray-900 dark:text-neutral-50 hover:text-gray-600 dark:hover:text-neutral-400">legal@mebit.io</a></p>
                  <p className="text-muted-foreground"><strong>Privacy Concerns:</strong> <a href="mailto:privacy@mebit.io" className="text-gray-900 dark:text-neutral-50 hover:text-gray-600 dark:hover:text-neutral-400">privacy@mebit.io</a></p>
                </div>
              </div>
            </section>

            {/* Service Level Agreement */}
            <section>
              <h2 className="text-2xl font-bold text-foreground mb-4">12. Service Level Agreement (SLA)</h2>
              <div className="bg-muted rounded-lg p-4">
                <h4 className="font-semibold text-foreground mb-2">Service Availability Target:</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• <strong>Uptime Goal:</strong> 99.5% monthly uptime (excluding scheduled maintenance)</li>
                  <li>• <strong>Scheduled Maintenance:</strong> Announced 48 hours in advance when possible</li>
                  <li>• <strong>Emergency Maintenance:</strong> May occur without advance notice for security issues</li>
                  <li>• <strong>Support Response:</strong> Best-effort support via support@mebit.io</li>
                </ul>
                <p className="text-xs text-muted-foreground mt-3">Note: Clara is an internal tool. No financial credits or compensation for downtime.</p>
              </div>
            </section>

            {/* Governing Law */}
            <section>
              <h2 className="text-2xl font-bold text-foreground mb-4">13. Governing Law and Jurisdiction</h2>
              <div className="border border-border rounded-lg p-4">
                <p className="text-muted-foreground text-sm mb-3">These Terms shall be governed by and construed in accordance with the laws of <strong>[Specify: Country/State]</strong>, without regard to its conflict of law provisions.</p>
                <p className="text-muted-foreground text-sm">Any legal action or proceeding arising under these Terms will be brought exclusively in the courts located in <strong>[Specify: City, Country]</strong>, and you consent to personal jurisdiction in such courts.</p>
              </div>
            </section>

            {/* Dispute Resolution */}
            <section>
              <h2 className="text-2xl font-bold text-foreground mb-4">14. Dispute Resolution and Arbitration</h2>

              <h3 className="text-xl font-semibold text-foreground mb-3">14.1 Informal Resolution</h3>
              <p className="text-muted-foreground text-sm mb-4">Before filing a claim, you agree to try to resolve the dispute informally by contacting legal@mebit.io. We will attempt to resolve disputes within 30 days.</p>

              <h3 className="text-xl font-semibold text-foreground mb-3">14.2 Binding Arbitration</h3>
              <Alert className="border-l-4">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Arbitration Agreement:</AlertTitle>
                <AlertDescription>
                  <ul className="text-sm space-y-1">
                    <li>• Any dispute shall be resolved by binding arbitration</li>
                    <li>• Arbitration will be conducted under [Specify: Arbitration Rules]</li>
                    <li>• Location: [Specify: City, Country]</li>
                    <li>• Language: English</li>
                    <li>• Individual claims only (no class actions)</li>
                  </ul>
                </AlertDescription>
              </Alert>

              <h3 className="text-xl font-semibold text-foreground mb-3 mt-4">14.3 Exceptions</h3>
              <p className="text-muted-foreground text-sm">You may bring claims in small claims court if they qualify, and either party may seek injunctive relief in court for intellectual property infringement.</p>
            </section>

            {/* Indemnification */}
            <section>
              <h2 className="text-2xl font-bold text-foreground mb-4">15. Indemnification</h2>
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Indemnification Agreement</AlertTitle>
                <AlertDescription>
                  <p className="font-semibold mb-2">You agree to indemnify and hold harmless Mebit and its officers, directors, employees, and agents from:</p>
                  <ul className="text-sm space-y-1">
                    <li>• Claims arising from your use of the Service</li>
                    <li>• Your violation of these Terms</li>
                    <li>• Your violation of any third-party rights</li>
                    <li>• Any content you submit or share</li>
                    <li>• Your breach of representations and warranties</li>
                  </ul>
                  <p className="text-xs mt-3 font-semibold">This includes reasonable attorneys' fees and costs.</p>
                </AlertDescription>
              </Alert>
            </section>

            {/* Force Majeure */}
            <section>
              <h2 className="text-2xl font-bold text-foreground mb-4">16. Force Majeure</h2>
              <p className="text-muted-foreground text-sm">Mebit shall not be liable for any failure or delay in performance due to circumstances beyond its reasonable control, including acts of God, war, terrorism, riots, embargoes, acts of civil or military authorities, fire, floods, accidents, pandemics, network infrastructure failures, strikes, or shortages of transportation, facilities, fuel, energy, labor or materials.</p>
            </section>

            {/* Severability */}
            <section>
              <h2 className="text-2xl font-bold text-foreground mb-4">17. Severability</h2>
              <p className="text-muted-foreground text-sm">If any provision of these Terms is found to be unenforceable or invalid, that provision will be limited or eliminated to the minimum extent necessary so that these Terms will otherwise remain in full force and effect.</p>
            </section>

            {/* Assignment */}
            <section>
              <h2 className="text-2xl font-bold text-foreground mb-4">18. Assignment</h2>
              <p className="text-muted-foreground text-sm">You may not assign or transfer these Terms or your rights hereunder, in whole or in part, without our prior written consent. We may assign these Terms at any time without notice.</p>
            </section>

            {/* Entire Agreement */}
            <section>
              <h2 className="text-2xl font-bold text-foreground mb-4">19. Entire Agreement</h2>
              <p className="text-muted-foreground text-sm">These Terms, together with our Privacy Policy and any other legal notices published on the Service, constitute the entire agreement between you and Mebit concerning the Service and supersede all prior agreements and understandings.</p>
            </section>

            {/* Electronic Communications */}
            <section>
              <h2 className="text-2xl font-bold text-foreground mb-4">20. Electronic Communications</h2>
              <div className="border border-border rounded-lg p-4">
                <p className="text-muted-foreground text-sm mb-2">By using the Service, you consent to receiving electronic communications from us. These communications may include:</p>
                <ul className="text-muted-foreground text-sm space-y-1 ml-6 list-disc">
                  <li>Account-related notifications</li>
                  <li>Security alerts</li>
                  <li>Service updates and announcements</li>
                  <li>Policy changes</li>
                </ul>
                <p className="text-muted-foreground text-sm mt-3">You agree that all agreements, notices, disclosures, and other communications we provide electronically satisfy any legal requirement that such communications be in writing.</p>
              </div>
            </section>

            {/* Export Control */}
            <section>
              <h2 className="text-2xl font-bold text-foreground mb-4">21. Export Control</h2>
              <Alert className="border-l-4">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Export Restrictions:</AlertTitle>
                <AlertDescription>
                  The Service may be subject to export control laws. You agree not to export, re-export, or transfer the Service or any technical data derived from the Service in violation of applicable export control laws and regulations.
                </AlertDescription>
              </Alert>
            </section>

            {/* Survival */}
            <section>
              <h2 className="text-2xl font-bold text-foreground mb-4">22. Survival</h2>
              <p className="text-muted-foreground text-sm">The following provisions will survive termination of these Terms: Intellectual Property Rights, Limitation of Liability, Indemnification, Governing Law, Dispute Resolution, and any other provisions that by their nature should survive.</p>
            </section>

            {/* Acknowledgment */}
            <section>
              <h2 className="text-2xl font-bold text-foreground mb-4">23. Acknowledgment</h2>
              <Alert className="border-2">
                <CheckCircle className="h-4 w-4" />
                <AlertTitle>User Acknowledgment</AlertTitle>
                <AlertDescription>
                  <p className="font-semibold mb-3">By using Clara Platform, you acknowledge that:</p>
                  <ul className="space-y-2 text-sm">
                    <li>✅ You have read and understood these Terms of Service</li>
                    <li>✅ You agree to be bound by these Terms</li>
                    <li>✅ You have a valid @mebit.io email address</li>
                    <li>✅ You are authorized by Mebit to access this platform</li>
                    <li>✅ You are at least 18 years of age</li>
                    <li>✅ You will comply with all applicable laws and Mebit policies</li>
                    <li>✅ You have read and understood our Privacy Policy</li>
                  </ul>
                </AlertDescription>
              </Alert>
            </section>

            {/* Footer */}
            <div className="border-t border-border pt-6 mt-8">
              <p className="text-sm text-muted-foreground text-center">
                <strong>Last Updated:</strong> October 26, 2025 | <strong>Effective Date:</strong> October 26, 2025 | <strong>Version:</strong> 1.0
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

export default TermsOfService;
