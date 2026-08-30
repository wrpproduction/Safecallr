# Inventaire Complet des Interactions Firestore & Storage

Ce document recense l'ensemble des 67 fichiers et des opérations Firestore / Firebase Storage du projet.

---

## 1. Liste des 67 fichiers analysés

### Composants, Contextes & Services (18 fichiers)
1. `src/App.tsx`
2. `src/components/AdminProtectedRoute.tsx`
3. `src/components/Layout.tsx`
4. `src/components/dashboard/BrandSettingsSection.tsx`
5. `src/components/me/ProfileEditCard.tsx`
6. `src/components/me/RecentAuthsSummary.tsx`
7. `src/components/me/TriggerAuthBlock.tsx`
8. `src/components/pro/ProLayout.tsx`
9. `src/components/pro/ProRouteGuard.tsx`
10. `src/components/seo/PageContentManager.tsx`
11. `src/contexts/LanguageContext.tsx`
12. `src/contexts/WorkspaceContext.tsx`
13. `src/hooks/useCollaboratorAuth.ts`
14. `src/hooks/useOrgDashboard.ts`
15. `src/lib/connections.ts`
16. `src/lib/imageUtils.ts`
17. `src/services/emailService.ts`
18. `src/services/pushNotifications.ts`

### Pages Utilisateurs & Publiques (20 fichiers)
19. `src/pages/Actualites.tsx`
20. `src/pages/ArticleDetail.tsx`
21. `src/pages/Auth.tsx`
22. `src/pages/AuthRequestDetails.tsx`
23. `src/pages/CompanyContact.tsx`
24. `src/pages/CompleteProfile.tsx`
25. `src/pages/Contacts.tsx`
26. `src/pages/Dashboard.tsx`
27. `src/pages/History.tsx`
28. `src/pages/Landing.tsx`
29. `src/pages/NewRequest.tsx`
30. `src/pages/OrgAuthRequestDetails.tsx`
31. `src/pages/Profile.tsx`
32. `src/pages/Register.tsx`
33. `src/pages/RequestStatus.tsx`
34. `src/pages/SitemapPage.tsx`
35. `src/pages/SitemapXmlPage.tsx`
36. `src/pages/VerifyEmail.tsx`
37. `src/pages/Welcome.tsx`
38. `src/pages/me/MeHistory.tsx`

### Pages Professionnels & Organisations (12 fichiers)
39. `src/pages/pro/ProClients.tsx`
40. `src/pages/pro/ProDashboard.tsx`
41. `src/pages/pro/ProHistory.tsx`
42. `src/pages/pro/ProLogin.tsx`
43. `src/pages/pro/ProProfile.tsx`
44. `src/pages/pro/ProRegister.tsx`
45. `src/pages/pro/ProRequestCode.tsx`
46. `src/pages/pro/ProRequestWait.tsx`
47. `src/pages/pro/ProSearch.tsx`
48. `src/pages/business/AdminDashboard.tsx`
49. `src/pages/business/AdminMembers.tsx`
50. `src/pages/business/BusinessRegister.tsx`

### Pages Super-Admin (13 fichiers)
51. `src/pages/AdminAlerts.tsx`
52. `src/pages/AdminCompanies.tsx`
53. `src/pages/AdminCreateOrganization.tsx`
54. `src/pages/AdminDashboard.tsx`
55. `src/pages/AdminLogin.tsx`
56. `src/pages/AdminOrganizationDetail.tsx`
57. `src/pages/AdminPros.tsx`
58. `src/pages/AdminRequests.tsx`
59. `src/pages/AdminUsers.tsx`
60. `src/pages/admin/AdminBlog.tsx`
61. `src/pages/admin/AdminBusinessBilling.tsx`
62. `src/pages/admin/AdminBusinessSpace.tsx`
63. `src/pages/admin/AdminOrganizationsList.tsx`

### Serveur Backend & Fonctions (4 fichiers)
64. `server.ts`
65. `server/notify.ts`
66. `server/stats.ts`
67. `functions/index.ts`
