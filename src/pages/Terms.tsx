import React from "react";
import { ArrowLeft, Globe, FileText, ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";
import AppLogo from "../components/AppLogo";

export default function Terms() {
  const scrollToId = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <div id="terms-page" className="min-h-screen bg-[#0A1128] text-[#E8ECF7] font-sans">
      {/* Header Bar */}
      <header id="terms-header" className="bg-[#0F1B3D] text-white py-14 px-6 relative overflow-hidden border-b border-[#263462]">
        <div className="absolute inset-0 bg-gradient-to-br from-[#0F1B3D] to-[#0A1128] opacity-90 z-0"></div>
        
        <div className="max-w-3xl mx-auto relative z-10">
          <div className="flex flex-wrap justify-between items-center gap-4 mb-8">
            <Link id="terms-back-home" to="/" className="inline-flex items-center gap-2 text-sm text-slate-300 hover:text-[#3DFFA0] transition-colors group">
              <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
              Back to home
            </Link>
            
            {/* Language Switcher Pills */}
            <div className="flex items-center gap-2 bg-[#131E42] border border-[#263462] px-3 py-1.5 rounded-full text-xs font-bold text-[#9FACD1]">
              <Globe size={14} className="text-[#3DFFA0]" />
              <Link to="/cgu" className="hover:text-[#3DFFA0] transition-colors">FR</Link>
              <span className="text-[#263462]">|</span>
              <span className="text-[#3DFFA0]">EN</span>
              <span className="text-[#263462]">|</span>
              <Link to="/terminos" className="hover:text-[#3DFFA0] transition-colors">ES</Link>
            </div>

            <AppLogo />
          </div>

          <h1 id="terms-main-title" className="text-3xl md:text-4xl font-extrabold tracking-tight mb-4 text-[#FFFFFF]">
            Terms of Use
          </h1>
          <p className="text-[#9FACD1] text-sm">
            Version 1.0 — <strong className="text-[#3DFFA0] font-semibold">July 2026</strong>
          </p>
        </div>
      </header>

      {/* Main Content */}
      <main id="terms-main-content" className="max-w-3xl mx-auto px-6 py-10 md:py-16">
        
        {/* Prevalence disclaimer */}
        <div id="terms-prevalence" className="bg-[#131E42] border border-[#263462] rounded-xl p-4 mb-10 text-sm text-[#9FACD1] leading-relaxed italic">
          Translation provided for information purposes. In the event of any discrepancy, the{" "}
          <Link to="/cgu" className="text-[#3DFFA0] hover:underline font-semibold">
            French version
          </Link>{" "}
          shall prevail.
        </div>

        {/* Table of Contents */}
        <nav id="terms-toc" className="bg-[#131E42] border border-[#263462] rounded-xl p-6 mb-12 shadow-sm">
          <h2 className="text-xs uppercase tracking-widest font-bold text-[#3DFFA0] mb-4 flex items-center gap-2">
            <FileText size={16} /> Summary
          </h2>
          <ol className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2 text-xs md:text-sm">
            <li><a href="#art1" onClick={(e) => scrollToId(e, "art1")} className="text-[#E8ECF7] hover:text-[#3DFFA0] hover:underline transition-colors block py-0.5">Article 1 — Service publisher</a></li>
            <li><a href="#art2" onClick={(e) => scrollToId(e, "art2")} className="text-[#E8ECF7] hover:text-[#3DFFA0] hover:underline transition-colors block py-0.5">Article 2 — Purpose</a></li>
            <li><a href="#art3" onClick={(e) => scrollToId(e, "art3")} className="text-[#E8ECF7] hover:text-[#3DFFA0] hover:underline transition-colors block py-0.5">Article 3 — Definitions</a></li>
            <li><a href="#art4" onClick={(e) => scrollToId(e, "art4")} className="text-[#E8ECF7] hover:text-[#3DFFA0] hover:underline transition-colors block py-0.5">Article 4 — Description of Service</a></li>
            <li><a href="#art5" onClick={(e) => scrollToId(e, "art5")} className="text-[#E8ECF7] hover:text-[#3DFFA0] hover:underline transition-colors block py-0.5">Article 5 — Acceptance and amendments</a></li>
            <li><a href="#art6" onClick={(e) => scrollToId(e, "art6")} className="text-[#E8ECF7] hover:text-[#3DFFA0] hover:underline transition-colors block py-0.5">Article 6 — Registration and account</a></li>
            <li><a href="#art7" onClick={(e) => scrollToId(e, "art7")} className="text-[#E8ECF7] hover:text-[#3DFFA0] hover:underline transition-colors block py-0.5">Article 7 — Professional status verification</a></li>
            <li><a href="#art8" onClick={(e) => scrollToId(e, "art8")} className="text-[#E8ECF7] hover:text-[#3DFFA0] hover:underline transition-colors block py-0.5">Article 8 — User obligations</a></li>
            <li><a href="#art9" onClick={(e) => scrollToId(e, "art9")} className="text-[#E8ECF7] hover:text-[#3DFFA0] hover:underline transition-colors block py-0.5">Article 9 — Financial terms</a></li>
            <li><a href="#art10" onClick={(e) => scrollToId(e, "art10")} className="text-[#E8ECF7] hover:text-[#3DFFA0] hover:underline transition-colors block py-0.5">Article 10 — Availability and evolution</a></li>
            <li><a href="#art11" onClick={(e) => scrollToId(e, "art11")} className="text-[#E8ECF7] hover:text-[#3DFFA0] hover:underline transition-colors block py-0.5">Article 11 — Liability</a></li>
            <li><a href="#art12" onClick={(e) => scrollToId(e, "art12")} className="text-[#E8ECF7] hover:text-[#3DFFA0] hover:underline transition-colors block py-0.5">Article 12 — Intellectual property</a></li>
            <li><a href="#art13" onClick={(e) => scrollToId(e, "art13")} className="text-[#E8ECF7] hover:text-[#3DFFA0] hover:underline transition-colors block py-0.5">Article 13 — Personal data</a></li>
            <li><a href="#art14" onClick={(e) => scrollToId(e, "art14")} className="text-[#E8ECF7] hover:text-[#3DFFA0] hover:underline transition-colors block py-0.5">Article 14 — Duration and termination</a></li>
            <li><a href="#art15" onClick={(e) => scrollToId(e, "art15")} className="text-[#E8ECF7] hover:text-[#3DFFA0] hover:underline transition-colors block py-0.5">Article 15 — Consumer mediation</a></li>
            <li><a href="#art16" onClick={(e) => scrollToId(e, "art16")} className="text-[#E8ECF7] hover:text-[#3DFFA0] hover:underline transition-colors block py-0.5">Article 16 — General provisions</a></li>
          </ol>
        </nav>

        {/* Article 1 */}
        <section id="art1" className="mb-10">
          <h2 className="text-xl md:text-2xl font-extrabold mb-4 text-[#FFFFFF] pt-2 border-b border-[#263462] pb-2">
            Article 1 — Service publisher
          </h2>
          <p className="text-[#9FACD1] mb-4 leading-relaxed text-justify">
            The SafeCallr service (the “Service”), available at <a href="https://safecallr.com" target="_blank" rel="noopener noreferrer" className="text-[#3DFFA0] hover:underline">https://safecallr.com</a> and through the SafeCallr mobile applications on the App Store and Google Play, is published by:
          </p>
          <div className="bg-[#131E42] border border-[#263462] rounded-xl p-5 mb-4 shadow-sm">
            <p className="text-[#E8ECF7] leading-relaxed">
              <strong className="text-white">Motioon</strong>, a French single-shareholder simplified joint-stock company (SASU) with a share capital of EUR 1,000, registered with the Trade and Companies Register under SIRET number 930 280 086 00015, having its registered office at 60 rue François Ier, 75008 Paris, France (“Motioon” or the “Publisher”).<br />
              Publication director: Mr Rémi Prével, President.<br />
              Contact: <a href="mailto:contact@safecallr.com" className="text-[#3DFFA0] hover:underline font-medium">contact@safecallr.com</a>
            </p>
          </div>
        </section>

        {/* Article 2 */}
        <section id="art2" className="mb-10">
          <h2 className="text-xl md:text-2xl font-extrabold mb-4 text-[#FFFFFF] pt-2 border-b border-[#263462] pb-2">
            Article 2 — Purpose
          </h2>
          <p className="text-[#9FACD1] mb-4 leading-relaxed text-justify">
            These Terms of Use (the “Terms”) set out the conditions under which users (the “Users”) access and use the Service.
          </p>
          <p className="text-[#9FACD1] leading-relaxed text-justify">
            Registering for and using the Service implies full and unreserved acceptance of these Terms. Users who do not accept the Terms must refrain from using the Service.
          </p>
        </section>

        {/* Article 3 */}
        <section id="art3" className="mb-10">
          <h2 className="text-xl md:text-2xl font-extrabold mb-4 text-[#FFFFFF] pt-2 border-b border-[#263462] pb-2">
            Article 3 — Definitions
          </h2>
          <ul className="list-disc list-inside space-y-3 text-[#9FACD1] leading-relaxed text-justify">
            <li><strong className="text-white">“Service”:</strong> the SafeCallr phone identity verification platform, in its web and mobile versions.</li>
            <li><strong className="text-white">“Individual User”:</strong> any natural person using the Service for personal, non-professional purposes.</li>
            <li><strong className="text-white">“Professional User”:</strong> any natural or legal person using the Service in the course of their professional activity, after verification of their status in accordance with Article 7.</li>
            <li><strong className="text-white">“Organisation”:</strong> any legal entity with a SafeCallr Business workspace enabling verification between colleagues.</li>
            <li><strong className="text-white">“Verification Code”:</strong> a single-use numeric code with a limited validity period, generated by the Service as part of a Verification Request.</li>
            <li><strong className="text-white">“Verification Request”:</strong> a request sent by one User to another User to confirm the caller's identity during a phone call or video call.</li>
          </ul>
        </section>

        {/* Article 4 */}
        <section id="art4" className="mb-10">
          <h2 className="text-xl md:text-2xl font-extrabold mb-4 text-[#FFFFFF] pt-2 border-b border-[#263462] pb-2">
            Article 4 — Description of the Service
          </h2>
          <p className="text-[#9FACD1] mb-4 leading-relaxed text-justify">
            SafeCallr is a tool designed to assist in verifying the identity of a person during a phone call or video call. It works as follows: the caller triggers a Verification Request from their interface; the recipient receives a notification in their application; a single-use Verification Code is generated; the caller communicates this code orally to the recipient, who enters it in their application to confirm the match.
          </p>
          <p className="text-[#9FACD1] mb-4 leading-relaxed text-justify">
            The Verification Code is never sent to the recipient by notification, SMS or any other written channel: its oral communication by the caller is the core of the verification mechanism.
          </p>
          <p className="text-[#9FACD1] mb-2 leading-relaxed font-semibold text-white">The Service comprises three modules:</p>
          <ul className="list-disc list-inside space-y-2 text-[#9FACD1] mb-4 leading-relaxed text-justify pl-2">
            <li><strong className="text-white">SafeCallr P2P:</strong> mutual verification between individuals, provided free of charge;</li>
            <li><strong className="text-white">SafeCallr Pro:</strong> verification of a professional's identity vis-à-vis their clients, provided on a subscription basis;</li>
            <li><strong className="text-white">SafeCallr Business:</strong> internal verification between colleagues within the same Organisation.</li>
          </ul>
          <p className="text-[#9FACD1] mb-4 leading-relaxed text-justify">
            The Service does not collect or process any biometric data: no voice or facial recognition is used. Verification relies exclusively on ephemeral single-use codes.
          </p>
          <p className="text-[#9FACD1] leading-relaxed text-justify">
            The Service is provided as a first version (minimum viable product). The Publisher does not claim any security certification at this stage and does not present the Service as a certified system.
          </p>
        </section>

        {/* Article 5 */}
        <section id="art5" className="mb-10">
          <h2 className="text-xl md:text-2xl font-extrabold mb-4 text-[#FFFFFF] pt-2 border-b border-[#263462] pb-2">
            Article 5 — Acceptance and amendment of the Terms
          </h2>
          <p className="text-[#9FACD1] mb-4 leading-relaxed text-justify">
            The Terms are accepted upon account creation, via a checkbox referring to these Terms. The applicable Terms are those in force on the date the Service is used.
          </p>
          <p className="text-[#9FACD1] leading-relaxed text-justify">
            The Publisher reserves the right to amend the Terms at any time and at its sole discretion, in particular to reflect changes to the Service, its offering or applicable regulations. Users will be informed of any substantial amendment by any appropriate means (in-app notification or email) with reasonable notice. Continued use of the Service after the amended Terms take effect constitutes acceptance thereof.
          </p>
        </section>

        {/* Article 6 */}
        <section id="art6" className="mb-10">
          <h2 className="text-xl md:text-2xl font-extrabold mb-4 text-[#FFFFFF] pt-2 border-b border-[#263462] pb-2">
            Article 6 — Registration and account
          </h2>
          <p className="text-[#9FACD1] mb-4 leading-relaxed text-justify">
            Registration is reserved for natural persons of legal age with legal capacity.
          </p>
          <p className="text-[#9FACD1] mb-4 leading-relaxed text-justify">
            Users undertake to provide accurate, complete and up-to-date information upon registration and to keep it up to date throughout their use of the Service. Creating an account under a false identity or on behalf of a third party without authorisation is prohibited.
          </p>
          <p className="text-[#9FACD1] mb-4 leading-relaxed text-justify">
            Login credentials are strictly personal and confidential. Users are responsible for keeping them confidential and for all activity carried out from their account. They undertake to inform the Publisher without delay of any unauthorised use of their account.
          </p>
          <p className="text-[#9FACD1] leading-relaxed text-justify">
            Use of the Service requires a compatible device, an Internet connection and activation of the application's notifications. Connection and equipment costs remain at the User's expense.
          </p>
        </section>

        {/* Article 7 */}
        <section id="art7" className="mb-10">
          <h2 className="text-xl md:text-2xl font-extrabold mb-4 text-[#FFFFFF] pt-2 border-b border-[#263462] pb-2">
            Article 7 — Verification of Professional User status
          </h2>
          <p className="text-[#9FACD1] mb-4 leading-relaxed text-justify">
            Access to SafeCallr Pro features is subject to prior verification of the applicant's professional status by the Publisher, on the basis of supporting documents (in particular registration extracts and evidence of registration with professional orders, chambers or regulated registers). The Publisher reserves the right to refuse or withdraw Professional User status from any applicant who does not satisfy these checks or whose supporting documents prove to be inaccurate.
          </p>
          <p className="text-[#9FACD1] leading-relaxed text-justify">
            Verification of professional status does not constitute an endorsement or a guarantee of the probity of the Professional User concerned, nor a guarantee of the quality of the services they otherwise provide to their clients.
          </p>
        </section>

        {/* Article 8 */}
        <section id="art8" className="mb-10">
          <h2 className="text-xl md:text-2xl font-extrabold mb-4 text-[#FFFFFF] pt-2 border-b border-[#263462] pb-2">
            Article 8 — User obligations and prohibited uses
          </h2>
          <p className="text-[#9FACD1] mb-4 leading-relaxed text-justify">
            Users undertake to use the Service in accordance with its purpose, these Terms and applicable regulations. The following are prohibited, without this list being exhaustive:
          </p>
          <ul className="list-disc list-inside space-y-2 text-[#9FACD1] mb-4 leading-relaxed text-justify pl-2">
            <li>any use of the Service for identity theft, fraud, abusive canvassing or harassment;</li>
            <li>communicating a Verification Code through a written channel (SMS, messaging, email) or disclosing it to a third party;</li>
            <li>any attempt to circumvent, alter or penetration-test the Service's security measures without the Publisher's prior written authorisation;</li>
            <li>any automated extraction, reproduction or use of Service data (scraping), and any deliberate overloading of the infrastructure;</li>
            <li>reselling, sublicensing or making the Service available to third parties outside the cases expressly provided for;</li>
            <li>using the Service to transmit unlawful or defamatory content or content infringing third-party rights.</li>
          </ul>
          <p className="text-[#9FACD1] leading-relaxed text-justify">
            Any breach of these obligations may result in suspension or termination of the account under Article 14, without prejudice to any action the Publisher may take.
          </p>
        </section>

        {/* Article 9 */}
        <section id="art9" className="mb-10">
          <h2 className="text-xl md:text-2xl font-extrabold mb-4 text-[#FFFFFF] pt-2 border-b border-[#263462] pb-2">
            Article 9 — Financial terms
          </h2>
          <p className="text-[#9FACD1] mb-4 leading-relaxed text-justify">
            The SafeCallr P2P module is provided free of charge to Individual Users. The Publisher reserves the right to change its offering, subject to prior notice to Users.
          </p>
          <p className="text-[#9FACD1] leading-relaxed text-justify">
            The SafeCallr Pro and SafeCallr Business modules are offered on a subscription basis, according to the prices and terms communicated before subscription. The specific conditions applicable to professional subscriptions (duration, invoicing, renewal, termination) are specified at the time of subscription and, where applicable, in separate terms of sale.
          </p>
        </section>

        {/* Article 10 */}
        <section id="art10" className="mb-10">
          <h2 className="text-xl md:text-2xl font-extrabold mb-4 text-[#FFFFFF] pt-2 border-b border-[#263462] pb-2">
            Article 10 — Availability and evolution of the Service
          </h2>
          <p className="text-[#9FACD1] mb-4 leading-relaxed text-justify">
            The Publisher endeavours to keep the Service accessible 24/7. It is however bound by a best-efforts obligation: access to the Service may be interrupted, suspended or limited, in particular for maintenance, updates, outages, force majeure or acts of third parties (operators, hosting providers, notification service providers).
          </p>
          <p className="text-[#9FACD1] mb-4 leading-relaxed text-justify">
            Delivery of notifications also depends on factors beyond the Publisher's control: the User's device settings, permissions granted to the application, connectivity, and the operating systems' notification services. The Publisher does not guarantee receipt of every notification in all circumstances.
          </p>
          <p className="text-[#9FACD1] leading-relaxed text-justify">
            As the Service is under active development, the Publisher may change, replace or remove features. Substantial changes affecting paid services will be notified in advance.
          </p>
        </section>

        {/* Article 11 */}
        <section id="art11" className="mb-10">
          <h2 className="text-xl md:text-2xl font-extrabold mb-4 text-[#FFFFFF] pt-2 border-b border-[#263462] pb-2">
            Article 11 — Liability
          </h2>
          <p className="text-[#9FACD1] mb-4 leading-relaxed text-justify">
            SafeCallr is a decision-support tool. The Service verifies that a person has real-time access to a specific SafeCallr account and, for Professional Users, that this account has undergone the status verification described in Article 7. The Service does not, however, guarantee the absence of any fraud, the probity of the other party, or the truthfulness of statements made during the exchange.
          </p>
          <p className="text-[#9FACD1] mb-4 leading-relaxed text-justify">
            The decision to proceed with an exchange, to disclose information or to carry out a transaction (in particular a payment or transfer) is the sole responsibility of the User. The Publisher recommends never disclosing bank details, passwords or security codes during a call, even a verified one.
          </p>
          <p className="text-[#9FACD1] mb-4 leading-relaxed text-justify">
            The Publisher shall not be liable, in particular: in the event of use of the Service in breach of the Terms; where a Verification Code is disclosed by a User; where the User's device or credentials are compromised; for content and statements exchanged between Users; or for indirect damages such as loss of opportunity, loss of data or commercial harm.
          </p>
          <p className="text-[#9FACD1] mb-4 leading-relaxed text-justify">
            For Professional Users, and to the extent permitted by law, the Publisher's total liability, all causes combined, is limited to the amounts actually paid by the Professional User during the twelve months preceding the event giving rise to liability.
          </p>
          <p className="text-[#9FACD1] leading-relaxed text-justify">
            Nothing in these Terms excludes or limits the Publisher's liability in the event of wilful misconduct, gross negligence, personal injury, or in any other case where such exclusion is prohibited by law. With respect to consumers, the limitations in this Article apply only to the extent permitted by the French Consumer Code.
          </p>
        </section>

        {/* Article 12 */}
        <section id="art12" className="mb-10">
          <h2 className="text-xl md:text-2xl font-extrabold mb-4 text-[#FFFFFF] pt-2 border-b border-[#263462] pb-2">
            Article 12 — Intellectual property
          </h2>
          <p className="text-[#9FACD1] mb-4 leading-relaxed text-justify">
            The Service, its structure, interfaces, software, visual identity, texts, the “SafeCallr” name and associated logos are protected by intellectual property law and remain the exclusive property of Motioon or its licensors. An e-Soleau envelope has also been filed with the French INPI as proof of prior art.
          </p>
          <p className="text-[#9FACD1] leading-relaxed text-justify">
            Registration grants the User a personal, non-exclusive, non-assignable and non-transferable right to use the Service for the duration of their registration and in accordance with its purpose. Any reproduction, representation, adaptation or exploitation not expressly authorised is prohibited.
          </p>
        </section>

        {/* Article 13 */}
        <section id="art13" className="mb-10">
          <h2 className="text-xl md:text-2xl font-extrabold mb-4 text-[#FFFFFF] pt-2 border-b border-[#263462] pb-2">
            Article 13 — Personal data
          </h2>
          <p className="text-[#9FACD1] mb-4 leading-relaxed text-justify">
            The processing of personal data carried out in connection with the Service is described in the{" "}
            <Link to="/privacy" className="text-[#3DFFA0] hover:underline font-semibold">
              Privacy Policy
            </Link>
            , available at <a href="https://safecallr.com/confidentialite" className="text-[#3DFFA0] hover:underline">https://safecallr.com/confidentialite</a>, which forms an integral part of the contractual framework. Users are invited to read it before registering.
          </p>
          <p className="text-[#9FACD1] leading-relaxed text-justify">
            For any question or to exercise their rights, Users may write to: <a href="mailto:contact@safecallr.com" className="text-[#3DFFA0] hover:underline font-medium">contact@safecallr.com</a>.
          </p>
        </section>

        {/* Article 14 */}
        <section id="art14" className="mb-10">
          <h2 className="text-xl md:text-2xl font-extrabold mb-4 text-[#FFFFFF] pt-2 border-b border-[#263462] pb-2">
            Article 14 — Duration, suspension and termination
          </h2>
          <p className="text-[#9FACD1] mb-4 leading-relaxed text-justify">
            The Terms apply for the entire duration of use of the Service.
          </p>
          <p className="text-[#9FACD1] mb-4 leading-relaxed text-justify">
            Users may stop using the Service and request deletion of their account at any time, from the application or by writing to <a href="mailto:contact@safecallr.com" className="text-[#3DFFA0] hover:underline font-medium">contact@safecallr.com</a>. Deleting the account deactivates the verification features associated with it.
          </p>
          <p className="text-[#9FACD1] mb-4 leading-relaxed text-justify">
            The Publisher may suspend, with immediate effect, a User's access to the Service in the event of a serious or repeated breach of these Terms, serious suspicion of fraud or impersonation, a threat to the security of the Service, or upon injunction from a competent authority. Except in cases of urgency or impossibility, the User will be informed of the grounds and given the opportunity to submit observations. The account may be terminated if the breach is not remedied or where the breach makes it impossible to maintain the contractual relationship.
          </p>
          <p className="text-[#9FACD1] leading-relaxed text-justify">
            The Publisher may also cease to provide all or part of the Service, subject to reasonable notice to Users and, for paid services, a pro-rata refund of amounts paid for the unperformed period.
          </p>
        </section>

        {/* Article 15 */}
        <section id="art15" className="mb-10">
          <h2 className="text-xl md:text-2xl font-extrabold mb-4 text-[#FFFFFF] pt-2 border-b border-[#263462] pb-2">
            Article 15 — Consumer mediation and disputes
          </h2>
          <p className="text-[#9FACD1] mb-4 leading-relaxed text-justify">
            In accordance with Articles L. 612-1 et seq. of the French Consumer Code, consumer Users may have free recourse to a consumer mediator with a view to the amicable resolution of any dispute with the Publisher. The designated mediator is:
          </p>
          <div className="bg-[#131E42] border border-[#263462] rounded-xl p-5 mb-4 shadow-sm">
            <p className="text-[#E8ECF7] leading-relaxed">
              <strong className="text-white">CM2C — Centre de la Médiation de la Consommation de Conciliateurs de justice</strong><br />
              49 rue de Ponthieu, 75008 Paris, France<br />
              Website: <a href="https://www.cm2c.net" target="_blank" rel="noopener noreferrer" className="text-[#3DFFA0] hover:underline inline-flex items-center gap-1">www.cm2c.net <ExternalLink size={12} /></a><br />
              <span className="text-xs text-[#9FACD1] italic">(the Publisher's membership registration is in progress)</span>
            </p>
          </div>
          <p className="text-[#9FACD1] leading-relaxed text-justify">
            Users may also use the European online dispute resolution platform:{" "}
            <a href="https://ec.europa.eu/consumers/odr" target="_blank" rel="noopener noreferrer" className="text-[#3DFFA0] hover:underline inline-flex items-center gap-1">
              https://ec.europa.eu/consumers/odr <ExternalLink size={12} />
            </a>.
          </p>
        </section>

        {/* Article 16 */}
        <section id="art16" className="mb-10">
          <h2 className="text-xl md:text-2xl font-extrabold mb-4 text-[#FFFFFF] pt-2 border-b border-[#263462] pb-2">
            Article 16 — General provisions
          </h2>
          <p className="text-[#9FACD1] mb-4 leading-relaxed text-justify">
            If any provision of the Terms is held to be void or unenforceable, the remaining provisions shall remain in full force. The Publisher's failure to enforce a breach shall not constitute a waiver of its right to do so subsequently.
          </p>
          <p className="text-[#9FACD1] mb-4 leading-relaxed text-justify">
            The Terms are drawn up in French and may be translated into other languages for information purposes. In the event of any discrepancy, the French version shall prevail.
          </p>
          <p className="text-[#9FACD1] leading-relaxed text-justify">
            The Terms are governed by French law. Any dispute relating to their interpretation or performance shall, failing amicable resolution, fall within the jurisdiction of the competent French courts. With respect to Professional Users, exclusive jurisdiction is granted to the Paris Commercial Court (Tribunal de commerce de Paris), notwithstanding multiple defendants or third-party claims.
          </p>
        </section>

        {/* Footer Navigation */}
        <div className="pt-8 border-t border-[#263462] flex flex-wrap justify-between items-center gap-4 text-xs font-bold uppercase tracking-wider text-[#9FACD1]">
          <Link to="/privacy" className="hover:text-[#3DFFA0] transition-colors">Privacy Policy</Link>
          <Link to="/legal-notice" className="hover:text-[#3DFFA0] transition-colors">Legal Notice</Link>
        </div>
      </main>
    </div>
  );
}
