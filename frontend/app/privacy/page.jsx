'use client';

import Link from 'next/link';
import Image from 'next/image';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen flex flex-col relative">
      {/* R'Mart Logo */}
      <div className="absolute top-4 left-4 z-10">
        <Link href="/" className="hover:opacity-80 transition-opacity">
          <div className="flex items-center gap-2">
            <Image 
              src="/logo-pic.png" 
              alt="R'mart Logo" 
              width={48}
              height={48}
              className="object-contain"
              sizes="48px"
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

      {/* Privacy Policy Content */}
      <main className="flex-1 pt-20 px-4 pb-8">
        <div className="max-w-4xl mx-auto">
          <div className="prose prose-lg max-w-none">
            <h1 className="text-4xl font-bold text-center mb-8 bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">
              Privacy Policy
            </h1>
            
            <div className="text-gray-700 leading-relaxed space-y-6">
              <p className="text-sm text-gray-500">Last updated: August 1, 2025</p>

              <p>
                This Privacy Policy explains how information about you is collected, used, and shared by R'Mart (hereafter "R'Mart," "our," "we," or "us"). It applies when you use our website (ucrmart.com), interact with us, or otherwise use any of our online services (collectively, the "R'Mart Service").
              </p>

              <p>
                We may update this Privacy Policy from time to time. If we make changes, we will revise the "Last updated" date above and, when appropriate, provide additional notice (such as posting on our home page or sending you an email). Please review this Policy whenever you access the R'Mart Service to stay informed about our practices.
              </p>

              <p>
                If you reside in a U.S. state with its own consumer-privacy law, please see Section V, "State-Specific Disclosures."
              </p>

              <hr className="my-8 border-gray-300" />

              <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">I. Information We Collect and How We Collect It</h2>
              
              <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-3">A. Information You Provide to Us</h3>
              <p>We collect information you provide directly to us when you:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>register or update your account</li>
                <li>post items for sale</li>
                <li>communicate with other users</li>
                <li>request customer support or otherwise engage with us</li>
              </ul>

              <p>The information may include:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>your name</li>
                <li>email address</li>
                <li>R'Mart account password (encrypted)</li>
                <li>UCR Residence Hall Name OR postal address, including city, state, and ZIP code (encrypted)</li>
                <li>photos and descriptions of items you post for sale</li>
                <li>all messages exchanged through the R'Mart Service (encrypted)</li>
                <li>any other information you choose to provide</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-3">B. Information We Collect Automatically</h3>
              <p>When you use the R'Mart Service we automatically collect:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>log information (browser type, access times, pages viewed, IP address, referring page)</li>
                <li>device information (hardware model, OS and version, unique device identifiers, mobile network data)</li>
                <li>location information, if you grant permission or if we infer it from your IP address</li>
                <li>cookie and similar-technology data (see Section IV.C for choices)</li>
              </ul>

              <p>
                We may use cookies, web beacons, and other technologies to recognize you, improve the R'Mart Service, understand usage, and determine whether an email has been opened or acted on.
              </p>

              <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">II. How We Use Your Information</h2>
              <p>We use your information to:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>verify login credentials and personalize your R'Mart experience</li>
                <li>connect you with other users</li>
                <li>maintain a trusted and safe environment (fraud detection, security, dispute resolution)</li>
                <li>operate, protect, improve, and optimize the R'Mart Service</li>
                <li>analyze usage trends and conduct research</li>
                <li>communicate about products, services, offers, promotions, rewards, or events</li>
                <li>send service-related messages, technical notices, security alerts, and support responses</li>
                <li>comply with legal obligations and enforce agreements</li>
                <li>carry out any other purpose disclosed at the time of collection</li>
              </ul>

              <p>
                R'Mart is based in the United States, and the information we collect is governed by U.S. law. By using the R'Mart Service, you consent to the processing and transfer of information in and to the U.S. and other countries, which may have different data-protection laws.
              </p>

              <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">III. When We Share Your Information</h2>
              <p>We may share information:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>publicly, when you post on the R'Mart Service (e.g., item listings)</li>
                <li>to comply with law, regulation, legal process, or governmental request</li>
                <li>to enforce our agreements or protect the rights, property, or safety of R'Mart or others</li>
                <li>in connection with a merger, asset sale, financing, or acquisition of our business</li>
                <li>with your consent or at your direction (including social-sharing features)</li>
              </ul>

              <p>
                We may also share aggregated or de-identified data that cannot reasonably identify you.
              </p>

              <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-3">Security</h3>
              <p>
                We use reasonable measures to protect your information from loss, theft, misuse, and unauthorized access, disclosure, alteration, or destruction. Whenever possible, we share aggregated or anonymized data with third parties. When identifiable data must be shared, we require equivalent privacy protections.
              </p>

              <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">IV. Your Choices</h2>
              
              <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-3">A. Account Information</h3>
              <p>
                You can update, correct, or delete certain profile information at any time by logging into your account. We may retain information as required by law or for legitimate business purposes. User-generated content such as reviews may remain publicly visible (without personal identifiers) after account deletion.
              </p>

              <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-3">B. Cookies</h3>
              <p>
                Most browsers accept cookies by default. You can set your browser to remove or reject cookies, but some features of the R'Mart Service may not function properly.
              </p>

              <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">V. State-Specific Disclosures</h2>
              <p>
                Please refer to Sections I–III for the categories of information we collect, our purposes, and our sharing practices. We retain information while your account is active, and longer where required for trust-and-safety matters, legal compliance, or other legitimate purposes.
              </p>

              <p>
                To request access, correction, or deletion of your personal information—or to exercise any other rights under applicable state law—email us at <a href="mailto:brandon@ucrmart.com" className="text-primary hover:underline">brandon@ucrmart.com</a>. We will verify your request using information that matches our records. You may appoint an authorized agent; we may require proof of authorization and still request you to verify your identity.
              </p>

              <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-3">A. Information for California Residents</h3>
              <p>
                The California Consumer Privacy Act (CCPA), as amended by the California Privacy Rights Act (CPRA), grants you rights to:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Know the categories and specific pieces of personal information we collect, the sources, purposes, disclosure practices, and whether we sell or share your data</li>
                <li>Delete personal information (with certain exceptions)</li>
                <li>Correct inaccurate personal information</li>
                <li>Limit the use or disclosure of sensitive personal information</li>
                <li>Be free from discrimination for exercising your privacy rights</li>
              </ul>



              <hr className="my-8 border-gray-300" />

              <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">Questions & Feedback</h2>
              <p className="text-center text-lg font-semibold">
                Questions?,  Contact <a href="mailto:brandon@ucrmart.com" className="text-primary hover:underline">brandon@ucrmart.com</a>.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}



