# Design System — Vendémian Tambourin (front public)

**Source** : maquettes validées du canvas Claude Design
(<https://claude.ai/artifact/HMJG4Z85iZobGTzk8gWjYR>, **version 11**, 2026-09-24) — rangée 1 :
`Main` (Accueil), `LeTambourin`, `Presentation` (Le club), `Calendrier`, `Galerie`, `Partenaires`,
`Contact` ; rangée 2 : `MobileFerme`, `MenuMobile`, `Erreur404`, `Confidentialite`, `Etats`.
Direction retenue : **« Fronton »** (palette relevée sur la photo du Fronton Vendémianais,
écusson du club), enrichie en v10–v11 de la **mise en page éditoriale** de la maquette « Site
vitrine » V1 : titres géants, mot-clé surligné en jaune, sections numérotées « 01 / 02 ».

**Tokens exécutables** : [`design/tokens.css`](design/tokens.css) — à reprendre tel quel dans
`src/styles/globals.css` (tâche T002).

Ce document est descriptif (ce que les maquettes établissent) **et** normatif là où les maquettes
sont muettes : états d'interaction, focus, responsive, contrastes insuffisants. Ces ajouts sont
signalés par 🆕 et récapitulés au §8.

---

## 1. Couleurs

### 1.1 Palette de marque

| Token | Hex | Origine | Usage |
|---|---|---|---|
| `vt-ink` | `#1C1B18` | ombre du fronton | header, footer, bandeaux de page, blocs sombres, texte principal |
| `vt-terracotta` | `#B5433A` | brique du mur | liens dans le texte, mois des matchs à venir, chip « défaite », icônes de lien externe |
| `vt-yellow` | `#F0C419` | maillot | CTA primaire, eyebrow, item de nav actif, tag « À venir », icônes sur fond sombre |
| `vt-cream` | `#F2EDE0` | crépi clair | texte de titre sur fond sombre, cartes des compétitions passées |

Accents dérivés : `vt-terracotta-hover #8A3229` (déjà dans les maquettes via `a:hover`),
`vt-yellow-hover #D9B016` 🆕.

### 1.2 Rôles

| Rôle | Token | Hex |
|---|---|---|
| Fond de page | `vt-bg` | `#F7F3EA` |
| Surface carte | `vt-surface` | `#FFFFFF` |
| Surface désaturée (passé, encadré Turnstile) | `vt-surface-muted` | `#F2EDE0` |
| Surface sombre (encadrement, carte contact) | `vt-surface-dark` | `#1C1B18` |
| Texte fort / titres (clair) | `vt-text` | `#1C1B18` |
| Paragraphe long | `vt-text-prose` | `#3A362E` |
| Texte secondaire (labels, méta) | `vt-text-secondary` | `#5C574A` |
| Texte tertiaire | `vt-text-muted` 🆕 | `#6B6657` |
| Texte tertiaire **grande taille uniquement** | `vt-text-muted-large` | `#7A7566` |
| Corps sur fond sombre | `vt-text-on-dark` | `#E4DFD0` |
| Titre sur fond sombre | `vt-text-on-dark-strong` | `#F2EDE0` |
| Footer | `vt-text-on-dark-muted` | `#9B9686` |
| Bordure de carte | `vt-border` | `rgb(28 27 24 / .10)` |
| Bordure de champ / chip inactive | `vt-border-strong` | `rgb(28 27 24 / .18)` |
| Bordure discrète / séparateur | `vt-border-subtle` | `rgb(28 27 24 / .08)` |
| Séparateur sur fond sombre | `vt-border-on-dark` | `rgb(242 237 224 / .12)` |
| Filet sous header solide | `vt-border-header` | `rgb(242 237 224 / .08)` |

Tuiles de la galerie sans photo (placeholders) : `#B5433A`, `#8A8574`, `#3A362E`, `#C9A227`,
`#6B655A` — icône `#F2EDE0` (ou `#1C1B18` sur la tuile jaune).

### 1.3 Contrastes (WCAG AA — principe II de la constitution)

Ratios calculés sur les couples réellement utilisés dans les maquettes :

| Couple | Ratio | Verdict |
|---|---|---|
| `#F0C419` sur `#1C1B18` (eyebrow, nav active) | 10.3:1 | ✅ |
| `#1C1B18` sur `#F0C419` (CTA primaire, bande CTA) | 10.3:1 | ✅ |
| `#E4DFD0` sur `#1C1B18` | 12.9:1 | ✅ |
| `#F2EDE0` sur `#1C1B18` | 14.7:1 | ✅ |
| `#9B9686` sur `#1C1B18` (footer) | 5.8:1 | ✅ |
| `#B5433A` sur `#F7F3EA` (liens) | 4.95:1 | ✅ |
| `#F2EDE0` sur `#B5433A` (chip « défaite ») | 4.7:1 | ✅ |
| `#5C574A` sur `#F7F3EA` | 6.2:1 | ✅ |
| `#3A362E` sur `#F7F3EA` | 10.3:1 | ✅ |
| `#7A7566` sur `#FFFFFF` | 4.6:1 | ⚠️ limite |
| **`#7A7566` sur `#F7F3EA`** (libellé « Compétitions passées », descriptions) | **4.15:1** | ❌ |
| **`#7A7566` sur `#F2EDE0`** (dates des compétitions passées) | **3.9:1** | ❌ |
| **`#8A8574` sur `#F2EDE0`** (mois des compétitions passées) | **3.2:1** | ❌ |

**Règle d'implémentation** : remplacer `#7A7566` et `#8A8574` par **`vt-text-muted #6B6657`**
(4.9:1 sur crème, 5.7:1 sur blanc) pour tout texte < 24px. `#7A7566` reste admis pour du texte
≥ 24px ou ≥ 18.7px gras (seuil AA « grand texte », 3:1). Le rendu visuel est quasi identique.

---

## 2. Typographie

Deux familles, chargées via **`next/font/google`** (et non le `<link>` Google Fonts des maquettes —
`next/font` auto-héberge les fichiers, supprime une requête tierce et évite le FOUT, ce qui sert
directement les Core Web Vitals) :

- **Barlow Condensed** — 600 / 700 / 800 → titres `h1`–`h3`, libellés de boutons et de chips.
  Toujours `text-transform: uppercase`, `letter-spacing: 0.01em`.
- **Barlow** — 400 / 500 / 600 / 700 → corps de texte, nav, champs, métadonnées.

### Échelle (desktop ≥ 1280px)

| Token | Taille | Interligne | Graisse | Emploi |
|---|---|---|---|---|
| `text-hero` | 88px | 0.9 | 800 | H1 de la home (2 lignes, en bas du hero) |
| `text-page-title` | 124px | 0.88 | 800 | H1 géant des bandeaux de page (v11) |
| `text-cta` | 112px | 0.86 | 800 | titre des bandes d'appel (« Viens essayer… », « Devenir partenaire ») |
| `text-section-head` | 64px | 0.9 | 800 | H2 des en-têtes de section numérotés |
| `text-section-number` | 72px | 0.85 | 800 | chiffre « 01 » jaune contouré (décoratif) |
| `text-statement` | 44px | 1.02 | 800 | phrase d'accroche en capitales (bloc Le club) |
| `text-section` | 30px | 1.2 | 700 | H2 secondaire (titre de formulaire, bloc) |
| `text-subsection` | 22px | 1.2 | 700 | H3 de groupe |
| `text-card-title` | 19–20px | 1.3 | 700 | H3 de carte, titre de compétition |
| `text-lead` | 17–18px | 1.6 | 400 | chapô de bandeau, accroche du hero |
| `text-body` | 16px | 1.75 | 400 | paragraphes |
| `text-ui` | 15px | 1.4 | 600 | nav, champs, texte de carte sombre |
| `text-meta` | 14px | 1.6 | 400–600 | métadonnées, chips, texte de carte |
| `text-small` | 13px | 1.6 | 700 | eyebrow, labels de formulaire, footer, RGPD |
| `text-micro` | 11–12px | 1 | 800 | tags (« À venir »), mois |

Les maquettes utilisent ponctuellement 14.5px / 15.5px / 13.5px : **arrondir à l'échelle**
(14px / 15px / 13px) à l'implémentation.

### Interlettrage

- Eyebrow : `0.14em` + uppercase + 700.
- Labels de formulaire, tags : `0.04em`.
- Nav, boutons, chips : `0.02em`.

### Échelle mobile (< 768px) 🆕

Les titres géants utilisent `clamp()` (voir `tokens.css`) : hero 44px, H1 de page 48px, bande
d'appel 44px, en-tête de section 36px (chiffre 40px), accroche 28px, H2 secondaire 24px, H3 18px,
chapô 16px, corps 16px. Les titres restent en capitales, interligne serré (≤ 0.92), jamais plus de
3 lignes à 375px.

### Mot surligné 🆕 (v11)

Un seul mot-clé par titre géant est surligné : `<em>` sans italique, fond `vt-yellow`, texte
`vt-ink`, `padding: 0 .08em`, `box-decoration-break: clone`. Contraste 10.3:1. L'emphase est
sémantique (`<em>`) et non purement visuelle. Exemples validés : « La balle *vole*, nous
suivons. », « Un jeu occitan, *vivant* depuis 700 ans. », « Un club de village, *depuis 1923*. »,
« Calendrier *&* résultats. », « Ce que ça *donne*. », « Merci à nos *partenaires*. », « Une
question ? *Écris-nous*. »

---

## 3. Espacement, formes, iconographie

- **Grille d'espacement** : multiples de 4px — `4 · 8 · 12 · 16 · 20 · 24 · 28 · 32 · 40 · 56 · 64 · 72`.
  Les valeurs impaires des maquettes (14, 18, 22, 26) sont à normaliser (→ 16, 20, 24, 24).
- **Gouttière de page** : 40px (desktop). 🆕 24px en tablette, 20px en mobile.
- **Rythme vertical** : bandeau de page `64px / 56px` (haut/bas), sections `64px`, header et footer
  `20px / 24px` verticaux.
- **Rayons** : `4px` contrôles (boutons, champs, chips de résultat) · `6px` cartes et images ·
  `8px` pastille d'icône · `999px` chips de filtre et tags.
- **Ombres** : aucune. Le design est plat, la hiérarchie passe par le fond et la bordure.
  Seul ajout 🆕 : `shadow-vt-card-hover` (`0 2px 8px rgb(28 27 24 / .06)`) au survol des cartes
  cliquables.
- **Icônes** : jeu **Lucide** (tracés identiques à ceux des maquettes), `stroke-width` 2 (1.8 sur les
  tuiles d'image), `stroke-linecap/linejoin: round`, tailles 18 / 22 / 30px. Couleur : `vt-yellow`
  sur fond sombre, `vt-terracotta` pour les liens externes, `vt-ink` dans la pastille jaune.
- **Images** : `object-fit: cover`, `object-position: center 30%` pour la photo du fronton (cadrage
  validé), rayon 6px hors hero.

---

## 4. Composants

Chaque composant est décrit par son ancrage dans les maquettes, ses tokens, ses états (🆕 quand ils
ne sont pas maquettés) et ses règles d'accessibilité.

### 4.1 Header / navigation

Deux variantes :

- **Overlay** (Accueil) : `position: relative` au-dessus du hero, fond transparent, aucune bordure.
- **Solide** (5 pages intérieures) : fond `vt-ink`, filet bas `vt-border-header`.

Commun : `padding: 12px 40px`, **écusson du club à gauche** (52px de haut, lien accueil, décision
2026-09-24 — §8) et nav à droite (`justify-content: space-between`), 7 liens — Accueil, Le
tambourin, Le club, Calendrier, Galerie, Partenaires, Contact (FR-027), `gap: 26px` → 24px, 15px / 600 /
uppercase / `0.02em`.

| État | Couleur |
|---|---|
| Défaut | `vt-text-on-dark` `#E4DFD0` |
| Actif (page courante) | `vt-yellow` `#F0C419` |
| Survol 🆕 | `vt-yellow` `#F0C419` |
| Focus 🆕 | contour `vt-yellow` 2px, offset 2px |

A11y : `<nav aria-label="Navigation principale">`, `aria-current="page"` sur l'item actif (la
couleur seule ne doit pas porter l'information).

### 4.2 Footer

Fond `vt-ink`, texte `vt-text-on-dark-muted` 13px, `padding: 24px 40px`, copyright « © Vendémian
Tambourin — Club de tambourin depuis 1923 » à gauche, liens « Partenaires » / « Contact » /
« Politique de confidentialité » à droite (`gap: 18px` → 16px). Survol 🆕 : `#E4DFD0`.

### 4.3 Hero plein écran (Accueil uniquement)

`min-height: 860px`, photo en fond (`fronton.jpg`) + overlay `--vt-hero-overlay` (sombre en haut
pour le header, **quasi transparent au centre** pour laisser voir la photo, sombre en bas pour le
texte). Contenu **aligné en bas** (`justify-content: flex-end`, 40px au-dessus des chiffres) :
indicateur de saison (pastille jaune + libellé 13px) → H1 88px sur 2 lignes → accroche 18px (max
560px) → 2 boutons (« Découvrir le sport », « Voir le calendrier »). En pied de hero, la rangée des
**chiffres clés** (§4.15). La bande « Prochain match » de la v9 est remplacée par la carte §4.14.

A11y : la photo est décorative (`alt=""`) puisque le texte porte l'information ;
`priority` sur `next/image` (c'est le LCP).

### 4.4 Bandeau de page (5 pages intérieures)

Fond `vt-ink`, `padding: 80px 40px 72px`. Structure : **eyebrow** (trait 22×3px jaune + libellé
jaune 13px/700/`0.14em`) → `h1` **124px** crème, capitales, interligne 0.88, un mot surligné
(§2) → chapô 19px `#E4DFD0`, largeur max 640px, 28px au-dessus.

Eyebrows utilisés : « Le sport », « Le club », « Compétitions », « Galerie », « Ils soutiennent le
club », « Nous contacter », « Vos données ».

### 4.5 Boutons

| Variante | Fond | Texte | Bordure | Où |
|---|---|---|---|---|
| Primaire | `vt-yellow` | `vt-ink` | — | « Voir le calendrier », « Envoyer le message » |
| Secondaire sur sombre | transparent | `#F2EDE0` | 2px `#6B655A` | « Découvrir le club » |
| Sur fond jaune | `vt-ink` | `#F2EDE0` | — | « Contacter le club » (bande CTA) |
| Tertiaire sur clair | transparent | `vt-ink` | 1px `rgb(28 27 24 / .2)` | « Charger plus de photos » |

Commun : `font-display`, 800, uppercase, `0.02em`, rayon 4px, `padding: 15px 30px`
(13px 28px quand la bordure fait 2px, pour conserver la même hauteur).

États 🆕 : survol → primaire `vt-yellow-hover`, secondaire/tertiaire → fond
`rgb(242 237 224 / .08)` resp. `rgb(28 27 24 / .05)` ; actif → translation 1px ;
focus → contour 2px (jaune sur sombre, encre sur clair), offset 2px ;
désactivé → opacité 0.5, `cursor: not-allowed`.
Hauteur de cible ≥ 44px (déjà le cas : 15+15+16×1.2 ≈ 49px).

### 4.6 Chips de filtre (Calendrier, Galerie)

`border-radius: 999px`, `padding: 10px 22px`, `font-display` 14px/700/uppercase/`0.02em`.

| État | Fond | Texte | Bordure |
|---|---|---|---|
| Sélectionné | `vt-ink` | `#F2EDE0` | — |
| Non sélectionné | transparent | `vt-ink` | 1px `vt-border-strong` |
| Survol 🆕 | `rgb(28 27 24 / .05)` | `vt-ink` | 1px `rgb(28 27 24 / .3)` |

A11y : rendre les chips comme `<button>` (Galerie, filtre client) ou `<a>` (Calendrier, filtre
serveur par URL), avec `aria-pressed` / `aria-current`. Les `<span>` des maquettes ne sont que du
rendu statique.

### 4.7 Carte de valeur (Le club)

Fond `vt-surface`, bordure 1px `vt-border`, **filet haut 4px `vt-yellow`**, rayon 6px,
`padding: 28px`, `gap: 12px` : numéro « 01 » 44px `vt-terracotta` → `h3` 32px → texte 15px
`vt-text-prose`. Trois cartes : Transmettre, Représenter, Rassembler.

A11y liens externes (partenaires, réseaux) : `rel="noopener noreferrer"` et mention de l'ouverture
dans un nouvel onglet (texte masqué visuellement ou `aria-label`).

### 4.8 Ligne de compétition (Calendrier)

**À venir** : fond `vt-surface`, bordure `vt-border`, **liseré gauche 4px `vt-yellow`**, rayon 6px,
`padding: 24px 28px`. Bloc date à gauche (64px) : mois 12px/700 uppercase `vt-terracotta` +
jour 30px/800 `font-display` `vt-ink`. Puis titre `h3` 19px + tag « À venir »
(fond `vt-yellow`, `vt-ink`, 11px/800, `0.04em`, pilule) + date/lieu 14px `vt-text-secondary` +
description 14px `vt-text-muted`.

**Passée** : fond `vt-surface-muted`, bordure `vt-border-subtle`, **pas de liseré**, titre et date
en `vt-text-secondary` / `vt-text-muted`, chip de résultat à droite :
victoire → fond `vt-ink` texte `#F2EDE0` ; défaite → fond `vt-terracotta` texte `#F2EDE0` ;
13px/700, rayon 4px, `padding: 8px 16px`.

Séparateur de groupe : libellé 13px/700/`0.08em` `vt-text-muted` + filet `rgb(28 27 24 / .12)`.

A11y : le résultat doit rester lisible sans la couleur — garder le libellé « Victoire 13–7 » /
« Défaite 9–13 » (déjà le cas). Dates en `<time datetime="…">`.

### 4.9 Grille photo (Galerie)

Grille 4 colonnes, `gap: 16px`. La première vignette occupe `span 2 × span 2` (`min-height: 340px`),
les suivantes 162px puis 200px de haut. Vignette avec légende : image + overlay
`--vt-image-caption-overlay` + légende 13px/600 `#F2EDE0` en bas à gauche (14px de marge).
Tuiles en cours de chargement : **squelette neutre** crème uni (`#E4DFD0` / `#EAE5D7`), pulse désactivé sous `prefers-reduced-motion` (validé le 2026-09-24). Une photo sans image n'est pas affichée ; les aplats colorés des maquettes n'étaient que des placeholders.
Bouton « Charger plus de photos » (tertiaire) centré, 36px au-dessus.

A11y : `alt` = légende de la photo ; les tuiles placeholder sont décoratives.

### 4.10 Formulaire (Contact)

Colonnes : formulaire `flex: 1.3` / carte info `flex: 1`, `gap: 56px`.

- **Label** : 13px/700/uppercase/`0.04em` `vt-text-secondary`, 8px au-dessus du champ.
- **Champ** : fond `vt-surface`, bordure 1px `vt-border-strong`, rayon 4px, `padding: 14px 16px`,
  15px. `textarea` : 5 lignes, `resize: vertical`.
- **États** 🆕 : focus → bordure `vt-ink` + contour 2px offset 2 ; erreur → bordure
  `vt-terracotta` + message 13px `vt-terracotta` lié par `aria-describedby` ; `aria-invalid`.
- **Turnstile** : encadré `border: 1px dashed rgb(28 27 24 / .25)`, fond `vt-surface-muted`,
  rayon 4px, `padding: 16px`.
- **RGPD** : case à cocher + texte 13px/1.6 `vt-text-secondary`, `accent-color: vt-terracotta` 🆕,
  mention de la conservation 12 mois et lien vers la politique de confidentialité.
- **Soumission** : bouton primaire, `align-self: flex-start`. 🆕 états « chargement » (libellé
  « Envoi… », `aria-busy`) et retour de succès/erreur en `role="status"` / `role="alert"`.
- **Écart** : `gap: 20px` entre groupes de champs.

### 4.11 Bloc sombre (encadrement, carte contact)

Fond `vt-surface-dark`, rayon 6px, `padding: 32px` (32px 36px pour l'encadrement).
Titre `h3` 20px `#F2EDE0`, texte 15px `#E4DFD0`, icônes `vt-yellow` 18px alignées en haut
(`gap: 12px`), séparateur interne `border-top: 1px vt-border-on-dark` + `padding-top: 20px` pour
les réseaux sociaux (13px/700/uppercase `#F2EDE0`).
Encadrement : pastille ronde 56px `vt-terracotta` en tête de bloc.

### 4.12 Bande CTA jaune (Le club)

Fond `vt-yellow`, `padding: 32px 40px`, `space-between` : message `font-display` 34px/800
capitales `vt-ink` (« Envie de rejoindre le club ? ») à gauche, bouton « sur fond jaune » à droite.

### 4.13 En-tête de section numéroté 🆕 (v11)

Grille `auto 1fr auto`, `gap: 24px`, aligné en bas, `padding-bottom: 18px`, **filet bas 2px
`vt-ink`** (ou `rgb(242 237 224 / .2)` sur fond sombre), `margin-bottom: 36px`.
Chiffre « 01 » 72px/800 `vt-yellow` avec contour `-webkit-text-stroke: 1.5px vt-ink` (décoratif,
`aria-hidden="true"`) → `h2` 64px capitales → lien optionnel 13px/800 capitales `vt-terracotta`
(« Tout le calendrier → »). La numérotation repart à 01 sur chaque page.

### 4.14 Carte « Prochain match » 🆕 (Accueil, FR-025)

Deux colonnes `1.15fr 1fr`, rayon 6px, sans bordure. **Gauche** fond `vt-yellow`, `padding: 40px` :
tag contour 2px `vt-ink` (« Championnat régional · J12 ») → `h3` 76px date/heure sur 2 lignes →
lieu 16px/700. **Droite** fond `vt-ink` : écusson du club (72px) vs pastille adverse (cercle 72px
contour crème, initiales), « VS » 52px `#6B655A` ; puis compte à rebours 4 colonnes (chiffres 42px
`vt-yellow`, libellés 11px capitales `#9B9686`), séparé par un filet `rgb(242 237 224 / .15)`.
Masquée s'il n'y a pas de compétition à venir. Sous `prefers-reduced-motion`, secondes masquées,
mise à jour à la minute. Pas d'`aria-live` ; la date en clair est dans un `<time>`.
Mobile : colonnes empilées, compte à rebours 2×2.

### 4.15 Chiffres clés 🆕 (Accueil, FR-024)

Rangée de 4 colonnes au pied du hero, filet haut `rgb(242 237 224 / .2)`, séparateurs verticaux
`rgb(242 237 224 / .15)`. Valeur `font-display` 60px/800 (la 1re en `vt-yellow`, les autres crème),
libellé 12px/700 capitales `0.12em` `#C9C3B3`. Mobile : grille 2×2, valeurs 40px. Rendu en `<dl>`.

### 4.16 Tuiles partenaires 🆕 (Partenaires, FR-005)

- **Principal** : grille 3 colonnes, tuile fond `vt-yellow`, rayon 6px, `padding: 28px`,
  `min-height: 180px` : tag « Principal » (fond `vt-ink`, texte `vt-yellow`, 11px/800) → nom
  `font-display` 34px capitales → description 14px/600 + « ↗ » si site.
- **Soutien / Institutionnel** : grille 4 resp. 3 colonnes, tuile blanche bordure `vt-border`,
  `min-height: 120px`, nom centré 24px capitales (ou logo `next/image`, hauteur max 64px, `alt` =
  nom du partenaire).
- Tuile sans site : `<div>` non focusable ; avec site : `<a target="_blank">`.
- Bloc **« Devenir partenaire »** : fond `vt-ink`, 2 colonnes, titre 96px (« partenaire » en
  `vt-yellow`), liste d'avantages à flèches jaunes, bouton primaire vers `/contact?sujet=partenariat`.

### 4.17 Page « Le tambourin » 🆕 (FR-022)

- **Règles en bref** : grille 4 colonnes sur fond blanc, filets haut/bas 2px `vt-ink`, cellules
  séparées par `vt-border` ; chiffre 60px jaune contouré (« 5×5 », « 80 m », « 13 J », « +60 ») →
  `h3` 24px → texte 15px. Mobile : 2 puis 1 colonne.
- **Schéma du terrain** : section `vt-ink`, rectangle `aspect-ratio: 4/1`, contour 2px `vt-yellow`,
  ligne médiane pleine jaune, lignes à 25 % / 75 % en pointillés, graduation tous les 10 %, 5
  joueurs par camp (pastilles 20px jaunes / crème, contour `vt-ink`). `role="img"` +
  `aria-label` décrivant dimensions et placement. Légende 13px capitales, valeurs en jaune.
  Rôles (fonds, tiers, cordiers) en 3 colonnes : `h3` 34px `vt-yellow` + texte 15px `#E4DFD0`.
- **Frise** : grille `180px 1fr`, année `font-display` 64px, filet haut 2px `vt-ink` par ligne,
  `h3` 30px + texte 16px (max 640px).
- **Citation** : bande `vt-yellow`, `<blockquote>` `font-display` 92px capitales, attribution
  13px/800 capitales.

### 4.18 Bande d'appel en diagonale 🆕 (Accueil)

Fond `vt-ink`, `padding: 80px 40px`, bandeau `vt-yellow` décoratif pivoté de −8° couvrant ~52 % à
droite (`aria-hidden`). Titre 112px crème (« essayer » en `vt-yellow`) à gauche ; à droite, texte
17px/600 `vt-ink` sur la partie jaune + bouton sombre vers `/contact?sujet=adhesion`. Mobile :
bandeau jaune en bas (60 % de hauteur), contenu empilé, titre 44px.

---

## 5. Layout & responsive

Les maquettes sont cadrées en **1280px**. Règles d'adaptation 🆕 (à vérifier par les assertions
Playwright de T053a, aux viewports 375 / 768 / 1280) :

| | Mobile < 768px | Tablette 768–1023px | Desktop ≥ 1024px |
|---|---|---|---|
| Gouttière | 20px | 24px | 40px |
| Largeur de contenu | 100% | 100% | max 1200px, centré |
| Nav | menu bouton → panneau plein écran fond `vt-ink`, liens 20px, cibles ≥ 44px | nav en ligne, `gap: 16px` | nav en ligne, `gap: 24px` |
| Hero | `min-height: 90vh`, H1 44px (2 lignes), boutons empilés pleine largeur, chiffres 2×2 | `min-height: 700px`, H1 64px | 860px, H1 88px |
| Bandeau de page | H1 48px, `padding: 48px 20px 40px` | H1 88px | H1 124px |
| En-tête de section | chiffre au-dessus du titre, titre 36px, lien dessous | titre 48px | titre 64px |
| Carte « Prochain match » | colonnes empilées, compte à rebours 2×2 | empilée | 2 colonnes |
| Règles / Partenaires | 1 colonne (règles 2 dès 480px), tuiles 2 colonnes | 2 colonnes | 4 / 3 colonnes |
| Valeurs / Histoire | 1 colonne | 2 colonnes (valeurs), 1 colonne (histoire) | 3 / 2 colonnes |
| Ligne de compétition | date au-dessus du titre, chip résultat sous le texte | inchangé | inchangé |
| Grille galerie | 2 colonnes, vignette vedette `span 2` | 3 colonnes | 4 colonnes |
| Contact | 1 colonne (formulaire puis infos) | 1 colonne | 2 colonnes |
| Footer | empilé, centré | en ligne | en ligne |

Menu mobile (validé le 2026-09-24, planches `MobileFerme` / `MenuMobile`, 7 entrées FR-027) : bouton « Menu » (icône burger + libellé, 44px de haut) aligné à droite ; à l'ouverture, panneau **plein écran** `vt-ink` en `role="dialog" aria-modal`, liens en Barlow Condensed 800 / 32px majuscules, cibles de 60px, page courante en `vt-yellow` + barre verticale + `aria-current`, bouton « Fermer » ; focus piégé, Échap ferme, focus rendu au bouton.

---

## 6. Accessibilité (transversal)

1. **Contrastes** : appliquer les substitutions du §1.3. Tout nouveau couple doit atteindre 4.5:1
   (texte normal) / 3:1 (grand texte, bordures et icônes porteuses de sens).
2. **Focus** : jamais supprimé. Contour 2px `vt-ink` sur fond clair, `vt-yellow` sur fond sombre,
   `offset: 2px` (tokens dans `tokens.css`).
3. **Couleur seule** : jamais porteuse d'information — `aria-current` sur la nav, libellé textuel
   sur les résultats de match et les tags.
4. **Hiérarchie** : un seul `h1` par page (celui du bandeau / du hero), pas de saut de niveau.
5. **Cibles tactiles** ≥ 44×44px (boutons, chips, liens de nav en mobile).
6. **Sémantique** : `header` / `nav` / `main` / `footer`, `<time datetime>` pour les dates,
   `<form>` avec `<label for>` explicites, lien d'évitement « Aller au contenu » 🆕.
7. **Mouvement** : `prefers-reduced-motion` neutralise transitions et animations (dans `tokens.css`).
8. **Images** : `alt` descriptif pour les photos de galerie, `alt=""` pour les photos décoratives
   (hero, illustration d'histoire).

---

## 7. Mise en œuvre

| Élément | Cible | Tâche |
|---|---|---|
| `design/tokens.css` → `src/styles/globals.css` | tokens Tailwind v4 + base | T002 |
| Polices via `next/font/google` (Barlow, Barlow Condensed) | `src/app/layout.tsx` | T012 |
| `Header` (variantes overlay/solide, écusson) + `Footer` | `src/components/layout/` | T013 |
| Menu mobile | `src/components/layout/MobileMenu.tsx` | T013a |
| `PageHero`, `SectionHead`, `Button`, `Chip`, mot surligné | `src/components/ui/` | T013b |
| Hero, chiffres clés, carte « Prochain match », bande diagonale | `src/app/page.tsx`, `src/components/home/` | T019b, T019c, T020 |
| Cartes valeurs, liste du bureau, bande CTA jaune | `src/app/le-club/page.tsx` | T021 |
| Règles, schéma du terrain, rôles, frise, citation | `src/app/le-tambourin/page.tsx` | T021a |
| Lignes de compétition, chips de filtre | `src/components/competitions/` | T027, T028 |
| Grille photo, chips de catégorie, bloc « Envoyer mes photos » | `src/components/gallery/` | T034, T035, T036 |
| Tuiles partenaires, bloc « Devenir partenaire » | `src/components/partners/` | T043 |
| Champs, sujet, encadré Turnstile, mention RGPD, carte info | `src/components/contact/` | T048, T049, T050 |
| Vérification responsive 375/768/1280 | suites Playwright | T053a |

**Variante Tailwind v3** — si `create-next-app` installe Tailwind v3 (T001/T002), transposer le bloc
`@theme` de `tokens.css` dans `tailwind.config.ts` :

```ts
theme: {
  extend: {
    colors: { vt: { ink: '#1C1B18', terracotta: '#B5433A', yellow: '#F0C419', cream: '#F2EDE0' /* … */ } },
    fontFamily: { display: ['var(--font-barlow-condensed)'], sans: ['var(--font-barlow)'] },
    fontSize: { hero: ['clamp(2.75rem, 5vw + 1rem, 5.5rem)', '0.9'], 'page-title': ['clamp(3rem, 9vw, 7.75rem)', '0.88'] /* … */ },
    borderRadius: { control: '4px', card: '6px', icon: '8px' },
  },
}
```

Les règles `@layer base` (focus, `prefers-reduced-motion`, styles de `body`/`h1-h3`/`a`) restent
identiques dans `globals.css`.

---

## 8. Ajouts, écarts et points à valider

**Ajouts 🆕 (non maquettés, nécessaires à la conformité constitutionnelle)** : états survol / focus /
actif / désactivé / erreur, contour de focus, échelle typographique mobile, règles responsive et
menu mobile, ombre de survol des cartes, lien d'évitement, `prefers-reduced-motion`.

**Écarts corrigés par rapport aux maquettes** :

1. `#7A7566` et `#8A8574` en petit texte → `vt-text-muted #6B6657` (contraste AA, §1.3).
2. Tailles 13.5 / 14.5 / 15.5px → arrondies à l'échelle (13 / 14 / 15px).
3. Espacements 14 / 18 / 22 / 26px → grille de 4px (16 / 20 / 24 / 24px).
4. `<link>` Google Fonts → `next/font/google` (auto-hébergement, pas de requête tierce).
5. Chips et boutons rendus en `<span>` dans les maquettes → vrais `<button>` / `<a>`.

**Décisions validées (2026-09-24)** :

- **Menu mobile** : panneau plein écran sombre (§5).
- **Logo** (écusson jaune/noir « Vendemian Tambourin 1923 », fourni le 2026-09-24) : petit écusson à
  gauche du header sur toutes les pages (y compris l'accueil et le menu mobile), lien vers l'accueil
  (`aria-label="Vendémian Tambourin — accueil"`). Pas de grand écusson dans le hero (essayé puis retiré). Remplace la décision « sans logo » du 2026-09-11.
  Fichier source attendu dans `public/brand/` (SVG de préférence, sinon PNG transparent ≥ 512px).
- **Galerie** : squelette neutre pendant le chargement ; fin de liste silencieuse (FR-018).
- **Mise en page éditoriale v10–v11** : palette/typos Fronton conservées ; ajout des titres
  géants, mots surlignés, sections numérotées, carte « Prochain match », bande diagonale, pages
  « Le tambourin » et « Partenaires » (remplace « Liens utiles »). Titre de l'accueil réduit à
  88px sur 2 lignes et placé en bas du hero pour laisser voir la photo (v11).
- **Contenu** : textes repris de la maquette « Site vitrine » V1 avec l'année de fondation **1923**
  (écusson) ; chiffres, bureau, partenaires, règles et devise restent à valider par le club.
- **Pages hors périmètre** maquettées dans l'artifact (2e rangée du canvas) : 404 (« Balle hors du
  fronton »), politique de confidentialité (texte brouillon à faire relire par le bureau), planche
  d'états (vides, chargement, erreurs de chargement, retours du formulaire FR-017 / FR-020, erreur de
  champ). Le footer gagne un lien « Politique de confidentialité ».
