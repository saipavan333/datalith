/* Datalith pass 2 — Track 14: Cloud Data Engineering (incl. the cross-platform module).
   Uses the shared primitives in p2lib.js. Prices only where pass 1 verified them. */
(function () {
  const { C, t, box, arrow, line, table, badge, svg, slider, choice } = P2L;
  const P = window.P2;

  /* ---------------------------------------------------------------- cloud-fundamentals */
  // demand curve used by both the static diagram and the interactive
  const DEMAND = [3, 3, 4, 5, 9, 4, 3, 3, 4, 10, 5, 3];
  const demandChart = (owned, title) => {
    const X0 = 50, Y0 = 200, BW = 30, U = 15;
    let b = t(240, 22, title, { bold: true, size: 14 });
    b += line(X0, Y0, X0 + 12 * BW + 10, Y0) + line(X0, Y0, X0, 40);
    b += t(X0 - 8, 48, "servers", { size: 11.5, fill: C.dim, a: "end" });
    let idle = 0, short = 0;
    DEMAND.forEach((d, i) => {
      const x = X0 + 6 + i * BW;
      const used = Math.min(d, owned);
      b += `<rect x="${x}" y="${Y0 - used * U}" width="${BW - 8}" height="${used * U}" style="fill:${C.accS}"/>`;
      if (d > owned) { b += `<rect x="${x}" y="${Y0 - d * U}" width="${BW - 8}" height="${(d - owned) * U}" style="fill:${C.badS}"/>`; short += d - owned; }
      else idle += owned - d;
    });
    b += line(X0, Y0 - owned * U, X0 + 12 * BW + 10, Y0 - owned * U, { stroke: C.warnS, dash: true, sw: 2 });
    b += t(X0 + 12 * BW + 8, Y0 - owned * U - 6, "you own " + owned, { size: 12, fill: C.warnT, a: "end", bold: true });
    b += t(X0 + 6 * BW, Y0 + 18, "12 months of demand", { size: 12, fill: C.dim });
    return { b, idle, short };
  };
  P["cloud-fundamentals"] = {
    simple: [
      "**The cloud** means renting computers, storage and databases over the internet instead of buying your own.",
      "You ask for a machine and get it in minutes. You pay for the time you use it, then hand it back.",
      "Before the cloud, a company bought enough servers for its busiest day. On every normal day most of them sat idle, still costing money.",
      "Data work is spiky: a big job at month end, small jobs the rest of the time. Renting by the hour fits that shape, which is why almost every modern data platform runs in the cloud.",
    ],
    analogy: {
      text: "Think of owning a car versus using taxis and rental vans.",
      left: "Getting around town", right: "Running data systems",
      map: [
        ["Buying a car you park most of the day", "Buying servers up front (on-premises)"],
        ["Paying for a taxi only when you ride", "Pay-as-you-go cloud (operating cost, not capital cost)"],
        ["Renting a big van just for moving day", "Scaling up for the month-end job, then back down"],
        ["The rental firm services the vans", "Managed services: the provider patches and repairs"],
        ["Taxis exist in many cities", "Regions around the world"],
      ],
      breaks: "if you drive all day, every day, owning the car is cheaper than taxis. The same is true of servers that are busy around the clock, which is why steady workloads use discounts or reserved capacity.",
    },
    svg: () => {
      const { b, idle } = demandChart(10, "On-premises: buy for the peak");
      let s = b + t(240, 236, `Bought for the busiest month: ${idle} of 120 server-months sit idle.`, { size: 12.5, fill: C.dim });
      return svg(480, 252, s, "Bar chart of monthly demand against a fixed number of owned servers");
    },
    caption: "Blue is servers doing work. Everything between the bars and the dashed line was paid for and unused.",
    ix: el => slider(el, { label: "Servers you buy", min: 3, max: 10, value: 5, fmt: v => v + " servers" }, v => {
      const { b, idle, short } = demandChart(v, "Fixed hardware vs a spiky year");
      let s = b + `<rect x="60" y="224" width="12" height="12" style="fill:${C.badS}"/>` + t(78, 234, "demand you could not serve", { size: 12, fill: C.badT, a: "start" });
      return {
        svg: svg(480, 248, s, "Owned servers against monthly demand"),
        note: `Idle server-months: <b>${idle}</b>. Unserved server-months: <b>${short}</b>. Buy fewer and the busy months fail; buy more and you pay for idle machines. The cloud lets the line follow the bars.`,
      };
    }),
    oneline: "The cloud lets you rent computers by the hour, so you pay for the work you do instead of for machines that sit idle.",
  };

  /* ---------------------------------------------------------------- cloud-service-models */
  const LAYERS = ["Application", "Runtime", "Operating system", "Virtual machine", "Hardware"];
  const MODELS = [["On-prem", 5], ["IaaS", 3], ["PaaS", 1], ["SaaS", 0]];
  const stackGrid = () => {
    let s = "";
    MODELS.forEach(([m], j) => { s += t(185 + j * 76, 52, m, { bold: true, size: 14 }); });
    LAYERS.forEach((L, i) => {
      const y = 64 + i * 36;
      s += t(140, y + 21, L, { size: 13, a: "end", fill: C.tx });
      MODELS.forEach(([, you], j) => { s += box(150 + j * 76, y, 70, 30, i < you ? "you" : "provider", null, i < you ? "warn" : "acc", { size: 11.5 }); });
    });
    return s;
  };
  P["cloud-service-models"] = {
    simple: [
      "Every cloud product answers one question: **which parts do you run, and which parts does the provider run?**",
      "**IaaS** (Infrastructure as a Service) gives you a bare virtual machine. You install and patch everything on it.",
      "**PaaS** (Platform as a Service) gives you a ready platform. You bring your code and data; the provider runs the operating system and scaling. BigQuery and Snowflake behave like this.",
      "**SaaS** (Software as a Service) is a finished app you just log in to, like Gmail or Looker. **Serverless** is PaaS where you never see a server at all.",
    ],
    analogy: {
      text: "Think of four ways to get pizza for dinner.",
      left: "Pizza", right: "Cloud model",
      map: [
        ["Make it at home: your oven, your dough", "On-premises: you run every layer"],
        ["Buy a ready base, bake it yourself", "IaaS: provider gives the machine, you do the rest"],
        ["Order delivery, you supply the table", "PaaS: you bring app and data only"],
        ["Eat at the restaurant", "SaaS: you just use the finished product"],
      ],
      breaks: "pizza choices are fixed, but real products blur the lines. BigQuery is often called PaaS, SaaS and serverless in the same article; what matters is which layers you must operate.",
    },
    svg: () => {
      let b = t(240, 22, "Who runs each layer?", { bold: true, size: 15 });
      b += stackGrid();
      b += `<rect x="150" y="256" width="12" height="12" style="fill:${C.warn};stroke:${C.warnS}"/>` + t(168, 266, "you manage", { size: 12, a: "start", fill: C.warnT });
      b += `<rect x="270" y="256" width="12" height="12" style="fill:${C.acc};stroke:${C.accS}"/>` + t(288, 266, "provider manages", { size: 12, a: "start", fill: C.accT });
      return svg(480, 280, b, "Four stacks showing which layers you manage in on-prem, IaaS, PaaS and SaaS");
    },
    caption: "Moving right, the provider takes over more layers. You trade control for less work. Your data and who can read it stay your job in every model.",
    oneline: "IaaS, PaaS and SaaS are just different answers to how much of the computer you have to run yourself.",
  };
})();
