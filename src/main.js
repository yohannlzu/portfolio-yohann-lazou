document.documentElement.classList.add("js");

const $ = (selector, scope = document) => scope.querySelector(selector);
const $$ = (selector, scope = document) => [...scope.querySelectorAll(selector)];

/* =========================
   YEAR
========================= */
(() => {
  const year = $("#year");
  if (year) year.textContent = new Date().getFullYear();
})();

/* =========================
   MOBILE MENU
========================= */
(() => {
  const toggle = $("#menuToggle");
  const nav = $("#siteNav");
  if (!toggle || !nav) return;

  toggle.addEventListener("click", () => {
    const isOpen = nav.classList.toggle("is-open");
    toggle.setAttribute("aria-expanded", String(isOpen));
  });

  nav.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;
    if (target.tagName !== "A") return;

    if (window.innerWidth <= 760) {
      nav.classList.remove("is-open");
      toggle.setAttribute("aria-expanded", "false");
    }
  });
})();

/* =========================
   ACTIVE NAV PILL
========================= */
(() => {
  const nav = $("#siteNav");
  const pill = $("#navPill");
  const links = $$(".site-nav a");

  if (!nav || !pill || !links.length) return;

  const items = links
    .map((link) => {
      const href = link.getAttribute("href");
      if (!href || !href.startsWith("#")) return null;
      const section = $(href);
      if (!section) return null;
      return { link, section };
    })
    .filter(Boolean);

  if (!items.length) return;

  let currentLink = items[0].link;
  let ticking = false;
  let lockedLink = null;
  let lockTimeout = null;

  function movePill(link) {
    if (!link || window.innerWidth <= 760) return;

    const navRect = nav.getBoundingClientRect();
    const linkRect = link.getBoundingClientRect();

    const x = linkRect.left - navRect.left;
    const w = linkRect.width;

    pill.style.width = `${w}px`;
    pill.style.transform = `translateX(${x}px)`;
    pill.style.opacity = "1";
  }

  function setActiveLink(link) {
    if (!link) return;
    currentLink = link;
    links.forEach((item) => item.classList.toggle("is-active", item === currentLink));
    movePill(currentLink);
  }

  function getActiveItem() {
    const scrollTop = window.scrollY;
    const viewportHeight = window.innerHeight;
    const docHeight = document.documentElement.scrollHeight;

    if (scrollTop + viewportHeight >= docHeight - 8) {
      return items[items.length - 1];
    }

    const marker = scrollTop + 140;
    let active = items[0];

    for (const item of items) {
      if (item.section.offsetTop <= marker) active = item;
    }

    return active;
  }

  function updateMenu() {
    if (lockedLink) {
      setActiveLink(lockedLink);
      return;
    }

    const active = getActiveItem();
    if (!active) return;
    setActiveLink(active.link);
  }

  function requestUpdate() {
    if (ticking) return;
    ticking = true;

    requestAnimationFrame(() => {
      updateMenu();
      ticking = false;
    });
  }

  function lockMenuTo(link) {
    lockedLink = link;
    setActiveLink(link);

    if (lockTimeout) clearTimeout(lockTimeout);
    lockTimeout = setTimeout(() => {
      lockedLink = null;
      requestUpdate();
    }, 900);
  }

  links.forEach((link) => {
    link.addEventListener("click", () => lockMenuTo(link));
  });

  window.addEventListener("load", updateMenu);
  window.addEventListener("scroll", requestUpdate, { passive: true });
  window.addEventListener("resize", () => {
    if (window.innerWidth <= 760) {
      pill.style.opacity = "0";
      return;
    }
    requestUpdate();
  });

  updateMenu();
})();

/* =========================
   REVEAL
========================= */
(() => {
  const reveals = $$(".reveal");
  if (!reveals.length) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    },
    { threshold: 0.14 }
  );

  reveals.forEach((element) => observer.observe(element));
})();

/* =========================
   HERO PARALLAX
========================= */
(() => {
  const heroContent = $("[data-parallax]");
  if (!heroContent) return;

  const onScroll = () => {
    const y = window.scrollY;
    const offset = Math.min(y * 0.08, 32);
    heroContent.style.transform = `translateY(${offset}px)`;
  };

  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });
})();

/* =========================
   TABS
========================= */
(() => {
  const tabsWrap = $("#workTabs");
  if (!tabsWrap) return;

  const tabs = $$("[data-tab]", tabsWrap);
  const panels = $$(".tab-panel");

  const setTab = (key) => {
    tabs.forEach((tab) => {
      const active = tab.dataset.tab === key;
      tab.classList.toggle("is-active", active);
      tab.setAttribute("aria-selected", String(active));
    });

    panels.forEach((panel) => {
      panel.classList.toggle("is-active", panel.dataset.panel === key);
    });
  };

  tabs.forEach((tab) => {
    tab.addEventListener("click", () => setTab(tab.dataset.tab));
  });
})();

/* =========================
   INTERESTS HOVER
========================= */
(() => {
  const cards = $$(".interest-card");
  if (!cards.length) return;

  cards.forEach((card) => {
    const img = card.dataset.img;
    const pos = card.dataset.pos || "center";
    card.style.setProperty("--bg-image", `url("${img}")`);
    card.style.setProperty("--bg-pos", pos);

    card.addEventListener("mouseenter", () => {
      cards.forEach((c) => c.classList.remove("is-active"));
      card.classList.add("is-active");
    });

    card.addEventListener("mouseleave", () => {
      card.classList.remove("is-active");
    });
  });
})();

/* =========================
   SMOOTH ANCHORS
========================= */
(() => {
  const anchorLinks = $$('a[href^="#"]');

  anchorLinks.forEach((link) => {
    link.addEventListener("click", (event) => {
      const href = link.getAttribute("href");
      if (!href || href === "#") return;

      const target = $(href);
      if (!target) return;

      event.preventDefault();

      const y = target.getBoundingClientRect().top + window.scrollY - 92;

      window.scrollTo({
        top: y,
        behavior: "smooth",
      });

      history.pushState(null, "", href);
    });
  });
})();

/* =========================
   I18N DATA
========================= */
const I18N = {
  fr: {
    "theme.light": "☀️",
    "theme.dark": "🌙",

    "nav.homeMenu": "Accueil",
    "nav.iutMenu": "IUT",
    "nav.skillsMenu": "Compétences",
    "nav.projectsMenu": "Projets",
    "nav.workMenu": "Alternance / Stage",
    "nav.eduMenu": "Formation",
    "nav.xpMenu": "Expérience",
    "nav.interestsMenu": "Intérêts",
    "nav.contactMenu": "Contact",

    "actions.openCv": "Ouvrir le CV",

    "home.top1": "Alternant — Sermeta",
    "home.top3": "Portfolio",
    "home.title": `Le Génie Mécanique et Productique<br /><span class="title-accent">appliqué</span> chez Sermeta`,
    "home.lead": "De l'étude complète à la fabrication en atelier",
    "home.ctaProjects": "Open projects",
    "home.ctaContact": "Contact",
    "home.profileEyebrow": "Profil",
    "home.aboutTitle": "À propos",
    "home.aboutLead":
      "Alternant en 2<sup>e</sup> année de Génie Mécanique et Productique à l’IUT de Brest, je développe des compétences en conception mécanique, dessin industriel et métrologie.",
    "home.aboutText": `En alternance chez <b>Sermeta</b> à Morlaix, j’évolue en tant que <b>dessinateur process</b>, avec une implication directe dans l’optimisation et la conception de nouveaux procédés de fabrication.`,
    "home.aboutMeta": `Diplôme prévu : <b>BUT GMP — 2027</b>`,

    "iut.title": "IUT de Brest",
    "iut.text1":
      "L’IUT de Brest me permet d’évoluer dans un environnement orienté vers la pratique, la démarche de projet et l’application directe des compétences du GMP.",
    "iut.text2":
      "Entre ressources techniques, projets encadrés, travail en équipe et lien avec l’industrie, cette formation constitue une base solide pour développer une approche concrète de la conception, de la fabrication et de l’innovation.",
    "iut.tag1": "GMP",
    "iut.tag2": "Projets",
    "iut.tag3": "Ateliers",
    "iut.tag4": "Industrie",
    "iut.link": "LE SITE DE L'IUT",

    "skills.title": "Compétences",
    "skills.cards.0.title": "CAO, FAO & mise en plan",
    "skills.cards.0.text":
      "Conception & Fabrication Assistées par Ordinateur, dessin 2D avec le logiciel CATIA",
    "skills.cards.0.chip1": "Modélisation 3D",
    "skills.cards.0.chip2": "Simulation",
    "skills.cards.0.chip3": "Mise en plan 2D",
    "skills.cards.1.title": "Conception mécanique",
    "skills.cards.1.text":
      "Analyse & cotation fonctionnelle, choix techniques, tolérances, logique d'assemblage",
    "skills.cards.1.chip1": "Analyse",
    "skills.cards.1.chip2": "Choix techniques",
    "skills.cards.1.chipTol": "Tolérances",
    "skills.cards.1.chip3": "Logique de montage",
    "skills.cards.2.title": "Usinage & chaudronnerie",
    "skills.cards.2.text":
      "Soudage, pliage de tôle, tournage, fraisage et perçage (conventionnels & numériques)",
    "skills.cards.2.chip1": "Usinage",
    "skills.cards.2.chip2": "Pliage",
    "skills.cards.2.chip3": "Découpe",
    "skills.cards.2.tag": "Atelier",
    "skills.cards.3.title": "Production méthodes",
    "skills.cards.3.text":
      "Réalisation des documents nécessaire à la fabrication, analyse fonctionnelle du dessin, recherche de solutions de fabrication.",
    "skills.cards.3.chip1": "Procédés",
    "skills.cards.3.chip2": "Analyse",
    "skills.cards.3.chip3": "APEF / Cph",
    "skills.cards.3.tag": "Méthodes",
    "skills.board.eyebrow": "Référentiel",
    "skills.board.title": "Niveaux de développement des compétences",
    "skills.level1": "Niveau 1",
    "skills.level2": "Niveau 2",
    "skills.level3": "Niveau 3",

    "projects.title": "Projets",
    "projects.open": "Ouvrir",
    "projects.close": "Fermer",
    "projects.inProgress": "EN COURS",
    "projects.company": "ENTREPRISE",
    "projects.p1.title": "Fabrication d'une pièce unitaire",
    "projects.p1.desc": "Fabrication d'une pièce en tôle pliée",
    "projects.p2.title": "Foil",
    "projects.p2.desc": "Conception d'un foil et de son moule",
    "projects.p3.title": "Projet arçon de voltige",
    "projects.p3.desc":
      "Objectif : Concevoir et fabriquer un arçon de voltige à partir d’un scan 3D d'un dos de cheval, afin de répondre aux besoins du cascadeur tout en garantissant le confort de l’animal. L’arçon devra épouser parfaitement la morphologie du cheval.",
    "projects.p3.meta": "Scan 3D / CATIA / Prototypage / Fabrication",
    "projects.p4.title": "Projet convoyeur gravitaire",
    "projects.p4.desc":
      "Etude d'un convoyeur gravitaire permettant l'évacuation des produits non conformes, tout en respectant le besoin et les contraintes de positionnement et de sécurité.",
    "projects.p4.meta": "Projet industriel / Analyse / Conception",

    "work.title": "Alternance / Stage",
    "work.roleLabel": "Rôle",
    "work.tabs.alt": "Alternance",
    "work.tabs.stage": "Stage",
    "work.box.missions": "Missions",
    "work.box.goals": "Objectifs",
    "work.box.skills": "Compétences développées",
    "work.alt.role": "Dessinateur process",
    "work.alt.desc":
      "Dans le cadre de l’obtention du BUT, une alternance doit être réalisée à partir de la 2<sup>e</sup> (mon cas) ou 3<sup>e</sup> année. En alternance chez Sermeta, je participe à l’amélioration des moyens de fabrication existants et à la conception de nouveaux équipements.",
    "work.alt.m1": "Conception 3D & mise en plan",
    "work.alt.m2": "Optimisation d’outillages / montages",
    "work.alt.m3": "Recherche de solutions",
    "work.alt.o1": "Réduction d’un temps de manipulation / simplification d’un montage",
    "work.alt.o2": "Fiabiliser un système",
    "work.alt.o3": "Conception de nouveaux équipements",
    "work.alt.s1": "Analyser un besoin industriel et le traduire en solution technique.",
    "work.alt.s2": "Concevoir des pièces, ensembles et outillages sur CATIA.",
    "work.alt.s3": "Réaliser des mises en plan et documents techniques pour la fabrication.",
    "work.alt.s4":
      "Améliorer un poste ou un moyen de production selon des contraintes de sécurité, d’ergonomie et d’efficacité.",
    "work.alt.s5":
      "Échanger avec les équipes atelier, méthodes et production pour faire avancer un projet.",
    "work.stage.role": "Stage opérateur",
    "work.stage.desc":
      "Dans le cadre de la validation de ma première année de BUT GMP, j’ai effectué un stage opérateur de trois semaines chez Oxymax. L’entreprise couvre plusieurs domaines du GMP : pliage, découpe, chaudronnerie ainsi qu'un bureau d'études et de méthodes. J’ai travaillé en tant qu'opérateur en découpe laser/oxycoupage, en pliage et en chaudronnerie.",
    "work.stage.m1": "Chargement/déchargement des tôles",
    "work.stage.m2": "Ébavurage & finition (acier, inox, alu)",
    "work.stage.m3": "Pliage de tôles",
    "work.stage.o1": "Comprendre le fonctionnement d’une entreprise",
    "work.stage.o2": "Découvrir les services",
    "work.stage.o3": "Comprendre les risques opérateur",
    "work.stage.s1":
      "Découvrir concrètement les étapes de transformation de la tôle en atelier.",
    "work.stage.s2":
      "Comprendre les contraintes de cadence, de qualité et de sécurité en production.",
    "work.stage.s3":
      "Observer et appliquer les gestes de base liés à la découpe, au pliage et à la chaudronnerie.",
    "work.stage.s4":
      "Développer de la rigueur, de l’autonomie et une meilleure lecture du fonctionnement d’un atelier industriel.",

    "edu.title": "Formation",
    "edu.i1.title": "BUT Génie Mécanique & Productique",
    "edu.i1.place": "IUT, Brest",
    "edu.i2.title": "Brevet d’Initiation à la Mer (BIMer)",
    "edu.i2.place": "IUT, Brest",
    "edu.i3.title": "Baccalauréat général",
    "edu.i3.place": "Lycée de l'Elorn, Landerneau",
    "edu.i4.title": "Epreuves Anticipées de Français (EAF)",
    "edu.i4.place": "Lycée de l'Elorn, Landerneau",
    "edu.i5.title": "Brevet d'Initiation à l'Aéronautique",
    "edu.i5.place": "Aéroclub, Guipavas",

    "xp.title": "Expérience",
    "xp.summer2025": "Été 2025",
    "xp.summer2024": "Été 2024",
    "xp.summer2023": "Été 2023",
    "xp.summer2022": "Été 2022",
    "xp.summer2021": "Été 2021",
    "xp.i1.title": "Employé Espaces Verts",
    "xp.i1.place": "Services Techniques, Landerneau",
    "xp.i2.title": "Employé Signalisation",
    "xp.i2.place": "Services Techniques, Landerneau",
    "xp.i3.title": "Emploi saisonnier — Échalotes",
    "xp.i3.place": "ETA LEOST, Plouedern",
    "xp.i4.title": "Emploi saisonnier — Échalotes",
    "xp.i4.place": "ETA LEOST, Plouedern",
    "xp.i5.title": "Emploi saisonnier — Échalotes",
    "xp.i5.place": "ETA LEOST, Plouedern",

    "interests.title": "Centres d’intérêt",
    "interests.i1.title": "Sport auto",
    "interests.i1.text": "stratégie / aérodynamique",
    "interests.i2.title": "Aéronautique",
    "interests.i2.text": "mécanique / aérodynamique",
    "interests.i3.title": "Running",
    "interests.i3.text": "endurance / dépassement de soi",
    "interests.i4.title": "Modélisme",
    "interests.i4.text": "assemblage",
    "interests.i5.title": "Photographie",
    "interests.i5.text": "capture du moment / style",
    "interests.i6.title": "Mécanique",
    "interests.i6.text": "fonctionnement / systèmes",
    "interests.i7.title": "Voyages",
    "interests.i7.text": "découverte",
    "interests.i8.title": "Bivouac",
    "interests.i8.text": "liberté",

    "contact.title": "Contact",
    "contact.p1": "Pour me contacter, ",
    "contact.p2":
      "il suffit de cliquer sur le mail ou le bouton LinkedIn ci-dessous."
  },

  en: {
    "theme.light": "☀️",
    "theme.dark": "🌙",

    "nav.homeMenu": "Home",
    "nav.iutMenu": "IUT",
    "nav.skillsMenu": "Skills",
    "nav.projectsMenu": "Projects",
    "nav.workMenu": "Work / Internship",
    "nav.eduMenu": "Education",
    "nav.xpMenu": "Experience",
    "nav.interestsMenu": "Interests",
    "nav.contactMenu": "Contact",

    "actions.openCv": "Open resume",

    "home.top1": "Apprentice — Sermeta",
    "home.top3": "Portfolio",
    "home.title": `Mechanical and Production Engineering<br /><span class="title-accent">applied</span> at Sermeta`,
    "home.lead": "From full design studies to workshop manufacturing",
    "home.ctaProjects": "Open projects",
    "home.ctaContact": "Contact",
    "home.profileEyebrow": "Profile",
    "home.aboutTitle": "About",
    "home.aboutLead":
      "Apprentice in the 2<sup>nd</sup> year of Mechanical and Production Engineering at the IUT of Brest, developing skills in mechanical design, industrial drawing and metrology.",
    "home.aboutText": `As an apprentice at <b>Sermeta</b> in Morlaix, I work as a <b>process designer</b>, with direct involvement in optimization and the design of new manufacturing processes.`,
    "home.aboutMeta": `Expected degree: <b>BUT GMP — 2027</b>`,

    "iut.title": "Brest IUT",
    "iut.text1":
      "The IUT of Brest allows me to evolve in an environment focused on hands-on work, project-based learning and direct application of GMP skills.",
    "iut.text2":
      "Between technical resources, supervised projects, teamwork and strong links with industry, this training provides a solid foundation for developing a practical approach to design, manufacturing and innovation.",
    "iut.tag1": "GMP",
    "iut.tag2": "Projects",
    "iut.tag3": "Workshops",
    "iut.tag4": "Industry",
    "iut.link": "IUT WEBSITE",

    "skills.title": "Skills",
    "skills.cards.0.title": "CAD, CAM & drawings",
    "skills.cards.0.text": "Computer-aided design and manufacturing, 2D drawing with CATIA",
    "skills.cards.0.chip1": "3D modeling",
    "skills.cards.0.chip2": "Simulation",
    "skills.cards.0.chip3": "2D drawings",
    "skills.cards.1.title": "Mechanical design",
    "skills.cards.1.text":
      "Functional analysis and dimensioning, technical choices, tolerances, assembly logic",
    "skills.cards.1.chip1": "Analysis",
    "skills.cards.1.chip2": "Technical choices",
    "skills.cards.1.chipTol": "Tolerances",
    "skills.cards.1.chip3": "Assembly logic",
    "skills.cards.2.title": "Machining & sheet metal work",
    "skills.cards.2.text":
      "Welding, sheet metal bending, turning, milling and drilling (conventional & CNC)",
    "skills.cards.2.chip1": "Machining",
    "skills.cards.2.chip2": "Bending",
    "skills.cards.2.chip3": "Cutting",
    "skills.cards.2.tag": "Workshop",
    "skills.cards.3.title": "Production methods",
    "skills.cards.3.text":
      "Preparation of manufacturing documents, functional drawing analysis, and search for manufacturing solutions.",
    "skills.cards.3.chip1": "Processes",
    "skills.cards.3.chip2": "Analysis",
    "skills.cards.3.chip3": "APEF / Cph",
    "skills.cards.3.tag": "Methods",
    "skills.board.eyebrow": "Framework",
    "skills.board.title": "Competency development levels",
    "skills.level1": "Level 1",
    "skills.level2": "Level 2",
    "skills.level3": "Level 3",

    "projects.title": "Projects",
    "projects.open": "Open",
    "projects.close": "Close",
    "projects.inProgress": "IN PROGRESS",
    "projects.company": "COMPANY",
    "projects.p1.title": "Manufacturing of a single part",
    "projects.p1.desc": "Manufacturing of a bent sheet metal part",
    "projects.p2.title": "Foil",
    "projects.p2.desc": "Design of a foil and its mold",
    "projects.p3.title": "Voltige saddle tree project",
    "projects.p3.desc":
      "Objective: design and manufacture a stunt saddle tree from a 3D scan of a horse’s back, meeting the stunt rider’s needs while ensuring the animal’s comfort. The saddle tree must perfectly match the horse’s morphology.",
    "projects.p3.meta": "3D scan / CATIA / Prototyping / Manufacturing",
    "projects.p4.title": "Gravity conveyor project",
    "projects.p4.desc":
      "Study of a gravity conveyor used to evacuate non-conforming products while meeting positioning and safety requirements.",
    "projects.p4.meta": "Industrial project / Analysis / Design",

    "work.title": "Work / Internship",
    "work.roleLabel": "Role",
    "work.tabs.alt": "Apprenticeship",
    "work.tabs.stage": "Internship",
    "work.box.missions": "Tasks",
    "work.box.goals": "Goals",
    "work.box.skills": "Skills developed",
    "work.alt.role": "Process designer",
    "work.alt.desc":
      "As part of the B.U.T. degree, an apprenticeship must be completed from the 2<sup>nd</sup> year onward (my case) or in the 3<sup>rd</sup> year. At Sermeta, I contribute to improving existing manufacturing resources and designing new equipment.",
    "work.alt.m1": "3D design & drawings",
    "work.alt.m2": "Tooling / fixture optimization",
    "work.alt.m3": "Solution research",
    "work.alt.o1": "Reduce handling time / simplify a setup",
    "work.alt.o2": "Improve system reliability",
    "work.alt.o3": "Design new equipment",
    "work.alt.s1": "Analyze an industrial need and translate it into a technical solution.",
    "work.alt.s2": "Design parts, assemblies and tooling in CATIA.",
    "work.alt.s3": "Produce drawings and technical documents for manufacturing.",
    "work.alt.s4":
      "Improve a workstation or production resource while considering safety, ergonomics and efficiency constraints.",
    "work.alt.s5": "Communicate with workshop, methods and production teams to move a project forward.",
    "work.stage.role": "Operator internship",
    "work.stage.desc":
      "As part of validating my first year of the B.U.T. GMP, I completed a three-week operator internship at Oxymax. The company covers several GMP fields: bending, cutting, boilermaking, as well as design and methods offices. I worked as an operator in laser/oxy-fuel cutting, bending, and boilermaking.",
    "work.stage.m1": "Loading/unloading metal sheets",
    "work.stage.m2": "Deburring & finishing (steel, stainless steel, aluminum)",
    "work.stage.m3": "Sheet metal bending",
    "work.stage.o1": "Understand how a company operates",
    "work.stage.o2": "Discover the departments",
    "work.stage.o3": "Understand operator risks",
    "work.stage.s1":
      "Discover the real workshop steps involved in transforming sheet metal.",
    "work.stage.s2":
      "Understand production constraints related to pace, quality and safety.",
    "work.stage.s3":
      "Observe and apply basic practices related to cutting, bending and boilermaking.",
    "work.stage.s4":
      "Develop rigor, autonomy and a better understanding of how an industrial workshop operates.",

    "edu.title": "Education",
    "edu.i1.title": "B.U.T. Mechanical & Production Engineering",
    "edu.i1.place": "IUT, Brest",
    "edu.i2.title": "BIMer (Marine Initiation Certificate)",
    "edu.i2.place": "IUT, Brest",
    "edu.i3.title": "General Baccalaureate",
    "edu.i3.place": "Lycée de l'Elorn, Landerneau",
    "edu.i4.title": "Early French Exams (EAF)",
    "edu.i4.place": "Lycée de l'Elorn, Landerneau",
    "edu.i5.title": "Aeronautics Initiation Certificate",
    "edu.i5.place": "Aéroclub, Guipavas",

    "xp.title": "Experience",
    "xp.summer2025": "Summer 2025",
    "xp.summer2024": "Summer 2024",
    "xp.summer2023": "Summer 2023",
    "xp.summer2022": "Summer 2022",
    "xp.summer2021": "Summer 2021",
    "xp.i1.title": "Green Spaces Employee",
    "xp.i1.place": "Technical Services, Landerneau",
    "xp.i2.title": "Signage Employee",
    "xp.i2.place": "Technical Services, Landerneau",
    "xp.i3.title": "Seasonal job — Shallots",
    "xp.i3.place": "ETA LEOST, Plouedern",
    "xp.i4.title": "Seasonal job — Shallots",
    "xp.i4.place": "ETA LEOST, Plouedern",
    "xp.i5.title": "Seasonal job — Shallots",
    "xp.i5.place": "ETA LEOST, Plouedern",

    "interests.title": "Interests",
    "interests.i1.title": "Motorsport",
    "interests.i1.text": "strategy / aerodynamics",
    "interests.i2.title": "Aeronautics",
    "interests.i2.text": "mechanics / aerodynamics",
    "interests.i3.title": "Running",
    "interests.i3.text": "endurance / self-improvement",
    "interests.i4.title": "Model making",
    "interests.i4.text": "assembly",
    "interests.i5.title": "Photography",
    "interests.i5.text": "capturing the moment / style",
    "interests.i6.title": "Mechanics",
    "interests.i6.text": "operation / systems",
    "interests.i7.title": "Travel",
    "interests.i7.text": "discovery",
    "interests.i8.title": "Bivouac",
    "interests.i8.text": "freedom",

    "contact.title": "Contact",
    "contact.p1": "To contact me, ",
    "contact.p2": "just click on the email address or the LinkedIn button below."
  }
};

const COMPETENCIES = {
  fr: [
    {
      key: "spec",
      title: "Spécifier",
      levels: [
        "Déterminer le besoin d'un client dans un cas simple",
        "Déterminer le besoin d'un client dans un cas industriel en collaboration",
        "Déterminer le besoin d'un client dans un cas industriel"
      ]
    },
    {
      key: "dev",
      title: "Développer",
      levels: [
        "Proposer des solutions dans un cas simple",
        "Proposer des solutions dans un cas complexe",
        "Proposer des solutions validées"
      ]
    },
    {
      key: "real",
      title: "Réaliser",
      levels: [
        "Concrétiser une solution simple",
        "Concrétiser une solution complexe en collaboration",
        "Concrétiser une solution complexe"
      ]
    },
    {
      key: "explo",
      title: "Exploiter",
      levels: [
        "Déterminer les sources d'information en entreprise",
        "Utiliser les outils permettant d’évaluer les performances",
        "Mettre en œuvre une amélioration suivant une démarche structurée"
      ]
    },
    {
      key: "innov",
      title: "Innover",
      levels: [
        "Expérimenter la démarche d’innovation",
        "Participer activement à une démarche d’innovation"
      ]
    }
  ],

  en: [
    {
      key: "spec",
      title: "Specify",
      levels: [
        "Identify a client need in a simple case",
        "Identify a client need in an industrial case in collaboration",
        "Identify a client need in an industrial case"
      ]
    },
    {
      key: "dev",
      title: "Develop",
      levels: [
        "Propose solutions in a simple case",
        "Propose solutions in a complex case",
        "Propose validated solutions"
      ]
    },
    {
      key: "real",
      title: "Produce",
      levels: [
        "Implement a simple solution",
        "Implement a complex solution collaboratively",
        "Implement a complex solution"
      ]
    },
    {
      key: "explo",
      title: "Operate",
      levels: [
        "Identify information sources in a company",
        "Use tools to evaluate performance",
        "Implement an improvement using a structured approach"
      ]
    },
    {
      key: "innov",
      title: "Innovate",
      levels: [
        "Experiment with the innovation process",
        "Actively participate in an innovation process"
      ]
    }
  ]
};

const COMPETENCY_DETAILS = {
  fr: {
    spec: {
      title: "Compétence Spécifier",
      eyebrow: "Compétence",
      image: "/images/competences/specifier-detail.png"
    },
    dev: {
      title: "Compétence Développer",
      eyebrow: "Compétence",
      image: "/images/competences/developper-detail.png"
    },
    real: {
      title: "Compétence Réaliser",
      eyebrow: "Compétence",
      image: "/images/competences/realiser-detail.png"
    },
    explo: {
      title: "Compétence Exploiter",
      eyebrow: "Compétence",
      image: "/images/competences/exploiter-detail.png"
    },
    innov: {
      title: "Compétence Innover",
      eyebrow: "Compétence",
      image: "/images/competences/innover-detail.png"
    }
  },

  en: {
    spec: {
      title: "Specify competency",
      eyebrow: "Competency",
      image: "/images/competences/specifier-detail-en.png"
    },
    dev: {
      title: "Develop competency",
      eyebrow: "Competency",
      image: "/images/competences/developper-detail-en.png"
    },
    real: {
      title: "Produce competency",
      eyebrow: "Competency",
      image: "/images/competences/realiser-detail-en.png"
    },
    explo: {
      title: "Operate competency",
      eyebrow: "Competency",
      image: "/images/competences/exploiter-detail-en.png"
    },
    innov: {
      title: "Innovate competency",
      eyebrow: "Competency",
      image: "/images/competences/innover-detail-en.png"
    }
  }
};

/* =========================
   STATE
========================= */
let currentLang = localStorage.getItem("site-lang") || "fr";
const THEME_KEY = "site-theme";
let currentTheme = localStorage.getItem(THEME_KEY) || "light";

/* =========================
   HELPERS
========================= */
function getI18nValue(key) {
  return I18N[currentLang]?.[key] ?? I18N.fr[key] ?? "";
}

function updateProjectButtonsLabels() {
  $$("[data-open]").forEach((btn) => {
    const isExpanded = btn.getAttribute("aria-expanded") === "true";
    btn.textContent = isExpanded ? getI18nValue("projects.close") : getI18nValue("projects.open");
  });

  const closeBtn = $("#workDetailClose");
  if (closeBtn) closeBtn.textContent = getI18nValue("projects.close");
}

/* =========================
   THEME
========================= */
function applyTheme() {
  document.documentElement.setAttribute("data-theme", currentTheme);

  const nextThemeLabel =
    currentTheme === "light"
      ? getI18nValue("theme.dark")
      : getI18nValue("theme.light");

  const valueDesktop = $("#themeToggleValue");
  if (valueDesktop) valueDesktop.textContent = nextThemeLabel;
}

(() => {
  const btnDesktop = $("#themeToggle");
  if (!btnDesktop) return;

  btnDesktop.addEventListener("click", () => {
    currentTheme = currentTheme === "light" ? "dark" : "light";
    localStorage.setItem(THEME_KEY, currentTheme);
    applyTheme();
  });
})();

/* =========================
   COMPETENCY BOARD
========================= */
function renderCompetencies() {
  const grid = $("#competencyGrid");
  if (!grid) return;

  const levelLabels = [
    getI18nValue("skills.level1"),
    getI18nValue("skills.level2"),
    getI18nValue("skills.level3")
  ];

  const items = COMPETENCIES[currentLang] || COMPETENCIES.fr;

  grid.innerHTML = items
    .map((item) => {
      const cards = item.levels
        .map((text, index) => {
          return `
            <div class="competency-card">
              <span class="competency-card__level">${levelLabels[index] || ""}</span>
              <span class="competency-card__text">${text}</span>
            </div>
          `;
        })
        .join("");

      return `
        <div class="competency-col">
          <button
            class="competency-head competency-head--${item.key}"
            type="button"
            data-competency-open="${item.key}"
            aria-label="${item.title}"
          >
            ${item.title}
          </button>
          ${cards}
        </div>
      `;
    })
    .join("");
}

(() => {
  const modal = $("#competencyModal");
  const closeBtn = $("#competencyModalClose");
  const titleEl = $("#competencyModalTitle");
  const eyebrowEl = $("#competencyModalEyebrow");
  const imageEl = $("#competencyModalImage");

  if (!modal || !closeBtn || !titleEl || !eyebrowEl || !imageEl) return;

  let currentCompetencyKey = null;

  function openCompetencyModal(key) {
    const data =
      (COMPETENCY_DETAILS[currentLang] && COMPETENCY_DETAILS[currentLang][key]) ||
      (COMPETENCY_DETAILS.fr && COMPETENCY_DETAILS.fr[key]);

    if (!data) return;

    currentCompetencyKey = key;
    eyebrowEl.textContent = data.eyebrow;
    titleEl.textContent = data.title;
    imageEl.src = data.image;
    imageEl.alt = data.title;

    modal.hidden = false;
    modal.setAttribute("aria-hidden", "false");
    document.body.classList.add("modal-open");
  }

  function closeCompetencyModal() {
    modal.hidden = true;
    modal.setAttribute("aria-hidden", "true");
    document.body.classList.remove("modal-open");
  }

  document.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;

    const trigger = target.closest("[data-competency-open]");
    if (trigger) {
      openCompetencyModal(trigger.dataset.competencyOpen);
      return;
    }

    if (target.hasAttribute("data-close-modal")) {
      closeCompetencyModal();
    }
  });

  closeBtn.addEventListener("click", closeCompetencyModal);

  window.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeCompetencyModal();
    }
  });

  window.__rerenderCompetencyModalIfNeeded = () => {
    if (!modal.hidden && currentCompetencyKey) {
      openCompetencyModal(currentCompetencyKey);
    }
  };
})();

/* =========================
   PROJECTS DETAIL
========================= */
(() => {
  const worksWrap = $("#works");
  if (!worksWrap) return;

  const cards = Array.from(worksWrap.querySelectorAll(".work[data-work]"));
  const openBtns = Array.from(worksWrap.querySelectorAll("[data-open]"));
  const panel = $("#workDetail");
  const closeBtn = $("#workDetailClose");
  const kEl = $("#workDetailK");
  const metaEl = $("#workDetailMeta");
  const titleEl = $("#workDetailTitle");
  const descEl = $("#workDetailDesc");
  const bulletsEl = $("#workDetailBullets");
  const mediaEl = $("#workDetailMedia");

  if (!panel || !openBtns.length) return;

  const PROJECTS = {
    fr: [
      {
        id: "p1",
        k: "PROJECT_01",
        meta: "SAÉ / 2025",
        title: "Fabrication d'une pièce unitaire",
        desc: "La SAÉ 2.03, consiste à concevoir et fabriquer une pièce unique en tôle pliée, alliant design et technicité. \n\n De l'idée initiale à la réalisation finale, toutes les étapes sont abordées : modélisation CATIA, préparation des fichiers de découpe, programmation du pliage et simulation, et fabrication en atelier. \n\n Ce projet met en avant à la fois la créativité, la maîtrise des outils numériques et les compétences en fabrication industrielle.",
        bullets: [
          "Conception de l'idée (voiture) — CATIA",
          "Développé de la pièce — CATIA",
          "Gamme de pliage — VBend",
          "Simulation — VBend",
          "Envoi documents pour découpe",
          "Fabrication / pliage — presse plieuse"
        ],
        images: [
          {
            src: "/images/projets/tole-1.png",
            cap: "Modèle CAO",
            height: "100px",
            mobileHeight: "180px",
            pos: "center center"
          },
          {
            src: "/images/projets/tole-2.png",
            cap: "Simulation",
            height: "100px",
            mobileHeight: "180px",
            pos: "center center"
          },
          {
            src: "/images/projets/tole-3.png",
            cap: "Pièce finie",
            height: "140px",
            mobileHeight: "220px",
            fit: "contain",
            pos: "center center"
          }
        ]
      },
      {
        id: "p2",
        k: "PROJECT_02",
        meta: "SAÉ / 2026",
        title: "Foil",
        desc: "La SAÉ 3.02, consiste à concevoir un foil plus performant en s'appuyant sur l'analyse des modèles existants \n\n La démarche inclut la modélisation complète de l'aile sur CATIA à partir de profils NACA, ainsi que la conception des moules nécessaires à sa fabrication. \n\n Ce projet met en avant les compétences en conception surfacique, en modélisation avancée et en développement de produits industriels.",
        bullets: [
          "Traçage des courbes guides",
          "Importation nuage de point",
          "Modélisation sections et surfaces",
          "Paramétrage du congé",
          "Conception moule"
        ],
        images: [
          {
            src: "/images/projets/foil-2.png",
            cap: "Moule",
            height: "160px",
            mobileHeight: "220px",
            pos: "center center"
          },
          {
            src: "/images/projets/foil-1.png",
            cap: "Surfacique",
            height: "160px",
            mobileHeight: "220px",
            pos: "center center"
          }
        ]
      }
    ],
    en: [
      {
        id: "p1",
        k: "PROJECT_01",
        meta: "PROJECT / 2025",
        title: "Manufacturing of a single part",
        desc: "Learning and assessment project: CATIA design, VBend simulation and bending range, cutting documents, and press brake manufacturing.",
        bullets: [
          "Concept design (car) — CATIA",
          "Part flat pattern — CATIA",
          "Bending sequence — VBend",
          "Simulation — VBend",
          "Sending documents for cutting",
          "Manufacturing / bending — press brake"
        ],
        images: [
          {
            src: "/images/projets/tole-1.png",
            cap: "CAD model",
            height: "100px",
            mobileHeight: "180px",
            pos: "center center"
          },
          {
            src: "/images/projets/tole-2.png",
            cap: "Simulation",
            height: "100px",
            mobileHeight: "180px",
            pos: "center center"
          },
          {
            src: "/images/projets/tole-3.png",
            cap: "Finished part",
            height: "140px",
            mobileHeight: "220px",
            fit: "contain",
            pos: "center center"
          }
        ]
      },
      {
        id: "p2",
        k: "PROJECT_02",
        meta: "PROJECT / 2026",
        title: "Foil",
        desc: "Creation of a surfacing foil and its mold in CATIA: guide curves, point cloud, sections/surfaces, and fillet parameterization.",
        bullets: [
          "Guide curve tracing",
          "Point cloud import",
          "Section and surface modeling",
          "Fillet parameterization",
          "Mold design"
        ],
        images: [
          {
            src: "/images/projets/foil-2.png",
            cap: "Mold",
            height: "160px",
            mobileHeight: "220px",
            pos: "center center"
          },
          {
            src: "/images/projets/foil-1.png",
            cap: "Surfacing",
            height: "160px",
            mobileHeight: "220px",
            pos: "center center"
          }
        ]
      }
    ]
  };

  let openedId = null;
  let currentProjectsLang = "fr";

  const setHeight = (el, value) => {
    el.style.height = typeof value === "number" ? `${value}px` : value;
  };

  const render = (p) => {
    if (!p) return;

    kEl.textContent = p.k;
    metaEl.textContent = p.meta;
    titleEl.textContent = p.title;
    descEl.textContent = p.desc;
    bulletsEl.innerHTML = `<ul>${p.bullets.map((x) => `<li>${x}</li>`).join("")}</ul>`;

    mediaEl.innerHTML = p.images
      .map((img) => {
        const cap = (img.cap || "").trim().toLowerCase();
        const isPieceFinie = cap === "pièce finie" || cap === "finished part";
        const isContain = img.fit === "contain";

        return `
          <figure
            class="${isPieceFinie ? "is-piece-finie" : ""} ${isContain ? "is-contain" : ""}"
            style="
              --media-height: ${img.height || "180px"};
              --media-height-mobile: ${img.mobileHeight || img.height || "220px"};
              --media-pos: ${img.pos || "center"};
            "
          >
            <img loading="lazy" src="${img.src}" alt="${img.cap || ""}" />
            <figcaption>${img.cap || "—"}</figcaption>
          </figure>
        `;
      })
      .join("");
  };

  const refreshButtonsState = () => {
    openBtns.forEach((btn) => {
      const isOpen = btn.dataset.open === openedId;
      btn.setAttribute("aria-expanded", isOpen ? "true" : "false");
      btn.textContent = isOpen ? getI18nValue("projects.close") : getI18nValue("projects.open");
    });

    cards.forEach((card) => {
      card.classList.toggle("is-selected", card.dataset.id === openedId);
    });
  };

  const openPanel = (id) => {
    const p = PROJECTS[currentProjectsLang].find((x) => x.id === id);
    if (!p) return;

    if (openedId === id) {
      closePanel();
      return;
    }

    openedId = id;
    render(p);
    refreshButtonsState();

    panel.hidden = false;
    panel.classList.add("is-on");
    setHeight(panel, 0);

    requestAnimationFrame(() => {
      setHeight(panel, panel.scrollHeight);
    });

    const onEnd = (e) => {
      if (e.propertyName !== "height") return;
      panel.style.height = "auto";
      panel.removeEventListener("transitionend", onEnd);
    };

    panel.addEventListener("transitionend", onEnd);
    panel.scrollIntoView({ behavior: "smooth", block: "nearest" });
  };

  const closePanel = () => {
    if (panel.hidden) return;

    openedId = null;
    refreshButtonsState();

    setHeight(panel, panel.scrollHeight);
    requestAnimationFrame(() => {
      setHeight(panel, 0);
    });

    const onEnd = (e) => {
      if (e.propertyName !== "height") return;
      panel.classList.remove("is-on");
      panel.hidden = true;
      panel.style.height = "0px";
      panel.removeEventListener("transitionend", onEnd);
    };

    panel.addEventListener("transitionend", onEnd);
  };

  openBtns.forEach((btn) => {
    btn.addEventListener("click", () => openPanel(btn.dataset.open));
  });

  closeBtn?.addEventListener("click", closePanel);

  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closePanel();
  });

  window.__setProjectsLang = (lang) => {
    currentProjectsLang = lang;
    if (!openedId) {
      refreshButtonsState();
      return;
    }
    const current = PROJECTS[currentProjectsLang].find((x) => x.id === openedId);
    if (current) render(current);
    refreshButtonsState();
  };

  refreshButtonsState();
})();

/* =========================
   APPLY I18N
========================= */
function applyI18n() {
  document.documentElement.lang = currentLang;

  $$("[data-i18n]").forEach((el) => {
    const key = el.dataset.i18n;
    const value = getI18nValue(key);
    if (!value) return;

    const span = el.querySelector("span");
    if (span && el.classList.contains("button")) {
      span.textContent = value;
    } else {
      el.textContent = value;
    }
  });

  $$("[data-i18n-html]").forEach((el) => {
    const key = el.dataset.i18nHtml;
    const value = getI18nValue(key);
    if (value) el.innerHTML = value;
  });

  const langBtn = $("#langBtn");
  if (langBtn) langBtn.textContent = currentLang === "fr" ? "EN" : "FR";

  document.title = "Yohann Lazou — Portfolio";

  renderCompetencies();
  window.__setProjectsLang?.(currentLang);
  updateProjectButtonsLabels();
  applyTheme();
  window.__rerenderCompetencyModalIfNeeded?.();
}

/* =========================
   INIT LANG
========================= */
(() => {
  const langBtn = $("#langBtn");

  if (langBtn) {
    langBtn.addEventListener("click", () => {
      currentLang = currentLang === "fr" ? "en" : "fr";
      localStorage.setItem("site-lang", currentLang);
      applyI18n();
    });
  }

  applyI18n();
})();