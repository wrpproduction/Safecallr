import { useState, useEffect } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { auth, db } from "../firebase";
import { doc, getDoc, onSnapshot } from "firebase/firestore";
import { Member, Organization } from "../lib/types";

export function useCollaboratorAuth() {
  const [member, setMember] = useState<Member | null>(null);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = async () => {
      const user = auth.currentUser;
      if (!user) {
        navigate("/login");
        return;
      }

      try {
        // We need to find which organization this user belongs to.
        // In a real app, we might have this in user custom claims or a mapping table.
        // For this MVP, we'll look for organizations where this user is a member.
        // Given the constraints and Step 2 implementation, orgId is usually part of the context or we can find it.
        // Let's look for organizations/orgId/members/userId
        
        // Since we don't have a global search for members easily without collectionGroup (which needs index),
        // we'll use a stored orgId in localStorage or pass it via context if possible.
        // BUT the user request says "/me", so it's a generic route.
        // I will implement a search in "users" doc to see if it has an "orgId" field we added in Step 2.
        
        const userDoc = await getDoc(doc(db, "users", user.uid));
        const orgId = userDoc.data()?.orgId;

        if (!orgId) {
          setError("Aucune organisation associée à ce compte.");
          setLoading(false);
          return;
        }

        // Get Org
        const orgDoc = await getDoc(doc(db, "organizations", orgId));
        if (!orgDoc.exists()) {
          setError("Organisation introuvable.");
          setLoading(false);
          return;
        }
        const orgData = orgDoc.data() as Organization;
        setOrganization(orgData);

        if (!orgData.active) {
          navigate("/organization-inactive");
          return;
        }

        // Get Member
        const memberRef = doc(db, "organizations", orgId, "members", user.uid);
        const unsubscribe = onSnapshot(memberRef, (snap) => {
          if (!snap.exists()) {
            setError("Profil membre introuvable.");
            setLoading(false);
            return;
          }
          const mData = snap.data() as Member;
          setMember(mData);
          setLoading(false);

          if (mData.status === "suspended" || mData.status === "blocked") {
            navigate("/account-suspended");
          }
        });

        return () => unsubscribe();

      } catch (err: any) {
        console.error("Collaborator Auth Error:", err);
        setError(err.message);
        setLoading(false);
      }
    };

    checkAuth();
  }, [navigate]);

  return { member, organization, loading, error };
}
