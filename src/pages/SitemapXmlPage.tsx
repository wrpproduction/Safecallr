import React, { useEffect, useState } from "react";
import { db, collection, query, where, getDocs } from "../firebase";
import { DEFAULT_BLOG_ARTICLES } from "../data/defaultArticles";

export default function SitemapXmlPage() {
  const [xmlContent, setXmlContent] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function generateXml() {
      const baseUrl = "https://safecallr.com";
      const staticPages = [
        { url: "/", priority: "1.0", changefreq: "daily" },
        { url: "/particuliers", priority: "0.9", changefreq: "weekly" },
        { url: "/en/particuliers", priority: "0.8", changefreq: "weekly" },
        { url: "/es/particuliers", priority: "0.8", changefreq: "weekly" },
        { url: "/professionnels", priority: "0.9", changefreq: "weekly" },
        { url: "/en/professionnels", priority: "0.8", changefreq: "weekly" },
        { url: "/es/professionnels", priority: "0.8", changefreq: "weekly" },
        { url: "/entreprises", priority: "0.9", changefreq: "weekly" },
        { url: "/en/entreprises", priority: "0.8", changefreq: "weekly" },
        { url: "/es/entreprises", priority: "0.8", changefreq: "weekly" },
        { url: "/institutions", priority: "0.8", changefreq: "weekly" },
        { url: "/how-it-works", priority: "0.8", changefreq: "monthly" },
        { url: "/en/how-it-works", priority: "0.7", changefreq: "monthly" },
        { url: "/es/how-it-works", priority: "0.7", changefreq: "monthly" },
        { url: "/actualite", priority: "0.8", changefreq: "daily" },
        { url: "/en/actualite", priority: "0.7", changefreq: "daily" },
        { url: "/es/actualite", priority: "0.7", changefreq: "daily" },
        { url: "/company-contact", priority: "0.7", changefreq: "monthly" },
        { url: "/en/company-contact", priority: "0.6", changefreq: "monthly" },
        { url: "/es/company-contact", priority: "0.6", changefreq: "monthly" },
        { url: "/sitemap", priority: "0.7", changefreq: "weekly" },
        { url: "/plan-du-site", priority: "0.7", changefreq: "weekly" },
        { url: "/cgu", priority: "0.5", changefreq: "monthly" },
        { url: "/terms", priority: "0.5", changefreq: "monthly" },
        { url: "/terms-of-use", priority: "0.5", changefreq: "monthly" },
        { url: "/terminos", priority: "0.5", changefreq: "monthly" },
        { url: "/condiciones-uso", priority: "0.5", changefreq: "monthly" },
        { url: "/confidentialite", priority: "0.5", changefreq: "monthly" },
        { url: "/privacy", priority: "0.5", changefreq: "monthly" },
        { url: "/privacidad", priority: "0.5", changefreq: "monthly" },
        { url: "/mentions-legales", priority: "0.5", changefreq: "monthly" },
        { url: "/legal-notice", priority: "0.5", changefreq: "monthly" },
        { url: "/aviso-legal", priority: "0.5", changefreq: "monthly" },
      ];

      const todayStr = new Date().toISOString().split("T")[0];
      let blogArticlesList: any[] = [];

      try {
        const q = query(collection(db, "articles"), where("published", "==", true));
        const snapshot = await getDocs(q);
        snapshot.forEach((doc) => {
          const data = doc.data();
          blogArticlesList.push({ id: doc.id, ...data });
        });
      } catch (err) {
        console.error("Error generating XML sitemap in client:", err);
      }

      // Merge with default articles
      for (const defArt of DEFAULT_BLOG_ARTICLES) {
        if (!blogArticlesList.some(a => a.slug === defArt.slug || a.metaTitle === defArt.metaTitle || a.id === defArt.id)) {
          blogArticlesList.push(defArt);
        }
      }

      const escapeXml = (unsafe: string) => 
        unsafe.replace(/[<>&'"]/g, (c) => {
          switch (c) {
            case '<': return '&lt;';
            case '>': return '&gt;';
            case '&': return '&amp;';
            case '\'': return '&apos;';
            case '"': return '&quot;';
            default: return c;
          }
        });

      const staticXml = staticPages.map(page => `  <url>
    <loc>${escapeXml(baseUrl + page.url)}</loc>
    <lastmod>${todayStr}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`).join('\n');

      const dynamicXml = blogArticlesList.map(art => {
        const slug = art.slug || art.metaTitle || art.id;
        const artDate = art.updatedAt || art.createdAt;
        const lastmodStr = artDate ? new Date(artDate).toISOString().split("T")[0] : todayStr;
        return `  <url>
    <loc>${escapeXml(baseUrl + "/actualite/" + encodeURIComponent(slug))}</loc>
    <lastmod>${lastmodStr}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`;
      }).join('\n');

      const fullXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${staticXml}
${dynamicXml ? dynamicXml + '\n' : ''}</urlset>`;

      setXmlContent(fullXml);
      setLoading(false);
    }

    generateXml();
  }, []);

  if (loading) {
    return (
      <div style={{ background: '#020617', color: '#94a3b8', padding: '24px', fontFamily: 'monospace', fontSize: '13px', minHeight: '100vh' }}>
        Génération du fichier XML Sitemap...
      </div>
    );
  }

  return (
    <div style={{ background: '#020617', color: '#38bdf8', padding: '20px', fontFamily: 'monospace', fontSize: '12px', minHeight: '100vh', overflowX: 'auto' }}>
      <pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
        {xmlContent}
      </pre>
    </div>
  );
}
