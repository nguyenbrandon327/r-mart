/**
 * Support & Security Agent Tools
 * Tools for policy questions, scam detection, and user support
 */

import { tool } from "@langchain/core/tools";
import { z } from "zod";

/**
 * Platform policies and terms (embedded for RAG)
 * In the future, these could be stored in pgvector for semantic search
 */
const PLATFORM_POLICIES = {
  terms_of_service: {
    title: "Terms of Service",
    sections: [
      {
        id: "eligibility",
        title: "Eligibility",
        content: "Users must be enrolled students at University of California, Riverside with a valid @ucr.edu email address. You must be at least 18 years old to use this platform."
      },
      {
        id: "account",
        title: "Account Responsibilities",
        content: "You are responsible for maintaining the security of your account. Do not share your login credentials. You are liable for all activities under your account. Report unauthorized access immediately."
      },
      {
        id: "listings",
        title: "Listing Guidelines",
        content: "All listings must be for legal items. Prohibited items include: weapons, drugs, alcohol, counterfeit goods, stolen property, and hazardous materials. Listings must accurately represent the item being sold."
      },
      {
        id: "transactions",
        title: "Transactions",
        content: "All transactions should occur in person in safe, public locations on or near campus. The platform does not handle payments directly. We are not responsible for transaction disputes between buyers and sellers."
      },
      {
        id: "conduct",
        title: "User Conduct",
        content: "Users must treat each other with respect. Harassment, discrimination, and threatening behavior are prohibited. Attempts to scam, defraud, or deceive other users will result in immediate account termination."
      },
      {
        id: "content",
        title: "Content Policy",
        content: "Users retain ownership of their content but grant us license to display it. Do not post copyrighted material without permission. We may remove content that violates our policies."
      },
      {
        id: "termination",
        title: "Account Termination",
        content: "We reserve the right to suspend or terminate accounts that violate our terms. Users may delete their accounts at any time through account settings."
      }
    ]
  },
  privacy_policy: {
    title: "Privacy Policy",
    sections: [
      {
        id: "collection",
        title: "Information We Collect",
        content: "We collect: email address, name, profile information you provide, listing data, messages between users, and usage analytics. We use cookies for session management."
      },
      {
        id: "usage",
        title: "How We Use Your Data",
        content: "Your data is used to: provide marketplace services, enable communication between users, improve the platform, send relevant notifications, and ensure platform safety."
      },
      {
        id: "sharing",
        title: "Data Sharing",
        content: "We do not sell your personal data. We may share data with: service providers who help operate the platform, law enforcement when legally required, and other users as necessary for transactions."
      },
      {
        id: "security",
        title: "Data Security",
        content: "We use industry-standard security measures including encryption, secure servers, and regular security audits. However, no system is 100% secure."
      },
      {
        id: "retention",
        title: "Data Retention",
        content: "We retain your data while your account is active. Upon account deletion, personal data is removed within 30 days. Some data may be retained for legal compliance."
      },
      {
        id: "rights",
        title: "Your Rights",
        content: "You have the right to: access your data, correct inaccuracies, delete your account, and opt out of non-essential communications."
      },
      {
        id: "contact",
        title: "Contact Us",
        content: "For privacy concerns or data requests, contact us through the support channel or email the platform administrators."
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

