import React from "react";
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import AppLogo from "../components/AppLogo";

export default function LegalNotice() {
  return (
    <div id="legal-notice-page" className="min-h-screen bg-[#0A1128] text-[#E8ECF7] font-sans">
      {/* Header Bar */}
      <header id="legal-notice-header" className="bg-[#0F1B3D] text-white py-14 px-6 relative overflow-hidden border-b border-[#263462]">
        <div className="absolute inset-0 bg-gradient-to-br from-[#0F1B3D] to-[#0A1128] opacity-90 z-0"></div>
        
        <div className="max-w-3xl mx-auto relative z-10">
          <div className="flex justify-between items-center mb-8">
            <Link id="legal-notice-back-home" to="/" className="inline-flex items-center gap-2 text-sm text-slate-300 hover:text-[#3DFFA0] transition-colors group">
              <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
              Back to home
            </Link>
            
            <AppLogo />
          </div>

          <h1 id="legal-notice-main-title" className="text-3xl md:text-4xl font-extrabold tracking-tight mb-4 text-[#FFFFFF]">
            Legal Notice
          </h1>
          <p className="text-[#9FACD1] text-sm">
            Last updated: <strong className="text-[#3DFFA0] font-semibold">July 18, 2026</strong>
          </p>
        </div>
      </header>

      {/* Main Content */}
      <main id="legal-notice-main-content" className="max-w-3xl mx-auto px-6 py-10 md:py-16">
        
        {/* Prevalence disclaimer */}
        <div id="legal-notice-prevalence" className="bg-[#131E42] border border-[#263462] rounded-xl p-4 mb-10 text-sm text-[#9FACD1] leading-relaxed">
          This English version is provided for convenience. In the event of any discrepancy, the{" "}
          <Link to="/mentions-legales" className="text-[#3DFFA0] hover:underline font-semibold">
            French version
          </Link>{" "}
          shall prevail.
        </div>

        {/* Section 1 */}
        <section id="publisher" className="mb-10">
          <h2 className="text-xl md:text-2xl font-extrabold mb-4 text-[#FFFFFF] pt-2">
            1. Website publisher
          </h2>
          <p className="text-[#9FACD1] mb-4 leading-relaxed">
            The website safecallr.com and the SafeCallr application are published by:
          </p>
          <div className="bg-[#131E42] border border-[#263462] rounded-xl p-5 mb-4 shadow-sm">
            <p className="text-[#E8ECF7] leading-relaxed">
              <strong className="text-white">MOTIOON</strong>, a French simplified joint-stock company (SASU) with a share capital of <strong className="text-white">[CAPITAL SOCIAL] €</strong><br />
              Registered office: 60 rue François I<sup>er</sup>, 75008 Paris, France<br />
              Registered with the Paris Trade and Companies Register (RCS) under number 930 280 086<br />
              EU VAT number: FR17 930 280 086<br />
              Email: <a href="mailto:contact@safecallr.com" className="text-[#3DFFA0] hover:underline">contact@safecallr.com</a>
            </p>
          </div>
          <p className="text-[#9FACD1] leading-relaxed">
            <strong className="text-white font-semibold">Publication director:</strong> Rémi Prével, President of MOTIOON.
          </p>
        </section>

        {/* Section 2 */}
        <section id="hosting" className="mb-10">
          <h2 className="text-xl md:text-2xl font-extrabold mb-4 text-[#FFFFFF] pt-2">
            2. Hosting
          </h2>
          <p className="text-[#9FACD1] mb-4 leading-relaxed">
            The website and web application are hosted by:
          </p>
          <div className="bg-[#131E42] border border-[#263462] rounded-xl p-5 mb-4 shadow-sm">
            <p className="text-[#E8ECF7] leading-relaxed">
              <strong className="text-white">Vercel Inc.</strong><br />
              440 N Barranca Ave #4133, Covina, CA 91723, United States<br />
              Website: <a href="https://vercel.com" target="_blank" rel="noopener noreferrer" className="text-[#3DFFA0] hover:underline">vercel.com</a>
            </p>
          </div>
          <p className="text-[#9FACD1] leading-relaxed">
            Certain service data is hosted and processed through Google's Firebase services (Google Ireland Ltd, Gordon House, Barrow Street, Dublin 4, Ireland). The domain name is managed by IONOS SE (Elgendorfer Str. 57, 56410 Montabaur, Germany).
          </p>
        </section>

        {/* Section 3 */}
        <section id="ip" className="mb-10">
          <h2 className="text-xl md:text-2xl font-extrabold mb-4 text-[#FFFFFF] pt-2">
            3. Intellectual property
          </h2>
          <p className="text-[#9FACD1] mb-4 leading-relaxed">
            All elements composing the safecallr.com website and the SafeCallr application (texts, graphics, logos, interfaces, software, structure, database) are the exclusive property of MOTIOON or are used under licence. Any reproduction, representation, modification, adaptation or exploitation, in whole or in part, without the prior written authorisation of MOTIOON is prohibited and constitutes infringement within the meaning of Articles L.335-2 et seq. of the French Intellectual Property Code.
          </p>
          <p className="text-[#9FACD1] leading-relaxed">
            The "SafeCallr" name and trademark and the associated logos may not be used without the prior written authorisation of MOTIOON.
          </p>
        </section>

        {/* Section 4 */}
        <section id="data" className="mb-10">
          <h2 className="text-xl md:text-2xl font-extrabold mb-4 text-[#FFFFFF] pt-2">
            4. Personal data
          </h2>
          <p className="text-[#9FACD1] leading-relaxed">
            The processing of personal data collected through the website and the application is described in our{" "}
            <Link to="/privacy" className="text-[#3DFFA0] hover:underline">
              Privacy Policy
            </Link>
            , which details the data collected, its purposes, retention periods and your rights.
          </p>
        </section>

        {/* Section 5 */}
        <section id="liability" className="mb-10">
          <h2 className="text-xl md:text-2xl font-extrabold mb-4 text-[#FFFFFF] pt-2">
            5. Liability
          </h2>
          <p className="text-[#9FACD1] mb-4 leading-relaxed">
            MOTIOON strives to ensure the accuracy and currency of the information published on this website, the content of which it may modify at any time and without notice. However, MOTIOON cannot guarantee the accuracy, completeness or currency of all the information made available.
          </p>
          <p className="text-[#9FACD1] leading-relaxed">
            Hyperlinks on the website may point to third-party sites over which MOTIOON exercises no control; MOTIOON declines all responsibility for their content.
          </p>
        </section>

        {/* Section 6 */}
        <section id="law" className="mb-10">
          <h2 className="text-xl md:text-2xl font-extrabold mb-4 text-[#FFFFFF] pt-2">
            6. Applicable law
          </h2>
          <p className="text-[#9FACD1] leading-relaxed">
            This legal notice is governed by French law. Any dispute relating to the safecallr.com website shall, in the absence of amicable resolution, be submitted to the competent French courts.
          </p>
        </section>

        {/* Section 7 */}
        <section id="contact" className="mb-10">
          <h2 className="text-xl md:text-2xl font-extrabold mb-4 text-[#FFFFFF] pt-2">
            7. Contact
          </h2>
          <p className="text-[#9FACD1] mb-4 leading-relaxed">
            For any question relating to the website or the service:
          </p>
          <p className="text-[#E8ECF7] leading-relaxed">
            <strong className="text-white">MOTIOON — SafeCallr</strong><br />
            60 rue François I<sup>er</sup>, 75008 Paris, France<br />
            <a href="mailto:contact@safecallr.com" className="text-[#3DFFA0] hover:underline">contact@safecallr.com</a>
          </p>
        </section>

      </main>

      {/* Footer */}
      <footer className="border-t border-[#263462] py-8 px-6 text-center text-sm text-[#9FACD1]">
        © 2026 MOTIOON — SafeCallr. All rights reserved.
      </footer>
    </div>
  );
}
