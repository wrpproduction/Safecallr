import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { 
  Globe, 
  FileText, 
  ShieldCheck, 
  Building2, 
  UserCheck, 
  HelpCircle, 
  Newspaper, 
  Mail, 
  Lock, 
  ExternalLink, 
  Download,
  ArrowRight,
  Home,
  CheckCircle2,
  List
} from "lucide-react";
import AppLogo from "../components/AppLogo";
import SEOManager from "../components/seo/SEOManager";
import { useLanguage } from "../contexts/LanguageContext";
import { db, collection, query, where, getDocs } from "../firebase";
import { DEFAULT_BLOG_ARTICLES } from "../data/defaultArticles";

interface BlogArticle {
  id: string;
  title: string;
  slug?: string;
  metaTitle?: string;
  category?: string;
  createdAt?: any;
}

export default function SitemapPage() {
  const { language, t } = useLanguage();
  const [articles, setArticles] = useState<BlogArticle[]>([]);
  const [loadingBlog, setLoadingBlog] = useState(true);

  useEffect(() => {
    async function fetchBlogArticles() {
      try {
        const q = query(collection(db, "articles"), where("published", "==", true));
        const snapshot = await getDocs(q);
        const fetched: BlogArticle[] = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          fetched.push({
            id: doc.id,
            title: data.title || "Article sans titre",
            slug: data.slug,
            metaTitle: data.metaTitle,
            category: data.category,
            createdAt: data.createdAt
          });
        });

        const merged = [...fetched];
        for (const defArt of DEFAULT_BLOG_ARTICLES) {
          if (!merged.some(a => a.slug === defArt.slug || a.metaTitle === defArt.metaTitle || a.id === defArt.id)) {
            merged.push(defArt);
          }
        }
        setArticles(merged);
      } catch (err) {
        console.error("Error fetching blog for sitemap:", err);
        setArticles(DEFAULT_BLOG_ARTICLES);
      } finally {
        setLoadingBlog(false);
      }
    }
    fetchBlogArticles();
  }, []);

  const getTitle = () => {
    if (language === "en") return "Site Map - SafeCallr";
    if (language === "es") return "Mapa del Sitio - SafeCallr";
    return "Plan du Site - SafeCallr";
  };

  const getSubtitle = () => {
    if (language === "en") return "Complete overview of all pages and blog articles available on SafeCallr.";
    if (language === "es") return "Visión general completa de todas las páginas y artículos disponibles en SafeCallr.";
    return "Vue d'ensemble de toutes les pages et articles de blog disponibles sur SafeCallr.";
  };

  const mainPages = [
    { title: language === "en" ? "Home" : language === "es" ? "Inicio" : "Accueil", path: "/", icon: Home, desc: "Page d'accueil de SafeCallr" },
    { title: language === "en" ? "Individuals" : language === "es" ? "Particulares" : "Particuliers", path: "/particuliers", icon: UserCheck, desc: "Protection gratuite contre les appels frauduleux" },
    { title: language === "en" ? "Professionals" : language === "es" ? "Profesionales" : "Professionnels", path: "/professionnels", icon: ShieldCheck, desc: "Rassurez vos clients lors de vos appels sortants" },
    { title: language === "en" ? "Enterprises" : language === "es" ? "Empresas" : "Entreprises", path: "/entreprises", icon: Building2, desc: "Solutions de vérification pour grands comptes" },
    { title: language === "en" ? "Institutions" : language === "es" ? "Instituciones" : "Institutions", path: "/institutions", icon: Building2, desc: "Protection et confiance pour organismes publics" },
    { title: language === "en" ? "How it Works" : language === "es" ? "Cómo funciona" : "Comment ça marche ?", path: "/how-it-works", icon: HelpCircle, desc: "Fonctionnement du protocole d'authentification SafeCallr" },
    { title: language === "en" ? "News & Blog" : language === "es" ? "Noticias y Blog" : "Actualités & Blog", path: "/actualite", icon: Newspaper, desc: "Articles, guides de sécurité et actualités de la fraude" },
    { title: language === "en" ? "Contact" : language === "es" ? "Contacto" : "Contact Entreprises", path: "/company-contact", icon: Mail, desc: "Prendre contact avec l'équipe commerciale" },
  ];

  const legalPages = [
    { label: "CGU (Français)", path: "/cgu" },
    { label: "Terms of Use (English)", path: "/terms" },
    { label: "Condiciones de Uso (Español)", path: "/terminos" },
    { label: "Politique de Confidentialité (Français)", path: "/confidentialite" },
    { label: "Privacy Policy (English)", path: "/privacy" },
    { label: "Política de Privacidad (Español)", path: "/privacidad" },
    { label: "Mentions Légales (Français)", path: "/mentions-legales" },
    { label: "Legal Notice (English)", path: "/legal-notice" },
    { label: "Aviso Legal (Español)", path: "/aviso-legal" },
  ];

  const portalPages = [
    { title: "Connexion / Inscription Particulier", path: "/auth" },
    { title: "Espace Professionnel (Pro Login)", path: "/pro/login" },
    { title: "Inscription Professionnelle", path: "/pro/register" },
    { title: "Portail Administration", path: "/admin/login" },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans selection:bg-emerald-500 selection:text-slate-950">
      <SEOManager 
        title={getTitle()} 
        description={getSubtitle()} 
      />

      {/* Header */}
      <header className="border-b border-white/5 bg-slate-900/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <AppLogo />
          <Link 
            to="/" 
            className="text-xs font-bold uppercase tracking-widest text-slate-400 hover:text-emerald-400 transition-colors flex items-center gap-2"
          >
            ← {language === "en" ? "Back to Home" : language === "es" ? "Volver al Inicio" : "Retour à l'accueil"}
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold uppercase tracking-wider">
            <List size={14} /> Plan du site (HTML Sitemap)
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight">
            {getTitle()}
          </h1>
          <p className="text-slate-400 text-sm md:text-base leading-relaxed">
            {getSubtitle()}
          </p>
        </div>

        {/* XML Box for Google Search Console */}
        <div className="mt-12 bg-gradient-to-br from-emerald-950/40 via-slate-900 to-slate-900 border border-emerald-500/30 rounded-3xl p-8 max-w-4xl mx-auto shadow-2xl flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2 text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start gap-2 text-emerald-400 font-bold text-sm uppercase tracking-wider">
              <Globe size={16} /> Fichier XML officiel Google Search Console
            </div>
            <p className="text-xs text-slate-300">
              Adresse officielle du sitemap XML pour l'indexation par les moteurs de recherche :
            </p>
            <code className="inline-block bg-slate-950 px-4 py-2 rounded-xl border border-white/10 text-emerald-300 text-xs font-mono">
              https://safecallr.com/sitemap.xml
            </code>
          </div>
          <a 
            href="/sitemap.xml" 
            target="_blank" 
            rel="noopener noreferrer"
            className="px-6 py-3.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs uppercase tracking-wider rounded-2xl shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-2 shrink-0"
          >
            <ExternalLink size={16} /> Voir sitemap.xml brut
          </a>
        </div>

        {/* Main Sections Grid */}
        <div className="mt-16 grid grid-cols-1 lg:grid-cols-2 gap-10">
          
          {/* Section 1: Pages Principales */}
          <div className="bg-slate-900/60 border border-white/10 rounded-3xl p-8 space-y-6">
            <div className="flex items-center gap-3 text-emerald-400 font-bold uppercase tracking-wider text-sm border-b border-white/10 pb-4">
              <Globe size={18} /> Pages Principales
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {mainPages.map((page, idx) => {
                const IconComponent = page.icon;
                return (
                  <Link
                    key={idx}
                    to={page.path}
                    className="p-4 rounded-2xl bg-slate-950/60 border border-white/5 hover:border-emerald-500/40 hover:bg-slate-800/50 transition-all group flex flex-col justify-between space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                        <IconComponent size={16} />
                      </div>
                      <ArrowRight size={14} className="text-slate-600 group-hover:text-emerald-400 group-hover:translate-x-1 transition-all" />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-white group-hover:text-emerald-400 transition-colors">
                        {page.title}
                      </h3>
                      <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                        {page.desc}
                      </p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Section 2: Articles du Blog */}
          <div className="bg-slate-900/60 border border-white/10 rounded-3xl p-8 space-y-6 flex flex-col">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-3 text-emerald-400 font-bold uppercase tracking-wider text-sm">
                <Newspaper size={18} /> Articles du Blog ({articles.length})
              </div>
              <Link to="/actualite" className="text-xs text-slate-400 hover:text-emerald-400 font-medium transition-colors">
                Voir tout →
              </Link>
            </div>

            {loadingBlog ? (
              <div className="py-12 text-center text-slate-500 text-xs animate-pulse">
                Chargement des articles de blog...
              </div>
            ) : articles.length === 0 ? (
              <div className="py-8 text-center text-slate-500 text-xs bg-slate-950/40 rounded-2xl p-6">
                Aucun article publié pour le moment.
              </div>
            ) : (
              <div className="space-y-3 max-h-[380px] overflow-y-auto pr-2 scrollbar-thin">
                {articles.map((art) => {
                  const articleSlug = art.slug || encodeURIComponent(art.metaTitle || art.id);
                  return (
                    <Link
                      key={art.id}
                      to={`/actualite/${articleSlug}`}
                      className="p-3.5 rounded-2xl bg-slate-950/60 border border-white/5 hover:border-emerald-500/30 hover:bg-slate-800/40 transition-all flex items-center justify-between group"
                    >
                      <div className="flex items-center gap-3 min-w-0 pr-4">
                        <CheckCircle2 size={14} className="text-emerald-500 shrink-0" />
                        <span className="font-medium text-xs text-slate-200 group-hover:text-emerald-400 transition-colors truncate">
                          {art.title}
                        </span>
                      </div>
                      <ArrowRight size={12} className="text-slate-600 group-hover:text-emerald-400 group-hover:translate-x-1 transition-all shrink-0" />
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          {/* Section 3: Pages Légales & Confidentialité */}
          <div className="bg-slate-900/60 border border-white/10 rounded-3xl p-8 space-y-6">
            <div className="flex items-center gap-3 text-emerald-400 font-bold uppercase tracking-wider text-sm border-b border-white/10 pb-4">
              <Lock size={18} /> Pages Légales & Confidentialité (FR / EN / ES)
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {legalPages.map((page, idx) => (
                <Link
                  key={idx}
                  to={page.path}
                  className="p-3 rounded-2xl bg-slate-950/60 border border-white/5 hover:border-emerald-500/30 hover:bg-slate-800/40 transition-all flex items-center justify-between group"
                >
                  <span className="text-xs text-slate-300 group-hover:text-emerald-400 font-medium">
                    {page.label}
                  </span>
                  <ArrowRight size={12} className="text-slate-600 group-hover:text-emerald-400 group-hover:translate-x-1 transition-all" />
                </Link>
              ))}
            </div>
          </div>

          {/* Section 4: Espaces & Authentification */}
          <div className="bg-slate-900/60 border border-white/10 rounded-3xl p-8 space-y-6">
            <div className="flex items-center gap-3 text-emerald-400 font-bold uppercase tracking-wider text-sm border-b border-white/10 pb-4">
              <UserCheck size={18} /> Espaces Membres & Accès
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {portalPages.map((page, idx) => (
                <Link
                  key={idx}
                  to={page.path}
                  className="p-3.5 rounded-2xl bg-slate-950/60 border border-white/5 hover:border-emerald-500/30 hover:bg-slate-800/40 transition-all flex items-center justify-between group"
                >
                  <span className="text-xs text-slate-300 group-hover:text-emerald-400 font-medium">
                    {page.title}
                  </span>
                  <ArrowRight size={12} className="text-slate-600 group-hover:text-emerald-400 group-hover:translate-x-1 transition-all" />
                </Link>
              ))}
            </div>
          </div>

        </div>
      </div>

      {/* Footer */}
      <footer className="py-12 border-t border-white/5 bg-slate-950 text-center text-xs text-slate-500">
        <p>© {new Date().getFullYear()} SafeCallr. All rights reserved.</p>
      </footer>
    </div>
  );
}
