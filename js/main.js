/*
 * main.js — tout le JavaScript du site. Aucune dépendance, aucun build.
 *
 * Ce fichier fait trois choses :
 *   1. Page d'accueil  : lit data/projets.json et affiche la liste des projets.
 *   2. Page projet     : affiche UN projet (identifié par ?p=slug dans l'URL).
 *   3. Toutes les pages : fait apparaître les blocs en douceur pendant le scroll.
 *
 * Sécurité : le contenu du JSON n'est JAMAIS injecté comme du HTML.
 * On crée les éléments un par un et on met le texte avec textContent,
 * donc même un titre contenant "<script>" s'affiche comme du texte inoffensif.
 */
(function () {
  'use strict';

  /* ───────── Contexte de la page ───────── */
  // <body data-page="home|project" data-root="" ou "../">
  // data-root = chemin pour remonter à la racine du site (les pages EN sont dans /en/).
  const page = document.body.dataset.page;
  const root = document.body.dataset.root || '';
  const lang = document.documentElement.lang === 'en' ? 'en' : 'fr';

  /* ───────── Textes dynamiques (les textes fixes sont directement dans le HTML) ───────── */
  const T = {
    fr: {
      read: 'Lire le projet',
      none: 'Aucun projet pour le moment.',
      loadError: 'Impossible de charger les projets. Réessaie dans un instant.',
      notFound: 'Projet introuvable.',
      back: 'Retour aux projets',
      stack: 'Outils',
      context: 'Contexte et objectif',
      approach: 'Démarche et choix techniques',
      issues: 'Erreurs rencontrées et solutions',
      gallery: 'Schémas et captures',
      report: 'Rapport complet',
      download: 'Télécharger le rapport (PDF)',
      pdfFallback: 'Votre navigateur n’affiche pas le PDF ici.',
      locale: 'fr-FR',
      projectPage: 'projet.html',
    },
    en: {
      read: 'Read the project',
      none: 'No projects yet.',
      loadError: 'Could not load the projects. Please try again in a moment.',
      notFound: 'Project not found.',
      back: 'Back to projects',
      stack: 'Tools',
      context: 'Context and goal',
      approach: 'Approach and technical choices',
      issues: 'Issues encountered and fixes',
      gallery: 'Diagrams and screenshots',
      report: 'Full report',
      download: 'Download the report (PDF)',
      pdfFallback: 'Your browser can’t display the PDF here.',
      locale: 'en-GB',
      projectPage: 'project.html',
    },
  }[lang];

  /* ───────── Outils ───────── */

  // Seuls ces chemins sont acceptés pour les images et PDF : "images/..." ou "files/...",
  // caractères simples, pas de "..". Ça bloque "javascript:", les URL externes, etc.
  const SAFE_ASSET = /^(images|files)\/[A-Za-z0-9_\-/.]+$/;
  const SAFE_SLUG = /^[a-z0-9-]+$/;

  function assetUrl(path) {
    if (typeof path !== 'string' || !SAFE_ASSET.test(path) || path.includes('..')) {
      if (path) console.warn('Chemin ignoré (non autorisé) :', path);
      return null;
    }
    return root + path;
  }

  // Choisit le texte dans la langue de la page, avec repli sur le français.
  function pick(obj) {
    return obj ? obj[lang] || obj.fr || '' : '';
  }

  // Petit constructeur d'éléments : h('a', { class: 'btn', href: '...', text: 'Salut' }, [enfants])
  function h(tag, attrs, children) {
    const node = document.createElement(tag);
    for (const [key, value] of Object.entries(attrs || {})) {
      if (value === null || value === undefined || value === false) continue;
      if (key === 'text') node.textContent = value; // textContent : jamais interprété comme du HTML
      else node.setAttribute(key, value);
    }
    for (const child of [].concat(children || [])) {
      if (child) node.append(child);
    }
    return node;
  }

  function formatDate(value) {
    if (typeof value !== 'string' || !value) return '';
    const iso = value.length === 7 ? value + '-01' : value; // accepte "2026-09" ou "2026-09-15"
    const date = new Date(iso + 'T00:00:00');
    if (Number.isNaN(date.getTime())) return '';
    return new Intl.DateTimeFormat(T.locale, { month: 'long', year: 'numeric' }).format(date);
  }

  function initials(text) {
    return text
      .split(/\s+/)
      .map((w) => w[0] || '')
      .join('')
      .slice(0, 2)
      .toUpperCase();
  }

  function projectUrl(slug) {
    return T.projectPage + '?p=' + encodeURIComponent(slug);
  }

  function chips(stack) {
    const items = Array.isArray(stack) ? stack : [];
    return h('ul', { class: 'chips' }, items.map((s) => h('li', { text: String(s) })));
  }

  /* ───────── Chargement des données ───────── */
  async function loadProjects() {
    const response = await fetch(root + 'data/projets.json', { cache: 'no-cache' });
    if (!response.ok) throw new Error('HTTP ' + response.status);
    const data = await response.json();
    const list = Array.isArray(data.projects) ? data.projects : [];
    return list
      .filter((p) => p && SAFE_SLUG.test(p.slug || ''))
      .sort((a, b) => {
        if (Boolean(a.featured) !== Boolean(b.featured)) return a.featured ? -1 : 1;
        return String(b.date || '').localeCompare(String(a.date || ''));
      });
  }

  /* ───────── Page d'accueil : liste des projets ───────── */
  function renderFeature(p) {
    const title = pick(p.title);
    const url = projectUrl(p.slug);
    const cover = assetUrl(p.cover);

    const media = h(
      'a',
      { class: 'feature-media', href: url, tabindex: '-1', 'aria-hidden': 'true' },
      cover
        ? h('img', { src: cover, alt: '', loading: 'lazy', decoding: 'async' })
        : h('span', { class: 'ph', 'aria-hidden': 'true', text: initials(title) })
    );

    const body = h('div', { class: 'feature-body' }, [
      h('p', { class: 'meta', text: formatDate(p.date) }),
      h('h3', {}, h('a', { href: url, text: title })),
      h('p', { class: 'prose', text: pick(p.summary) }),
      chips(p.stack),
      h('a', { class: 'textlink', href: url, text: T.read }),
    ]);

    return h('article', { class: 'feature reveal' }, [media, body]);
  }

  function renderRow(p) {
    const stackText = (Array.isArray(p.stack) ? p.stack : []).slice(0, 4).join(', ');
    return h('li', { class: 'reveal' }, [
      h('a', { class: 'row', href: projectUrl(p.slug) }, [
        h('span', { class: 'row-date', text: formatDate(p.date) }),
        h('span', { class: 'row-main' }, [
          h('span', { class: 'row-title', text: pick(p.title) }),
          h('span', { class: 'row-sum', text: pick(p.summary) }),
        ]),
        h('span', { class: 'row-stack', text: stackText }),
      ]),
    ]);
  }

  async function initHome() {
    const container = document.getElementById('projects-list');
    if (!container) return;
    try {
      const projects = await loadProjects();
      container.replaceChildren();
      if (projects.length === 0) {
        container.append(h('p', { class: 'state', text: T.none }));
        return;
      }
      const featured = projects.filter((p) => p.featured);
      const others = projects.filter((p) => !p.featured);
      featured.forEach((p) => container.append(renderFeature(p)));
      if (others.length) container.append(h('ul', { class: 'index' }, others.map(renderRow)));
      initReveal(container);
    } catch (error) {
      console.error(error);
      container.replaceChildren(h('p', { class: 'state', text: T.loadError }));
    }
  }

  /* ───────── Page projet : un seul projet (?p=slug) ───────── */
  // Accepte un texte simple ou un tableau de textes (affiché en liste à puces).
  function renderBlock(label, content) {
    const items = Array.isArray(content) ? content.filter((t) => typeof t === 'string' && t.trim()) : null;
    if (items ? items.length === 0 : !content) return null;
    return h('section', { class: 'block' }, [
      h('h2', { text: label }),
      items
        ? h('ul', { class: 'prose points' }, items.map((t) => h('li', { class: 'pre', text: t })))
        : h('p', { class: 'prose pre', text: content }), // "pre" garde les retours à la ligne
    ]);
  }

  function renderProject(p) {
    const title = pick(p.title);
    const cover = assetUrl(p.cover);
    const report = assetUrl(p.report);

    // Titre de l'onglet et description : mis à jour depuis les données.
    const siteName = document.querySelector('.brand')?.textContent || '';
    document.title = title + ' — ' + siteName;
    document.querySelector('meta[name="description"]')?.setAttribute('content', pick(p.summary));

    // Le switch FR/EN doit rester sur le même projet.
    const switcher = document.querySelector('[data-lang-switch]');
    if (switcher) switcher.setAttribute('href', switcher.getAttribute('href') + '?p=' + encodeURIComponent(p.slug));

    const nodes = [
      h('a', { class: 'textlink back', href: 'index.html#projects', text: T.back }),
      h('header', { class: 'project-head' }, [
        h('p', { class: 'meta', text: formatDate(p.date) }),
        h('h1', { text: title }),
        h('p', { class: 'lead', text: pick(p.summary) }),
        Array.isArray(p.stack) && p.stack.length
          ? h('div', { class: 'stack-line' }, [h('span', { class: 'meta', text: T.stack }), chips(p.stack)])
          : null,
      ]),
      cover ? h('img', { class: 'cover', src: cover, alt: '', decoding: 'async' }) : null,
      renderBlock(T.context, pick(p.context)),
      renderBlock(T.approach, pick(p.approach)),
      renderBlock(T.issues, pick(p.issues)),
    ];

    const gallery = (Array.isArray(p.gallery) ? p.gallery : [])
      .map((g) => ({ src: assetUrl(g && g.image), alt: pick(g && g.alt) }))
      .filter((g) => g.src);
    if (gallery.length) {
      nodes.push(
        h('section', { class: 'block' }, [
          h('h2', { text: T.gallery }),
          h(
            'ul',
            { class: 'gallery' },
            gallery.map((g) =>
              h('li', {}, h('figure', {}, [
                h('a', { href: g.src, target: '_blank', rel: 'noopener noreferrer' }, h('img', { src: g.src, alt: g.alt, loading: 'lazy', decoding: 'async' })),
                g.alt ? h('figcaption', { text: g.alt }) : null, // la légende visible reprend le texte "alt"
              ]))
            )
          ),
        ])
      );
    }

    if (report) {
      nodes.push(
        h('section', { class: 'block' }, [
          h('h2', { text: T.report }),
          // Lecteur PDF du navigateur. Sur mobile il est souvent limité : d'où le bouton de téléchargement juste dessous.
          h('object', { class: 'pdf', data: report + '#toolbar=1&navpanes=0', type: 'application/pdf', 'aria-label': T.report }, h('p', { class: 'state', text: T.pdfFallback })),
          h('p', {}, h('a', { class: 'btn btn-solid', href: report, download: true, text: T.download })),
        ])
      );
    }

    return nodes;
  }

  async function initProject() {
    const container = document.getElementById('project-root');
    if (!container) return;
    const slug = new URLSearchParams(window.location.search).get('p') || '';
    const backLink = h('a', { class: 'textlink back', href: 'index.html#projects', text: T.back });
    try {
      const project = SAFE_SLUG.test(slug) ? (await loadProjects()).find((p) => p.slug === slug) : null;
      if (!project) {
        container.replaceChildren(backLink, h('p', { class: 'state', text: T.notFound }));
        return;
      }
      container.replaceChildren(...renderProject(project).filter(Boolean));
    } catch (error) {
      console.error(error);
      container.replaceChildren(backLink, h('p', { class: 'state', text: T.loadError }));
    }
  }

  /* ───────── Apparition douce au scroll ───────── */
  // Sans JS, ou avec « réduire les animations » activé dans l'OS, tout reste visible.
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let observer = null;

  function initReveal(scope) {
    if (reduceMotion || !('IntersectionObserver' in window)) return;
    observer =
      observer ||
      new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.remove('is-hidden');
              observer.unobserve(entry.target);
            }
          });
        },
        { rootMargin: '0px 0px -8% 0px', threshold: 0.08 }
      );
    scope.querySelectorAll('.reveal').forEach((node) => {
      if (node.dataset.seen) return;
      node.dataset.seen = '1';
      // On ne masque que ce qui est sous la ligne de flottaison : le haut de page ne clignote jamais.
      if (node.getBoundingClientRect().top > window.innerHeight) {
        node.classList.add('is-hidden');
        observer.observe(node);
      }
    });
  }

  /* ───────── Démarrage ───────── */
  initReveal(document);
  if (page === 'home') initHome();
  if (page === 'project') initProject();
})();
