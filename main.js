const bySelector = (selector) => document.querySelector(selector);
const allBySelector = (selector) => document.querySelectorAll(selector);
const STORAGE_KEY = "academic-site-language";
const DEFAULT_VISIBLE_PUBLICATIONS_PER_DOMAIN = 2;

let currentLanguage = localStorage.getItem(STORAGE_KEY) || "zh";
let expandedPublicationDomains = new Set();

const getData = () => SITE_DATA[currentLanguage] || SITE_DATA.zh;

const localize = (value) => {
  if (!value || typeof value !== "object") return value || "";
  return value[currentLanguage] || value.zh || value.en || "";
};

const resetContainer = (selector) => {
  const container = bySelector(selector);
  if (container) container.replaceChildren();
  return container;
};

const createExternalLink = (label, href, className = "") => {
  const link = document.createElement("a");
  link.href = href;
  link.textContent = label;
  if (!href.startsWith("mailto:")) {
    link.target = "_blank";
    link.rel = "noreferrer";
  }
  if (className) link.className = className;
  return link;
};

const createAnchor = (label, href, className = "") => {
  const link = document.createElement("a");
  link.href = href;
  link.textContent = label;
  if (className) link.className = className;
  return link;
};

const getKeywordText = (keyword) => localize(keyword);

const renderMeta = (data) => {
  document.documentElement.lang = data.meta.lang;
  document.title = data.meta.title;
  const description = bySelector('meta[name="description"]');
  if (description) description.content = data.meta.description;
};

const renderStaticCopy = (data) => {
  allBySelector("[data-ui]").forEach((node) => {
    const key = node.dataset.ui;
    node.textContent = data.ui[key] || "";
  });

  allBySelector("[data-language-option]").forEach((button) => {
    const isActive = button.dataset.languageOption === currentLanguage;
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-pressed", isActive ? "true" : "false");
  });
};

const renderProfile = (data) => {
  allBySelector("[data-profile]").forEach((node) => {
    const key = node.dataset.profile;
    node.textContent = data.profile[key] || "";
  });
};

const renderProfileInlineLinks = (data) => {
  const container = resetContainer("[data-profile-inline-links]");
  if (!container) return;

  data.links.forEach((link) => {
    container.appendChild(createExternalLink(`[${link.label}]`, link.href));
  });
};

const renderEducation = (data) => {
  const container = resetContainer("[data-education]");
  if (!container) return;

  data.education.forEach((item) => {
    const row = document.createElement("article");
    row.className = "education-item";
    row.innerHTML = `<time>${item.period}</time><strong>${item.school}</strong><span>${item.field}</span>`;
    container.appendChild(row);
  });
};

const renderNews = (data) => {
  const container = resetContainer("[data-news]");
  if (!container) return;

  data.news.forEach((item) => {
    const entry = document.createElement("article");
    entry.className = "news-entry";

    const date = document.createElement("time");
    date.textContent = item.date;

    const copy = document.createElement("p");
    if (item.href) {
      copy.appendChild(createExternalLink(item.text, item.href));
    } else {
      copy.textContent = item.text;
    }

    entry.append(date, copy);
    container.appendChild(entry);
  });
};

const renderResearchDirections = (data) => {
  const container = resetContainer("[data-research-directions]");
  if (!container) return;

  data.researchDirections.forEach((item, index) => {
    const card = document.createElement("article");
    card.className = "research-card";

    const number = document.createElement("span");
    number.className = "research-card-number";
    number.textContent = String(index + 1).padStart(2, "0");

    const heading = document.createElement("h3");
    heading.textContent = item.title;

    const body = document.createElement("p");
    body.textContent = item.description;

    card.append(number, heading, body);
    container.appendChild(card);
  });
};

// 联系方式图标统一由内联 SVG 生成，方便后续用 CSS 精细控制样式。
const CONTACT_ICON_SVGS = {
  email: `
    <svg viewBox="0 0 26 20" aria-hidden="true">
      <rect x="1" y="3" width="24" height="14" rx="2.5"></rect>
      <path d="M2.8 4.6L13 11.8L23.2 4.6"></path>
    </svg>
  `,
  researchgate: `
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="8" r="3.2"></circle>
      <path d="M6.2 18.2C7.1 14.9 9.3 13.2 12 13.2C14.7 13.2 16.9 14.9 17.8 18.2"></path>
      <rect x="4.5" y="4.5" width="15" height="15" rx="7.5"></rect>
    </svg>
  `,
  orcid: `
    <svg viewBox="0 0 26 26" aria-hidden="true">
      <circle cx="13" cy="13" r="11"></circle>
      <text x="13" y="17" text-anchor="middle">iD</text>
    </svg>
  `,
  github: `
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 3C7.03 3 3 6.87 3 11.65C3 15.47 5.58 18.71 9.16 19.85C9.61 19.93 9.77 19.67 9.77 19.45C9.77 19.25 9.76 18.63 9.76 17.81C7 18.39 6.41 16.5 6.41 16.5C5.96 15.37 5.31 15.07 5.31 15.07C4.41 14.48 5.38 14.49 5.38 14.49C6.38 14.56 6.91 15.48 6.91 15.48C7.79 16.95 9.22 16.53 9.79 16.28C9.88 15.66 10.14 15.23 10.43 14.99C8.22 14.75 5.9 13.92 5.9 10.24C5.9 9.19 6.29 8.34 6.94 7.68C6.84 7.44 6.49 6.47 7.04 5.17C7.04 5.17 7.88 4.91 9.76 6.13C10.56 5.91 11.42 5.8 12.28 5.8C13.14 5.8 14 5.91 14.8 6.13C16.68 4.91 17.52 5.17 17.52 5.17C18.07 6.47 17.72 7.44 17.62 7.68C18.27 8.34 18.66 9.19 18.66 10.24C18.66 13.93 16.34 14.74 14.12 14.98C14.49 15.29 14.82 15.88 14.82 16.79C14.82 18.09 14.81 19.16 14.81 19.45C14.81 19.67 14.97 19.94 15.42 19.85C19 18.71 21.58 15.47 21.58 11.65C21.58 6.87 17.55 3 12 3Z"></path>
    </svg>
  `,
  default: `
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="9"></circle>
      <path d="M12 8V12"></path>
      <circle cx="12" cy="15.5" r="1"></circle>
    </svg>
  `
};

const createContactIcon = (key) => {
  const icon = document.createElement("span");
  icon.className = "contact-icon";
  icon.dataset.contactKey = key;
  icon.innerHTML = CONTACT_ICON_SVGS[key] || CONTACT_ICON_SVGS.default;
  return icon;
};

// 联系方式的值既可能是纯文本，也可能是可点击链接，这里统一处理。
const createContactValueNode = (link) => {
  const valueText = link.note || link.href?.replace(/^mailto:/, "") || "";
  if (!link.href) {
    const value = document.createElement("span");
    value.className = "contact-value";
    value.textContent = valueText;
    return value;
  }
  return createExternalLink(valueText, link.href, "contact-value");
};

const createContactItem = (link) => {
  const item = document.createElement("article");
  item.className = "contact-link";
  item.dataset.contactKey = link.key;

  const copy = document.createElement("div");
  copy.className = "contact-copy";

  const label = document.createElement("strong");
  label.className = "contact-label";
  label.textContent = `${link.label}：`;

  copy.append(label, createContactValueNode(link));
  item.append(createContactIcon(link.key), copy);
  return item;
};

const renderLinks = (data) => {
  const contactLinks = resetContainer("[data-contact-links]");
  if (!contactLinks) return;

  data.links.forEach((link) => {
    contactLinks.appendChild(createContactItem(link));
  });
};

const getPaperKeywords = (paper) => paper.keywords?.map(getKeywordText).filter(Boolean) || [];

const getPublicationDomains = (paper) =>
  paper.domains?.map((domain) => localize(domain)).filter(Boolean) || [];

const getPaperTitle = (paper) => localize(paper.title);

const getPaperCitation = (paper) => localize(paper.citation);

const getPaperVenue = (paper) => localize(paper.venue);

const getPaperCitationVenue = (paper) => localize(paper.citationVenue) || getPaperVenue(paper);

const getImpactFactor = (paper) => getPaperKeywords(paper).find((keyword) => /^IF\s*\d/i.test(keyword));

const getImpactFactorValue = (paper) => {
  const match = getImpactFactor(paper)?.match(/[\d.]+/);
  return match ? Number(match[0]) : 0;
};

const getJournalLevel = (paper) =>
  getPaperKeywords(paper).find((keyword) =>
    /^(JCR\s+Q\d|CSSCI|普通期刊)$/i.test(keyword)
  );

const getCasPartition = (paper) =>
  getPaperKeywords(paper).find((keyword) =>
    /^(CAS\s+Q[1-4]|中科院[一二三四]区)$/i.test(keyword)
  );

const getJournalLevelPriority = (paper) => {
  const level = getJournalLevel(paper) || "";
  if (/JCR\s+Q1/i.test(level)) return 5;
  if (/JCR\s+Q2/i.test(level)) return 4;
  if (/JCR\s+Q3/i.test(level)) return 3;
  if (/JCR\s+Q4/i.test(level)) return 2;
  if (/CSSCI/i.test(level)) return 3;
  if (/普通期刊/i.test(level)) return 1;
  return 0;
};

const isEnglishPublication = (paper) => {
  const type = `${paper.type?.zh || ""} ${paper.type?.en || ""}`;
  if (/中文|chinese/i.test(type)) return false;
  if (/英文|english/i.test(type)) return true;

  const title =
    typeof paper.title === "string" ? paper.title : paper.title?.zh || paper.title?.en || "";
  return !/[\u4e00-\u9fff]/u.test(title);
};

const getRolePriority = (paper) => {
  const role = `${paper.role?.zh || ""} ${paper.role?.en || ""}`;
  if (/共同第一|co-first/i.test(role)) return 6;
  if (/第一作者|first author/i.test(role)) return 5;
  if (/通讯作者|corresponding/i.test(role)) return 4;
  if (/第二作者|second author/i.test(role)) return 3;
  if (/第三作者|third author/i.test(role)) return 2;
  return 0;
};

const isFirstAuthorPublication = (paper) => {
  const role = `${paper.role?.zh || ""} ${paper.role?.en || ""}`;
  return /共同第一|第一作者|co-first|first author/i.test(role);
};

const comparePublicationsByPriority = (a, b) => {
  const priorityChecks = [
    Number(isFirstAuthorPublication(b)) - Number(isFirstAuthorPublication(a)),
    Number(isEnglishPublication(b)) - Number(isEnglishPublication(a)),
    getImpactFactorValue(b) - getImpactFactorValue(a),
    getJournalLevelPriority(b) - getJournalLevelPriority(a),
    getRolePriority(b) - getRolePriority(a),
    Number(b.year) - Number(a.year)
  ];

  const priority = priorityChecks.find((value) => value !== 0);
  return priority || getPaperTitle(a).localeCompare(getPaperTitle(b), currentLanguage === "zh" ? "zh-Hans-CN" : "en");
};

const isJournalPublication = (paper) => {
  const type = localize(paper.type).toLowerCase();
  return type.includes("journal") || type.includes("期刊");
};

const createHighlightedAuthorFragment = (text) => {
  const fragment = document.createDocumentFragment();
  const pattern = /(郑天鹏|Zheng,\s*T\.|Zheng\s+T|Zheng\s+Tianpeng)/gi;
  let lastIndex = 0;

  for (const match of text.matchAll(pattern)) {
    if (match.index > lastIndex) {
      fragment.appendChild(document.createTextNode(text.slice(lastIndex, match.index)));
    }

    const strong = document.createElement("strong");
    strong.textContent = match[0];
    fragment.appendChild(strong);
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    fragment.appendChild(document.createTextNode(text.slice(lastIndex)));
  }

  return fragment;
};

const getPublicationAuthors = (paper) => {
  if (paper.authors) return localize(paper.authors);

  const citation = getPaperCitation(paper) || "";
  if (/^[\u4e00-\u9fff]/.test(citation)) {
    const match = citation.match(/^(.+?)[.。]\s*[(（]\d{4}/);
    if (match) return match[1].trim();
  }

  if (citation.includes(" et al.")) {
    return `${citation.split(" et al.", 1)[0].trim()} et al`;
  }

  const yearMatch = citation.match(/^(.+?)\s*\(\d{4}\)\.\s+/);
  if (yearMatch) return yearMatch[1].trim();

  const titleIndex = citation.toLowerCase().indexOf((getPaperTitle(paper) || "").toLowerCase());
  if (titleIndex > 0) {
    return citation.slice(0, titleIndex).replace(/[.\s]+$/u, "").trim();
  }

  return citation.split(/\.\s+/)[0]?.trim() || "";
};

const getPublicationDetail = (paper) => {
  const citation = (getPaperCitation(paper) || "").replace(/\s*https?:\/\/\S+\s*$/u, "").trim();
  const citationVenue = getPaperCitationVenue(paper);
  const venueIndex = citation.indexOf(citationVenue);
  let detail = "";

  if (venueIndex >= 0) {
    detail = citation.slice(venueIndex + citationVenue.length).replace(/^[,，.。\s]+/u, "").trim();
  } else {
    const match = citation.match(/([A-Za-z. ]+\s+\d+[^.。]*\(\d{4}\)|\(?\d{4}\)?[,，]?\s*[^.。]*)[.。]?$/u);
    detail = match?.[1]?.trim() || "";
  }

  detail = detail.replace(/[.。]$/u, "").replace(/^\((\d{4})\)$/u, "$1");
  if (!detail) return paper.year;
  return detail.includes(paper.year) ? detail : `${paper.year}, ${detail}`;
};

const createPublicationEntry = (paper) => {
  const row = document.createElement("article");
  row.className = "publication-entry";

  const title = document.createElement("h3");
  const paperTitle = getPaperTitle(paper);
  if (paper.href) {
    title.appendChild(createExternalLink(paperTitle, paper.href));
  } else {
    title.textContent = paperTitle;
  }

  const authors = document.createElement("p");
  authors.className = "publication-authors";
  authors.appendChild(createHighlightedAuthorFragment(getPublicationAuthors(paper)));

  const venue = document.createElement("span");
  venue.className = "publication-venue";
  venue.textContent = getPaperVenue(paper);

  const meta = document.createElement("div");
  meta.className = "publication-meta";

  const detail = document.createElement("span");
  detail.className = "publication-detail";
  detail.textContent = getPublicationDetail(paper);
  meta.appendChild(detail);

  if (paper.href) {
    meta.appendChild(createExternalLink(paper.href, paper.href, "publication-doi"));
  }

  const journalLevel = getJournalLevel(paper);
  if (journalLevel) {
    const tag = document.createElement("em");
    tag.className = "publication-role publication-level";
    tag.textContent = journalLevel;
    meta.appendChild(tag);
  }

  const casPartition = getCasPartition(paper);
  if (casPartition) {
    const tag = document.createElement("em");
    tag.className = "publication-role publication-level";
    tag.textContent = casPartition;
    meta.appendChild(tag);
  }

  const impactFactor = getImpactFactor(paper);
  if (impactFactor) {
    const tag = document.createElement("em");
    tag.className = "publication-role publication-if";
    tag.textContent = impactFactor;
    meta.appendChild(tag);
  }

  const role = localize(paper.role);
  if (role) {
    const tag = document.createElement("em");
    tag.className = "publication-role";
    tag.textContent = role;
    meta.appendChild(tag);
  }

  row.append(title, authors, venue, meta);
  return row;
};

const createFeaturedPublication = (paper, index, data) => {
  const card = document.createElement("article");
  card.className = "featured-card";

  const visual = document.createElement("div");
  visual.className = `featured-visual featured-visual-${(index % 3) + 1}`;
  visual.setAttribute("aria-hidden", "true");

  const visualNumber = document.createElement("span");
  visualNumber.className = "featured-number";
  visualNumber.textContent = String(index + 1).padStart(2, "0");

  const visualLabel = document.createElement("span");
  visualLabel.className = "featured-visual-label";
  visualLabel.textContent = getPublicationDomains(paper)[0] || getPaperVenue(paper);
  visual.append(visualNumber, visualLabel);

  const copy = document.createElement("div");
  copy.className = "featured-copy";

  const meta = document.createElement("div");
  meta.className = "featured-meta";
  const year = document.createElement("span");
  year.textContent = paper.year;
  const venue = document.createElement("span");
  venue.textContent = getPaperVenue(paper);
  meta.append(year, venue);

  const title = document.createElement("h3");
  const paperTitle = getPaperTitle(paper);
  if (paper.href) {
    title.appendChild(createExternalLink(paperTitle, paper.href));
  } else {
    title.textContent = paperTitle;
  }

  const authors = document.createElement("p");
  authors.className = "featured-authors";
  authors.appendChild(createHighlightedAuthorFragment(getPublicationAuthors(paper)));

  const badges = document.createElement("div");
  badges.className = "featured-badges";
  [localize(paper.role), getJournalLevel(paper), getCasPartition(paper), getImpactFactor(paper)]
    .filter(Boolean)
    .forEach((value) => {
      const badge = document.createElement("span");
      badge.textContent = value;
      badges.appendChild(badge);
    });

  copy.append(meta, title, authors, badges);

  if (paper.href) {
    const link = createExternalLink(data.ui.openLink, paper.href, "featured-link");
    link.setAttribute("aria-label", `${data.ui.openLink}: ${paperTitle}`);
    copy.appendChild(link);
  }

  card.append(visual, copy);
  return card;
};

const renderFeaturedPublications = (data) => {
  const container = resetContainer("[data-featured-publications]");
  if (!container) return;

  data.publications
    .filter(isJournalPublication)
    .slice()
    .sort(comparePublicationsByPriority)
    .slice(0, 3)
    .forEach((paper, index) => {
      container.appendChild(createFeaturedPublication(paper, index, data));
    });
};

const groupPublicationsByDomain = (publications) =>
  publications.reduce((groups, paper) => {
    const domain = getPublicationDomains(paper)[0] || (currentLanguage === "zh" ? "未分类" : "Uncategorized");
    if (!groups.has(domain)) groups.set(domain, []);
    groups.get(domain).push(paper);
    return groups;
  }, new Map());

const getDomainToggleLabel = (remainingCount, isExpanded, data) => {
  if (isExpanded) return data.ui.showLess;
  return currentLanguage === "zh" ? `展开其余 ${remainingCount} 篇` : `Show ${remainingCount} more`;
};

const renderPublications = (data) => {
  const container = resetContainer("[data-publications]");
  if (!container) return;

  const journalPublications = data.publications
    .filter(isJournalPublication)
    .slice()
    .sort(comparePublicationsByPriority);
  const groupedPublications = groupPublicationsByDomain(journalPublications);
  const orderedDomains = data.publicationDomainOrder?.map((domain) => localize(domain)).filter(Boolean) || [];
  const remainingDomains = [...groupedPublications.keys()].filter((domain) => !orderedDomains.includes(domain));

  [...orderedDomains, ...remainingDomains].forEach((domain) => {
    const papers = groupedPublications.get(domain);
    if (!papers?.length) return;

    const section = document.createElement("section");
    section.className = "publication-domain-group";

    const header = document.createElement("div");
    header.className = "domain-heading-row";

    const heading = document.createElement("h4");
    heading.className = "domain-heading";
    heading.textContent = domain;

    header.appendChild(heading);

    const list = document.createElement("div");
    list.className = "domain-publication-list";

    const visiblePapers = papers.slice(0, DEFAULT_VISIBLE_PUBLICATIONS_PER_DOMAIN);
    const remainingPapers = papers.slice(DEFAULT_VISIBLE_PUBLICATIONS_PER_DOMAIN);
    const isExpanded = expandedPublicationDomains.has(domain);

    visiblePapers.forEach((paper) => list.appendChild(createPublicationEntry(paper)));

    if (remainingPapers.length) {
      const moreList = document.createElement("div");
      moreList.className = "domain-publication-list domain-publication-extra";
      moreList.hidden = !isExpanded;
      remainingPapers.forEach((paper) => moreList.appendChild(createPublicationEntry(paper)));

      const button = document.createElement("button");
      button.className = "text-button domain-toggle";
      button.type = "button";
      button.textContent = getDomainToggleLabel(remainingPapers.length, isExpanded, data);
      button.setAttribute("aria-expanded", isExpanded ? "true" : "false");
      button.addEventListener("click", () => {
        if (expandedPublicationDomains.has(domain)) {
          expandedPublicationDomains.delete(domain);
        } else {
          expandedPublicationDomains.add(domain);
        }
        renderPublications(getData());
      });
      header.appendChild(button);
      list.appendChild(moreList);
    }

    section.append(header, list);
    container.appendChild(section);
  });

  const toggle = bySelector("[data-publications-toggle]");
  if (toggle) {
    toggle.hidden = true;
  }
};

const renderResearchTags = (data) => {
  const container = resetContainer("[data-research-tags]");
  if (!container) return;

  data.researchDirections.forEach((item) => {
    const tag = document.createElement("span");
    tag.textContent = item.title;
    container.appendChild(tag);
  });
};

const renderResearchFocus = (data) => {
  const container = resetContainer("[data-research-focus]");
  if (!container) return;

  const heading = document.createElement("h3");
  heading.className = "research-focus-heading";
  heading.textContent = data.researchFocus?.title || data.ui.focusHeading || "";

  const body = document.createElement("p");
  body.className = "research-focus-text";
  body.textContent = data.researchFocus?.body || data.ui.researchIntro || "";

  container.append(heading, body);
};

const renderYear = () => {
  const year = bySelector("[data-year]");
  if (year) year.textContent = new Date().getFullYear();
};

const renderPage = () => {
  const data = getData();
  renderMeta(data);
  renderStaticCopy(data);
  renderProfile(data);
  renderProfileInlineLinks(data);
  renderEducation(data);
  renderNews(data);
  renderLinks(data);
  renderResearchTags(data);
  renderResearchDirections(data);
  renderResearchFocus(data);
  renderFeaturedPublications(data);
  renderPublications(data);
  renderYear();
};

const switchLanguage = (language) => {
  if (!SITE_DATA[language]) return;
  currentLanguage = language;
  localStorage.setItem(STORAGE_KEY, currentLanguage);
  renderPage();
};

allBySelector("[data-language-option]").forEach((button) => {
  button.addEventListener("click", () => switchLanguage(button.dataset.languageOption));
});

renderPage();
