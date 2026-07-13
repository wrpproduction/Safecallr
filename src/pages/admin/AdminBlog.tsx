import React, { useState, useEffect } from "react";
import { 
  FileText, 
  Plus, 
  Search, 
  Filter, 
  Edit, 
  Trash2, 
  Globe, 
  Eye, 
  Sparkles, 
  CheckCircle, 
  XCircle, 
  Loader2, 
  ArrowLeft, 
  Image as ImageIcon,
  Upload,
  ExternalLink,
  ChevronRight
} from "lucide-react";
import AdminLayout from "../../components/AdminLayout";
import { 
  auth, 
  db, 
  collection, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  query, 
  orderBy,
  serverTimestamp 
} from "../../firebase";
import { toast } from "sonner";
import { handleFirestoreError, OperationType } from "../../lib/firestore-errors";

// Preset beautiful high-contrast illustrations for SEO
const PRESET_IMAGES = [
  {
    name: "Alerte Phishing",
    url: "https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&w=600&q=80"
  },
  {
    name: "Sécurité Téléphonique",
    url: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=600&q=80"
  },
  {
    name: "Fraude Bancaire",
    url: "https://images.unsplash.com/photo-1559526324-4b87b5e36e44?auto=format&fit=crop&w=600&q=80"
  },
  {
    name: "Authentification Double Facteur",
    url: "https://images.unsplash.com/photo-1614064641938-3bbee52942c7?auto=format&fit=crop&w=600&q=80"
  }
];

export default function AdminBlog() {
  const [articles, setArticles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  // Form states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingArticle, setEditingArticle] = useState<any | null>(null);
  const [formTitle, setFormTitle] = useState("");
  const [formContent, setFormContent] = useState("");
  const [formSummary, setFormSummary] = useState("");
  const [formImageUrl, setFormImageUrl] = useState("");
  const [formCategory, setFormCategory] = useState<"grand_public" | "professionnel">("grand_public");
  const [formPublished, setFormPublished] = useState(true);
  const [formMetaTitle, setFormMetaTitle] = useState("");
  const [formMetaDescription, setFormMetaDescription] = useState("");
  const [formSeoKeywords, setFormSeoKeywords] = useState("");
  const [formGeoTargeting, setFormGeoTargeting] = useState("");

  // AI Generator states
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiTopic, setAiTopic] = useState("");
  const [aiRegion, setAiRegion] = useState("");
  const [aiCustomKeywords, setAiCustomKeywords] = useState("");

  useEffect(() => {
    fetchArticles();
  }, []);

  const fetchArticles = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, "articles"), orderBy("createdAt", "desc"));
      const querySnapshot = await getDocs(q);
      const items: any[] = [];
      querySnapshot.forEach((doc) => {
        items.push({ id: doc.id, ...doc.data() });
      });
      setArticles(items);
    } catch (err: any) {
      toast.error("Impossible de récupérer les articles");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Autogenerate slug/meta title from Title
  const handleTitleChange = (val: string) => {
    setFormTitle(val);
    if (!editingArticle) {
      // Auto populate meta title if not editing
      const slugified = val
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .slice(0, 60);
      setFormMetaTitle(slugified);
    }
  };

  // Convert uploaded image to base64
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 800000) { // ~800KB limit for base64 storage
      toast.error("L'image est trop lourde. Veuillez choisir une image de moins de 800 Ko.");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setFormImageUrl(reader.result as string);
      toast.success("Image importée avec succès !");
    };
    reader.readAsDataURL(file);
  };

  // Call server-side Gemini generation
  const handleGenerateWithAI = async () => {
    if (!aiTopic) {
      toast.error("Veuillez saisir un sujet ou une idée d'article.");
      return;
    }

    setIsGenerating(true);
    try {
      const res = await fetch("/api/generate-blog-post", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          topic: aiTopic,
          category: formCategory,
          targetLocation: aiRegion,
          keywords: aiCustomKeywords
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Une erreur s'est produite lors de la génération.");
      }

      // Populate form fields with AI generated content
      setFormTitle(data.title);
      setFormContent(data.content);
      setFormSummary(data.summary);
      setFormMetaTitle(data.metaTitle.toLowerCase().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-"));
      setFormMetaDescription(data.metaDescription);
      setFormSeoKeywords(data.seoKeywords);
      setFormGeoTargeting(data.geoTargeting);
      
      // Auto pick a preset image corresponding to topic
      const randomPreset = PRESET_IMAGES[Math.floor(Math.random() * PRESET_IMAGES.length)];
      setFormImageUrl(randomPreset.url);

      toast.success("Article généré et optimisé par l'IA avec succès !");
    } catch (err: any) {
      toast.error(err.message || "Erreur lors de la génération avec l'IA.");
      console.error(err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleOpenCreate = () => {
    setEditingArticle(null);
    setFormTitle("");
    setFormContent("");
    setFormSummary("");
    setFormImageUrl(PRESET_IMAGES[0].url);
    setFormCategory("grand_public");
    setFormPublished(true);
    setFormMetaTitle("");
    setFormMetaDescription("");
    setFormSeoKeywords("");
    setFormGeoTargeting("");
    setAiTopic("");
    setAiRegion("");
    setAiCustomKeywords("");
    setIsFormOpen(true);
  };

  const handleOpenEdit = (article: any) => {
    setEditingArticle(article);
    setFormTitle(article.title || "");
    setFormContent(article.content || "");
    setFormSummary(article.summary || "");
    setFormImageUrl(article.imageUrl || "");
    setFormCategory(article.category || "grand_public");
    setFormPublished(article.published !== false);
    setFormMetaTitle(article.metaTitle || "");
    setFormMetaDescription(article.metaDescription || "");
    setFormSeoKeywords(article.seoKeywords || "");
    setFormGeoTargeting(article.geoTargeting || "");
    setIsFormOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formTitle || !formContent || !formSummary || !formMetaTitle || !formMetaDescription) {
      toast.error("Veuillez remplir tous les champs requis.");
      return;
    }

    const cleanSlug = formMetaTitle
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-");

    const payload = {
      title: formTitle,
      content: formContent,
      summary: formSummary,
      imageUrl: formImageUrl,
      category: formCategory,
      published: formPublished,
      metaTitle: cleanSlug,
      metaDescription: formMetaDescription,
      seoKeywords: formSeoKeywords,
      geoTargeting: formGeoTargeting,
      updatedAt: new Date().toISOString()
    };

    try {
      if (editingArticle) {
        const docRef = doc(db, "articles", editingArticle.id);
        await updateDoc(docRef, payload);
        toast.success("Article mis à jour !");
      } else {
        await addDoc(collection(db, "articles"), {
          ...payload,
          createdAt: new Date().toISOString()
        });
        toast.success("Article créé et publié !");
      }
      setIsFormOpen(false);
      fetchArticles();
    } catch (err: any) {
      handleFirestoreError(err, editingArticle ? OperationType.UPDATE : OperationType.CREATE, "articles");
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Êtes-vous sûr de vouloir supprimer cet article ?")) {
      return;
    }

    try {
      await deleteDoc(doc(db, "articles", id));
      toast.success("Article supprimé.");
      fetchArticles();
    } catch (err: any) {
      handleFirestoreError(err, OperationType.DELETE, `articles/${id}`);
    }
  };

  const filteredArticles = articles.filter(art => {
    const matchesSearch = art.title?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          art.content?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === "all" || art.category === categoryFilter;
    const matchesStatus = statusFilter === "all" || 
                          (statusFilter === "published" && art.published === true) ||
                          (statusFilter === "draft" && art.published === false);
    return matchesSearch && matchesCategory && matchesStatus;
  });

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-4xl font-black tracking-tight flex items-center gap-3">
              <FileText className="text-primary w-10 h-10" />
              Actualités & Blog SEO
            </h1>
            <p className="text-slate-400 mt-2">
              Rédigez et publiez des articles de blog pour améliorer le référencement de SafeCallr sur les moteurs de recherche.
            </p>
          </div>

          {!isFormOpen && (
            <button 
              onClick={handleOpenCreate}
              className="bg-primary text-on-primary px-6 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all text-sm uppercase tracking-wider"
            >
              <Plus size={18} />
              Nouvel Article
            </button>
          )}
        </div>

        {isFormOpen ? (
          /* Create / Edit Form Layout */
          <div className="bg-surface-container-low border border-white/5 rounded-3xl p-8 space-y-8">
            <div className="flex items-center justify-between border-b border-white/5 pb-6">
              <button 
                onClick={() => setIsFormOpen(false)}
                className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-slate-400 hover:text-primary transition-colors"
              >
                <ArrowLeft size={16} /> Retour à la liste
              </button>
              <h2 className="text-2xl font-bold">
                {editingArticle ? "Modifier l'article" : "Créer un article d'actualité"}
              </h2>
            </div>

            {/* AI Generation Widget - ONLY for new articles or if manually requested */}
            {!editingArticle && (
              <div className="bg-primary/5 border border-primary/20 rounded-2xl p-6 space-y-4">
                <div className="flex items-center gap-2">
                  <Sparkles className="text-primary w-5 h-5 animate-pulse" />
                  <h3 className="font-bold text-lg">Générer un article SEO & GEO avec l'IA</h3>
                </div>
                <p className="text-xs text-slate-400">
                  Saisissez un sujet et laissez Gemini rédiger un article complet de niveau expert, structuré avec les métadonnées SEO/GEO déjà renseignées.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-1">
                    <label className="block text-xs uppercase tracking-wider font-bold text-slate-400 mb-2">Sujet de l'article *</label>
                    <input 
                      type="text" 
                      placeholder="Ex: Arnaque au faux banquier à Marseille"
                      value={aiTopic}
                      onChange={(e) => setAiTopic(e.target.value)}
                      className="w-full bg-[#0a0a0c] border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-primary focus:outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs uppercase tracking-wider font-bold text-slate-400 mb-2">Ciblage Géographique (Optionnel)</label>
                    <input 
                      type="text" 
                      placeholder="Ex: Marseille, Bouches-du-Rhône"
                      value={aiRegion}
                      onChange={(e) => setAiRegion(e.target.value)}
                      className="w-full bg-[#0a0a0c] border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-primary focus:outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs uppercase tracking-wider font-bold text-slate-400 mb-2">Mots-clés SEO additionnels</label>
                    <input 
                      type="text" 
                      placeholder="Ex: double validation, usurpation"
                      value={aiCustomKeywords}
                      onChange={(e) => setAiCustomKeywords(e.target.value)}
                      className="w-full bg-[#0a0a0c] border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-primary focus:outline-none transition-all"
                    />
                  </div>
                </div>
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={handleGenerateWithAI}
                    disabled={isGenerating || !aiTopic}
                    className="bg-primary/20 text-primary border border-primary/30 hover:bg-primary hover:text-on-primary px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest flex items-center gap-2 transition-all disabled:opacity-50"
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Génération en cours...
                      </>
                    ) : (
                      <>
                        <Sparkles size={14} />
                        Générer avec Gemini
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left Column: Form Fields */}
              <div className="lg:col-span-2 space-y-6">
                <div>
                  <label className="block text-xs uppercase tracking-widest font-black text-slate-400 mb-2">Titre de l'article *</label>
                  <input 
                    type="text" 
                    placeholder="Saisissez un titre captivant et informatif"
                    value={formTitle}
                    onChange={(e) => handleTitleChange(e.target.value)}
                    className="w-full bg-[#0a0a0c] border border-white/10 rounded-xl px-4 py-3.5 text-base font-medium focus:border-primary focus:outline-none transition-all"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs uppercase tracking-widest font-black text-slate-400 mb-2">Résumé pour l'aperçu *</label>
                  <textarea 
                    rows={2}
                    placeholder="Un résumé court de 2-3 phrases accrocheuses qui sera affiché sur la liste des articles."
                    value={formSummary}
                    onChange={(e) => setFormSummary(e.target.value)}
                    className="w-full bg-[#0a0a0c] border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-primary focus:outline-none transition-all"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs uppercase tracking-widest font-black text-slate-400 mb-2">Contenu complet * (Markdown / HTML)</label>
                  <textarea 
                    rows={12}
                    placeholder="Rédigez votre article complet ici. Vous pouvez utiliser du Markdown propre."
                    value={formContent}
                    onChange={(e) => setFormContent(e.target.value)}
                    className="w-full bg-[#0a0a0c] border border-white/10 rounded-xl px-4 py-3 font-mono text-sm focus:border-primary focus:outline-none transition-all"
                    required
                  />
                </div>

                {/* SEO Snippet Preview - Google Style */}
                <div className="bg-[#0e0e11] border border-white/5 rounded-2xl p-6 space-y-4">
                  <h3 className="font-bold text-sm text-slate-400 flex items-center gap-2">
                    <Globe size={16} className="text-primary" />
                    Aperçu sur Google (SEO Snippet Preview)
                  </h3>
                  <div className="p-4 bg-[#141416] rounded-xl font-sans max-w-xl space-y-1">
                    <div className="text-xs text-[#dadce0] flex items-center gap-1.5 overflow-hidden text-ellipsis whitespace-nowrap">
                      <span>https://safecallr.com</span>
                      <ChevronRight size={10} className="text-[#9aa0a6]" />
                      <span className="text-[#9aa0a6]">actualite</span>
                      <ChevronRight size={10} className="text-[#9aa0a6]" />
                      <span className="text-[#9aa0a6] font-medium">{formMetaTitle || "slug-de-l-url"}</span>
                    </div>
                    <div className="text-xl text-[#8ab4f8] hover:underline cursor-pointer font-medium line-clamp-1 leading-normal">
                      {formTitle || "Titre de l'article - SafeCallr"}
                    </div>
                    <div className="text-sm text-[#bdc1c6] line-clamp-2 leading-relaxed">
                      {formMetaDescription || "Renseignez une méta description pour que Google l'affiche ici."}
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: Settings & SEO Metadata */}
              <div className="space-y-6">
                {/* Meta details */}
                <div className="bg-surface-container-lowest border border-white/5 rounded-2xl p-6 space-y-4">
                  <h3 className="font-bold text-sm text-primary uppercase tracking-widest border-b border-white/5 pb-2">Configuration</h3>
                  
                  <div>
                    <label className="block text-xs uppercase tracking-widest font-bold text-slate-400 mb-2">Catégorie cible *</label>
                    <select 
                      value={formCategory}
                      onChange={(e) => setFormCategory(e.target.value as any)}
                      className="w-full bg-[#0a0a0c] border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-primary focus:outline-none transition-all"
                    >
                      <option value="grand_public">Grand Public / Particulier</option>
                      <option value="professionnel">Professionnel & Entreprise</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs uppercase tracking-widest font-bold text-slate-400 mb-2">Statut de publication</label>
                    <div className="flex items-center gap-6 mt-2">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input 
                          type="radio" 
                          name="published" 
                          checked={formPublished === true}
                          onChange={() => setFormPublished(true)}
                          className="text-primary focus:ring-0 focus:ring-offset-0 bg-[#0a0a0c]"
                        />
                        <span className="text-sm">Publié</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input 
                          type="radio" 
                          name="published" 
                          checked={formPublished === false}
                          onChange={() => setFormPublished(false)}
                          className="text-primary focus:ring-0 focus:ring-offset-0 bg-[#0a0a0c]"
                        />
                        <span className="text-sm">Brouillon</span>
                      </label>
                    </div>
                  </div>
                </div>

                {/* Cover Image Upload & Select */}
                <div className="bg-surface-container-lowest border border-white/5 rounded-2xl p-6 space-y-4">
                  <h3 className="font-bold text-sm text-primary uppercase tracking-widest border-b border-white/5 pb-2 flex items-center gap-2">
                    <ImageIcon size={16} /> Illustration
                  </h3>

                  <div>
                    <label className="block text-xs uppercase tracking-widest font-bold text-slate-400 mb-2">Image URL</label>
                    <input 
                      type="text" 
                      placeholder="Saisissez une URL d'image"
                      value={formImageUrl}
                      onChange={(e) => setFormImageUrl(e.target.value)}
                      className="w-full bg-[#0a0a0c] border border-white/10 rounded-xl px-4 py-2.5 text-xs focus:border-primary focus:outline-none transition-all"
                    />
                  </div>

                  {/* Preset Selector */}
                  <div>
                    <label className="block text-[10px] uppercase tracking-widest font-bold text-slate-500 mb-2">Ou choisir une illustration de sécurité</label>
                    <div className="grid grid-cols-2 gap-2">
                      {PRESET_IMAGES.map((img) => (
                        <button
                          key={img.name}
                          type="button"
                          onClick={() => setFormImageUrl(img.url)}
                          className={`relative h-12 rounded-lg overflow-hidden border transition-all ${
                            formImageUrl === img.url ? "border-primary scale-[0.98] ring-1 ring-primary" : "border-transparent opacity-60 hover:opacity-100"
                          }`}
                        >
                          <img src={img.url} alt={img.name} className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/60 flex items-center justify-center p-1 text-[8px] font-bold text-center text-white">
                            {img.name}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Local Upload */}
                  <div className="border-2 border-dashed border-white/10 rounded-xl p-4 text-center cursor-pointer hover:border-primary/50 transition-colors relative">
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={handleImageUpload}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                    />
                    <Upload className="mx-auto w-6 h-6 text-slate-400 mb-2" />
                    <span className="text-[10px] font-bold uppercase tracking-wider block text-slate-300">Importer une image locale</span>
                    <span className="text-[9px] text-slate-500 block mt-1">Limite : 800 Ko</span>
                  </div>

                  {formImageUrl && (
                    <div className="mt-4 rounded-xl overflow-hidden border border-white/10 h-32 relative">
                      <img src={formImageUrl} alt="Aperçu d'illustration" className="w-full h-full object-cover" />
                    </div>
                  )}
                </div>

                {/* SEO Configuration */}
                <div className="bg-surface-container-lowest border border-white/5 rounded-2xl p-6 space-y-4">
                  <h3 className="font-bold text-sm text-primary uppercase tracking-widest border-b border-white/5 pb-2">Métadonnées SEO</h3>
                  
                  <div>
                    <label className="block text-xs uppercase tracking-widest font-bold text-slate-400 mb-2">Meta Titre & Slug d'URL *</label>
                    <input 
                      type="text" 
                      placeholder="Ex: arnaque-faux-conseiller-bancaire"
                      value={formMetaTitle}
                      onChange={(e) => setFormMetaTitle(e.target.value)}
                      className="w-full bg-[#0a0a0c] border border-white/10 rounded-xl px-4 py-2.5 text-xs focus:border-primary focus:outline-none transition-all"
                      required
                    />
                    <p className="text-[10px] text-slate-500 mt-1">Sert également de lien direct d'URL.</p>
                  </div>

                  <div>
                    <label className="block text-xs uppercase tracking-widest font-bold text-slate-400 mb-2">Meta Description *</label>
                    <textarea 
                      rows={3}
                      placeholder="Description affichée sur Google (max 160 caractères)"
                      value={formMetaDescription}
                      onChange={(e) => setFormMetaDescription(e.target.value)}
                      className="w-full bg-[#0a0a0c] border border-white/10 rounded-xl px-4 py-2 text-xs focus:border-primary focus:outline-none transition-all"
                      maxLength={160}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs uppercase tracking-widest font-bold text-slate-400 mb-2">Mots-clés SEO</label>
                    <input 
                      type="text" 
                      placeholder="Ex: double authentification, spoofing, arnaque"
                      value={formSeoKeywords}
                      onChange={(e) => setFormSeoKeywords(e.target.value)}
                      className="w-full bg-[#0a0a0c] border border-white/10 rounded-xl px-4 py-2.5 text-xs focus:border-primary focus:outline-none transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs uppercase tracking-widest font-bold text-slate-400 mb-2">Ciblage Géographique (GEO SEO)</label>
                    <input 
                      type="text" 
                      placeholder="Ex: France, Lyon, Auvergne-Rhône-Alpes"
                      value={formGeoTargeting}
                      onChange={(e) => setFormGeoTargeting(e.target.value)}
                      className="w-full bg-[#0a0a0c] border border-white/10 rounded-xl px-4 py-2.5 text-xs focus:border-primary focus:outline-none transition-all"
                    />
                  </div>
                </div>

                <div className="flex gap-4">
                  <button 
                    type="submit"
                    className="flex-1 bg-primary text-on-primary py-4 rounded-xl font-bold uppercase tracking-widest hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-primary/25 transition-all text-sm"
                  >
                    Enregistrer l'article
                  </button>
                </div>
              </div>
            </form>
          </div>
        ) : (
          /* Articles List Layout */
          <div className="space-y-6">
            {/* Filter Section */}
            <div className="bg-surface-container-low border border-white/5 rounded-2xl p-6 flex flex-col md:flex-row gap-4 items-center justify-between">
              <div className="relative w-full md:w-96">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 w-5 h-5" />
                <input 
                  type="text" 
                  placeholder="Rechercher un article..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-[#0a0a0c] border border-white/10 rounded-xl pl-12 pr-4 py-3 text-sm focus:border-primary focus:outline-none transition-all"
                />
              </div>

              <div className="flex flex-wrap gap-4 w-full md:w-auto">
                <div className="flex items-center gap-2">
                  <Filter size={16} className="text-slate-400" />
                  <span className="text-xs uppercase tracking-wider font-bold text-slate-400">Catégorie :</span>
                  <select 
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="bg-[#0a0a0c] border border-white/10 rounded-lg px-3 py-2 text-xs focus:border-primary focus:outline-none"
                  >
                    <option value="all">Toutes</option>
                    <option value="grand_public">Grand Public</option>
                    <option value="professionnel">Professionnel</option>
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs uppercase tracking-wider font-bold text-slate-400">Statut :</span>
                  <select 
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="bg-[#0a0a0c] border border-white/10 rounded-lg px-3 py-2 text-xs focus:border-primary focus:outline-none"
                  >
                    <option value="all">Tous</option>
                    <option value="published">Publiés</option>
                    <option value="draft">Brouillons</option>
                  </select>
                </div>
              </div>
            </div>

            {loading ? (
              <div className="flex flex-col items-center justify-center py-20">
                <Loader2 className="w-10 h-10 text-primary animate-spin mb-4" />
                <p className="text-slate-400">Chargement des articles de blog...</p>
              </div>
            ) : filteredArticles.length === 0 ? (
              <div className="bg-surface-container-low border border-white/5 rounded-2xl py-20 text-center">
                <FileText className="mx-auto w-12 h-12 text-slate-500 mb-4" />
                <h3 className="font-bold text-lg mb-2">Aucun article trouvé</h3>
                <p className="text-slate-400 text-sm mb-6">Commencez dès maintenant en créant ou en générant votre premier article.</p>
                <button 
                  onClick={handleOpenCreate}
                  className="bg-primary text-on-primary px-6 py-3 rounded-xl font-bold uppercase text-xs tracking-wider"
                >
                  Ajouter un article
                </button>
              </div>
            ) : (
              /* Articles Grid */
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredArticles.map((art) => (
                  <div 
                    key={art.id}
                    className="bg-surface-container-low border border-white/5 hover:border-white/10 rounded-3xl overflow-hidden shadow-xl flex flex-col group transition-all duration-300"
                  >
                    {/* Illustration preview */}
                    <div className="h-44 relative bg-slate-900 overflow-hidden shrink-0">
                      {art.imageUrl ? (
                        <img 
                          src={art.imageUrl} 
                          alt={art.title} 
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <ImageIcon className="text-slate-600 w-10 h-10" />
                        </div>
                      )}
                      
                      {/* Category Badge */}
                      <span className={`absolute top-4 left-4 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        art.category === "grand_public" 
                          ? "bg-blue-500/20 text-blue-300 border border-blue-500/30" 
                          : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                      }`}>
                        {art.category === "grand_public" ? "Grand Public" : "Professionnel"}
                      </span>

                      {/* Publish Badge */}
                      <span className={`absolute top-4 right-4 px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 ${
                        art.published !== false 
                          ? "bg-primary/20 text-primary border border-primary/30" 
                          : "bg-slate-500/20 text-slate-400 border border-slate-500/30"
                      }`}>
                        {art.published !== false ? <CheckCircle size={10} /> : <XCircle size={10} />}
                        {art.published !== false ? "Publié" : "Brouillon"}
                      </span>
                    </div>

                    {/* Description */}
                    <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                      <div>
                        <h3 className="font-bold text-lg leading-snug line-clamp-2 mb-2 group-hover:text-primary transition-colors">
                          {art.title}
                        </h3>
                        <p className="text-xs text-slate-400 line-clamp-3">
                          {art.summary}
                        </p>
                      </div>

                      {/* Footer information */}
                      <div className="pt-4 border-t border-white/5 space-y-3 shrink-0">
                        <div className="flex items-center justify-between text-[10px] text-slate-500 font-medium">
                          {art.geoTargeting && (
                            <span className="flex items-center gap-1 text-primary">
                              <Globe size={10} /> {art.geoTargeting}
                            </span>
                          )}
                          <span>
                            {art.createdAt ? new Date(art.createdAt).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" }) : "N/A"}
                          </span>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2 justify-end">
                          <a 
                            href={`/actualite/${art.metaTitle}`}
                            target="_blank"
                            rel="noreferrer"
                            className="p-2 hover:bg-white/5 rounded-lg text-slate-400 hover:text-white transition-colors"
                            title="Voir sur le site"
                          >
                            <ExternalLink size={16} />
                          </a>
                          <button 
                            onClick={() => handleOpenEdit(art)}
                            className="p-2 hover:bg-white/5 rounded-lg text-slate-400 hover:text-primary transition-colors"
                            title="Modifier"
                          >
                            <Edit size={16} />
                          </button>
                          <button 
                            onClick={() => handleDelete(art.id)}
                            className="p-2 hover:bg-white/5 rounded-lg text-slate-400 hover:text-error transition-colors"
                            title="Supprimer"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
