/**
 * Support & Security Agent Tools
 * Tools for policy questions, scam detection, and user support
 */

import { tool } from "@langchain/core/tools";
import { z } from "zod";

/**
 * Platform policies and terms (embedded for RAG)
 * Sourced directly from the live Terms of Service and Privacy Policy pages.
 * In the future, these could be stored in pgvector for semantic search.
 */
const PLATFORM_POLICIES = {
  terms_of_service: {
    title: "Terms of Service",
    lastUpdated: "August 1, 2025",
    contact: "brandon@ucrmart.com",
    sections: [
      {
        id: "overview",
        title: "Overview",
        content: "These Terms of Service apply to your access to and use of the R'Mart website (ucrmart.com), mobile applications, and any other online products and services operated by R'Mart. By using the Services you agree to these Terms. They include a mandatory arbitration agreement requiring you to resolve disputes on an individual basis. To contact us about these Terms, email brandon@ucrmart.com."
      },
      {
        id: "privacy",
        title: "Section 1 – Privacy",
        content: "Please review the Privacy Policy to understand how R'Mart collects, uses, and shares information about you. By using the Services, you acknowledge you have received the Privacy Policy."
      },
      {
        id: "eligibility",
        title: "Section 2 – Eligibility",
        content: "You must be at least 16 years old to use the Services. Users under 18 (or the age of legal majority) may only use the Services under supervision of a parent or legal guardian who agrees to be bound by these Terms. The Services are exclusively for current students of the University of California, Riverside (UCR). By using the Services, you represent that you are a current UCR student and will stop using the Services when you are no longer enrolled. R'Mart may suspend or terminate accounts that do not meet these requirements."
      },
      {
        id: "accounts",
        title: "Section 3 – User Accounts and Security",
        content: "You may need to register for an account to access certain features. You must provide accurate information and keep it up to date. You are responsible for safeguarding your login credentials and for any activity under your account. Notify R'Mart immediately at brandon@ucrmart.com if you suspect unauthorized access."
      },
      {
        id: "services_listings",
        title: "Section 4A – Listing Items, Buying, and Selling",
        content: "The Services allow you to post items for sale or giveaway by uploading photos and descriptions. Posting is free. R'Mart does not provide or facilitate any payment feature and does not act as a payment processor or intermediary. Users must arrange any exchange of money entirely outside the Services. Because R'Mart is not a party to any transaction, we cannot assist with refunds, returns, or payment disputes. We may remove any listing at any time for any reason."
      },
      {
        id: "services_content",
        title: "Section 4B – User Content",
        content: "You retain ownership of content you post but grant R'Mart a worldwide, irrevocable, non-exclusive, royalty-free, sublicensable license to use, modify, display, and distribute that content in connection with the Services. You must have all necessary rights to grant this license, and your content must not violate these Terms or any law. R'Mart may remove any content at any time."
      },
      {
        id: "prohibited_conduct",
        title: "Section 5 – Prohibited Conduct",
        content: "You agree not to: use the Services for any purpose other than listing and exchanging goods among UCR students; engage in harassing, threatening, or misleading conduct; post items that violate any applicable law or R'Mart guidelines (e.g., prohibited or restricted items); use automated means (bots, scrapers) without permission; create more than one account or transfer your account without consent; infringe anyone's intellectual-property or privacy rights; bypass or interfere with the security or operation of the Services."
      },
      {
        id: "ownership",
        title: "Section 6 – Ownership; Limited License",
        content: "The Services and all related content are owned by R'Mart or its licensors. R'Mart grants you a limited, non-transferable, revocable license to access and use the Services in accordance with these Terms."
      },
      {
        id: "suspension_termination",
        title: "Section 7 – Suspension; Termination",
        content: "R'Mart may suspend or terminate your access to the Services at any time for any reason. Upon termination, the license granted in Section 6 ends and you must stop using the Services."
      },
      {
        id: "trademarks",
        title: "Section 8 – Trademarks",
        content: "R'Mart, the R'Mart logo, and any related names, logos, or slogans are trademarks of R'Mart. You may not use them without prior written permission. All other trademarks remain the property of their respective owners."
      },
      {
        id: "feedback",
        title: "Section 9 – Feedback",
        content: "Any suggestions, ideas, or other feedback you submit may be used by R'Mart for any purpose without compensation to you."
      },
      {
        id: "copyright",
        title: "Section 10 – Copyright & Intellectual-Property Complaints",
        content: "If you believe content on the Services infringes your copyright or other IP rights, email brandon@ucrmart.com with the information required by 17 U.S.C. § 512(c)(3)."
      },
      {
        id: "indemnification",
        title: "Section 11 – Indemnification",
        content: "To the fullest extent permitted by law, you agree to indemnify and hold harmless R'Mart, its affiliates, and their officers, directors, employees, and agents from any claims arising from your use of the Services, your content, or your violation of these Terms."
      },
      {
        id: "disclaimers",
        title: "Section 12 – Disclaimers",
        content: "The Services are provided 'as is' and 'as available.' R'Mart makes no warranties, express or implied, regarding the Services, including their accuracy, reliability, or availability. You assume all risk for your use of the Services."
      },
      {
        id: "liability",
        title: "Section 13 – Limitation of Liability",
        content: "To the fullest extent permitted by law, R'Mart and its affiliates will not be liable for indirect, consequential, incidental, or special damages, or lost profits. Our total liability for any claim related to the Services is limited to $100 or the amount you paid us in the past 12 months, whichever is greater."
      },
      {
        id: "assumption_of_risk",
        title: "Section 14 – Assumption of Risk",
        content: "YOU ARE SOLELY RESPONSIBLE FOR TAKING APPROPRIATE PRECAUTIONS WHEN INTERACTING WITH OTHER USERS, ESPECIALLY IN PERSON. R'MART DOES NOT VET USERS AND IS NOT RESPONSIBLE FOR THEIR CONDUCT."
      },
      {
        id: "release",
        title: "Section 15 – Release",
        content: "To the fullest extent permitted by law, you release R'Mart and its affiliates from any claims or damages arising from disputes between you and other users."
      },
      {
        id: "data_transfer",
        title: "Section 16 – Transfer and Processing of Data",
        content: "By using the Services, you consent to the processing and transfer of your information in and to the United States and other countries."
      },
      {
        id: "arbitration",
        title: "Section 17 – Dispute Resolution; Binding Arbitration",
        content: "Except for certain small-claims disputes or equitable relief, you and R'Mart agree to resolve any dispute through binding arbitration on an individual basis. You must first email brandon@ucrmart.com with a written Notice of your claim. If the claim cannot be resolved within 30 days, either party may commence arbitration with JAMS in Riverside County, California (or via video/phone if damages are under $10,000). The Federal Arbitration Act governs this agreement. You may opt out of arbitration by emailing brandon@ucrmart.com within 30 days of first agreeing to these Terms."
      },
      {
        id: "governing_law",
        title: "Section 18 – Governing Law and Venue",
        content: "These Terms and any non-arbitrable dispute will be governed by California law, with venue in the state or federal courts located in Riverside County, California."
      },
      {
        id: "modifications",
        title: "Section 19 – Modifying or Terminating the Services",
        content: "R'Mart may change, suspend, or discontinue any part of the Services at any time. You may stop using the Services at any time."
      },
      {
        id: "miscellaneous",
        title: "Section 20 – Miscellaneous",
        content: "If any provision of these Terms is unenforceable, that provision will be severed and the rest will remain in effect. R'Mart's failure to enforce any provision is not a waiver. These Terms are the entire agreement between you and R'Mart regarding the Services."
      }
    ]
  },
  privacy_policy: {
    title: "Privacy Policy",
    lastUpdated: "August 1, 2025",
    contact: "brandon@ucrmart.com",
    sections: [
      {
        id: "overview",
        title: "Overview",
        content: "This Privacy Policy explains how information about you is collected, used, and shared by R'Mart. It applies when you use the R'Mart website (ucrmart.com) or any of our online services. R'Mart may update this Policy from time to time; continued use of the Service indicates acceptance of any changes."
      },
      {
        id: "collection_provided",
        title: "Section I-A – Information You Provide to Us",
        content: "R'Mart collects information you provide directly when you register or update your account, post items for sale, communicate with other users, or request support. This includes: your name, email address, R'Mart account password (encrypted), UCR Residence Hall Name or postal address (encrypted), photos and descriptions of items you post, all messages exchanged through the Service (encrypted), and any other information you choose to provide."
      },
      {
        id: "collection_automatic",
        title: "Section I-B – Information Collected Automatically",
        content: "When you use the R'Mart Service we automatically collect: log information (browser type, access times, pages viewed, IP address, referring page), device information (hardware model, OS version, unique device identifiers, mobile network data), location information if you grant permission or inferred from your IP address, and cookie and similar-technology data. We may use cookies, web beacons, and other technologies to recognize you, improve the Service, understand usage, and determine whether an email has been opened."
      },
      {
        id: "usage",
        title: "Section II – How We Use Your Information",
        content: "R'Mart uses your information to: verify login credentials and personalize your experience; connect you with other users; maintain a trusted and safe environment (fraud detection, security, dispute resolution); operate, protect, improve, and optimize the Service; analyze usage trends and conduct research; communicate about products, services, offers, promotions, rewards, or events; send service-related messages, technical notices, security alerts, and support responses; comply with legal obligations and enforce agreements; and carry out any other purpose disclosed at the time of collection. R'Mart is based in the United States, and by using the Service you consent to the processing and transfer of information in and to the U.S. and other countries."
      },
      {
        id: "sharing",
        title: "Section III – When We Share Your Information",
        content: "R'Mart may share information: publicly, when you post on the Service (e.g., item listings); to comply with law, regulation, legal process, or governmental request; to enforce agreements or protect the rights, property, or safety of R'Mart or others; in connection with a merger, asset sale, financing, or acquisition; and with your consent or at your direction (including social-sharing features). R'Mart may also share aggregated or de-identified data that cannot reasonably identify you. R'Mart does not sell your personal data."
      },
      {
        id: "security",
        title: "Section III – Security",
        content: "R'Mart uses reasonable measures to protect your information from loss, theft, misuse, and unauthorized access, disclosure, alteration, or destruction. Whenever possible, R'Mart shares aggregated or anonymized data with third parties. When identifiable data must be shared, equivalent privacy protections are required."
      },
      {
        id: "choices_account",
        title: "Section IV-A – Account Information Choices",
        content: "You can update, correct, or delete certain profile information at any time by logging into your account. R'Mart may retain information as required by law or for legitimate business purposes. User-generated content such as reviews may remain publicly visible (without personal identifiers) after account deletion."
      },
      {
        id: "choices_cookies",
        title: "Section IV-B – Cookie Choices",
        content: "Most browsers accept cookies by default. You can set your browser to remove or reject cookies, but some features of the R'Mart Service may not function properly without them."
      },
      {
        id: "state_disclosures",
        title: "Section V – State-Specific Disclosures",
        content: "R'Mart retains information while your account is active, and longer where required for trust-and-safety matters, legal compliance, or other legitimate purposes. To request access, correction, or deletion of your personal information—or to exercise any other rights under applicable state law—email brandon@ucrmart.com. R'Mart will verify your request using information that matches its records. You may appoint an authorized agent; R'Mart may require proof of authorization and still request you to verify your identity."
      },
      {
        id: "california_rights",
        title: "Section V-A – California Residents (CCPA/CPRA)",
        content: "The California Consumer Privacy Act (CCPA), as amended by the California Privacy Rights Act (CPRA), grants California residents the right to: know the categories and specific pieces of personal information collected, the sources, purposes, disclosure practices, and whether R'Mart sells or shares your data; delete personal information (with certain exceptions); correct inaccurate personal information; limit the use or disclosure of sensitive personal information; and be free from discrimination for exercising your privacy rights. Contact brandon@ucrmart.com to exercise these rights."
      },
      {
        id: "contact",
        title: "Questions & Feedback",
        content: "For any privacy questions, data requests, or concerns about R'Mart's information practices, contact brandon@ucrmart.com."
      }
    ]
  },
  safety_guidelines: {
    title: "Safety Guidelines",
    sections: [
      {
        id: "meetup",
        title: "Safe Meetup Practices",
        content: "Always meet in public, well-lit areas on campus. Popular safe spots include: the HUB, library, student union. Bring a friend if possible. Meet during daylight hours. Tell someone where you're going."
      },
      {
        id: "payment",
        title: "Payment Safety",
        content: "Use cash or secure payment methods. Never wire money or use gift cards. Inspect items before paying. Get receipts for expensive items. Never share bank account or credit card details."
      },
      {
        id: "communication",
        title: "Communication Safety",
        content: "Keep conversations on the platform for your protection. Be wary of users who insist on moving to other platforms. Don't share personal information like your dorm room number or class schedule."
      },
      {
        id: "scams",
        title: "Common Scams to Avoid",
        content: "Watch for: prices too good to be true, pressure to act fast, requests for unusual payment methods, sellers who won't meet in person, fake payment confirmations, overpayment scams."
      }
    ]
  }
};

/**
 * Scam indicators with severity levels
 */
const SCAM_INDICATORS = [
  { pattern: /wire transfer|western union|moneygram/i, severity: "high", reason: "Requesting wire transfer - common scam method" },
  { pattern: /gift card/i, severity: "high", reason: "Requesting gift card payment - classic scam indicator" },
  { pattern: /can't meet|unable to meet|out of town/i, severity: "medium", reason: "Avoiding in-person meeting" },
  { pattern: /send money first|pay before/i, severity: "high", reason: "Requesting payment before seeing item" },
  { pattern: /too good to be true|urgent|act now|limited time/i, severity: "medium", reason: "Pressure tactics" },
  { pattern: /verify.*account|confirm.*payment|click.*link/i, severity: "high", reason: "Possible phishing attempt" },
  { pattern: /overseas|ship.*international|nigeria|foreign/i, severity: "medium", reason: "International transaction - higher risk" },
  { pattern: /\b[5-9]\d%\s*off\b|\b[1-9]\d\d%\b/i, severity: "medium", reason: "Unrealistic discount" },
  { pattern: /certified check|cashier.*check|money order/i, severity: "high", reason: "Fake check scam indicator" },
  { pattern: /personal.*number|social.*security|ssn/i, severity: "high", reason: "Requesting sensitive personal information" }
];

/**
 * Search policies using keyword matching (simple RAG simulation)
 * Future: Replace with pgvector semantic search
 */
export const searchPolicies = tool(
  async ({ query, policyType }) => {
    try {
      const searchTerms = query.toLowerCase().split(/\s+/);
      const results = [];

      const policiesToSearch = policyType 
        ? { [policyType]: PLATFORM_POLICIES[policyType] }
        : PLATFORM_POLICIES;

      for (const [type, policy] of Object.entries(policiesToSearch)) {
        if (!policy) continue;
        
        for (const section of policy.sections) {
          const sectionText = `${section.title} ${section.content}`.toLowerCase();
          const matchScore = searchTerms.filter(term => sectionText.includes(term)).length;
          
          if (matchScore > 0) {
            results.push({
              policyType: type,
              policyTitle: policy.title,
              sectionId: section.id,
              sectionTitle: section.title,
              content: section.content,
              relevanceScore: matchScore / searchTerms.length
            });
          }
        }
      }

      // Sort by relevance
      results.sort((a, b) => b.relevanceScore - a.relevanceScore);

      if (results.length === 0) {
        return JSON.stringify({
          found: false,
          message: "No relevant policy sections found for your query.",
          suggestion: "Try rephrasing your question or ask about specific topics like 'privacy', 'payments', 'safety', or 'account'."
        });
      }

      return JSON.stringify({
        found: true,
        count: results.length,
        topResults: results.slice(0, 3),
        summary: `Found ${results.length} relevant policy section(s) for your query about "${query}".`
      });
    } catch (error) {
      console.error("Error searching policies:", error);
      return JSON.stringify({ error: "Failed to search policies", details: error.message });
    }
  },
  {
    name: "searchPolicies",
    description: "Search through Terms of Service, Privacy Policy, and Safety Guidelines to answer policy questions",
    schema: z.object({
      query: z.string().describe("The policy question or topic to search for"),
      policyType: z.enum(["terms_of_service", "privacy_policy", "safety_guidelines"]).optional()
        .describe("Specific policy document to search (optional)")
    })
  }
);

/**
 * Analyze text for scam indicators
 */
export const analyzeForScam = tool(
  async ({ text, context }) => {
    try {
      const findings = [];
      let maxSeverity = "low";

      for (const indicator of SCAM_INDICATORS) {
        if (indicator.pattern.test(text)) {
          findings.push({
            severity: indicator.severity,
            reason: indicator.reason,
            match: text.match(indicator.pattern)?.[0]
          });
          
          if (indicator.severity === "high") {
            maxSeverity = "high";
          } else if (indicator.severity === "medium" && maxSeverity !== "high") {
            maxSeverity = "medium";
          }
        }
      }

      // Calculate risk score
      const riskScore = findings.reduce((score, f) => {
        return score + (f.severity === "high" ? 30 : f.severity === "medium" ? 15 : 5);
      }, 0);

      const normalizedRisk = Math.min(100, riskScore);

      let recommendation;
      if (normalizedRisk >= 60) {
        recommendation = "🚨 HIGH RISK - Do not proceed with this transaction. This shows multiple scam indicators.";
      } else if (normalizedRisk >= 30) {
        recommendation = "⚠️ CAUTION - Some concerning elements detected. Proceed carefully and meet in person on campus.";
      } else if (normalizedRisk > 0) {
        recommendation = "✅ LOW RISK - Minor concerns detected. Still follow standard safety practices.";
      } else {
        recommendation = "✅ NO OBVIOUS RISKS - No scam indicators detected, but always stay vigilant.";
      }

      return JSON.stringify({
        analyzed: true,
        context: context || "general",
        riskScore: normalizedRisk,
        riskLevel: maxSeverity,
        findings: findings.length > 0 ? findings : "No specific scam indicators found",
        recommendation,
        generalTips: [
          "Always meet in public on campus",
          "Inspect items before paying",
          "If it seems too good to be true, it probably is",
          "Trust your instincts"
        ]
      });
    } catch (error) {
      console.error("Error analyzing for scam:", error);
      return JSON.stringify({ error: "Failed to analyze text", details: error.message });
    }
  },
  {
    name: "analyzeForScam",
    description: "Analyze a listing description or message for potential scam indicators",
    schema: z.object({
      text: z.string().describe("The text to analyze for scam indicators"),
      context: z.enum(["listing", "message", "profile", "general"]).optional()
        .describe("Context of the text being analyzed")
    })
  }
);

/**
 * Get platform help information
 */
export const getPlatformHelp = tool(
  async ({ topic }) => {
    const helpTopics = {
      creating_listing: {
        title: "How to Create a Listing",
        steps: [
          "Click 'Add Listing' or the + button",
          "Take clear photos of your item from multiple angles",
          "Write a descriptive title with brand/model if applicable",
          "Set a fair price (use our price estimator for help)",
          "Write a detailed description including condition and any defects",
          "Select the appropriate category",
          "Post your listing!"
        ],
        tips: [
          "Good photos increase views by 80%",
          "Detailed descriptions reduce questions",
          "Competitive pricing leads to faster sales"
        ]
      },
      buying: {
        title: "How to Buy Items",
        steps: [
          "Browse listings or search for what you need",
          "Click on items to see full details",
          "Save items you're interested in",
          "Message the seller through the app",
          "Arrange a meetup in a safe location",
          "Inspect the item and complete the transaction"
        ],
        tips: [
          "Ask questions before meeting",
          "Meet in public areas on campus",
          "Bring exact cash if possible"
        ]
      },
      messaging: {
        title: "Using Messages",
        steps: [
          "Click 'Message' on any listing to start a conversation",
          "Find your conversations in the Inbox",
          "Keep all communication in the app for safety"
        ],
        tips: [
          "Be polite and responsive",
          "Be specific about meetup times and locations",
          "Report any suspicious messages"
        ]
      },
      account: {
        title: "Account Management",
        steps: [
          "Access settings from your profile menu",
          "Update your profile information anytime",
          "Manage notification preferences",
          "View your active and sold listings"
        ],
        tips: [
          "Keep your profile updated for trust",
          "Use a clear profile photo",
          "Respond to messages promptly for a good reputation"
        ]
      },
      safety: {
        title: "Staying Safe",
        steps: [
          "Always meet in public areas on campus",
          "Bring a friend to transactions",
          "Inspect items before paying",
          "Trust your instincts - if something feels wrong, walk away"
        ],
        tips: [
          "The HUB and library are safe meetup spots",
          "Daytime meetings are safest",
          "Report suspicious behavior immediately"
        ]
      }
    };

    const selectedHelp = helpTopics[topic];
    
    if (!selectedHelp) {
      return JSON.stringify({
        error: false,
        message: "Help topic not found",
        availableTopics: Object.keys(helpTopics).map(t => ({
          id: t,
          title: helpTopics[t].title
        }))
      });
    }

    return JSON.stringify({
      found: true,
      topic: topic,
      ...selectedHelp
    });
  },
  {
    name: "getPlatformHelp",
    description: "Get help information about using the platform",
    schema: z.object({
      topic: z.enum(["creating_listing", "buying", "messaging", "account", "safety"])
        .describe("Help topic to get information about")
    })
  }
);

// Export all support tools
export const supportTools = [
  searchPolicies,
  analyzeForScam,
  getPlatformHelp,
];

export default supportTools;

