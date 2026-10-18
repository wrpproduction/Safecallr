import { onCall, HttpsError } from "firebase-functions/v2/https";
import { initializeApp } from "firebase-admin/app";
import { getFirestore, FieldValue, Timestamp } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";
import * as crypto from "crypto";

const app = initializeApp();
const db = getFirestore(app, "ai-studio-ffb666f4-67e6-42be-a2e6-2406f74f5b0d");
const authAdmin = getAuth(app);

/**
 * Cloud Function Callable: sendVerificationCode
 * Région: europe-west3
 * Génère un code OTP (6 chiffres + 1 lettre majuscule), stocke son hash SHA-256 dans Firestore
 * et crée un document dans la collection "mail" pour envoi via l'extension Trigger Email.
 */
export const sendVerificationCode = onCall({ region: "europe-west3" }, async (request) => {
  if (!request.auth || !request.auth.token.email) {
    throw new HttpsError("unauthenticated", "Vous devez être authentifié avec une adresse e-mail.");
  }

  const email = request.auth.token.email.toLowerCase().trim();
  const uid = request.auth.uid;
  const firstName = (request.data?.firstName || "").trim();

  const codeRef = db.collection("verification_codes").doc(uid);
  const existingDoc = await codeRef.get();

  // Rate Limiting : 1 code toutes les 60 secondes maximum
  if (existingDoc.exists) {
    const data = existingDoc.data();
    const createdAt = data?.createdAt as Timestamp | undefined;
    if (createdAt) {
      const elapsedMs = Date.now() - createdAt.toMillis();
      if (elapsedMs < 60000) {
        const remainingSecs = Math.ceil((60000 - elapsedMs) / 1000);
        throw new HttpsError(
          "resource-exhausted",
          `Veuillez patienter ${remainingSecs} seconde${remainingSecs > 1 ? "s" : ""} avant de demander un nouveau code.`
        );
      }
    }
  }

  // 1. Génération du code d'activation cryptographique (6 chiffres + 1 lettre majuscule)
  const letters = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const randomLetter = letters.charAt(crypto.randomInt(0, letters.length));
  const codeDigits = crypto.randomInt(100000, 1000000);
  const code = `${codeDigits}${randomLetter}`;

  // 2. Hash SHA-256 (jamais stocké en clair)
  const codeHash = crypto.createHash("sha256").update(code).digest("hex");

  // 3. Sauvegarde dans verification_codes/{uid}
  await codeRef.set({
    codeHash,
    email,
    createdAt: FieldValue.serverTimestamp(),
    expiresAt: new Date(Date.now() + 30 * 60 * 1000), // Expiration sous 30 minutes
    attempts: 0
  });

  // 4. Construction de l'e-mail officiel SafeCallr
  const subject = "Votre code d'activation SafeCallr";
  const greeting = firstName ? `Bonjour ${firstName},` : "Bonjour,";
  const text = `${greeting}\n\nMerci pour votre inscription sur SafeCallr !\n\nPour finaliser votre inscription et activer votre compte, veuillez saisir le code de sécurité ci-dessous dans l'application :\n\n${code}\n\nCe code de sécurité est strictement confidentiel et expire dans 30 minutes. L'équipe SafeCallr ne vous demandera jamais ce code par téléphone ou par e-mail.\n\nCet e-mail est automatique. Merci de ne pas y répondre directement.\n\nL'équipe SafeCallr`;

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Activez votre compte SafeCallr</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.5; color: #ffffff; background-color: #0b0f19; margin: 0; padding: 0; }
    .wrapper { max-width: 600px; margin: 0 auto; padding: 30px 20px; border: 1px solid #1f2937; border-radius: 16px; background-color: #0b0f19; }
    .header { text-align: center; margin-bottom: 30px; }
    .icon-container { display: inline-block; background-color: #10b981; padding: 12px; border-radius: 12px; margin-bottom: 10px; }
    .app-name { font-size: 24px; font-weight: 800; color: #10b981; margin: 0; letter-spacing: -0.05em; }
    .subtitle { font-size: 13px; color: #9ca3af; margin: 5px 0 0 0; text-transform: uppercase; letter-spacing: 0.15em; }
    .card { background-color: #111827; padding: 25px; border-radius: 12px; border: 1px solid #1f2937; text-align: center; }
    .card-title { font-size: 18px; font-weight: 700; color: #ffffff; margin-top: 0; margin-bottom: 15px; text-align: left; }
    .card-text { font-size: 14px; line-height: 1.6; color: #d1d5db; margin-bottom: 25px; text-align: left; }
    .code-container { margin: 30px 0; background-color: #1f2937; border: 1px solid #374151; padding: 15px 30px; border-radius: 12px; display: inline-block; }
    .code-text { font-size: 36px; font-weight: 800; letter-spacing: 0.2em; color: #10b981; font-family: monospace; }
    .warning-text { font-size: 12px; color: #9ca3af; margin-top: 15px; text-align: left; }
    .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #6b7280; border-top: 1px solid #1f2937; padding-top: 20px; }
    .footer-automated { margin: 0 0 10px 0; }
    .footer-team { margin: 0; font-weight: bold; color: #9ca3af; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <div class="icon-container">
        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 13c0 5-3.5 7.5-7.66 9.7a1 1 0 0 1-.68 0C7.5 20.5 4 18 4 13V6a1 1 0 0 1 .76-.97l8-2a1 1 0 0 1 .48 0l8 2A1 1 0 0 1 20 6z"/></svg>
      </div>
      <h1 class="app-name">SafeCallr</h1>
      <p class="subtitle">L'authentification humaine contre la fraude</p>
    </div>

    <div class="card">
      <h2 class="card-title">Activez votre compte</h2>
      <p class="card-text">
        ${greeting}<br/><br/>
        Merci pour votre inscription sur SafeCallr !<br/>
        Pour finaliser votre inscription et activer votre compte, veuillez saisir le code de sécurité (chiffres + lettre) ci-dessous dans l'application :
      </p>

      <div class="code-container">
        <span class="code-text">${code}</span>
      </div>

      <p class="warning-text">Ce code de sécurité est strictement confidentiel et expire dans 30 minutes. L'équipe SafeCallr ne vous demandera jamais ce code par téléphone ou par e-mail.</p>
    </div>

    <div class="footer">
      <p class="footer-automated">Cet e-mail est automatique. Merci de ne pas y répondre directement.</p>
      <p class="footer-team">L'équipe SafeCallr — MOTIOON</p>
    </div>
  </div>
</body>
</html>`;

  // 5. Déclenchement de l'envoi via l'extension Trigger Email (collection "mail")
  await db.collection("mail").add({
    to: email,
    message: {
      subject,
      text,
      html
    }
  });

  return { ok: true };
});

/**
 * Cloud Function Callable: verifyCode
 * Région: europe-west3
 * Valide le code haché, gère l'expiration et le compteur d'essais (max 5),
 * met à jour users/{uid} et pros/{uid} avec update() (sans créer pros si absent),
 * puis détruit le document de code.
 */
export const verifyCode = onCall({ region: "europe-west3" }, async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Vous devez être connecté pour vérifier votre code.");
  }

  const uid = request.auth.uid;
  const inputCode = (request.data?.code || "").trim().toUpperCase();

  if (!inputCode) {
    throw new HttpsError("invalid-argument", "Le code de validation est requis.");
  }

  const codeRef = db.collection("verification_codes").doc(uid);
  const codeSnap = await codeRef.get();

  if (!codeSnap.exists) {
    throw new HttpsError("not-found", "Aucun code d'activation en attente ou code déjà utilisé. Veuillez en demander un nouveau.");
  }

  const data = codeSnap.data()!;
  const currentAttempts = data.attempts || 0;

  // Sécurité anti-brute force : 5 essais max
  if (currentAttempts >= 5) {
    await codeRef.delete();
    throw new HttpsError(
      "resource-exhausted",
      "Nombre maximal de tentatives dépassé. Ce code a été révoqué par sécurité. Veuillez demander un nouveau code."
    );
  }

  // Vérification de l'expiration
  const expiresAt = data.expiresAt?.toDate ? data.expiresAt.toDate() : new Date(data.expiresAt);
  if (expiresAt && expiresAt.getTime() < Date.now()) {
    await codeRef.delete();
    throw new HttpsError("deadline-exceeded", "Ce code d'activation a expiré. Veuillez demander un nouveau code.");
  }

  // Comparaison par hachage SHA-256
  const inputHash = crypto.createHash("sha256").update(inputCode).digest("hex");
  if (inputHash !== data.codeHash) {
    const nextAttempts = currentAttempts + 1;
    await codeRef.update({ attempts: nextAttempts });
    const remaining = 5 - nextAttempts;
    if (remaining <= 0) {
      await codeRef.delete();
      throw new HttpsError(
        "resource-exhausted",
        "Code incorrect. Nombre maximal de tentatives atteint. Veuillez demander un nouveau code."
      );
    }
    throw new HttpsError(
      "invalid-argument",
      `Code incorrect (${remaining} tentative${remaining > 1 ? "s" : ""} restante${remaining > 1 ? "s" : ""}).`
    );
  }

  // SUCCÈS : Mise à jour du statut vérifié sur Firebase Auth et Firestore
  // 1. Firebase Auth : emailVerified = true
  await authAdmin.updateUser(uid, { emailVerified: true });

  // 2. Firestore : update users/{uid}
  try {
    await db.collection("users").doc(uid).update({ emailVerified: true });
  } catch (err: any) {
    console.warn(`[verifyCode] Échec mise à jour users/${uid} :`, err.message);
  }

  // 3. Firestore : update pros/{uid} (ne pas créer si inexistant, ignorer NOT_FOUND)
  try {
    await db.collection("pros").doc(uid).update({ emailVerified: true });
  } catch (err: any) {
    const isNotFound = err.code === 5 || err.message?.includes("NOT_FOUND") || err.message?.includes("No document to update");
    if (!isNotFound) {
      console.warn(`[verifyCode] Note mise à jour pros/${uid} :`, err.message);
    }
  }

  // 4. Suppression immédiate du code à usage unique
  await codeRef.delete();

  return { ok: true };
});

/**
 * Cloud Function Callable: submitCompanyContact
 * Région: europe-west3
 * Accessible aux visiteurs (connectés ou non).
 * Enregistre la demande entreprise et déclenche l'email d'alerte sans exposer de droits en écriture directe sur "mail".
 */
export const submitCompanyContact = onCall({ region: "europe-west3" }, async (request) => {
  const { firstName, lastName, email, phone, companyName, message } = request.data || {};
  if (!firstName || !lastName || !email || !message) {
    throw new HttpsError("invalid-argument", "Veuillez renseigner tous les champs obligatoires (prénom, nom, email, message).");
  }

  const cleanEmail = email.trim().toLowerCase();

  // 1. Enregistrer la demande
  await db.collection("companyContactRequests").add({
    firstName: firstName.trim(),
    lastName: lastName.trim(),
    email: cleanEmail,
    phone: (phone || "").trim(),
    companyName: (companyName || "").trim(),
    message: message.trim(),
    targetEmail: "contact@safecallr.com",
    status: "new",
    createdAt: FieldValue.serverTimestamp()
  });

  // 2. Envoyer l'email via la collection mail (Admin SDK)
  const cleanMessage = message.trim().replace(/\n/g, "<br>");
  const subject = `NOUVELLE DEMANDE SAFECALLR : ${companyName || `${firstName} ${lastName}`}`;
  const html = `
    <h3>Nouvelle demande de contact entreprise</h3>
    <p><strong>Nom :</strong> ${firstName} ${lastName}</p>
    <p><strong>Entreprise :</strong> ${companyName || "N/A"}</p>
    <p><strong>Email :</strong> ${cleanEmail}</p>
    <p><strong>Téléphone :</strong> ${phone || "N/A"}</p>
    <p><strong>Message :</strong></p>
    <p>${cleanMessage}</p>
  `;
  const text = `Nouvelle demande de contact entreprise\nNom: ${firstName} ${lastName}\nEntreprise: ${companyName || "N/A"}\nEmail: ${cleanEmail}\nTéléphone: ${phone || "N/A"}\n\nMessage:\n${message.trim()}`;

  await db.collection("mail").add({
    to: "contact@safecallr.com",
    replyTo: cleanEmail,
    message: {
      subject,
      text,
      html
    }
  });

  return { ok: true };
});

/**
 * Cloud Function Callable: sendPasswordReset
 * Région: europe-west3
 * Génère le lien sécurisé de réinitialisation de mot de passe via l'Admin SDK,
 * et envoie un e-mail officiel aux couleurs de SafeCallr via la collection "mail".
 */
export const sendPasswordReset = onCall({ region: "europe-west3" }, async (request) => {
  const email = (request.data?.email || "").trim().toLowerCase();

  if (!email || !email.includes("@")) {
    throw new HttpsError("invalid-argument", "L'adresse email est requise et doit être valide.");
  }

  // 1. Rate Limiting : 1 demande toutes les 60 secondes maximum par adresse e-mail
  const emailHash = crypto.createHash("sha256").update(email).digest("hex");
  const limitRef = db.collection("password_reset_limits").doc(emailHash);
  const limitDoc = await limitRef.get();

  if (limitDoc.exists) {
    const data = limitDoc.data();
    const lastRequestedAt = data?.lastRequestedAt as Timestamp | undefined;
    if (lastRequestedAt) {
      const elapsedMs = Date.now() - lastRequestedAt.toMillis();
      if (elapsedMs < 60000) {
        const remainingSecs = Math.ceil((60000 - elapsedMs) / 1000);
        throw new HttpsError(
          "resource-exhausted",
          `Veuillez patienter ${remainingSecs} seconde${remainingSecs > 1 ? "s" : ""} avant de refaire une demande pour cette adresse.`
        );
      }
    }
  }

  // Enregistrer immédiatement l'horodatage de la tentative (empêche les attaques par force brute ou timing)
  await limitRef.set({
    lastRequestedAt: FieldValue.serverTimestamp()
  });

  // 2. Vérifier si l'utilisateur existe dans Firebase Auth
  let userExists = false;
  try {
    await authAdmin.getUserByEmail(email);
    userExists = true;
  } catch (err: any) {
    if (err.code === "auth/user-not-found") {
      userExists = false;
    } else {
      console.warn("[sendPasswordReset] Erreur de vérification utilisateur :", err);
      userExists = false;
    }
  }

  // Règle de sécurité stricte : Toujours renvoyer { ok: true }, que l'adresse existe ou non
  // Ne jamais révéler publiquement si un compte existe dans la base
  if (!userExists) {
    console.log(`[sendPasswordReset] Demande reçue pour adresse non répertoriée (${email}) - retour { ok: true } silencieux`);
    return { ok: true };
  }

  // 3. Générer le lien sécurisé Firebase et router vers notre page brandée SafeCallr
  const firebaseRawLink = await authAdmin.generatePasswordResetLink(email);
  let resetLink = firebaseRawLink;

  try {
    const parsedUrl = new URL(firebaseRawLink);
    const oobCode = parsedUrl.searchParams.get("oobCode");
    if (oobCode) {
      resetLink = `https://safecallr.com/reset-password?oobCode=${oobCode}&email=${encodeURIComponent(email)}`;
    }
  } catch (parseErr) {
    console.warn("[sendPasswordReset] Impossible de parser l'URL Firebase :", parseErr);
  }

  // 4. Template HTML officiel SafeCallr (Dark navy #0b0f19 et Vert émeraude #10b981)
  const subject = "Réinitialisation de votre mot de passe SafeCallr";
  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Réinitialisation de mot de passe SafeCallr</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.5; color: #ffffff; background-color: #0b0f19; margin: 0; padding: 0; }
    .wrapper { max-width: 600px; margin: 0 auto; padding: 30px 20px; border: 1px solid #1f2937; border-radius: 16px; background-color: #0b0f19; }
    .header { text-align: center; margin-bottom: 30px; }
    .icon-container { display: inline-block; background-color: #10b981; padding: 12px; border-radius: 12px; margin-bottom: 10px; }
    .app-name { font-size: 24px; font-weight: 800; color: #10b981; margin: 0; letter-spacing: -0.05em; }
    .subtitle { font-size: 13px; color: #9ca3af; margin: 5px 0 0 0; text-transform: uppercase; letter-spacing: 0.15em; }
    .card { background-color: #111827; padding: 25px; border-radius: 12px; border: 1px solid #1f2937; text-align: center; }
    .card-title { font-size: 18px; font-weight: 700; color: #ffffff; margin-top: 0; margin-bottom: 15px; text-align: left; }
    .card-text { font-size: 14px; line-height: 1.6; color: #d1d5db; margin-bottom: 25px; text-align: left; }
    .button-container { margin: 30px 0; text-align: center; }
    .btn { background-color: #10b981; color: #0b0f19 !important; padding: 14px 28px; border-radius: 10px; text-decoration: none; font-weight: 800; font-size: 15px; display: inline-block; }
    .warning-text { font-size: 12px; color: #9ca3af; margin-top: 20px; text-align: left; line-height: 1.5; }
    .fallback-url { font-size: 11px; color: #6b7280; word-break: break-all; margin-top: 15px; text-align: left; }
    .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #6b7280; border-top: 1px solid #1f2937; padding-top: 20px; }
    .footer-automated { margin: 0 0 10px 0; }
    .footer-team { margin: 0; font-weight: bold; color: #9ca3af; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <div class="icon-container">
        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 13c0 5-3.5 7.5-7.66 9.7a1 1 0 0 1-.68 0C7.5 20.5 4 18 4 13V6a1 1 0 0 1 .76-.97l8-2a1 1 0 0 1 .48 0l8 2A1 1 0 0 1 20 6z"/></svg>
      </div>
      <h1 class="app-name">SafeCallr</h1>
      <p class="subtitle">L'authentification humaine contre la fraude</p>
    </div>

    <div class="card">
      <h2 class="card-title">Réinitialisation de votre mot de passe</h2>
      <p class="card-text">
        Bonjour,<br/><br/>
        Vous avez demandé la réinitialisation du mot de passe associé à votre compte SafeCallr (<strong>${email}</strong>). Cliquez sur le bouton ci-dessous pour choisir votre nouveau mot de passe :
      </p>

      <div class="button-container">
        <a href="${resetLink}" class="btn" target="_blank" rel="noopener noreferrer">Réinitialiser mon mot de passe</a>
      </div>

      <p class="warning-text">Ce lien est sécurisé et valable pendant 1 heure. Si vous n'êtes pas à l'origine de cette demande, vous pouvez ignorer cet e-mail ; votre mot de passe actuel restera inchangé.</p>
      <p class="fallback-url">Si le bouton ne fonctionne pas, copiez ce lien dans votre navigateur :<br/>${resetLink}</p>
    </div>

    <div class="footer">
      <p class="footer-automated">Cet e-mail est automatique. Merci de ne pas y répondre directement.</p>
      <p class="footer-team">L'équipe SafeCallr — MOTIOON</p>
    </div>
  </div>
</body>
</html>`;

  const text = `SafeCallr — Réinitialisation de mot de passe\n\nBonjour,\n\nVous avez demandé la réinitialisation du mot de passe pour votre compte SafeCallr (${email}).\n\nLien de réinitialisation : ${resetLink}\n\nCe lien est sécurisé et valable 1 heure.\n\nL'équipe SafeCallr — MOTIOON`;

  // 4. Injecter dans la collection mail
  await db.collection("mail").add({
    to: email,
    message: {
      subject,
      html,
      text
    }
  });

  return { ok: true };
});

