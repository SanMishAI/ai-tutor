import Link from "next/link"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Privacy Policy — SelectEd",
  description: "How SelectEd collects, uses, and protects your information.",
}

export default function PrivacyPage() {
  return (
    <div
      className="min-h-screen flex flex-col items-center px-6 py-12 relative overflow-hidden"
      style={{ backgroundColor: "#0a0b1a", color: "#f1f5f9" }}
    >
      <div className="absolute w-96 h-96 rounded-full opacity-10 blur-3xl pointer-events-none" style={{ background: "#7c3aed", top: "5%", left: "-10%" }} />
      <div className="absolute w-80 h-80 rounded-full opacity-10 blur-3xl pointer-events-none" style={{ background: "#0ea5e9", bottom: "10%", right: "-5%" }} />

      <div className="w-full max-w-2xl mb-8 relative z-10">
        <Link href="/" className="text-sm text-indigo-400 hover:text-indigo-300 transition-colors">
          ← Back to SelectEd
        </Link>
      </div>

      <div className="w-full max-w-2xl space-y-10 relative z-10">

        <div className="space-y-3">
          <p className="text-xs font-semibold tracking-widest text-indigo-400 uppercase">Legal</p>
          <h1
            className="text-4xl sm:text-5xl leading-tight"
            style={{ fontFamily: '"Arial Black", Impact, system-ui', fontWeight: 900 }}
          >
            Privacy Policy
          </h1>
          <p className="text-slate-400 text-sm">Last updated: June 2026</p>
        </div>

        <p className="text-slate-300 leading-relaxed">
          SelectEd (&ldquo;we&rdquo;, &ldquo;our&rdquo;, &ldquo;us&rdquo;) is operated by Santrupta Mishra, based in Melbourne, Australia.
          This policy explains what information we collect, how we use it, and your rights in relation to it.
          We are committed to handling your data in accordance with the <em>Privacy Act 1988</em> (Cth) and the Australian Privacy Principles.
        </p>

        {[
          {
            title: "1. Information we collect",
            body: (
              <div className="space-y-4 text-slate-300 leading-relaxed">
                <p><strong className="text-white">Guest users (not signed in)</strong> — No account is created and no data is sent to our servers. Your chat conversations are stored only in your browser&rsquo;s <code className="text-indigo-300 text-sm">localStorage</code> and never leave your device.</p>
                <p><strong className="text-white">Signed-in users</strong> — When you create an account we collect:</p>
                <ul className="list-disc list-inside space-y-1 text-sm pl-2">
                  <li>Account identifiers provided by Clerk (name, email address or phone number, and OAuth provider ID)</li>
                  <li>Chat conversations you save (subject, year level, messages)</li>
                  <li>Exam results (score, subject, year level, wrong answers, time taken)</li>
                  <li>Practice results (subject, question, whether the answer was correct)</li>
                </ul>
              </div>
            ),
          },
          {
            title: "2. How we use your information",
            body: (
              <ul className="list-disc list-inside space-y-2 text-slate-300 text-sm pl-2 leading-relaxed">
                <li>To provide and improve the SelectEd service</li>
                <li>To sync your conversations and results across devices when you are signed in</li>
                <li>To display your history in the sidebar and exam results screens</li>
                <li>We do not use your data for advertising or sell it to third parties</li>
              </ul>
            ),
          },
          {
            title: "3. Third-party services",
            body: (
              <div className="space-y-3 text-slate-300 text-sm leading-relaxed">
                <p>We use the following third-party providers to operate SelectEd. Each provider has its own privacy policy.</p>
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="py-2 pr-4 text-white font-semibold text-xs uppercase tracking-wider">Provider</th>
                      <th className="py-2 pr-4 text-white font-semibold text-xs uppercase tracking-wider">Purpose</th>
                      <th className="py-2 text-white font-semibold text-xs uppercase tracking-wider">Data shared</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {[
                      ["Clerk", "Authentication", "Account credentials, OAuth tokens"],
                      ["Neon (AWS Sydney)", "Database", "Conversations, exam & practice results"],
                      ["Anthropic", "AI tutoring", "Your messages and exam content"],
                      ["Vercel", "Hosting & analytics", "Page views, anonymous usage metrics"],
                    ].map(([provider, purpose, data]) => (
                      <tr key={provider}>
                        <td className="py-2 pr-4 font-medium text-slate-200">{provider}</td>
                        <td className="py-2 pr-4 text-slate-400">{purpose}</td>
                        <td className="py-2 text-slate-400">{data}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <p className="text-slate-400 text-xs pt-1">
                  Messages you send are processed by Anthropic&rsquo;s Claude API to generate tutor responses.
                  Anthropic&rsquo;s usage policies prohibit them from training models on API inputs by default.
                </p>
              </div>
            ),
          },
          {
            title: "4. Children's privacy",
            body: (
              <p className="text-slate-300 leading-relaxed text-sm">
                SelectEd is designed for students of all ages, including children under 13. We do not knowingly collect
                personal information from children without verifiable parental consent. If you are a parent or guardian
                and believe your child has provided personal data without your consent, please contact us at the address
                below and we will delete it promptly. We encourage parents to supervise their children&rsquo;s use of the app
                and to use Guest mode (no account) if they prefer not to store any data on our servers.
              </p>
            ),
          },
          {
            title: "5. Data retention",
            body: (
              <p className="text-slate-300 leading-relaxed text-sm">
                We retain your account data and associated conversations and results for as long as your account is active.
                You may delete individual conversations from within the app at any time.
                To request deletion of your entire account and all associated data, contact us at the address below.
              </p>
            ),
          },
          {
            title: "6. Security",
            body: (
              <p className="text-slate-300 leading-relaxed text-sm">
                All data is transmitted over HTTPS. Our database (Neon) is hosted in AWS ap-southeast-2 (Sydney) and
                access is restricted to our application layer. Authentication is handled by Clerk, which is SOC 2 Type II certified.
                No payment information is ever collected or stored by SelectEd.
              </p>
            ),
          },
          {
            title: "7. Your rights",
            body: (
              <div className="space-y-2 text-slate-300 text-sm leading-relaxed">
                <p>Under the Australian Privacy Principles you have the right to:</p>
                <ul className="list-disc list-inside space-y-1 pl-2">
                  <li>Access the personal information we hold about you</li>
                  <li>Request correction of inaccurate information</li>
                  <li>Request deletion of your data</li>
                  <li>Lodge a complaint with the Office of the Australian Information Commissioner (OAIC)</li>
                </ul>
              </div>
            ),
          },
          {
            title: "8. Changes to this policy",
            body: (
              <p className="text-slate-300 leading-relaxed text-sm">
                We may update this policy from time to time. The &ldquo;Last updated&rdquo; date at the top of this page will reflect
                any changes. Continued use of SelectEd after changes are posted constitutes your acceptance of the updated policy.
              </p>
            ),
          },
          {
            title: "9. Contact",
            body: (
              <p className="text-slate-300 leading-relaxed text-sm">
                For any privacy-related questions, requests, or complaints, please contact:<br />
                <strong className="text-white">Santrupta Mishra</strong><br />
                Melbourne, Australia<br />
                <a href="mailto:santrupta.mishra@gmail.com" className="text-indigo-400 hover:text-indigo-300 transition-colors">
                  santrupta.mishra@gmail.com
                </a>
              </p>
            ),
          },
        ].map(({ title, body }) => (
          <div
            key={title}
            className="rounded-2xl border border-white/10 p-6 space-y-4"
            style={{ background: "rgba(255,255,255,0.03)" }}
          >
            <h2 className="text-lg font-bold text-white">{title}</h2>
            {body}
          </div>
        ))}

        <div className="text-center pt-4 pb-8">
          <Link
            href="/"
            className="inline-block px-8 py-3 rounded-2xl font-bold text-white transition-opacity hover:opacity-90 text-base"
            style={{ background: "linear-gradient(135deg, #7c3aed, #0ea5e9)" }}
          >
            Back to SelectEd →
          </Link>
        </div>

      </div>
    </div>
  )
}
