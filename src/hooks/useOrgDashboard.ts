import { useState, useEffect } from "react";
import { 
  doc, 
  onSnapshot, 
  collection, 
  query, 
  orderBy, 
  limit, 
  getDoc,
  getDocs,
  where 
} from "firebase/firestore";
import { db } from "../firebase";
import { Organization, Member, AuthRequest } from "../lib/types";

export function useOrgDashboard(orgId: string | undefined) {
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [authRequests, setAuthRequests] = useState<AuthRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!orgId) return;

    setLoading(true);
    setError(null);

    let unsubOrg: () => void = () => {};
    let unsubMembers: () => void = () => {};
    let unsubAuth: () => void = () => {};

    // 1. Try organizations collection first
    const orgRef = doc(db, "organizations", orgId);
    
    unsubOrg = onSnapshot(orgRef, async (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        const capabilities = data.capabilities || {
          external: data.capabilities?.external ?? (data.type === "business" ? false : true),
          internal: data.capabilities?.internal ?? (data.type === "business" || data.serviceBusinessActive ? true : false)
        };
        const status = data.status || (data.active === false ? "suspended" : "active");
        setOrganization({
          id: snapshot.id,
          name: data.name || "Organisation",
          siret: data.siret || "",
          address: data.address || "",
          logoUrl: data.logoUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${data.name || 'SafeCallr'}`,
          representativeEmail: data.representativeEmail || data.adminEmail || data.email,
          representativeUserId: data.representativeUserId || data.adminUid || "",
          active: status === "active",
          status,
          capabilities,
          primaryColor: data.primaryColor || "#3dffa0",
          trustMessage: data.trustMessage || "Membre du réseau de confiance SafeCallr Business",
          officialPhones: data.officialPhones || [],
          allowedEmailDomains: data.allowedEmailDomains || [],
          createdAt: data.createdAt,
          createdBy: data.createdBy || "",
          ...data
        } as unknown as Organization);
        setError(null);
        setLoading(false);
      } else {
        // Fallback: Check 'companies' collection if not in 'organizations'
        try {
          const compRef = doc(db, "companies", orgId);
          const compSnap = await getDoc(compRef);
          if (compSnap.exists()) {
            const compData = compSnap.data();
            setOrganization({
              id: compSnap.id,
              name: compData.name || "Entreprise",
              siret: compData.siret || "",
              address: compData.address || "",
              logoUrl: compData.logoUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${compData.name || 'Company'}`,
              representativeEmail: compData.adminEmail || compData.email,
              representativeUserId: compData.adminUid || compData.userId || "",
              active: compData.status !== "suspended",
              primaryColor: "#3dffa0",
              trustMessage: "Membre du réseau de confiance SafeCallr Business",
              officialPhones: [],
              allowedEmailDomains: [],
              createdAt: compData.createdAt,
              createdBy: compData.createdBy || "",
              ...compData
            } as unknown as Organization);
            setError(null);
          } else {
            setError("Organisation non trouvée");
          }
        } catch (e: any) {
          setError(e.message || "Erreur de chargement de l'organisation");
        } finally {
          setLoading(false);
        }
      }
    }, (err) => {
      console.error("Org snapshot error:", err);
      // Fallback check on error
      getDoc(doc(db, "companies", orgId)).then((compSnap) => {
        if (compSnap.exists()) {
          const compData = compSnap.data();
          setOrganization({
            id: compSnap.id,
            name: compData.name || "Entreprise",
            siret: compData.siret || "",
            address: compData.address || "",
            logoUrl: compData.logoUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${compData.name || 'Company'}`,
            representativeEmail: compData.adminEmail || compData.email,
            representativeUserId: compData.adminUid || compData.userId || "",
            active: compData.status !== "suspended",
            primaryColor: "#3dffa0",
            trustMessage: "Membre du réseau de confiance SafeCallr Business",
            officialPhones: [],
            allowedEmailDomains: [],
            createdAt: compData.createdAt,
            createdBy: compData.createdBy || "",
            ...compData
          } as unknown as Organization);
          setError(null);
        } else {
          setError("Organisation non trouvée");
        }
      }).catch(() => {
        setError(err.message);
      }).finally(() => {
        setLoading(false);
      });
    });

    // 2. Members snapshot (from subcollection or query)
    unsubMembers = onSnapshot(query(collection(db, "organizations", orgId, "members"), orderBy("createdAt", "desc")), (snapshot) => {
      if (!snapshot.empty) {
        setMembers(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as unknown as Member)));
      } else {
        // Try fallback fetching pros belonging to company
        getDocs(query(collection(db, "pros"), where("companyId", "==", orgId))).then((proSnap) => {
          if (!proSnap.empty) {
            setMembers(proSnap.docs.map(d => {
              const p = d.data();
              return {
                id: d.id,
                firstName: p.firstName || "Collaborateur",
                lastName: p.lastName || "",
                email: p.email || "",
                role: p.isReferent ? "representative" : "collaborator",
                jobTitle: p.jobTitle || "",
                directPhone: p.phoneNumber || "",
                photoUrl: p.photoUrl || "",
                status: p.status === "active" ? "active" : "suspended",
                createdAt: p.createdAt,
                createdBy: p.createdBy || ""
              } as unknown as Member;
            }));
          }
        }).catch(() => {});
      }
    });

    // 3. Last 20 AuthRequests snapshot
    unsubAuth = onSnapshot(query(collection(db, "organizations", orgId, "authRequests"), orderBy("createdAt", "desc"), limit(20)), (snapshot) => {
      setAuthRequests(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as AuthRequest)));
    });

    return () => {
      unsubOrg();
      unsubMembers();
      unsubAuth();
    };
  }, [orgId]);

  return { organization, members, authRequests, loading, error };
}
