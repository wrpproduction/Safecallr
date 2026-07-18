import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { 
  FileText, 
  Shield, 
  ArrowRight, 
  ChevronRight, 
  Search, 
  Globe, 
  Users, 
  Building2, 
  Loader2 
} from "lucide-react";
import { db, collection, getDocs, query, where, orderBy } from "../firebase";
import SEOManager from "../components/seo/SEOManager";
import AppLogo from "../components/AppLogo";

export default function Actualites() {
  const [articles, setArticles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<"all" | "grand_public" | "professionnel">("all");

  useEffect(() => {
    const fetchArticles = async () => {
      setLoading(true);
      try {
        // Query only published articles ordered by creation date
        const q = query(
          collection(db, "articles"), 
          where("published", "==", true)
        );
        const querySnapshot = await getDocs(q);
        const items: any[] = [];
        querySnapshot.forEach((doc) => {
          items.push({ id: doc.id, ...doc.data() });
        });
        
        // Sort by createdAt since complex Firestore query without composite index might fail
        items.sort((a, b) => {
          const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return dateB - dateA;
        });

        setArticles(items);
      } catch (err) {
        console.error("Error fetching articles:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchArticles();
  }, []);

  const filteredArticles = selectedCategory === "all" 
    ? articles 
    : articles.filter(art => art.category === selectedCategory);

  const featuredArticle = filteredArticles[0];
  const regularArticles = filteredArticles.slice(1);

  // Generate structured schema (JSON-LD) for SEO
  const blogJsonLd = {
    "@context": "https://schema.org",
    "@type": "Blog",
    "name": "Le Blog de la Sécurité Téléphonique - SafeCallr",
    "description": "Conseils, décryptages d'arnaques et actualités sur la sécurité des appels pour les particuliers et les professionnels.",
    "publisher": {
      "@type": "Organization",
      "name": "SafeCallr",
      "logo": {
        "@type": "ImageObject",
        "url": "https://safecallr.com/logo.png"
      }
    },
    "blogPost": filteredArticles.map(art => ({
      "@type": "BlogPosting",
      "headline": art.title,
      "description": art.summary,
      "image": art.imageUrl,
      "datePublished": art.createdAt,
      "url": `https://safecallr.com/actualite/${art.metaTitle}`
    }))
  };

  return (
    <div className="min-h-screen bg-background text-on-background selection:bg-primary/30 selection:text-primary overflow-x-hidden">
      <SEOManager 
        title="Actualités de Sécurité Téléphonique & Anti-Spoofing"
        description="Retrouvez nos derniers articles, décryptages d'arnaques (faux conseiller, usurpation) et conseils de cybersécurité pour particuliers et entreprises."
        jsonLd={blogJsonLd}
      />

      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 md:px-6 h-20 flex items-center justify-between">
          <Link to="/" className="flex items-center">
            <AppLogo 
              size={40} 
              textClassName="md:text-2xl" 
              className="gap-3" 
              iconContainerClassName="shadow-lg shadow-primary/20 rounded-xl" 
            />
          </Link>
          <div className="flex items-center gap-4 text-xs font-bold uppercase tracking-widest text-slate-400">
            <Link to="/" className="hover:text-primary transition-colors">Accueil</Link>
            <span className="text-slate-700">/</span>
            <span className="text-white">Actualités</span>
          </div>
        </div>
      </nav>

      {/* Hero Header */}
      <section className="pt-32 pb-12 px-6 relative overflow-hidden">
        <div className="absolute top-20 left-1/2 -translate-x-1/2 w-full max-w-7xl h-full pointer-events-none">
          <div className="absolute top-10 left-10 w-72 h-72 bg-primary/10 rounded-full blur-[120px]"></div>
        </div>

        <div className="max-w-7xl mx-auto text-center space-y-4 relative z-10">
          <span className="px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-[10px] font-bold uppercase tracking-widest text-primary">
            Centre de vigilance & Conseils
          </span>
          <h1 className="font-headline font-black text-4xl md:text-6xl tracking-tight">
            Le Blog de la <span className="text-primary">Sécurité Téléphonique</span>
          </h1>
          <p className="text-slate-400 max-w-2xl mx-auto text-sm md:text-base">
            Protégez vos proches et vos collaborateurs contre le spoofing, l'usurpation d'identité et les arnaques de faux conseillers bancaires.
          </p>
        </div>
      </section>

      {/* Filters */}
      <section className="py-6 border-y border-white/5 bg-surface-container-lowest/50">
        <div className="max-w-7xl mx-auto px-6 flex justify-center gap-4">
          <button
            onClick={() => setSelectedCategory("all")}
            className={`px-5 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all ${
              selectedCategory === "all"
                ? "bg-primary text-on-primary"
                : "bg-surface-container-low hover:bg-surface-container border border-white/5 text-slate-400 hover:text-white"
            }`}
          >
            Tous les articles
          </button>
          <button
            onClick={() => setSelectedCategory("grand_public")}
            className={`px-5 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all ${
              selectedCategory === "grand_public"
                ? "bg-primary text-on-primary"
                : "bg-surface-container-low hover:bg-surface-container border border-white/5 text-slate-400 hover:text-white"
            }`}
          >
            <Users size={12} />
            Grand Public
          </button>
          <button
            onClick={() => setSelectedCategory("professionnel")}
            className={`px-5 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all ${
              selectedCategory === "professionnel"
                ? "bg-primary text-on-primary"
                : "bg-surface-container-low hover:bg-surface-container border border-white/5 text-slate-400 hover:text-white"
            }`}
          >
            <Building2 size={12} />
            Professionnels
          </button>
        </div>
      </section>

      {/* Main Articles Grid */}
      <section className="py-16 px-6 max-w-7xl mx-auto">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
            <p className="text-slate-400 font-medium text-sm">Chargement des dossiers de sécurité...</p>
          </div>
        ) : filteredArticles.length === 0 ? (
          <div className="text-center py-20 bg-surface-container-low/50 border border-white/5 rounded-3xl">
            <FileText className="mx-auto w-12 h-12 text-slate-600 mb-4" />
            <p className="text-slate-400 font-medium">Aucun article n'a encore été publié dans cette catégorie.</p>
          </div>
        ) : (
          <div className="space-y-16">
            {/* Featured Article - Big Banner card */}
            {featuredArticle && (
              <div className="relative group rounded-[32px] overflow-hidden bg-surface-container-low border border-white/5 hover:border-white/10 transition-all duration-300 shadow-2xl">
                <Link to={`/actualite/${featuredArticle.metaTitle}`} className="grid grid-cols-1 lg:grid-cols-2">
                  <div className="h-64 lg:h-96 relative overflow-hidden bg-slate-950">
                    <img 
                      src={featuredArticle.imageUrl || "https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&w=800&q=80"} 
                      alt={featuredArticle.title} 
                      className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-700"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t lg:bg-gradient-to-r from-black/80 to-transparent"></div>
                  </div>
                  <div className="p-8 lg:p-12 flex flex-col justify-between space-y-6">
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          featuredArticle.category === "grand_public" 
                            ? "bg-blue-500/20 text-blue-300 border border-blue-500/30" 
                            : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                        }`}>
                          A la une - {featuredArticle.category === "grand_public" ? "Grand Public" : "Professionnel"}
                        </span>
                        {featuredArticle.geoTargeting && (
                          <span className="flex items-center gap-1 text-[10px] text-primary font-bold uppercase tracking-widest">
                            <Globe size={10} /> {featuredArticle.geoTargeting}
                          </span>
                        )}
                      </div>
                      <h2 className="font-headline font-black text-2xl lg:text-4xl text-white tracking-tight leading-snug group-hover:text-primary transition-colors">
                        {featuredArticle.title}
                      </h2>
                      <p className="text-slate-400 text-sm lg:text-base leading-relaxed line-clamp-3">
                        {featuredArticle.summary}
                      </p>
                    </div>
                    <div className="flex items-center justify-between pt-4 border-t border-white/5 text-xs text-slate-500">
                      <span>
                        {featuredArticle.createdAt ? new Date(featuredArticle.createdAt).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" }) : ""}
                      </span>
                      <span className="text-primary font-bold uppercase tracking-wider flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                        Lire l'article complet <ArrowRight size={14} />
                      </span>
                    </div>
                  </div>
                </Link>
              </div>
            )}

            {/* Grid of other articles */}
            {regularArticles.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pt-8">
                {regularArticles.map(art => (
                  <div 
                    key={art.id}
                    className="bg-surface-container-low border border-white/5 hover:border-white/10 rounded-[28px] overflow-hidden shadow-xl flex flex-col group transition-all duration-300"
                  >
                    <Link to={`/actualite/${art.metaTitle}`} className="flex flex-col h-full">
                      <div className="h-48 relative overflow-hidden bg-slate-950">
                        <img 
                          src={art.imageUrl || "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=600&q=80"} 
                          alt={art.title} 
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        <span className={`absolute top-4 left-4 px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                          art.category === "grand_public" 
                            ? "bg-blue-500/20 text-blue-300 border border-blue-500/30" 
                            : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                        }`}>
                          {art.category === "grand_public" ? "Grand Public" : "Professionnel"}
                        </span>
                      </div>
                      <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                        <div className="space-y-2">
                          <h3 className="font-bold text-lg text-white group-hover:text-primary transition-colors line-clamp-2 leading-snug">
                            {art.title}
                          </h3>
                          <p className="text-slate-400 text-xs line-clamp-3">
                            {art.summary}
                          </p>
                        </div>
                        <div className="pt-4 border-t border-white/5 flex items-center justify-between text-[10px] text-slate-500 font-medium">
                          {art.geoTargeting ? (
                            <span className="flex items-center gap-1 text-primary">
                              <Globe size={10} /> {art.geoTargeting}
                            </span>
                          ) : (
                            <span></span>
                          )}
                          <span>
                            {art.createdAt ? new Date(art.createdAt).toLocaleDateString("fr-FR", { day: "numeric", month: "short" }) : ""}
                          </span>
                        </div>
                      </div>
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </section>

      {/* Footer */}
      <footer className="py-20 px-6 border-t border-white/5 bg-surface-container-lowest mt-20">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-10">
          <AppLogo className="gap-3" />
          <div className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">
            © 2026 SafeCallr Technologies. Tous droits réservés.
          </div>
          <div className="flex gap-8 text-[10px] font-bold uppercase tracking-widest text-slate-500">
            <Link to="/" className="hover:text-primary transition-colors">Accueil</Link>
            <Link to="/actualite" className="hover:text-primary transition-colors">Actualités</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
