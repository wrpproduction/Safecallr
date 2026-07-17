import React from "react";
import { Shield, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

export default function Privacy() {
  const scrollToId = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <div id="privacy-policy-en-page" className="min-h-screen bg-[#FAFBFD] text-[#0F1B3D] font-sans">
      {/* Header Bar */}
      <header id="privacy-en-header" className="bg-[#0F1B3D] text-white py-14 px-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#0F1B3D] to-[#1E2E5D] opacity-90 z-0"></div>
        
        <div className="max-w-3xl mx-auto relative z-10">
          <div className="flex justify-between items-center mb-8">
            <Link id="privacy-en-back-home" to="/" className="inline-flex items-center gap-2 text-sm text-slate-300 hover:text-[#3DFFA0] transition-colors group">
              <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
              Back to home
            </Link>
            
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-[#3DFFA0] flex items-center justify-center shrink-0">
                <Shield className="text-[#0F1B3D] w-5 h-5" />
              </div>
              <span className="font-headline font-black text-lg tracking-tighter text-[#3DFFA0]">SafeCallr</span>
            </div>
          </div>

          <h1 id="privacy-en-main-title" className="text-3xl md:text-4xl font-extrabold tracking-tight mb-4">
            Privacy Policy
          </h1>
          <p className="text-[#B9C3DC] text-sm">
            Last updated: <strong className="text-[#3DFFA0] font-semibold">July 16, 2026</strong> · Version 1.0
          </p>
        </div>
      </header>

      {/* Main Content */}
      <main id="privacy-en-main-content" className="max-w-3xl mx-auto px-6 py-10 md:py-16">
        
        {/* Intro */}
        <div id="privacy-en-intro-card" className="border-l-4 border-[#3DFFA0] pl-6 py-2 mb-6 text-[#2A3A66] text-lg leading-relaxed italic">
          <p>
            SafeCallr is a caller authentication service designed to fight phone fraud and identity impersonation. Protecting your personal data is at the heart of our mission: this policy explains transparently what data we collect, why, for how long we keep it, and what your rights are.
          </p>
        </div>

        {/* Prevalence disclaimer */}
        <div id="privacy-en-prevalence" className="bg-[#F1F5F9] border border-[#E3E8F2] rounded-xl p-4 mb-10 text-sm text-[#2A3A66] leading-relaxed">
          This English version is provided for convenience. In the event of any discrepancy or dispute regarding its interpretation, the{" "}
          <Link to="/confidentialite" className="text-[#0E9C5C] hover:underline font-semibold">
            French version
          </Link>{" "}
          shall prevail.
        </div>

        {/* Table of Contents */}
        <nav id="privacy-en-toc" className="bg-white border border-[#E3E8F2] rounded-xl p-6 mb-12 shadow-sm">
          <h2 className="text-xs uppercase tracking-widest font-bold text-[#2A3A66] mb-4">
            Contents
          </h2>
          <ol className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2 text-sm">
            <li>
              <a href="#controller" onClick={(e) => scrollToId(e, "controller")} className="hover:text-[#0E9C5C] hover:underline transition-colors block py-0.5">
                1. Data controller
              </a>
            </li>
            <li>
              <a href="#data" onClick={(e) => scrollToId(e, "data")} className="hover:text-[#0E9C5C] hover:underline transition-colors block py-0.5">
                2. Data we collect
              </a>
            </li>
            <li>
              <a href="#no-collect" onClick={(e) => scrollToId(e, "no-collect")} className="hover:text-[#0E9C5C] hover:underline transition-colors block py-0.5">
                3. What SafeCallr does not collect
              </a>
            </li>
            <li>
              <a href="#purposes" onClick={(e) => scrollToId(e, "purposes")} className="hover:text-[#0E9C5C] hover:underline transition-colors block py-0.5">
                4. Purposes and legal bases
              </a>
            </li>
            <li>
              <a href="#retention" onClick={(e) => scrollToId(e, "retention")} className="hover:text-[#0E9C5C] hover:underline transition-colors block py-0.5">
                5. Retention periods
              </a>
            </li>
            <li>
              <a href="#recipients" onClick={(e) => scrollToId(e, "recipients")} className="hover:text-[#0E9C5C] hover:underline transition-colors block py-0.5">
                6. Recipients and processors
              </a>
            </li>
            <li>
              <a href="#transfers" onClick={(e) => scrollToId(e, "transfers")} className="hover:text-[#0E9C5C] hover:underline transition-colors block py-0.5">
                7. Transfers outside the European Union
              </a>
            </li>
            <li>
              <a href="#security" onClick={(e) => scrollToId(e, "security")} className="hover:text-[#0E9C5C] hover:underline transition-colors block py-0.5">
                8. Security
              </a>
            </li>
            <li>
              <a href="#rights" onClick={(e) => scrollToId(e, "rights")} className="hover:text-[#0E9C5C] hover:underline transition-colors block py-0.5">
                9. Your rights
              </a>
            </li>
            <li>
              <a href="#age" onClick={(e) => scrollToId(e, "age")} className="hover:text-[#0E9C5C] hover:underline transition-colors block py-0.5">
                10. Minimum age
              </a>
            </li>
            <li>
              <a href="#cookies" onClick={(e) => scrollToId(e, "cookies")} className="hover:text-[#0E9C5C] hover:underline transition-colors block py-0.5">
                11. Cookies
              </a>
            </li>
            <li>
              <a href="#changes" onClick={(e) => scrollToId(e, "changes")} className="hover:text-[#0E9C5C] hover:underline transition-colors block py-0.5">
                12. Changes to this policy
              </a>
            </li>
            <li>
              <a href="#contact" onClick={(e) => scrollToId(e, "contact")} className="hover:text-[#0E9C5C] hover:underline transition-colors block py-0.5">
                13. Contact
              </a>
            </li>
          </ol>
        </nav>

        {/* Sections */}
        <div className="space-y-12 leading-relaxed text-base">
          
          <section id="controller" className="scroll-mt-6">
            <h2 className="text-xl md:text-2xl font-extrabold text-[#0F1B3D] mb-4">
              1. Data controller
            </h2>
            <div className="space-y-3">
              <p>The controller of the personal data collected through the SafeCallr application and website is:</p>
              <p className="bg-white border border-[#E3E8F2] rounded-xl p-4 shadow-sm">
                <strong>MOTIOON</strong>, a French simplified joint-stock company (SASU)<br />
                Registered office: 60 rue François I<sup>er</sup>, 75008 Paris, France<br />
                Registered with the Paris Trade and Companies Register (RCS) under number 930 280 086<br />
                Represented by its President, Rémi Prével
              </p>
              <p>
                For any question regarding your personal data:{" "}
                <a href="mailto:contact@safecallr.com" className="text-[#0E9C5C] hover:underline font-medium">
                  contact@safecallr.com
                </a>
              </p>
              <p>
                MOTIOON has not appointed a Data Protection Officer (DPO), as such an appointment is not mandatory given the current nature and scale of its processing activities. The contact point above handles all requests relating to personal data.
              </p>
            </div>
          </section>

          <section id="data" className="scroll-mt-6">
            <h2 className="text-xl md:text-2xl font-extrabold text-[#0F1B3D] mb-4">
              2. Data we collect
            </h2>
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-bold text-[#0F1B3D] mb-2">2.1 Account data (all users)</h3>
                <ul className="list-disc pl-6 space-y-2">
                  <li><strong>Identity:</strong> full name;</li>
                  <li><strong>Contact details:</strong> email address, phone number;</li>
                  <li><strong>Authentication:</strong> password (stored exclusively in encrypted/hashed form — we never have access to your password in plain text);</li>
                  <li><strong>Account type:</strong> individual or professional.</li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-bold text-[#0F1B3D] mb-2">2.2 Professional verification data (professional accounts only)</h3>
                <p>
                  To ensure that only legitimate professionals can claim a verified professional status — which is the very foundation of the protection SafeCallr provides — we ask professionals for proof of the existence of their company or activity (a French Kbis extract or an equivalent document evidencing the legal existence of the entity).
                </p>
              </div>

              <div>
                <h3 className="text-lg font-bold text-[#0F1B3D] mb-2">2.3 Service usage data</h3>
                <ul className="list-disc pl-6 space-y-2">
                  <li><strong>Secure contacts:</strong> the list of SafeCallr users with whom you have established a verification relationship;</li>
                  <li><strong>Verification history:</strong> the date, counterpart and outcome (identity confirmed or not) of each authentication request;</li>
                  <li><strong>Verification codes:</strong> the single-use codes generated during an authentication request, which expire automatically after a short period;</li>
                  <li><strong>Preferences:</strong> application language.</li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-bold text-[#0F1B3D] mb-2">2.4 Technical data</h3>
                <ul className="list-disc pl-6 space-y-2">
                  <li><strong>Push notification token (FCM token):</strong> a technical identifier used to deliver authentication notifications to your device;</li>
                  <li><strong>Platform used:</strong> iOS, Android or web;</li>
                  <li><strong>Technical logs:</strong> connection and error logs strictly necessary for the operation, security and maintenance of the service.</li>
                </ul>
              </div>
            </div>
          </section>

          <section id="no-collect" className="scroll-mt-6">
            <h2 className="text-xl md:text-2xl font-extrabold text-[#0F1B3D] mb-4">
              3. What SafeCallr does not collect
            </h2>
            <div className="bg-white border border-[#E3E8F2] border-l-4 border-l-[#3DFFA0] rounded-xl p-6 shadow-sm">
              <p className="font-semibold text-lg text-[#0F1B3D] mb-3">
                SafeCallr does not record your calls, does not collect any voice data and does not perform any biometric analysis.
              </p>
              <p className="text-sm text-[#2A3A66] mb-0">
                The service works exclusively through the exchange of verification codes: we have access neither to the content nor to the audio of your phone conversations, which take place outside the application. SafeCallr does not access your phone's address book without your permission and does not collect your location.
              </p>
            </div>
          </section>

          <section id="purposes" className="scroll-mt-6">
            <h2 className="text-xl md:text-2xl font-extrabold text-[#0F1B3D] mb-4">
              4. Purposes and legal bases
            </h2>
            <div className="overflow-x-auto border border-[#E3E8F2] rounded-xl shadow-sm bg-white">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="bg-[#0F1B3D] text-white">
                    <th className="p-4 font-semibold border-b border-[#E3E8F2]">Purpose</th>
                    <th className="p-4 font-semibold border-b border-[#E3E8F2]">Data concerned</th>
                    <th className="p-4 font-semibold border-b border-[#E3E8F2]">Legal basis (Art. 6 GDPR)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E3E8F2] text-[#2A3A66]">
                  <tr>
                    <td className="p-4 align-top">Creating and managing your account, providing the authentication service</td>
                    <td className="p-4 align-top">Account data, secure contacts, verification codes, FCM token</td>
                    <td className="p-4 align-top">Performance of the contract</td>
                  </tr>
                  <tr>
                    <td className="p-4 align-top">Verifying the professional status of professional accounts</td>
                    <td className="p-4 align-top">Proof of company existence (Kbis or equivalent)</td>
                    <td className="p-4 align-top">Performance of the contract and legitimate interest (prevention of fraud and professional identity impersonation)</td>
                  </tr>
                  <tr>
                    <td className="p-4 align-top">History of your verifications, available in the application</td>
                    <td className="p-4 align-top">Verification history</td>
                    <td className="p-4 align-top">Performance of the contract</td>
                  </tr>
                  <tr>
                    <td className="p-4 align-top">Security, abuse prevention, service maintenance</td>
                    <td className="p-4 align-top">Technical logs</td>
                    <td className="p-4 align-top">Legitimate interest (security of the service and its users)</td>
                  </tr>
                  <tr>
                    <td className="p-4 align-top">Responding to your requests and providing support</td>
                    <td className="p-4 align-top">Contact details, content of your requests</td>
                    <td className="p-4 align-top">Performance of the contract and legitimate interest</td>
                  </tr>
                  <tr>
                    <td className="p-4 align-top">Compliance with our legal obligations (subscription invoicing, accounting)</td>
                    <td className="p-4 align-top">Account and billing data of professional accounts</td>
                    <td className="p-4 align-top">Legal obligation</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="mt-4 text-sm text-[#2A3A66]">
              We do not use your data for targeted advertising and we do not sell your data to third parties.
            </p>
          </section>

          <section id="retention" className="scroll-mt-6">
            <h2 className="text-xl md:text-2xl font-extrabold text-[#0F1B3D] mb-4">
              5. Retention periods
            </h2>
            <div className="overflow-x-auto border border-[#E3E8F2] rounded-xl shadow-sm bg-white">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="bg-[#0F1B3D] text-white">
                    <th className="p-4 font-semibold border-b border-[#E3E8F2]">Data</th>
                    <th className="p-4 font-semibold border-b border-[#E3E8F2]">Retention period</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E3E8F2] text-[#2A3A66]">
                  <tr>
                    <td className="p-4 align-top">Account data</td>
                    <td className="p-4 align-top">For the lifetime of the account, then deleted within 30 days of account closure</td>
                  </tr>
                  <tr>
                    <td className="p-4 align-top">Verification codes</td>
                    <td className="p-4 align-top">Automatically deleted upon expiry, and no later than 72 hours after generation</td>
                  </tr>
                  <tr>
                    <td className="p-4 align-top">Verification history</td>
                    <td className="p-4 align-top">12 rolling months, then deleted or anonymised</td>
                  </tr>
                  <tr>
                    <td className="p-4 align-top">Professional proof document (Kbis or equivalent)</td>
                    <td className="p-4 align-top">For the lifetime of the professional account, in order to be able to evidence the validity of the verified status at any time</td>
                  </tr>
                  <tr>
                    <td className="p-4 align-top">Technical logs</td>
                    <td className="p-4 align-top">12 months maximum</td>
                  </tr>
                  <tr>
                    <td className="p-4 align-top">Billing data (professional accounts)</td>
                    <td className="p-4 align-top">10 years from the close of the financial year, in accordance with statutory accounting obligations</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="mt-4 text-sm text-[#2A3A66]">
              Certain data may be retained beyond these periods where required by law, or for the establishment, exercise or defence of legal claims, for the duration of the applicable limitation periods.
            </p>
          </section>

          <section id="recipients" className="scroll-mt-6">
            <h2 className="text-xl md:text-2xl font-extrabold text-[#0F1B3D] mb-4">
              6. Recipients and processors
            </h2>
            <p className="mb-4">
              Your data is accessible only to authorised MOTIOON personnel and to the technical service providers strictly necessary for the operation of the service, acting as processors within the meaning of the GDPR:
            </p>
            <div className="overflow-x-auto border border-[#E3E8F2] rounded-xl shadow-sm bg-white mb-6">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="bg-[#0F1B3D] text-white">
                    <th className="p-4 font-semibold border-b border-[#E3E8F2]">Provider</th>
                    <th className="p-4 font-semibold border-b border-[#E3E8F2]">Role</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E3E8F2] text-[#2A3A66]">
                  <tr>
                    <td className="p-4 align-top">Google Ireland Ltd / Google LLC — Firebase</td>
                    <td className="p-4 align-top">Account authentication, database, delivery of push notifications (FCM)</td>
                  </tr>
                  <tr>
                    <td className="p-4 align-top">Vercel Inc.</td>
                    <td className="p-4 align-top">Hosting of the web application and of safecallr.com</td>
                  </tr>
                  <tr>
                    <td className="p-4 align-top">IONOS SE</td>
                    <td className="p-4 align-top">Domain name management and related services</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="mb-3">
              Each processor is bound by contractual data protection commitments compliant with Article 28 GDPR. In addition, as part of the very operation of the service, certain information about you (name, verified status) is visible to the users with whom you establish a verification relationship — this is the purpose of the service.
            </p>
            <p>
              Your data may also be disclosed to competent authorities where we are legally required to do so.
            </p>
          </section>

          <section id="transfers" className="scroll-mt-6">
            <h2 className="text-xl md:text-2xl font-extrabold text-[#0F1B3D] mb-4">
              7. Transfers outside the European Union
            </h2>
            <p className="mb-3">
              Some of our providers (Google, Vercel) are US companies or belong to US groups. Transfers of data to the United States may therefore occur in the course of their services.
            </p>
            <p>
              These transfers are governed by the mechanisms provided for under the GDPR: the European Commission's adequacy decision on the EU–US Data Privacy Framework, to which Google and Vercel have certified, and/or the European Commission's Standard Contractual Clauses, supplemented where appropriate by additional safeguards.
            </p>
          </section>

          <section id="security" className="scroll-mt-6">
            <h2 className="text-xl md:text-2xl font-extrabold text-[#0F1B3D] mb-4">
              8. Security
            </h2>
            <p className="mb-4">
              We implement technical and organisational measures aligned with industry best practices to protect your data, including:
            </p>
            <ul className="list-disc pl-6 space-y-2 mb-4">
              <li>encryption of data in transit (TLS);</li>
              <li>storage of passwords exclusively in hashed form;</li>
              <li>single-use verification codes with automatic expiry;</li>
              <li>strict database access rules limiting each user to their own data;</li>
              <li>data minimisation: we only collect the data necessary for the service.</li>
            </ul>
            <p>
              No information system can, however, be considered infallible. In the event of a data breach likely to result in a risk to your rights and freedoms, we will notify the French supervisory authority (CNIL) and, where the risk is high, the individuals concerned, under the conditions set out in Articles 33 and 34 GDPR.
            </p>
          </section>

          <section id="rights" className="scroll-mt-6">
            <h2 className="text-xl md:text-2xl font-extrabold text-[#0F1B3D] mb-4">
              9. Your rights
            </h2>
            <p className="mb-4">
              Under the GDPR and the French Data Protection Act, you have the following rights over your personal data:
            </p>
            <ul className="list-disc pl-6 space-y-2 mb-4">
              <li><strong>Right of access:</strong> obtain a copy of the data we hold about you;</li>
              <li><strong>Right to rectification:</strong> have inaccurate or incomplete data corrected;</li>
              <li><strong>Right to erasure:</strong> request the deletion of your data, in particular by deleting your account;</li>
              <li><strong>Right to restriction:</strong> request the temporary freezing of the processing of your data;</li>
              <li><strong>Right to data portability:</strong> receive your data in a structured, commonly used format;</li>
              <li><strong>Right to object:</strong> object to processing based on our legitimate interest, on grounds relating to your particular situation;</li>
              <li><strong>Post-mortem directives:</strong> set directives regarding the fate of your data after your death, as provided under French law.</li>
            </ul>
            <p className="mb-3">
              To exercise these rights, contact us at{" "}
              <a href="mailto:contact@safecallr.com" className="text-[#0E9C5C] hover:underline font-medium">
                contact@safecallr.com
              </a>
              . We may ask for proof of identity where there is reasonable doubt as to the identity of the requester. We respond within one month, extendable by two months for complex requests.
            </p>
            <p>
              If you believe your rights are not being respected, you may lodge a complaint with the French supervisory authority, the Commission nationale de l'informatique et des libertés (CNIL):{" "}
              <a href="https://www.cnil.fr" target="_blank" rel="noopener noreferrer" className="text-[#0E9C5C] hover:underline font-medium">
                www.cnil.fr
              </a>{" "}
              — CNIL, 3 place de Fontenoy, TSA 80715, 75334 Paris Cedex 07, France — or with the supervisory authority of your country of residence.
            </p>
          </section>

          <section id="age" className="scroll-mt-6">
            <h2 className="text-xl md:text-2xl font-extrabold text-[#0F1B3D] mb-4">
              10. Minimum age
            </h2>
            <p>
              SafeCallr is restricted to persons aged <strong>18 or over</strong>. By creating an account, you confirm that you are at least 18 years old. If we become aware that an account has been created by a minor, we will delete it.
            </p>
          </section>

          <section id="cookies" className="scroll-mt-6">
            <h2 className="text-xl md:text-2xl font-extrabold text-[#0F1B3D] mb-4">
              11. Cookies
            </h2>
            <p className="mb-3">
              The SafeCallr application and website only use trackers and local storage that are strictly necessary for the operation of the service (maintaining your session, remembering your language). Such strictly necessary trackers are exempt from consent under the applicable guidelines of the CNIL.
            </p>
            <p>
              We do not use advertising cookies. Should audience measurement tools be deployed in the future, this policy will be updated and your consent will be collected where required by regulation.
            </p>
          </section>

          <section id="changes" className="scroll-mt-6">
            <h2 className="text-xl md:text-2xl font-extrabold text-[#0F1B3D] mb-4">
              12. Changes to this policy
            </h2>
            <p>
              MOTIOON may amend this policy at any time, in particular to reflect changes in the service, our practices or applicable regulations. The version in force is the one published on this page, whose last update date appears at the top. In the event of a substantial change, we will inform you by a notification in the application or by email before it takes effect.
            </p>
          </section>

          <section id="contact" className="scroll-mt-6">
            <h2 className="text-xl md:text-2xl font-extrabold text-[#0F1B3D] mb-4">
              13. Contact
            </h2>
            <p className="mb-3">For any question relating to this policy or to your personal data:</p>
            <p className="bg-white border border-[#E3E8F2] rounded-xl p-4 shadow-sm">
              <strong>MOTIOON — SafeCallr</strong><br />
              60 rue François I<sup>er</sup>, 75008 Paris, France<br />
              <a href="mailto:contact@safecallr.com" className="text-[#0E9C5C] hover:underline font-medium">
                contact@safecallr.com
              </a>
            </p>
          </section>

        </div>
      </main>

      {/* Footer */}
      <footer id="privacy-en-footer" className="border-t border-[#E3E8F2] py-8 px-6 text-center text-sm text-[#2A3A66] bg-white">
        <div className="max-w-3xl mx-auto">
          © 2026 MOTIOON SASU — SafeCallr. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
