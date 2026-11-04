/* Datalith pass 2 — Track 19: DataOps, infrastructure & the engineer's craft. */
(function () {
  const { C, t, box, arrow, line, table, badge, svg, slider, choice } = P2L;
  const P = window.P2;

  /* ---------------------------------------------------------------- dataops-git */
  const GITC = [["edit file", [1, 0, 0, 0]], ["git add", [1, 1, 0, 0]], ["git commit", [1, 1, 1, 0]], ["git push", [1, 1, 1, 1]]];
  P["dataops-git"] = {
    simple: [
      "**Git** records every change to your code, so you can see who changed what, when, and why, and go back to any earlier version.",
      "A change moves through stages: you **edit** files in your working folder, `git add` puts chosen changes in the **staging area**, `git commit` saves them as a snapshot in your local history, and `git push` sends commits to a shared remote like GitHub.",
      "**Branches** let you work on a change without touching the main line, then merge it when it's ready.",
    ],
    analogy: {
      text: "Think of preparing a parcel at the post office.",
      left: "Post office", right: "Git",
      map: [
        ["Items on your desk", "Working directory changes"],
        ["Putting chosen items in the box", "`git add` (staging)"],
        ["Sealing and labelling the box", "`git commit` with a message"],
        ["Handing it over the counter", "`git push` to the remote"],
        ["A separate box for a different order", "A branch"],
      ],
      breaks: "a posted parcel can't be changed. A pushed commit can be rewritten with a force push, which breaks everyone else's copy, so never rewrite history on a shared branch.",
    },
    svg: () => P["dataops-git"]._fig(2),
    _fig: i => {
      const st = GITC[i][1];
      let b = t(240, 20, "after: " + GITC[i][0], { bold: true, size: 14, mono: true });
      [["working dir", "acc"], ["staging", "vio"], ["local repo", "warn"], ["remote (GitHub)", "good"]].forEach(([n, k], j) => {
        const x = 12 + j * 118;
        b += box(x, 40, 106, 60, n, st[j] ? "has the change" : "-", st[j] ? k : "ghost", { size: 12, size2: 10.5 });
        if (j < 3) b += arrow(x + 108, 70, x + 116, 70, { sw: 1.4 });
      });
      ["git add", "git commit", "git push"].forEach((c, j) => { b += t(130 + j * 118, 120, c, { size: 11, mono: true, fill: C.dim }); });
      b += t(240, 152, "git status shows which stage each change is in", { size: 12, fill: C.dim });
      return svg(480, 168, b, "A change moving through Git's working directory, staging area, local repo and remote");
    },
    caption: "Each command moves the change one stage to the right.",
    ix: el => choice(el, { label: "Command", options: GITC.map(g => g[0]), value: 0 }, i => ({ svg: P["dataops-git"]._fig(i), note: ["Only on your disk. Nothing is recorded yet.", "Staged: the next commit will include it.", "Saved in your local history, but nobody else can see it yet.", "Now on the shared remote; teammates can pull it."][i] })),
    oneline: "Git saves snapshots of your code as you add, commit and push changes.",
  };

  /* ---------------------------------------------------------------- dataops-github */
  P["dataops-github"] = {
    simple: [
      "**GitHub** hosts Git repositories and adds team features. The main one is the **pull request** (PR): a proposal to merge your branch into main, where teammates review the diff and comment.",
      "Most teams use **trunk-based** development: short-lived branches merged into main often, protected by required reviews and passing checks.",
      "**GitHub Actions** runs workflows (YAML files in `.github/workflows/`) on events like a push or a PR, for example running tests and linting on every change.",
    ],
    analogy: {
      text: "Think of submitting an essay to a teacher for review.",
      left: "Essay review", right: "Pull request",
      map: [
        ["Your draft in a separate notebook", "A feature branch"],
        ["Handing it in for comments", "Opening a PR"],
        ["The teacher's red-pen notes", "Review comments on the diff"],
        ["The spell-checker run before reading", "GitHub Actions checks"],
        ["Copying the approved essay into the class book", "Merging into main"],
      ],
      breaks: "a teacher reads every word. Reviewers skim big PRs, so large changes get weaker review; keep PRs small and focused.",
    },
    svg: () => {
      let b = t(240, 22, "Branch -> pull request -> merge", { bold: true, size: 14 });
      b += line(20, 160, 460, 160, { stroke: C.goodS, sw: 3 }); b += t(30, 182, "main", { a: "start", size: 12, mono: true, fill: C.goodT });
      b += line(80, 160, 120, 100, { stroke: C.accS, sw: 2.4 }); b += line(120, 100, 330, 100, { stroke: C.accS, sw: 2.4 }); b += line(330, 100, 380, 160, { stroke: C.accS, sw: 2.4 });
      [140, 200, 260].forEach(x => { b += `<circle cx="${x}" cy="100" r="7" style="fill:${C.accS}"/>`; });
      b += t(200, 86, "feature/add-orders-model", { size: 11.5, mono: true, fill: C.accT });
      b += box(150, 40, 180, 30, "PR: review + checks", null, "vio", { size: 12 });
      b += `<circle cx="380" cy="160" r="9" style="fill:${C.goodS}"/>`; b += t(400, 145, "merge", { size: 12, fill: C.goodT, a: "start" });
      b += box(20, 196, 440, 34, "Actions on PR: pytest, sqlfluff, dbt build --select state:modified+", null, "plain", { size: 10.5, mono: true });
      return svg(480, 244, b, "Feature branch merged into main through a pull request");
    },
    caption: "Work happens on a branch; the pull request is where review and automatic checks happen before merging.",
    oneline: "GitHub adds pull requests for review and Actions for automatic checks around your Git branches.",
  };

  /* ---------------------------------------------------------------- dataops-cicd */
  const CI = ["lint", "unit tests", "dbt build", "data tests"];
  P["dataops-cicd"] = {
    simple: [
      "**CI** (continuous integration) runs automatic checks on every change: style checks, unit tests, a test build of the pipeline. A failing check blocks the merge.",
      "**CD** (continuous delivery or deployment) ships merged changes to production automatically, the same way every time, instead of someone copying files by hand.",
      "For data pipelines, CI usually builds the changed models into a throwaway schema with sample or production-like data and runs data tests there.",
    ],
    analogy: {
      text: "Think of an airport's checks before a plane takes off.",
      left: "Airport", right: "CI/CD",
      map: [
        ["Ground crew checklist", "Lint and unit tests"],
        ["Engine run-up on the runway", "Test build in a CI schema"],
        ["Any failed check: plane stays at the gate", "Failed check blocks the merge"],
        ["Same take-off procedure every flight", "Automated, repeatable deploy"],
      ],
      breaks: "pre-flight checks catch most problems, not weather on the way. CI can't see tomorrow's source data, so production still needs data tests and monitoring.",
    },
    svg: () => P["dataops-cicd"]._fig(-1),
    _fig: f => {
      let b = t(240, 20, f < 0 ? "All checks pass: merge and deploy" : CI[f] + " fails: merge blocked", { bold: true, size: 13.5 });
      CI.forEach((c, i) => {
        const x = 12 + i * 92, st = f < 0 || i < f ? "good" : i === f ? "bad" : "ghost";
        b += box(x, 40, 84, 54, c, st === "good" ? "pass" : st === "bad" ? "FAIL" : "skipped", st, { size: c.length > 12 ? 9.5 : 11.5, size2: 10.5 });
        b += arrow(x + 86, 67, x + 90, 67, { sw: 1.2 });
      });
      b += box(380, 40, 88, 54, "deploy", f < 0 ? "to prod" : "blocked", f < 0 ? "good" : "ghost", { size: 12 });
      b += t(240, 124, "on: pull_request   ->   on: push to main", { size: 12, mono: true, fill: C.dim });
      return svg(480, 140, b, "CI checks gating a deployment");
    },
    caption: "Checks run in order; one failure stops the pipeline before anything reaches production.",
    ix: el => choice(el, { label: "Which check fails?", options: ["none", ...CI], value: 2 }, i => ({ svg: P["dataops-cicd"]._fig(i - 1), note: i === 0 ? "Merged code deploys automatically." : "Fix the failure in the branch and push again; the checks rerun." })),
    oneline: "CI checks every change automatically, and CD ships the ones that pass the same way every time.",
  };

  /* ---------------------------------------------------------------- dataops-containers */
  P["dataops-containers"] = {
    simple: [
      "\"It works on my machine\" happens because laptops and servers have different Python versions, libraries and system tools.",
      "A **container** packages your code with everything it needs (runtime, libraries, config) into one **image**. Built from a `Dockerfile`, the image runs the same on a laptop, in CI and in the cloud.",
      "Containers share the host's operating system kernel, so they start in seconds and are much lighter than virtual machines.",
    ],
    analogy: {
      text: "Think of a lunchbox packed at home.",
      left: "Lunchbox", right: "Container",
      map: [
        ["Recipe for packing it", "`Dockerfile`"],
        ["The packed box, ready to go", "Image"],
        ["Opening it at school, work or a picnic", "Running a container anywhere"],
        ["Same food wherever you open it", "Reproducible environment"],
        ["You still need a table to eat on", "Shared host kernel"],
      ],
      breaks: "a lunchbox doesn't change after packing, but images built with `pip install pandas` (no version) can differ each time you build. Pin versions and base image tags.",
    },
    svg: () => {
      let b = t(240, 22, "Build once, run the same everywhere", { bold: true, size: 14 });
      b += box(16, 40, 140, 110, null, null, "plain");
      ["FROM python:3.12-slim", "COPY req.txt .", "RUN pip install -r", "COPY src/ src/", "CMD python run.py"].forEach((l, i) => { b += t(24, 60 + i * 19, l, { a: "start", size: 10, mono: true }); });
      b += arrow(158, 95, 186, 95, { label: "build" });
      b += box(190, 64, 100, 62, "image", "etl:1.4.2", "vio", { mono2: true });
      [["laptop", 40], ["CI", 90], ["Cloud Run / K8s", 140]].forEach(([n, y]) => { b += arrow(292, 95, 330, y + 14, { sw: 1.2 }); b += box(334, y, 130, 30, n, null, "good", { size: 12 }); });
      b += t(240, 206, "Same image tag = same code, libraries and runtime.", { size: 12, fill: C.dim });
      return svg(480, 222, b, "Dockerfile building an image that runs in several places");
    },
    caption: "The Dockerfile builds one image; that same image runs on a laptop, in CI and in the cloud.",
    oneline: "A container packs code with everything it needs, so it runs the same on any machine.",
  };

  /* ---------------------------------------------------------------- dataops-testing-cicd */
  P["dataops-testing-cicd"] = {
    simple: [
      "Test gates decide whether a change may move forward. Data pipelines need three kinds.",
      "**Unit tests** check transform logic on small fixed inputs, in seconds. **Data tests** (dbt tests, Great Expectations) check a real build's output: unique keys, no nulls, valid ranges. **Diff checks** compare the new build with production: row counts and key metrics should match unless the change meant to alter them.",
      "Fast tests run on every push; heavier ones run on the PR before merge.",
    ],
    analogy: {
      text: "Think of quality checks in a bakery.",
      left: "Bakery", right: "Pipeline test gate",
      map: [
        ["Tasting a spoon of batter", "Unit test on tiny input"],
        ["Checking a baked loaf's weight and colour", "Data tests on a build"],
        ["Comparing today's loaf with yesterday's", "Diff against production"],
        ["Not shipping a failed batch", "The gate blocks the merge"],
      ],
      breaks: "loaves don't change their recipe silently. Upstream data does; a change can pass every test on last week's sample and still break on today's data.",
    },
    svg: () => {
      let b = t(240, 22, "Test gates from push to merge", { bold: true, size: 14 });
      [["unit tests", "seconds, every push", "acc"], ["build in CI schema", "changed models only", "vio"], ["data tests", "unique, not_null, ranges", "warn"], ["diff vs prod", "counts and metrics match?", "good"]].forEach(([a, z, k], i) => { const y = 40 + i * 48; b += badge(30, y + 20, i + 1, k); b += box(52, y, 412, 40, a, z, k, { size2: 11 }); });
      return svg(480, 240, b, "Ordered test gates in a data CI pipeline");
    },
    caption: "Cheap checks first, expensive ones later; any failure stops the change.",
    oneline: "Data CI tests the logic, the built data, and how the result differs from production before merging.",
  };

  /* ---------------------------------------------------------------- dataops-iac */
  P["dataops-iac"] = {
    simple: [
      "**Infrastructure as code** (IaC) means describing your cloud resources (buckets, datasets, service accounts, clusters) in code files instead of clicking in a console.",
      "With **Terraform** you write what you want, `terraform plan` shows exactly what would change, and `terraform apply` makes it so. A **state file** records what Terraform created.",
      "The code goes through Git and review like any other code, so every environment can be rebuilt the same way.",
    ],
    analogy: {
      text: "Think of an architect's blueprint for a house.",
      left: "Building", right: "Terraform",
      map: [
        ["The blueprint", "`.tf` files"],
        ["\"Here's what the builders will change\"", "`terraform plan`"],
        ["Builders doing the work", "`terraform apply`"],
        ["The site record of what was built", "State file"],
        ["Building the same house on another plot", "Another environment from the same code"],
      ],
      breaks: "nobody adds a room to a house without updating the blueprint, but people do click changes in the cloud console. That drift makes the next `apply` revert or fight their change.",
    },
    svg: () => {
      let b = t(240, 22, "Desired state in code, Terraform closes the gap", { bold: true, size: 13.5 });
      b += box(16, 44, 150, 100, null, null, "plain");
      ['resource "google_storage', '  _bucket" "raw" {', '  name = "raw-prod"', '  location = "EU"', "}"].forEach((l, i) => { b += t(24, 64 + i * 17, l, { a: "start", size: 10.5, mono: true }); });
      b += arrow(168, 94, 196, 94);
      b += box(200, 54, 110, 80, "plan", "+1 to add", "warn", { size2: 11 });
      b += arrow(312, 94, 340, 94, { label: "apply" });
      b += box(344, 54, 120, 80, "cloud", "bucket raw-prod", "good");
      b += box(200, 160, 264, 34, "state file: what Terraform manages", null, "vio", { size: 12 });
      b += arrow(404, 136, 404, 158, { dash: true });
      return svg(480, 208, b, "Terraform plan and apply from code to cloud resources");
    },
    caption: "Plan shows the difference between the code and reality; apply makes reality match the code.",
    oneline: "Infrastructure as code describes cloud resources in reviewed files that a tool like Terraform builds for you.",
  };

  /* ---------------------------------------------------------------- dataops-observability */
  P["dataops-observability"] = {
    simple: [
      "Job monitoring says whether a job ran. **Data observability** says whether the data it produced is healthy.",
      "It watches five pillars: **freshness** (is it up to date?), **volume** (expected row counts?), **schema** (did columns change?), **distribution** (are values in normal ranges?) and **lineage** (what is upstream and downstream?).",
      "An **SLA** (service level agreement) is the promise, like \"orders ready by 06:00 on 99% of days\". The **SLI** is the measured number, and the **SLO** is the internal target.",
    ],
    analogy: {
      text: "Think of a doctor's check-up.",
      left: "Check-up", right: "Data observability",
      map: [
        ["Pulse: is the heart beating on time?", "Freshness"],
        ["Weight: within the normal range?", "Volume"],
        ["Any new symptoms?", "Schema changes"],
        ["Blood test values", "Distributions"],
        ["Family history", "Lineage"],
      ],
      breaks: "doctors know normal ranges for people. Data has no textbook ranges; tools learn them from history, so a slow drift can become the new normal without an alert.",
    },
    svg: () => {
      let b = t(240, 22, "Five pillars of data health", { bold: true, size: 14 });
      [["freshness", "last load 05:40", "good"], ["volume", "-62% rows", "bad"], ["schema", "no change", "good"], ["distribution", "amt mean normal", "good"], ["lineage", "3 downstream", "warn"]].forEach(([n, s, k], i) => { b += box(12 + i * 92, 44, 86, 70, n, s, k, { size: 12, size2: 9 }); });
      b += box(12, 140, 456, 40, "Alert: orders volume -62% vs last 4 Mondays. 3 dashboards affected.", null, "bad", { size: 12 });
      b += t(240, 206, "SLA promise; SLO target; SLI measured value", { size: 12, fill: C.dim });
      return svg(480, 222, b, "Data observability pillars with one failing signal");
    },
    caption: "A job can succeed while volume collapses; lineage tells you who is affected.",
    oneline: "Data observability checks that data is fresh, complete and normal, and shows who depends on it.",
  };

  /* ---------------------------------------------------------------- dataops-monitoring */
  P["dataops-monitoring"] = {
    simple: [
      "In production something always breaks eventually. Good teams find out before users do.",
      "Monitor the things that matter to users (is the data fresh and correct?) and alert only when a person must act. Every alert should link to a **runbook**: what it means, what to check first, how to fix it.",
      "An **on-call** rotation shares the duty. After an incident, a blameless **post-mortem** records what happened and what will stop it happening again.",
    ],
    analogy: {
      text: "Think of a fire station.",
      left: "Fire service", right: "Data on-call",
      map: [
        ["Smoke alarms in every room", "Monitors and checks"],
        ["Only calling out for real fires", "Alerting on actionable problems"],
        ["Crew on shift tonight", "On-call rotation"],
        ["The procedures binder", "Runbooks"],
        ["The report after a fire", "Blameless post-mortem"],
      ],
      breaks: "firefighters respond to every alarm. People stop responding to alerts that are usually false; too many noisy alerts are as dangerous as none.",
    },
    svg: () => {
      let b = t(240, 22, "From signal to fix", { bold: true, size: 14 });
      const S = [["monitor", "freshness, tests", "plain"], ["alert", "page on-call", "warn"], ["runbook", "check, fix", "acc"], ["resolve", "backfill", "good"], ["post-mortem", "prevent repeat", "vio"]];
      S.forEach(([a, z, k], i) => { const x = 10 + i * 94; b += box(x, 50, 86, 56, a, z, k, { size: a.length > 10 ? 11 : 12, size2: 10 }); if (i < 4) b += arrow(x + 88, 78, x + 92, 78, { sw: 1.3 }); });
      b += t(240, 140, "Good alert: what broke, impact, first check, runbook link", { size: 12, fill: C.dim });
      b += t(240, 162, "Bad alert: \"Job failed\" with nothing else", { size: 12, fill: C.badT });
      return svg(480, 178, b, "Incident flow from monitor to post-mortem");
    },
    caption: "A useful alert leads straight to a runbook; every incident ends with a lesson written down.",
    oneline: "Watch what users care about, alert only when someone must act, and learn from every incident.",
  };

  /* ---------------------------------------------------------------- dataops-docker-k8s */
  P["dataops-docker-k8s"] = {
    simple: [
      "**Kubernetes** (K8s) runs containers across a cluster of machines and keeps them running.",
      "The smallest unit is a **pod** (one or more containers). A **Deployment** says \"keep 3 copies of this pod running\"; if one crashes or a machine dies, Kubernetes starts a replacement. A **Job** runs a pod to completion, which suits batch tasks.",
      "Data teams meet it through Spark on Kubernetes, Airflow's KubernetesExecutor, and managed services like GKE (Google Kubernetes Engine).",
    ],
    analogy: {
      text: "Think of a harbour master managing berths.",
      left: "Harbour", right: "Kubernetes",
      map: [
        ["Ships", "Pods running containers"],
        ["Berths along the quay", "Nodes (machines)"],
        ["The harbour master assigning berths", "The scheduler"],
        ["\"Always keep 3 ferries running\"", "A Deployment's replica count"],
        ["A ferry breaks down: send another", "Self-healing"],
      ],
      breaks: "ships keep their cargo when they move berth. Pods don't keep local files when replaced; anything that must survive goes to a persistent volume or object storage.",
    },
    svg: () => {
      let b = t(240, 22, "Deployment: replicas = 3", { bold: true, size: 14, mono: true });
      [["node 1", [1, 0]], ["node 2", [1, 2]], ["node 3", [0, 0]]].forEach(([n, pods], i) => {
        const x = 16 + i * 152;
        b += box(x, 44, 140, 110, null, null, "plain");
        b += t(x + 70, 64, n + (i === 2 ? " (down)" : ""), { size: 12, bold: true, fill: i === 2 ? C.badT : C.tx });
        pods.forEach((p, j) => { if (p) b += box(x + 10 + j * 64, 80, 56, 50, "pod", p === 2 ? "new" : "running", p === 2 ? "good" : "acc", { size: 12, size2: 10 }); });
      });
      b += arrow(400, 130, 300, 108, { dash: true, stroke: C.goodS }); b += t(392, 150, "rescheduled", { size: 11, fill: C.goodT });
      b += t(240, 186, "A node died; Kubernetes started a replacement pod elsewhere.", { size: 12, fill: C.dim });
      return svg(480, 202, b, "Kubernetes rescheduling a pod after a node failure");
    },
    caption: "Kubernetes keeps the declared number of pods running, moving them when a node fails.",
    oneline: "Kubernetes keeps the right number of containers running across many machines and replaces failures.",
  };

  /* ---------------------------------------------------------------- dataops-data-contracts */
  const DC = [["add optional column", "pass", "good"], ["rename customer_id", "fail: breaking", "bad"], ["change amount to string", "fail: type", "bad"], ["new value in status enum", "warn: consumers review", "warn"]];
  P["dataops-data-contracts"] = {
    simple: [
      "A **data contract** is a written agreement between the team that produces data and the teams that use it: column names, types, meanings, allowed values, freshness and who owns it.",
      "It is stored as a file (often YAML) next to the producer's code and checked in CI. A change that breaks the contract fails before it ships, instead of breaking dashboards the next morning.",
      "Contracts turn \"someone renamed a column\" from a surprise into a planned change with a new version.",
    ],
    analogy: {
      text: "Think of a delivery agreement with a supplier.",
      left: "Supplier agreement", right: "Data contract",
      map: [
        ["\"Boxes of 12, labelled, every Monday by 9\"", "Schema, semantics, freshness"],
        ["The signed agreement", "Contract file in the repo"],
        ["Checking deliveries at the gate", "CI and runtime checks"],
        ["Agreeing a new box size before switching", "Versioned breaking change"],
      ],
      breaks: "a supplier agreement covers one buyer. Data often has many consumers the producer doesn't know about; a contract only protects the uses that are written into it.",
    },
    svg: () => P["dataops-data-contracts"]._fig(1),
    _fig: i => {
      const [c, r, k] = DC[i];
      let b = t(240, 20, "producer PR: " + c, { bold: true, size: 13.5 });
      b += box(16, 40, 226, 110, null, null, "plain");
      ["contract: orders v2", "owner: checkout-team", "customer_id: string, required", "amount: decimal(12,2)", "status: [paid, refunded]"].forEach((l, j) => { b += t(24, 60 + j * 19, l, { a: "start", size: 10, mono: true }); });
      b += arrow(244, 95, 270, 95); b += t(257, 84, "CI", { size: 10.5, fill: C.dim });
      b += box(274, 66, 190, 58, r, null, k, { size: 13 });
      b += box(16, 166, 448, 36, k === "bad" ? "Merge blocked: publish orders v3 and tell consumers first" : k === "warn" ? "Merge allowed, consumers notified" : "Merge allowed", null, k, { size: 12 });
      return svg(480, 216, b, "A data contract checked against a producer change");
    },
    caption: "The contract check runs in the producer's CI, before the change reaches any consumer.",
    ix: el => choice(el, { label: "Producer change", options: DC.map(d => d[0]), value: 0 }, i => ({ svg: P["dataops-data-contracts"]._fig(i), note: ["Adding an optional field doesn't break existing readers.", "Every consumer query using customer_id would break.", "Sums and joins on amount would fail or give wrong answers.", "Consumers with CASE statements on status may need an update."][i] })),
    oneline: "A data contract is a checked agreement on what data looks like, so producers can't break consumers by surprise.",
  };

  /* ---------------------------------------------------------------- dataops-secrets */
  P["dataops-secrets"] = {
    simple: [
      "**Secrets** are passwords, API keys and tokens. Never write them in code or commit them to Git: Git history keeps them forever, even after you delete the line.",
      "Keep them in a **secrets manager** (Google Secret Manager, HashiCorp Vault, AWS Secrets Manager). The job reads the secret at run time, using its own identity (a service account), and the manager logs who read what.",
      "Better still, use identity-based access with no secret at all, like workload identity on GKE. Rotate any secret that leaks, immediately.",
    ],
    analogy: {
      text: "Think of a hotel key card system.",
      left: "Hotel keys", right: "Secrets management",
      map: [
        ["Writing the door code on the door", "Secret hard-coded in the repo"],
        ["Front desk issues a card when you show ID", "Secrets manager checks the job's identity"],
        ["The card log of who opened which door", "Access audit log"],
        ["Cards that expire at checkout", "Short-lived tokens and rotation"],
      ],
      breaks: "a lost hotel card stops working when the desk cancels it. A leaked API key keeps working until you rotate it at the provider, and anyone who copied the repo still has it.",
    },
    svg: () => {
      let b = t(240, 22, "Secrets come from a manager, never the repo", { bold: true, size: 13.5 });
      b += box(16, 44, 190, 46, 'password = "hunter2"', "in Git history forever", "bad", { mono: true, size: 12, size2: 11 });
      b += line(16, 67, 206, 67, { stroke: C.badS, sw: 2 });
      b += box(16, 120, 130, 50, "ETL job", "service account", "acc", { size2: 11 });
      b += arrow(148, 140, 196, 140, { label: "ask" });
      b += box(200, 112, 140, 66, "Secret Manager", "checks identity, logs access", "vio", { size2: 9.5 });
      b += arrow(196, 158, 148, 158, { label: "secret", dy: 16, stroke: C.goodS });
      b += arrow(342, 145, 370, 145);
      b += box(374, 120, 90, 50, "database", null, "good");
      return svg(480, 196, b, "Job fetching a secret from a secrets manager at run time");
    },
    caption: "The job proves who it is, receives the secret at run time, and every read is logged.",
    oneline: "Keep secrets in a secrets manager and fetch them at run time, never in code or Git.",
  };

  /* ---------------------------------------------------------------- dataops-environments */
  P["dataops-environments"] = {
    simple: [
      "Teams keep separate **environments**: **dev** for building, **staging** (or test) that mirrors production, and **prod** that users rely on. Each has its own datasets and credentials.",
      "Releases can still go wrong, so ship carefully. **Blue-green**: run the new version beside the old, then switch traffic at once (and back if needed). **Canary**: send a small share of traffic or data to the new version first and widen it if metrics stay healthy. **Feature flags** turn new logic on without a redeploy.",
      "For data, a common pattern is write-audit-publish: build into a hidden table, run checks, then swap it into place.",
    ],
    analogy: {
      text: "Think of a restaurant trying a new dish.",
      left: "Restaurant", right: "Release strategy",
      map: [
        ["Practising in the test kitchen", "Dev and staging"],
        ["Serving it to one table first", "Canary"],
        ["Two full kitchens, switch which one serves", "Blue-green"],
        ["A menu item you can hide instantly", "Feature flag"],
      ],
      breaks: "a bad dish is just sent back. A bad data release may already be read by downstream jobs; write-audit-publish keeps bad data out of the published table in the first place.",
    },
    svg: () => P["dataops-environments"]._fig(10),
    _fig: pct => {
      let b = t(240, 20, "Canary: " + pct + "% of runs use the new version", { bold: true, size: 13.5 });
      b += box(16, 40, 120, 50, "traffic / runs", null, "plain");
      const w = 300;
      b += `<rect x="160" y="44" width="${w * (100 - pct) / 100}" height="20" rx="4" style="fill:${C.acc};stroke:${C.accS}"/>`;
      b += `<rect x="${160 + w * (100 - pct) / 100}" y="68" width="${w * pct / 100}" height="20" rx="4" style="fill:${C.good};stroke:${C.goodS}"/>`;
      b += t(160, 110, "v1.4 (current) " + (100 - pct) + "%", { a: "start", size: 12, fill: C.accT });
      b += t(460, 110, "v1.5 (canary) " + pct + "%", { a: "end", size: 12, fill: C.goodT });
      b += box(16, 128, 448, 40, pct >= 100 ? "Fully rolled out; keep v1.4 ready for rollback" : "Compare error rate, row counts and latency before widening", null, pct >= 100 ? "good" : "warn", { size: 12 });
      b += t(240, 194, "dev -> staging -> prod, each with its own data and credentials", { size: 12, fill: C.dim });
      return svg(480, 208, b, "Canary rollout share between two versions");
    },
    caption: "A canary sends a small share to the new version; you widen it only while metrics stay healthy.",
    ix: el => slider(el, { label: "Canary share (%)", min: 0, max: 100, step: 10, value: 30 }, v => ({ svg: P["dataops-environments"]._fig(v), note: v === 0 ? "New version deployed but taking nothing: a dark launch." : v === 100 ? "Done. Remove the old version only after a quiet period." : "If any metric worsens, set the share back to 0." })),
    oneline: "Build in dev, test in staging, and release to prod gradually so mistakes stay small.",
  };

  /* ---------------------------------------------------------------- de-design-docs */
  P["de-design-docs"] = {
    simple: [
      "Before building a big data system, senior engineers write a **design doc** (or RFC, request for comments) so the team agrees on the plan before code makes it expensive to change.",
      "A good one has: the problem and who it's for, goals and **non-goals**, the proposed design with a diagram, the **alternatives** considered and why they lost, risks, cost, and a rollout plan.",
      "Reviewers poke holes early, when changing the plan costs an hour of editing instead of a month of rework.",
    ],
    analogy: {
      text: "Think of planning a school trip.",
      left: "School trip", right: "Design doc",
      map: [
        ["Why we're going and who's coming", "Problem and users"],
        ["\"We are not visiting the beach\"", "Non-goals"],
        ["Route, bus, timings", "Proposed design"],
        ["Train was considered but too expensive", "Alternatives considered"],
        ["Parents sign off", "Review and approval"],
      ],
      breaks: "a trip plan is done once the trip happens. A design doc should be updated when the build changes the plan, or it misleads the next person who reads it.",
    },
    svg: () => {
      let b = t(240, 22, "Design doc outline", { bold: true, size: 14 });
      [["context and problem", "acc"], ["goals / non-goals", "vio"], ["proposed design + diagram", "good"], ["alternatives considered", "warn"], ["risks, cost, rollout", "plain"]].forEach(([s, k], i) => { b += box(60, 38 + i * 40, 300, 32, s, null, k, { size: 12.5 }); b += badge(36, 54 + i * 40, i + 1, k === "plain" ? "acc" : k); });
      b += box(376, 38, 88, 192, "review", "before code", "ghost", { size: 12.5, size2: 11 });
      return svg(480, 244, b, "Sections of a design document");
    },
    caption: "Agree on problem, scope, design and trade-offs on paper, while changes are still cheap.",
    oneline: "A design doc gets the team to agree on the problem, plan and trade-offs before any code is written.",
  };

  /* ---------------------------------------------------------------- de-stakeholders */
  P["de-stakeholders"] = {
    simple: [
      "Much of a data engineer's real work is **translation**. A manager asks \"how many active users do we have?\"; you must turn that into an exact definition, a data source, a refresh schedule and a table.",
      "Ask clarifying questions: active means what (logged in, paid, did an action)? Over what period? Which countries? How fresh must it be, and what decision will it drive?",
      "Write the answers down as a metric definition both sides agree on, then build it.",
    ],
    analogy: {
      text: "Think of a tailor taking an order.",
      left: "Tailor", right: "Data engineer",
      map: [
        ["\"I want a nice suit\"", "A vague business request"],
        ["Measuring and asking about fabric, fit, occasion", "Clarifying questions"],
        ["The written order with measurements", "Metric definition"],
        ["A fitting before the final stitch", "Showing a draft before production"],
      ],
      breaks: "a tailor's customer knows what fits them. Stakeholders often don't know what data exists or what's possible, so part of the job is proposing options, not only taking orders.",
    },
    svg: () => {
      let b = t(240, 22, "From a fuzzy ask to a definition", { bold: true, size: 14 });
      b += box(16, 44, 140, 60, "\"How many active users?\"", null, "warn", { size: 10 });
      b += arrow(158, 74, 186, 74, { label: "ask" });
      b += box(190, 40, 130, 68, null, null, "plain");
      ["active = what?", "which period?", "which users?", "how fresh?"].forEach((q, i) => { b += t(255, 58 + i * 15, q, { size: 11, fill: C.dim }); });
      b += arrow(322, 74, 350, 74);
      b += box(354, 40, 110, 68, "metric", "written + agreed", "good", { size2: 10.5 });
      b += box(16, 130, 448, 50, "DAU = distinct users with 1+ order or search, IST day", "source: events_clean; refreshed hourly; owner: growth", "acc", { size: 11.5, size2: 10 });
      return svg(480, 194, b, "Turning a vague request into a precise metric definition");
    },
    caption: "Clarifying questions turn a vague ask into one written definition everyone agrees on.",
    oneline: "A data engineer translates fuzzy business questions into exact, agreed definitions before building.",
  };

  /* ---------------------------------------------------------------- de-career */
  P["de-career"] = {
    simple: [
      "Data engineering careers grow by **scope**: how big a problem you own without being told how.",
      "A **junior** engineer completes well-defined tasks. A **mid-level** engineer owns pipelines end to end. A **senior** owns a system and its design trade-offs. A **staff** engineer shapes direction across teams.",
      "Your resume should show impact with numbers (\"cut nightly runtime from 4 h to 50 min\"), and in offers, negotiate on the whole package, with competing offers or market data as evidence.",
    ],
    analogy: {
      text: "Think of roles in a football club.",
      left: "Football club", right: "DE level",
      map: [
        ["A player following the coach's drills", "Junior: defined tasks"],
        ["A regular starter who runs their position", "Mid: owns pipelines"],
        ["The captain organising the team on the pitch", "Senior: owns a system"],
        ["The coach planning the season", "Staff: direction across teams"],
      ],
      breaks: "football roles are visible on the pitch. Engineering scope often isn't, so you have to make your impact visible: write it up, measure it, share it.",
    },
    svg: () => {
      let b = t(240, 22, "Levels grow by scope", { bold: true, size: 14 });
      [["junior", "a task", 60], ["mid", "a pipeline", 120], ["senior", "a system", 180], ["staff", "many teams", 240]].forEach(([n, s, w], i) => {
        const y = 44 + i * 46;
        b += t(20, y + 22, n, { a: "start", size: 13, bold: true });
        b += `<rect x="90" y="${y + 4}" width="${w * 1.1}" height="28" rx="5" style="fill:${[C.acc, C.vio, C.warn, C.good][i]};stroke:${[C.accS, C.vioS, C.warnS, C.goodS][i]}"/>`;
        b += t(98 + w * 1.1, y + 23, s, { a: "start", size: 12, fill: C.dim });
      });
      b += t(240, 238, "Resume: impact with numbers, not a list of tools", { size: 12, fill: C.dim });
      return svg(480, 254, b, "Engineering levels by scope of ownership");
    },
    caption: "Each level owns a bigger problem with less direction.",
    oneline: "DE careers grow by the size of the problem you own, so show your impact in numbers.",
  };

  /* ---------------------------------------------------------------- dataops-interview-prep */
  P["dataops-interview-prep"] = {
    simple: [
      "This page collects the DataOps track for revision.",
      "Expect: Git workflows, CI/CD for data, containers and Kubernetes, Terraform, secrets, environments and release strategies, observability and on-call, data contracts.",
      "Interviewers like a concrete story: a change you shipped, how it was tested, how it was released, and what you'd do if it broke.",
    ],
    analogy: {
      text: "Think of a car's journey from factory to road.",
      left: "Car", right: "DataOps",
      map: [
        ["Design drawings under version control", "Git"],
        ["Factory quality checks", "CI"],
        ["Shipping and dealer handover", "CD and environments"],
        ["Dashboard warning lights", "Monitoring and observability"],
      ],
      breaks: "a car is finished at the factory. A pipeline changes every week, so DataOps is about making each change safe, not one big launch.",
    },
    svg: () => {
      let b = t(240, 22, "The life of a change", { bold: true, size: 14 });
      [["branch + PR", "acc"], ["CI tests", "vio"], ["deploy", "warn"], ["observe", "good"], ["fix / roll back", "bad"]].forEach(([s, k], i) => { const x = 10 + i * 94; b += box(x, 50, 86, 50, s, null, k, { size: 12 }); if (i < 4) b += arrow(x + 88, 75, x + 92, 75, { sw: 1.3 }); });
      b += t(240, 136, "Tell one real story through every box.", { size: 12.5, fill: C.dim });
      return svg(480, 152, b, "Stages a change goes through");
    },
    caption: "Walk one real change from branch to production and back again if it breaks.",
    oneline: "Know how a change is versioned, tested, released, watched and rolled back.",
  };
})();
