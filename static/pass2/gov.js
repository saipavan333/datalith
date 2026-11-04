/* Datalith pass 2 — Track 20: Governance, quality & security. */
(function () {
  const { C, t, box, arrow, line, table, badge, svg, slider, choice } = P2L;
  const P = window.P2;

  /* ---------------------------------------------------------------- gov-data-quality */
  P["gov-data-quality"] = {
    simple: [
      "**Data quality** has several dimensions: **completeness** (nothing missing), **validity** (values follow the rules), **uniqueness** (no duplicates), **consistency** (matches other sources), **accuracy** (matches reality) and **timeliness** (arrives on time).",
      "Check them automatically on every load. Rows that fail go to a **quarantine** table with the reason, instead of being silently dropped or loaded.",
      "Set a threshold: a few bad rows are quarantined and the load continues; past the threshold, stop the load and alert, because something upstream is broken.",
    ],
    analogy: {
      text: "Think of sorting fruit at a packing house.",
      left: "Fruit packing", right: "Data quality",
      map: [
        ["Checking size, ripeness and bruises", "Validation rules"],
        ["A side crate for rejects, labelled why", "Quarantine table with reasons"],
        ["A few rejects: carry on packing", "Below threshold: load continues"],
        ["Half the delivery rotten: stop and call the farm", "Above threshold: halt and alert"],
      ],
      breaks: "rotten fruit is easy to see. Data can pass every rule and still be wrong (a correct-looking price in the wrong currency), so accuracy needs reconciliation against a trusted source.",
    },
    svg: () => P["gov-data-quality"]._fig(10),
    _fig: pct => {
      const stop = pct > 5;
      let b = t(240, 20, "100,000 rows in; " + pct + "% fail validation; threshold 5%", { bold: true, size: 13 });
      b += box(16, 44, 110, 60, "incoming", "100,000 rows", "plain");
      b += arrow(128, 74, 156, 74);
      b += box(160, 44, 120, 60, "validate", "rules + reason", "vio");
      b += arrow(282, 62, 330, 52); b += arrow(282, 88, 330, 112, { stroke: C.badS });
      b += box(334, 32, 130, 44, stop ? "load halted" : "loaded", stop ? "nothing published" : (100000 * (100 - pct) / 100).toLocaleString("en-US") + " rows", stop ? "ghost" : "good", { size2: 11 });
      b += box(334, 92, 130, 44, "quarantine", (1000 * pct).toLocaleString("en-US") + " rows + why", "bad", { size2: 11 });
      b += box(16, 156, 448, 40, stop ? "Above threshold: stop, alert the source owner" : "Below threshold: publish, review quarantine later", null, stop ? "bad" : "good", { size: 12.5 });
      return svg(480, 210, b, "Validate-and-quarantine flow with a failure threshold");
    },
    caption: "Bad rows go to quarantine with a reason; too many bad rows stop the whole load.",
    ix: el => slider(el, { label: "Rows failing (%)", min: 0, max: 20, value: 2 }, v => ({ svg: P["gov-data-quality"]._fig(v), note: v > 5 ? "This many failures usually means a broken upstream change, not a few odd rows." : v === 0 ? "Clean load." : "A few bad rows: keep them for review rather than dropping them silently." })),
    oneline: "Check data on every load, set bad rows aside with a reason, and stop if too many are bad.",
  };

  /* ---------------------------------------------------------------- gov-pii-security */
  P["gov-pii-security"] = {
    simple: [
      "**PII** (personally identifiable information) is any data that can identify a person: name, email, phone, address, government ID, and even combinations like birth date plus postcode.",
      "The core habits: **minimise** (don't collect or copy what you don't need), **classify** (tag sensitive columns), **control** access (least privilege), **protect** (encrypt, mask, tokenise) and **monitor** (audit who reads what).",
      "Governance is the set of rules and owners that keeps these habits going as the platform grows.",
    ],
    analogy: {
      text: "Think of a hospital's patient records.",
      left: "Hospital", right: "PII handling",
      map: [
        ["Only noting what treatment needs", "Minimise"],
        ["Red folders for sensitive records", "Classify"],
        ["Only the patient's doctors may open them", "Least-privilege access"],
        ["Locked cabinets", "Encryption"],
        ["Sign-out sheet for every folder", "Audit logs"],
      ],
      breaks: "a folder is either open or closed. Data leaks through copies: an export to a spreadsheet, a debug log, a test database, so controls must follow the data, not just guard the main table.",
    },
    svg: () => {
      let b = t(240, 22, "Five habits for personal data", { bold: true, size: 14 });
      [["minimise", "collect less", "acc"], ["classify", "tag columns", "vio"], ["control", "least privilege", "warn"], ["protect", "encrypt, mask", "good"], ["monitor", "audit reads", "plain"]].forEach(([n, s, k], i) => { b += box(10 + i * 94, 44, 86, 60, n, s, k, { size: 12.5, size2: 10 }); if (i < 4) b += arrow(98 + i * 94, 74, 102 + i * 94, 74, { sw: 1.2 }); });
      b += table(60, 130, ["column", "class", "who sees it"], [["email", "PII", "support (masked)"], ["order_amount", "internal", "analysts"], ["aadhaar_no", "restricted", "nobody by default"]], { cw: [120, 100, 140], rh: 26, size: 11.5, hl: { 2: "bad" } });
      return svg(480, 248, b, "Personal data habits and a column classification example");
    },
    caption: "Tag each column by sensitivity and let the tag decide who may see it and how.",
    oneline: "Handle personal data by collecting less, tagging it, limiting access, protecting it and auditing use.",
  };

  /* ---------------------------------------------------------------- gov-lineage-catalog */
  P["gov-lineage-catalog"] = {
    simple: [
      "**Lineage** records what feeds what: which sources and jobs built a table, and which dashboards and models read it. It answers \"if I change this, what breaks?\" (impact) and \"why is this number wrong?\" (root cause).",
      "A **data catalog** is a searchable inventory of datasets: descriptions, owners, columns, tags, freshness and lineage, so people can find and trust data. Examples: Dataplex, DataHub, OpenMetadata, Unity Catalog.",
      "The best lineage is collected automatically from query logs and tools like dbt and OpenLineage, not drawn by hand.",
    ],
    analogy: {
      text: "Think of a family tree and a library catalogue.",
      left: "Everyday", right: "Data governance",
      map: [
        ["A family tree: who descends from whom", "Lineage graph"],
        ["\"Which cousins share this grandparent?\"", "Impact analysis"],
        ["Tracing an inherited trait back", "Root-cause analysis"],
        ["The library's searchable catalogue", "Data catalog"],
      ],
      breaks: "family trees rarely change. Lineage changes with every deploy, so hand-drawn lineage goes stale within weeks; only automatically collected lineage stays true.",
    },
    svg: () => {
      let b = t(240, 22, "Change raw.orders: what's affected?", { bold: true, size: 13.5 });
      b += box(16, 90, 100, 36, "raw.orders", null, "warn", { mono: true, size: 11.5 });
      b += arrow(118, 108, 146, 108);
      b += box(150, 90, 100, 36, "stg_orders", null, "bad", { mono: true, size: 11.5 });
      b += arrow(252, 100, 280, 66); b += arrow(252, 116, 280, 150);
      b += box(284, 48, 100, 36, "fct_orders", null, "bad", { mono: true, size: 11.5 });
      b += box(284, 132, 100, 36, "churn_model", null, "bad", { mono: true, size: 11.5 });
      b += arrow(386, 66, 404, 66); b += box(408, 48, 60, 36, "BI", null, "bad", { size: 12 });
      b += t(240, 206, "Lineage lists every downstream asset and its owner before you ship.", { size: 12, fill: C.dim });
      return svg(480, 222, b, "Lineage graph showing downstream impact of a source change");
    },
    caption: "Everything downstream of the changed table (red) is at risk; lineage finds it in seconds.",
    oneline: "Lineage shows what feeds what, and a catalog helps people find, understand and trust data.",
  };

  /* ---------------------------------------------------------------- gov-privacy-compliance */
  P["gov-privacy-compliance"] = {
    simple: [
      "Privacy laws set rules for personal data. The EU's **GDPR** (General Data Protection Regulation) is the best known; India's **DPDP Act 2023** (Digital Personal Data Protection) follows similar ideas.",
      "Core GDPR principles: have a lawful basis, use data only for the stated **purpose**, keep the **minimum**, keep it only as **long** as needed, and keep it secure. People have rights to **access**, correct and **erase** their data.",
      "For data engineers this means: know where each person's data lives, be able to delete it everywhere (including backups and derived tables), and report a breach to the regulator within 72 hours. GDPR fines reach €20 million or 4% of global annual turnover, whichever is higher.",
    ],
    analogy: {
      text: "Think of borrowing a friend's car.",
      left: "Borrowed car", right: "Privacy law",
      map: [
        ["Agreeing what you'll use it for", "Purpose limitation"],
        ["Not taking it on a road trip you didn't mention", "No reuse for new purposes without a basis"],
        ["Returning it when you're done", "Storage limitation"],
        ["\"Give me my keys back now\"", "Right to erasure"],
        ["Reporting a scratch straight away", "Breach notification"],
      ],
      breaks: "you return a car in one piece. Personal data gets copied into many tables, logs and models, so honouring erasure means tracking every copy, which is why lineage and classification matter.",
    },
    svg: () => {
      let b = t(240, 22, "An erasure request touches every copy", { bold: true, size: 14 });
      b += box(16, 50, 120, 50, "user asks", "delete my data", "warn", { size2: 11 });
      b += arrow(138, 75, 166, 75);
      b += box(170, 50, 120, 50, "find by lineage", "+ classification", "vio", { size2: 11 });
      [["raw + bronze", 34], ["silver, gold", 76], ["logs, exports", 118], ["backups (expire)", 160]].forEach(([n, y]) => { b += arrow(292, 75, 330, y + 14, { sw: 1.1 }); b += box(334, y, 130, 30, n, null, "plain", { size: 11.5 }); });
      b += t(150, 158, "GDPR: answer within a month", { size: 11.5, fill: C.dim });
      b += t(150, 176, "breach: tell the regulator in 72 h", { size: 11.5, fill: C.dim });
      return svg(480, 206, b, "Erasure request propagating to every copy of personal data");
    },
    caption: "Deleting a person's data means finding and removing every copy, not only the source row.",
    oneline: "Privacy laws limit why and how long you keep personal data, and let people see or erase it.",
  };

  /* ---------------------------------------------------------------- gov-access-masking */
  const ROLES = [["analyst", ["IN only", "r***@mail.com", "visible"]], ["support (IN)", ["IN only", "ria@mail.com", "hidden"]], ["admin", ["all rows", "ria@mail.com", "visible"]]];
  P["gov-access-masking"] = {
    simple: [
      "Access control decides who can see what. **RBAC** (role-based access control) grants rights to roles like `analyst`. **ABAC** (attribute-based) uses tags and user attributes, like \"PII columns only for people in the privacy group\".",
      "Control can be fine-grained: **row-level security** shows each user only their rows (an Indian team sees only Indian customers), and **column-level security** hides or **masks** sensitive columns (`r***@mail.com`).",
      "Grant the least access that does the job, and grant it to groups, not individuals.",
    ],
    analogy: {
      text: "Think of a building's key cards.",
      left: "Office building", right: "Data access",
      map: [
        ["Cards by job: staff, cleaner, manager", "RBAC roles"],
        ["Card works only on your floor", "Row-level security"],
        ["Frosted glass over the finance office", "Column masking"],
        ["Visitor badge with an end time", "Temporary, expiring grants"],
      ],
      breaks: "a key card can't copy a room. A user allowed to read data can export it, so masking and row filters must apply in the warehouse itself, not only in a dashboard.",
    },
    svg: () => P["gov-access-masking"]._fig(0),
    _fig: i => {
      const [r, [rows, email, amt]] = ROLES[i];
      let b = t(240, 20, "SELECT * FROM customers  as role: " + r, { bold: true, size: 13 });
      const data = [["Ria", "IN", email, amt === "hidden" ? "***" : "4,500"], ["Om", "IN", email.replace("ria", "om").replace("r***", "o***"), amt === "hidden" ? "***" : "1,200"]];
      if (rows === "all rows") data.push(["Eli", "UK", i === 2 ? "eli@mail.com" : "e***@mail.com", "3,100"]);
      b += table(30, 40, ["name", "country", "email", "spend"], data, { cw: [80, 80, 160, 100], rh: 30, size: 12 });
      b += box(30, 40 + 30 * (data.length + 1) + 14, 420, 36, "rows: " + rows + "  |  email: " + (email.includes("***") ? "masked" : "clear") + "  |  spend: " + amt, null, "plain", { size: 12 });
      return svg(480, 40 + 30 * (data.length + 1) + 64, b, "Rows and columns visible to a role");
    },
    caption: "The same query returns different rows and masked columns depending on who runs it.",
    ix: el => choice(el, { label: "Run as", options: ROLES.map(r => r[0]), value: 1 }, i => ({ svg: P["gov-access-masking"]._fig(i), note: ["Analysts see spend but only masked emails, for Indian rows.", "Support can see emails to help customers, but not spend.", "Admins see everything; keep this group tiny and audited."][i] })),
    oneline: "Access control decides which rows and columns each role sees, masking what they shouldn't.",
  };

  /* ---------------------------------------------------------------- gov-data-mesh */
  P["gov-data-mesh"] = {
    simple: [
      "In a central model, one data team builds everything for everyone, and becomes a bottleneck as the company grows.",
      "**Data mesh** spreads ownership: each business **domain** (payments, logistics, marketing) owns its data as a **data product**, with documentation, quality promises and an owner.",
      "A central **platform** team provides self-serve tools, and **federated governance** sets shared rules (naming, security, interoperability) that every domain follows.",
    ],
    analogy: {
      text: "Think of a food court instead of one big restaurant kitchen.",
      left: "Food court", right: "Data mesh",
      map: [
        ["Each stall cooks its own speciality", "Domains own their data products"],
        ["Menus with prices and allergens", "Product docs and quality promises"],
        ["The mall provides power, water, seating", "Self-serve data platform"],
        ["Food-safety rules for every stall", "Federated governance"],
      ],
      breaks: "food stalls already know how to cook. Many domain teams have no data engineers; data mesh only works if domains get the skills and time, otherwise quality drops everywhere at once.",
    },
    svg: () => {
      let b = t(240, 22, "Domains own products on a shared platform", { bold: true, size: 13.5 });
      [["payments", "acc"], ["logistics", "vio"], ["marketing", "warn"]].forEach(([d, k], i) => { b += box(16 + i * 152, 40, 140, 70, d, "data product + owner", k, { size2: 10.5 }); });
      b += box(16, 128, 444, 40, "self-serve platform: storage, pipelines, catalog, access", null, "plain", { size: 12 });
      b += box(16, 180, 444, 36, "federated governance: shared rules, security, naming", null, "good", { size: 12 });
      return svg(480, 230, b, "Data mesh domains on a shared platform with federated governance");
    },
    caption: "Domains build and own products; the platform and shared rules keep them compatible.",
    oneline: "Data mesh makes each business domain own its data as a product, on a shared platform with shared rules.",
  };

  /* ---------------------------------------------------------------- gov-mdm */
  P["gov-mdm"] = {
    simple: [
      "The same customer often appears in many systems: the CRM says \"Ria Sharma\", billing says \"R. Sharma\", support has an old email. **Master data management** (MDM) builds one trusted **golden record** per real-world entity.",
      "It works in steps: **match** records that refer to the same entity (fuzzy matching on name, email, phone), **merge** them using survivorship rules (newest email wins, billing address from billing), and give each a master ID.",
      "Other systems then use that master ID, so reports count one customer once.",
    ],
    analogy: {
      text: "Think of a school merging pupil lists after two schools join.",
      left: "School merger", right: "MDM",
      map: [
        ["Two lists with the same child spelled differently", "Duplicate records across systems"],
        ["Matching on name, birthday and parents", "Match rules"],
        ["Deciding which address to keep", "Survivorship rules"],
        ["A new single roll number", "Master ID / golden record"],
      ],
      breaks: "a teacher can phone a parent to check. Automatic matching makes mistakes both ways (merging two different people, missing a real match), so uncertain matches need a human review queue.",
    },
    svg: () => {
      let b = t(240, 22, "Three records, one customer", { bold: true, size: 14 });
      [["CRM", "Ria Sharma", "ria@x.in"], ["billing", "R. Sharma", "ria@x.in"], ["support", "Ria S.", "ria.old@y.com"]].forEach(([s, n, e], i) => { b += box(16, 40 + i * 54, 160, 46, s + ": " + n, e, "plain", { size: 12, size2: 10.5, mono2: true }); b += arrow(178, 63 + i * 54, 216, 117, { sw: 1.2 }); });
      b += box(220, 94, 90, 46, "match", "+ merge", "vio");
      b += arrow(312, 117, 340, 117);
      b += box(344, 80, 120, 74, "golden record", "M-1042: Ria Sharma", "good", { size2: 10.5 });
      return svg(480, 214, b, "Matching and merging duplicate records into a golden record");
    },
    caption: "Matching finds records for the same person; survivorship rules pick each field for the golden record.",
    oneline: "Master data management merges duplicate records into one trusted record for each customer or product.",
  };

  /* ---------------------------------------------------------------- gov-encryption */
  P["gov-encryption"] = {
    simple: [
      "**Encryption** scrambles data so only someone with the key can read it. Data is encrypted **at rest** (on disk, usually AES-256) and **in transit** (over the network, with TLS).",
      "**Symmetric** encryption uses one key to lock and unlock, and is fast. **Asymmetric** encryption uses a public key to lock and a private key to unlock, and is used to exchange keys and sign things.",
      "Clouds use **envelope encryption**: a data key encrypts the data, and a master key held in a key management service (KMS) encrypts the data key. With **CMEK** (customer-managed keys) you control that master key and can revoke it.",
    ],
    analogy: {
      text: "Think of a safe-deposit box at a bank.",
      left: "Bank", right: "Encryption",
      map: [
        ["Your valuables locked in a box", "Data encrypted with a data key"],
        ["The box key kept in the bank's vault", "Data key wrapped by the KMS master key"],
        ["Armoured van between branches", "TLS in transit"],
        ["You can cancel the vault access", "Revoking a customer-managed key"],
      ],
      breaks: "a locked box protects against thieves, not against you. Encryption at rest doesn't stop a user with query access from reading data; access control and masking still matter.",
    },
    svg: () => {
      let b = t(240, 22, "Envelope encryption", { bold: true, size: 14 });
      b += box(16, 50, 100, 46, "data", "plain text", "plain");
      b += arrow(118, 73, 146, 73, { label: "DEK" });
      b += box(150, 50, 120, 46, "encrypted data", "on disk", "good", { size: 12 });
      b += box(150, 130, 120, 46, "data key (DEK)", null, "warn", { size: 12 });
      b += arrow(272, 153, 300, 153, { label: "KEK" });
      b += box(304, 130, 160, 46, "wrapped DEK", "stored with the data", "vio", { size2: 11 });
      b += box(304, 50, 160, 46, "KMS master key", "never leaves KMS", "acc", { size2: 11 });
      b += arrow(384, 98, 384, 128, { dash: true });
      b += t(240, 206, "Revoke the master key and every wrapped DEK becomes useless.", { size: 12, fill: C.dim });
      return svg(480, 222, b, "Envelope encryption with a data key wrapped by a KMS master key");
    },
    caption: "A data key encrypts the data; the master key in KMS encrypts the data key.",
    oneline: "Encryption locks data with keys, on disk and on the network, with master keys kept in a key service.",
  };

  /* ---------------------------------------------------------------- gov-compliance-frameworks */
  P["gov-compliance-frameworks"] = {
    simple: [
      "Different rules apply depending on the data and the customers. **GDPR** (EU) and **DPDP** (India) cover personal data. **HIPAA** covers US health data. **PCI DSS** covers payment card data. **SOC 2** is an audit report showing a company's security controls work, often required by business customers.",
      "Laws (GDPR, HIPAA, DPDP) are legal duties. Standards and attestations (PCI DSS, SOC 2, ISO 27001) are frameworks you are audited against.",
      "In practice they ask for similar controls: access control, encryption, audit logs, retention, incident response, and proof that all of these run.",
    ],
    analogy: {
      text: "Think of safety rules for different kinds of vehicles.",
      left: "Vehicles", right: "Compliance",
      map: [
        ["Road traffic law for everyone", "GDPR / DPDP for personal data"],
        ["Extra rules for ambulances", "HIPAA for health data"],
        ["Rules for armoured cash vans", "PCI DSS for card data"],
        ["An annual roadworthiness certificate", "SOC 2 / ISO 27001 audit"],
      ],
      breaks: "a roadworthy certificate covers the whole car. Compliance scope is often a part of the platform; card data kept out of most systems (tokenised) shrinks the PCI scope a lot.",
    },
    svg: () => {
      let b = t(240, 22, "Common controls behind many frameworks", { bold: true, size: 13.5 });
      b += table(16, 40, ["", "GDPR", "HIPAA", "PCI DSS", "SOC 2"], [["covers", "EU personal", "US health", "card data", "controls audit"], ["type", "law", "law", "standard", "attestation"]], { cw: [72, 92, 92, 92, 100], rh: 28, size: 11 });
      [["access control", "acc"], ["encryption", "vio"], ["audit logs", "warn"], ["retention", "good"], ["incidents", "plain"]].forEach(([n, k], i) => { b += box(16 + i * 90, 140, 84, 40, n, null, k, { size: n.length > 12 ? 9.5 : 11 }); });
      b += t(240, 206, "Build the controls once; map them to each framework.", { size: 12, fill: C.dim });
      return svg(480, 222, b, "Compliance frameworks and the controls they share");
    },
    caption: "Most frameworks ask for the same handful of controls, so build them once and reuse the evidence.",
    oneline: "Compliance frameworks cover different data, but mostly ask for the same core security controls.",
  };

  /* ---------------------------------------------------------------- gov-classification-retention */
  P["gov-classification-retention"] = {
    simple: [
      "**Classification** tags each dataset or column by sensitivity, for example public, internal, confidential, restricted. Tags then drive controls automatically: who can read, whether to mask, where it may be stored.",
      "**Retention** says how long data is kept and what happens after: move to cheaper storage, anonymise, or delete. Rules come from law (tax records often must be kept for years) and from privacy (don't keep personal data longer than needed).",
      "Automate both. Storage lifecycle rules and table expiry settings enforce retention without anyone remembering to.",
    ],
    analogy: {
      text: "Think of a household's paperwork.",
      left: "Paperwork", right: "Classification and retention",
      map: [
        ["Labels: \"keep safe\", \"ordinary\"", "Sensitivity classes"],
        ["Passports in the locked drawer", "Restricted data, tight access"],
        ["Keeping tax papers for years", "Legal retention period"],
        ["Shredding old bank letters", "Deletion after retention"],
        ["Moving old photos to the loft", "Archive to cold storage"],
      ],
      breaks: "shredding a letter destroys it. Deleting a row may leave copies in backups, snapshots and time-travel versions until those expire too, so retention must cover them.",
    },
    svg: () => P["gov-classification-retention"]._fig(400),
    _fig: d => {
      let b = t(240, 20, "customer_events row, " + d + " days old", { bold: true, size: 13.5 });
      const stages = [[0, 90, "hot storage", "acc"], [90, 365, "cold storage", "vio"], [365, 730, "anonymised", "warn"], [730, 1000, "deleted", "bad"]];
      stages.forEach(([a, z, n, k], j) => { b += box(16 + j * 112, 44, 108, 40, n, a + "-" + (z === 1000 ? "..." : z) + " d", d >= a && d < z ? k : "ghost", { size: 11.5, size2: 10 }); });
      const j = stages.findIndex(([a, z]) => d >= a && d < z), [a0, z0] = stages[j], px = 16 + j * 112 + 108 * Math.min(1, (d - a0) / (z0 - a0));
      b += `<polygon points="${px.toFixed(1)},92 ${(px - 6).toFixed(1)},104 ${(px + 6).toFixed(1)},104" style="fill:${C.tx}"/>`;
      const cur = stages.find(([a, z]) => d >= a && d < z) || stages[3];
      b += box(16, 120, 448, 40, "now: " + cur[2], null, cur[3], { size: 13 });
      b += t(240, 186, "class: confidential (contains user_id) -> 2-year retention", { size: 12, fill: C.dim });
      return svg(480, 200, b, "Data lifecycle stages by age under a retention policy");
    },
    caption: "Age decides the stage: hot, then cold, then anonymised, then deleted.",
    ix: el => slider(el, { label: "Age (days)", min: 0, max: 999, step: 10, value: 30 }, v => ({ svg: P["gov-classification-retention"]._fig(v), note: v >= 730 ? "Deleted, including snapshots and backups once they expire." : v >= 365 ? "user_id replaced with a random key: still useful for trends, no longer personal." : "Kept in full for operations and analysis." })),
    oneline: "Tag data by sensitivity and let its age decide when it's archived, anonymised or deleted.",
  };

  /* ---------------------------------------------------------------- gov-interview-prep */
  P["gov-interview-prep"] = {
    simple: [
      "This page collects the governance, quality and security track for revision.",
      "Expect: data quality dimensions and quarantine, PII handling, GDPR rights like erasure, RBAC vs ABAC, row and column security, encryption and KMS, lineage and catalogs, data mesh.",
      "Good answers connect a rule to how it is enforced automatically, not just stated in a policy document.",
    ],
    analogy: {
      text: "Think of a building inspector's visit.",
      left: "Inspection", right: "Governance interview",
      map: [
        ["Are the fire exits marked?", "Is data classified?"],
        ["Who has keys to which rooms?", "Access control"],
        ["Are the alarms tested?", "Quality checks and monitoring"],
        ["Records of past incidents", "Audit logs"],
      ],
      breaks: "an inspector visits once a year. Data governance has to work every day, which is why answers should stress automation over manual review.",
    },
    svg: () => {
      let b = t(240, 22, "Policy -> automated control -> evidence", { bold: true, size: 13.5 });
      [["policy", "PII is masked for analysts", "plain"], ["control", "masking rule in warehouse", "acc"], ["evidence", "audit log, test results", "good"]].forEach(([a, z, k], i) => { const x = 16 + i * 152; b += box(x, 50, 140, 70, a, z, k, { size2: 9.5 }); if (i < 2) b += arrow(x + 142, 85, x + 150, 85, { sw: 1.4 }); });
      return svg(480, 140, b, "Governance from policy to automated control to evidence");
    },
    caption: "A rule only counts when a system enforces it and leaves evidence that it did.",
    oneline: "Know quality, privacy, access and security rules, and how each one is enforced automatically.",
  };
})();
