import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { 
  Shield, 
  ArrowLeft, 
  Globe, 
  Calendar, 
  User, 
  Share2, 
  Check, 
  Link as LinkIcon, 
  Loader2, 
  ChevronRight, 
  ChevronLeft 
} from "lucide-react";
import { db, collection, getDocs, query, where } from "../firebase";
import SEOManager from "../components/seo/SEOManager";
import MarkdownRenderer from "../components/MarkdownRenderer";
import { toast } from "sonner";

export default function ArticleDetail() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [article, setArticle] = useState<any | null>(null);
  const [relatedArticles, setRelatedArticles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetchArticleAndRelated = async () => {
      if (!slug) return;
      setLoading(true);
      try {
        // Query article by metaTitle slug
        const q = query(
          collection(db, "articles"), 
          where("metaTitle", "==", slug),
          where("published", "==", true)
        );
        const querySnapshot = await getDocs(q);
        
        if (querySnapshot.empty) {
          setArticle(null);
          setLoading(false);
          return;
        }

        let currentArticle: any = null;
        querySnapshot.forEach((doc) => {
          currentArticle = { id: doc.id, ...doc.data() };
        });

        setArticle(currentArticle);

        // Fetch related articles of same category (limit to 3)
        if (currentArticle) {
          const relatedQ = query(
            collection(db, "articles"),
            where("category", "==", currentArticle.category),
            where("published", "==", true)
          );
          const relatedSnapshot = await getDocs(relatedQ);
          const relatedList: any[] = [];
          relatedSnapshot.forEach((doc) => {
            const data = doc.data();
            if (doc.id !== currentArticle.id) {
              relatedList.push({ id: doc.id, ...data });
            }
          });
          setRelatedArticles(relatedList.slice(0, 3));
        }

      } catch (err) {
        console.error("Error fetching article details:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchArticleAndRelated();
  }, [slug]);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    toast.success("Lien de l'article copié dans le presse-papiers !");
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background text-on-background flex flex-col items-center justify-center">
        <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
        <p className="text-slate-400 text-sm">Chargement de l'article en cours...</p>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="min-h-screen bg-background text-on-background flex flex-col items-center justify-center p-6 text-center">
        <Shield className="w-16 h-16 text-primary mb-6 animate-bounce" />
        <h1 className="font-headline font-black text-3xl mb-2">Article introuvable</h1>
        <p className="text-slate-400 max-w-md mb-8">
          L'article que vous recherchez n'existe pas ou a été retiré par nos administrateurs de sécurité.
        </p>
        <Link 
          to="/actualite" 
          className="bg-primary text-on-primary px-6 py-3 rounded-xl font-bold uppercase text-xs tracking-wider flex items-center gap-2 hover:scale-105 active:scale-95 transition-all"
        >
          <ArrowLeft size={16} />
          Retour aux Actualités
        </Link>
      </div>
    );
  }

  // Generate Article Schema JSON-LD for Search Engine Optimization (SEO)
  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    "headline": article.title,
    "image": [article.imageUrl],
    "datePublished": article.createdAt || new Date().toISOString(),
    "dateModified": article.updatedAt || new Date().toISOString(),
    "author": {
      "@type": "Organization",
      "name": "Comité de Vigilance SafeCallr",
      "url": "https://safecallr.com"
    },
    "publisher": {
      "@type": "Organization",
      "name": "SafeCallr",
      "logo": {
        "@type": "ImageObject",
        "url": "https://safecallr.com/logo.png"
      }
    },
    "description": article.summary
  };

  return (
    <div className="min-h-screen bg-background text-on-background selection:bg-primary/30 selection:text-primary">
      <SEOManager 
        title={`${article.title} | Vigilance SafeCallr`}
        description={article.metaDescription || article.summary}
        jsonLd={articleJsonLd}
      />

      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 md:px-6 h-20 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20 shrink-0">
              <Shield className="text-on-primary w-6 h-6" />
            </div>
            <span className="font-headline font-black text-xl md:text-2xl tracking-tighter text-primary">SafeCallr</span>
          </Link>
          <div className="flex items-center gap-2 text-[10px] md:text-xs font-bold uppercase tracking-widest text-slate-400 overflow-hidden text-ellipsis whitespace-nowrap">
            <Link to="/" className="hover:text-primary transition-colors shrink-0">Accueil</Link>
            <span className="text-slate-700">/</span>
            <Link to="/actualite" className="hover:text-primary transition-colors shrink-0">Actualités</Link>
            <span className="text-slate-700">/</span>
            <span className="text-white truncate max-w-[120px] md:max-w-[200px]">{article.title}</span>
          </div>
        </div>
      </nav>

      {/* Hero Header with image background overlay */}
      <section className="pt-32 pb-16 px-6 relative overflow-hidden border-b border-white/5 bg-surface-container-lowest/30">
        <div className="absolute inset-0 z-0 opacity-10 pointer-events-none">
          <img src={article.imageUrl} alt="" className="w-full h-full object-cover blur-md" />
        </div>

        <div className="max-w-4xl mx-auto space-y-6 relative z-10 text-center lg:text-left">
          <Link 
            to="/actualite"
            className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-400 hover:text-primary transition-colors"
          >
            <ArrowLeft size={14} /> Retour aux actualités
          </Link>

          <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4">
            <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
              article.category === "grand_public" 
                ? "bg-blue-500/20 text-blue-300 border border-blue-500/30" 
                : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
            }`}>
              {article.category === "grand_public" ? "Grand Public" : "Professionnel"}
            </span>

            {article.geoTargeting && (
              <span className="flex items-center gap-1.5 text-xs text-primary font-bold uppercase tracking-widest bg-primary/10 border border-primary/20 px-3 py-1 rounded-full">
                <Globe size={12} /> {article.geoTargeting}
              </span>
            )}
          </div>

          <h1 className="font-headline font-black text-3xl md:text-5xl tracking-tight leading-tight text-white">
            {article.title}
          </h1>

          <div className="flex flex-wrap items-center justify-center lg:justify-start gap-6 text-xs text-slate-400 font-medium border-t border-white/5 pt-6">
            <span className="flex items-center gap-2">
              <Calendar size={14} className="text-primary" />
              {article.createdAt ? new Date(article.createdAt).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" }) : ""}
            </span>
            <span className="flex items-center gap-2">
              <User size={14} className="text-primary" />
              Rédaction SafeCallr
            </span>
            <button 
              onClick={handleCopyLink}
              className="flex items-center gap-1.5 text-slate-400 hover:text-primary transition-colors cursor-pointer"
            >
              {copied ? <Check size={14} className="text-green-400" /> : <Share2 size={14} />}
              Partager
            </button>
          </div>
        </div>
      </section>

      {/* Article Content */}
      <section className="py-16 px-6">
        <div className="max-w-4xl mx-auto grid grid-cols-1 lg:grid-cols-4 gap-12">
          
          {/* Main article body */}
          <div className="lg:col-span-3 space-y-8">
            {article.imageUrl && (
              <div className="rounded-[32px] overflow-hidden border border-white/5 shadow-2xl h-64 md:h-[450px] relative">
                <img src={article.imageUrl} alt={article.title} className="w-full h-full object-cover" />
              </div>
            )}

            {/* Quick summary box */}
            <div className="bg-primary/5 border border-primary/20 rounded-2xl p-6 italic text-slate-300 text-sm md:text-base leading-relaxed">
              <strong>Résumé :</strong> {article.summary}
            </div>

            {/* Structured Content Renderer */}
            <div className="prose prose-invert max-w-none">
              <MarkdownRenderer content={article.content} />
            </div>

            {/* Local Security Advice / Warning Callout */}
            {article.geoTargeting && (
              <div className="bg-amber-500/5 border border-amber-500/20 rounded-2xl p-6 space-y-3 mt-10">
                <h4 className="font-bold text-amber-300 text-sm uppercase tracking-wider flex items-center gap-2">
                  <Globe size={16} /> Vigilance Locale - {article.geoTargeting}
                </h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Cet article contient des optimisations de sécurité et des recommandations pertinentes pour la région de <strong>{article.geoTargeting}</strong>. Restez vigilants et prévenez vos proches locaux.
                </p>
              </div>
            )}
          </div>

          {/* Right Sidebar: Quick info & call to action */}
          <div className="space-y-8">
            <div className="bg-surface-container-low border border-white/5 rounded-3xl p-6 space-y-6">
              <div className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center shadow-lg shadow-primary/20">
                <Shield className="text-on-primary w-6 h-6" />
              </div>
              <h3 className="font-headline font-black text-xl text-white">Sécurisez vos appels</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                SafeCallr empêche les fraudeurs d'usurper vos numéros de téléphone et d'arnaquer vos clients ou vos collaborateurs en authentifiant chaque appel en temps réel.
              </p>
              <Link 
                to="/" 
                className="block text-center bg-primary text-on-primary py-3.5 rounded-xl font-bold uppercase tracking-wider text-xs shadow-lg shadow-primary/25 hover:scale-105 active:scale-95 transition-all"
              >
                Découvrir SafeCallr
              </Link>
            </div>

            {/* Share and SEO tag highlights */}
            {article.seoKeywords && (
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-widest text-slate-500">Mots-clés</h4>
                <div className="flex flex-wrap gap-1.5">
                  {article.seoKeywords.split(",").map((kw: string) => (
                    <span key={kw} className="bg-white/5 border border-white/5 text-[10px] px-2 py-1 rounded-md text-slate-300">
                      #{kw.trim()}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Related articles section */}
      {relatedArticles.length > 0 && (
        <section className="py-16 border-t border-white/5 bg-surface-container-lowest/50 px-6">
          <div className="max-w-4xl mx-auto space-y-8">
            <h3 className="font-headline font-black text-2xl md:text-3xl tracking-tight text-white">
              Articles recommandés de la même catégorie
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {relatedArticles.map(art => (
                <div 
                  key={art.id}
                  className="bg-surface-container-low border border-white/5 hover:border-white/10 rounded-2xl overflow-hidden shadow-lg flex flex-col group transition-all duration-300"
                >
                  <Link to={`/actualite/${art.metaTitle}`} className="flex flex-col h-full">
                    <div className="h-32 relative overflow-hidden bg-slate-950">
                      <img src={art.imageUrl} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    </div>
                    <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                      <h4 className="font-bold text-sm text-white line-clamp-2 leading-snug group-hover:text-primary transition-colors">
                        {art.title}
                      </h4>
                      <span className="text-[10px] text-primary font-bold uppercase tracking-wider flex items-center gap-1 shrink-0">
                        Lire l'article <ChevronRight size={10} />
                      </span>
                    </div>
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="py-20 px-6 border-t border-white/5 bg-surface-container-lowest mt-20">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-10">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Shield className="text-on-primary w-5 h-5" />
            </div>
            <span className="font-headline font-black text-xl tracking-tighter text-primary">SafeCallr</span>
          </div>
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
