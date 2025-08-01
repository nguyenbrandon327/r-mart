'use client';

import Link from 'next/link';

export default function TermsPage() {
  return (
    <div className="min-h-screen flex flex-col relative">
      {/* R'Mart Logo */}
      <div className="absolute top-4 left-4 z-10">
        <Link href="/" className="hover:opacity-80 transition-opacity">
          <div className="flex items-center gap-2">
            <img 
              src="/logo-pic.png" 
              alt="R'mart Logo" 
              className="size-12 object-contain"
            />
            <span
              className="font-black font-gt-america-expanded tracking-tighter text-2xl 
                bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary"
            >
              r'mart
            </span>
          </div>
        </Link>
      </div>

      {/* Terms Content */}
      <main className="flex-1 pt-20 px-4 pb-8">
        <div className="max-w-4xl mx-auto">
          <div className="prose prose-lg max-w-none">
            <h1 className="text-4xl font-bold text-center mb-8 bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">
              Terms of Service
            </h1>
            
            <div className="text-gray-700 leading-relaxed space-y-6">
              <p className="text-sm text-gray-500">Last updated: August 1, 2025</p>

              <p>
                These Terms of Service ("Terms") apply to your access to and use of the R'Mart website (ucrmart.com), mobile applications, and any other online products and services we provide (collectively, the "R'Mart Services" or "Services") operated by R'Mart ("R'Mart," "we," or "us").
              </p>

              <p className="font-semibold">
                PLEASE READ THESE TERMS CAREFULLY. THEY INCLUDE A MANDATORY ARBITRATION AGREEMENT (SEE SECTION 17) THAT REQUIRES YOU TO RESOLVE DISPUTES WITH US THROUGH FINAL AND BINDING ARBITRATION ON AN INDIVIDUAL BASIS. IF YOU DO NOT AGREE TO THESE TERMS, DO NOT USE THE SERVICES.
              </p>

              <p className="font-semibold">
                YOU ACKNOWLEDGE AND AGREE THAT USING AN INTERNET-BASED MARKETPLACE AND MEETING OTHER USERS IN PERSON INVOLVE CERTAIN RISKS (SEE SECTION 14).
              </p>

              <p>
                We may supply additional terms for particular features; those additional terms become part of your agreement with us if you use the applicable features. If any additional term conflicts with these Terms, the additional term governs to the extent of the conflict.
              </p>

              <p>
                We may update these Terms at any time. If we do, we will give notice—such as by emailing you, posting a notice through the Services, or updating the "Last updated" date. Unless we say otherwise, the amended Terms are effective immediately, and continued use of the Services confirms your acceptance. If you do not agree to the amended Terms, you must stop using the Services.
              </p>

              <p>
                To contact us about these Terms or the Services, email <a href="mailto:brandon@ucrmart.com" className="text-primary hover:underline">brandon@ucrmart.com</a>. This is the sole email address for all inquiries.
              </p>

              <hr className="my-8 border-gray-300" />

              <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">1. Privacy</h2>
              <p>
                Please review our Privacy Policy to understand how we collect, use, and share information about you. By using the Services, you acknowledge you have received our Privacy Policy.
              </p>

              <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">2. Eligibility</h2>
              <ul className="list-disc pl-6 space-y-2">
                <li>You must be at least 16 years old to use the Services.</li>
                <li>If you are under 18 (or the age of legal majority where you live), you may use the Services only under the supervision of a parent or legal guardian who agrees to be bound by these Terms.</li>
                <li>The Services are intended exclusively for current students of the University of California, Riverside ("UCR"). By using the Services, you represent that you are a current UCR student and will cease using the Services when you are no longer a student.</li>
                <li>We may suspend or terminate any account that does not meet these requirements or that has previously been suspended or removed.</li>
              </ul>

              <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">3. User Accounts and Security</h2>
              <p>
                You may need to register for an account to access certain features. You must provide accurate information and keep it up to date. You are responsible for safeguarding your login credentials and for any activity under your account. Notify us immediately at <a href="mailto:brandon@ucrmart.com" className="text-primary hover:underline">brandon@ucrmart.com</a> if you suspect unauthorized access.
              </p>

              <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">4. The R'Mart Services</h2>
              <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-3">A. Listing Items, Buying, and Selling</h3>
              <p>
                The Services allow you to post items for sale or giveaway by uploading photos and descriptions. Posting is free.
              </p>
              <p>
                R'Mart does not provide or facilitate any payment feature—online or offline—and does not act as a payment processor or intermediary. Users must arrange any exchange of money entirely outside the Services. Because R'Mart is not a party to any transaction, we cannot assist with refunds, returns, or payment disputes.
              </p>
              <p>
                We may remove any listing at any time for any reason.
              </p>

              <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-3">B. User Content</h3>
              <p>
                You retain ownership of content you post but grant R'Mart a worldwide, irrevocable, non-exclusive, royalty-free, sublicensable license to use, modify, display, and distribute that content in connection with the Services. You must have all necessary rights to grant this license, and your content must not violate these Terms or any law. We may remove any content at any time.
              </p>

              <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">5. Prohibited Conduct</h2>
              <p>You agree not to:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Use the Services for any purpose other than listing and exchanging goods among UCR students.</li>
                <li>Engage in harassing, threatening, or misleading conduct.</li>
                <li>Post items that violate any applicable law or R'Mart guidelines (e.g., prohibited or restricted items).</li>
                <li>Use automated means (bots, scrapers) without our permission.</li>
                <li>Create more than one account or transfer your account without our consent.</li>
                <li>Infringe anyone's intellectual-property or privacy rights.</li>
                <li>Bypass or interfere with the security or operation of the Services.</li>
              </ul>

              <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">6. Ownership; Limited License</h2>
              <p>
                The Services and all related content are owned by R'Mart or its licensors. We grant you a limited, non-transferable, revocable license to access and use the Services in accordance with these Terms.
              </p>

              <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">7. Suspension; Termination</h2>
              <p>
                We may suspend or terminate your access to the Services at any time for any reason. Upon termination, the license granted in Section 6 ends and you must stop using the Services.
              </p>

              <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">8. Trademarks</h2>
              <p>
                R'Mart, the R'Mart logo, and any related names, logos, or slogans are trademarks of R'Mart. You may not use them without our prior written permission. All other trademarks remain the property of their respective owners.
              </p>

              <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">9. Feedback</h2>
              <p>
                Any suggestions, ideas, or other feedback you submit may be used by R'Mart for any purpose without compensation to you.
              </p>

              <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">10. Copyright & Intellectual-Property Complaints</h2>
              <p>
                If you believe content on the Services infringes your copyright or other IP rights, email <a href="mailto:brandon@ucrmart.com" className="text-primary hover:underline">brandon@ucrmart.com</a> with the information required by 17 U.S.C. § 512(c)(3).
              </p>

              <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">11. Indemnification</h2>
              <p>
                To the fullest extent permitted by law, you agree to indemnify and hold harmless R'Mart, its affiliates, and their officers, directors, employees, and agents from any claims arising from your use of the Services, your content, or your violation of these Terms.
              </p>

              <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">12. Disclaimers</h2>
              <p>
                The Services are provided "as is" and "as available." We make no warranties, express or implied, regarding the Services, including their accuracy, reliability, or availability. You assume all risk for your use of the Services.
              </p>

              <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">13. Limitation of Liability</h2>
              <p>
                To the fullest extent permitted by law, R'Mart and its affiliates will not be liable for indirect, consequential, incidental, or special damages, or lost profits. Our total liability for any claim related to the Services is limited to $100 or the amount you paid us in the past 12 months (whichever is greater).
              </p>

              <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">14. Assumption of Risk</h2>
              <p className="font-semibold">
                YOU ARE SOLELY RESPONSIBLE FOR TAKING APPROPRIATE PRECAUTIONS WHEN INTERACTING WITH OTHER USERS, ESPECIALLY IN PERSON. R'MART DOES NOT VET USERS AND IS NOT RESPONSIBLE FOR THEIR CONDUCT.
              </p>

              <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">15. Release</h2>
              <p>
                To the fullest extent permitted by law, you release R'Mart and its affiliates from any claims or damages arising from disputes between you and other users.
              </p>

              <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">16. Transfer and Processing of Data</h2>
              <p>
                By using the Services, you consent to the processing and transfer of your information in and to the United States and other countries.
              </p>

              <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">17. Dispute Resolution; Binding Arbitration</h2>
              <p className="font-semibold">
                PLEASE REVIEW CAREFULLY—THIS SECTION AFFECTS YOUR RIGHTS.
              </p>
              <p>
                Except for certain small-claims disputes or equitable relief, you and R'Mart agree to resolve any dispute through binding arbitration on an individual basis. You must first email <a href="mailto:brandon@ucrmart.com" className="text-primary hover:underline">brandon@ucrmart.com</a> with a written Notice of your claim. If we cannot resolve the claim within 30 days, either party may commence arbitration with JAMS in Riverside County, California (or via video/phone if damages are under $10,000). The Federal Arbitration Act governs this agreement. You may opt out of arbitration by emailing <a href="mailto:brandon@ucrmart.com" className="text-primary hover:underline">brandon@ucrmart.com</a> within 30 days of first agreeing to these Terms.
              </p>

              <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">18. Governing Law and Venue</h2>
              <p>
                These Terms and any non-arbitrable dispute will be governed by California law, with venue in the state or federal courts located in Riverside County, California.
              </p>

              <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">19. Modifying or Terminating the Services</h2>
              <p>
                We may change, suspend, or discontinue any part of the Services at any time. You may stop using the Services at any time.
              </p>

              <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">20. Miscellaneous</h2>
              <p>
                If any provision of these Terms is unenforceable, that provision will be severed and the rest will remain in effect. Our failure to enforce any provision is not a waiver. These Terms are the entire agreement between you and us regarding the Services.
              </p>

              <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">21. Supplemental Terms</h2>
              <p>
                R'Mart currently provides no supplemental service-specific terms.
              </p>

              <hr className="my-8 border-gray-300" />

              <p className="text-center text-lg font-semibold">
                Questions? Contact <a href="mailto:brandon@ucrmart.com" className="text-primary hover:underline">brandon@ucrmart.com</a>.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
