# Design System — Vendémian Tambourin (front public)

**Source** : extrait des 6 maquettes validées du canvas Claude Design
(<https://claude.ai/artifact/HMJG4Z85iZobGTzk8gWjYR>, version 6) — `Main` (Accueil),
`Presentation`, `Calendrier`, `Galerie`, `LiensUtiles`, `Contact`.
Direction retenue : **« Fronton dynamique »**, palette relevée sur la photo du Fronton
Vendémianais fournie par le club.

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
| `text-hero` | 68px | 0.95 | 700 | H1 de la home |
| `text-page-title` | 52px | 1 | 700 | H1 des pages intérieures |
| `text-section` | 30px | 1.2 | 700 | H2 de section |
| `text-subsection` | 22px | 1.2 | 700 | H2 de sous-groupe (Liens utiles) |
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

Non maquettée. Valeurs à appliquer : hero 40px, H1 de page 34px, H2 24px, H2 de sous-groupe 20px,
H3 18px, chapô 16px, corps 16px. Le reste est inchangé.

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

Commun : `padding: 20px 40px`, nav **alignée à droite** (`justify-content: flex-end`), **pas de
logo ni de titre** (retrait validé par le club), 6 liens, `gap: 26px` → 24px, 15px / 600 /
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

Fond `vt-ink`, texte `vt-text-on-dark-muted` 13px, `padding: 24px 40px`, copyright à gauche, liens
« Liens utiles » / « Contact » à droite (`gap: 18px` → 16px). Survol 🆕 : `#E4DFD0`.

### 4.3 Hero plein écran (Accueil uniquement)

`min-height: 820px`, photo en fond (`fronton.jpg`) + overlay `--vt-hero-overlay`. Contenu centré
verticalement, largeur max 680px (texte 520px) : eyebrow → H1 68px → accroche 18px → 2 boutons.
En bas, **bande « Prochain match »** : filet haut `rgb(242 237 224 / .15)`, `padding: 20px 40px`,
libellé jaune 12px/800/`0.1em`, puce `4px` `#6B655A`, texte `#E4DFD0` 14px, lien jaune poussé à
droite (`margin-left: auto`).

A11y : la photo est décorative (`alt=""`) puisque le texte porte l'information ;
`priority` sur `next/image` (c'est le LCP).

### 4.4 Bandeau de page (5 pages intérieures)

Fond `vt-ink`, `padding: 64px 40px 56px`. Structure : **eyebrow** (trait 22×3px jaune + libellé
jaune 13px/700/`0.14em`) → `h1` 52px crème → chapô 17px `#E4DFD0`, largeur max 640px.

Eyebrows utilisés : « Le club », « Compétitions », « En images », « Contact ».

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

### 4.7 Carte de contenu (valeurs, liens utiles)

Fond `vt-surface`, bordure 1px `vt-border`, rayon 6px, `padding: 28px` (20px 24px pour les lignes
de liens). Carte « valeur » : pastille d'icône 44px rayon 8px fond `vt-yellow` icône `vt-ink` →
`h3` 19px → texte 14px `vt-text-secondary`, `gap: 14px`.
Ligne « lien utile » : `<a target="_blank">` en `flex` — libellé 16px/700 + domaine 13px
`vt-text-muted` à gauche, icône « lien externe » `vt-terracotta` 18px à droite.

A11y liens externes : `rel="noopener noreferrer"` et mention de l'ouverture dans un nouvel onglet
(texte masqué visuellement ou `aria-label`).

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
Tuiles sans photo : aplat de la palette de tuiles + icône image centrée.
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

### 4.12 Bande CTA jaune (Présentation)

Fond `vt-yellow`, `padding: 28px 40px`, `space-between` : message 15px/700 `vt-ink` à gauche,
email + bouton « sur fond jaune » à droite.

---

## 5. Layout & responsive

Les maquettes sont cadrées en **1280px**. Règles d'adaptation 🆕 (à vérifier par les assertions
Playwright de T053a, aux viewports 375 / 768 / 1280) :

| | Mobile < 768px | Tablette 768–1023px | Desktop ≥ 1024px |
|---|---|---|---|
| Gouttière | 20px | 24px | 40px |
| Largeur de contenu | 100% | 100% | max 1200px, centré |
| Nav | menu bouton → panneau plein écran fond `vt-ink`, liens 20px, cibles ≥ 44px | nav en ligne, `gap: 16px` | nav en ligne, `gap: 24px` |
| Hero | `min-height: 70vh`, H1 40px, boutons empilés pleine largeur | `min-height: 600px`, H1 52px | 820px, H1 68px |
| Bande « prochain match » | empilée, lien en dessous | en ligne | en ligne |
| Valeurs / Histoire | 1 colonne | 2 colonnes (valeurs), 1 colonne (histoire) | 3 / 2 colonnes |
| Ligne de compétition | date au-dessus du titre, chip résultat sous le texte | inchangé | inchangé |
| Grille galerie | 2 colonnes, vignette vedette `span 2` | 3 colonnes | 4 colonnes |
| Contact | 1 colonne (formulaire puis infos) | 1 colonne | 2 colonnes |
| Footer | empilé, centré | en ligne | en ligne |

Le menu mobile n'est pas maquetté : **à valider** avant implémentation (§8).

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
| `Header` (variantes overlay/solide) + `Footer` | `src/components/layout/` | T013 |
| Hero + bande « prochain match » | `src/app/page.tsx` | T020 |
| Bandeau de page, cartes valeurs, bloc sombre, bande CTA | `src/app/presentation/page.tsx` | T021 |
| Lignes de compétition, chips de filtre | `src/components/competitions/` | T027, T028 |
| Grille photo, chips de catégorie | `src/components/gallery/` | T034, T035 |
| Lignes de liens externes | `src/app/liens-utiles/page.tsx` | T043 |
| Champs, encadré Turnstile, mention RGPD, carte info | `src/components/contact/` | T048, T049, T050 |
| Vérification responsive 375/768/1280 | suites Playwright | T053a |

**Variante Tailwind v3** — si `create-next-app` installe Tailwind v3 (T001/T002), transposer le bloc
`@theme` de `tokens.css` dans `tailwind.config.ts` :

```ts
theme: {
  extend: {
    colors: { vt: { ink: '#1C1B18', terracotta: '#B5433A', yellow: '#F0C419', cream: '#F2EDE0' /* … */ } },
    fontFamily: { display: ['var(--font-barlow-condensed)'], sans: ['var(--font-barlow)'] },
    fontSize: { hero: ['4.25rem', '0.95'], 'page-title': ['3.25rem', '1'] /* … */ },
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

**À valider par le club avant `/speckit-implement`** :

- le motif du **menu mobile** (panneau plein écran sombre proposé) ;
- l'absence de **logo** dans le header — confirmée pour l'accueil, reconduite sur les 5 pages ;
- le traitement des **tuiles sans photo** de la galerie (aplats colorés) une fois les vraies photos
  disponibles ;
- les pages **hors périmètre maquetté** : 404, politique de confidentialité (liée depuis la mention
  RGPD), états vides (aucune compétition, aucune photo) et états d'erreur de chargement.
