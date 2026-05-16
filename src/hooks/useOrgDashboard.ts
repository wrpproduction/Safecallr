import { useState, useEffect } from "react";
import { 
  doc, 
  onSnapshot, 
  collection, 
  query, 
  orderBy, 
  limit, 
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

    // 1. Organization snapshot
    const unsubOrg = onSnapshot(doc(db, "organizations", orgId), (snapshot) => {
      if (snapshot.exists()) {
        setOrganization({ id: snapshot.id, ...snapshot.data() } as Organization);
      } else {
        setError("Organisation non trouvée");
      }
      setLoading(false);
    }, (err) => {
      console.error(err);
      setError(err.message);
      setLoading(false);
    });

    // 2. Members snapshot
    const unsubMembers = onSnapshot(query(collection(db, "organizations", orgId, "members"), orderBy("createdAt", "desc")), (snapshot) => {
      setMembers(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Member)));
    });

    // 3. Last 20 AuthRequests snapshot
    const unsubAuth = onSnapshot(query(collection(db, "organizations", orgId, "authRequests"), orderBy("createdAt", "desc"), limit(20)), (snapshot) => {
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
