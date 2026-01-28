const mockServices = [
  {
    id: "core-api",
    name: "Core API",
    description: "Public, authenticated RPC and REST endpoints",
    group: "Core",
    status: "operational",
    uptime30d: 99.982,
    lastIncidentAt: "2026-01-15T09:30:00Z",
  },
  {
    id: "ingest",
    name: "Ingest pipeline",
    description: "Ingestion and normalization for events",
    group: "Data",
    status: "operational",
    uptime30d: 99.963,
    lastIncidentAt: "2026-01-08T14:10:00Z",
  },
  {
    id: "dashboards",
    name: "Dashboards",
    description: "Web dashboard and configuration UI",
    group: "UX",
    status: "degraded",
    uptime30d: 99.721,
    lastIncidentAt: "2026-01-27T06:05:00Z",
  },
  {
    id: "webhooks",
    name: "Webhooks",
    description: "Outbound notifications and incident webhooks",
    group: "Integrations",
    status: "operational",
    uptime30d: 99.901,
    lastIncidentAt: "2026-01-11T18:40:00Z",
  },
];

const mockIncidents = [
  {
    id: "incident-3",
    title: "Elevated error rates on dashboards",
    severity: "minor",
    startedAt: "2026-01-27T05:40:00Z",
    resolvedAt: null,
    services: ["dashboards"],
  },
  {
    id: "incident-2",
    title: "Webhook delivery delays",
    severity: "minor",
    startedAt: "2026-01-11T18:12:00Z",
    resolvedAt: "2026-01-11T18:40:00Z",
    services: ["webhooks"],
  },
  {
    id: "incident-1",
    title: "API p99 latency increase",
    severity: "major",
    startedAt: "2026-01-08T13:32:00Z",
    resolvedAt: "2026-01-08T14:10:00Z",
    services: ["core-api", "ingest"],
  },
];

function summarizeOverallStatus(services, incidents) {
  let status = "operational";
  for (const service of services) {
    if (service.status === "outage") {
      status = "outage";
      break;
    }
    if (service.status === "degraded" && status === "operational") {
      status = "degraded";
    }
  }
  const activeIncidents = incidents.filter((incident) => !incident.resolvedAt);
  const statusLabel =
    status === "operational"
      ? activeIncidents.length === 0
        ? "All Systems Operational"
        : "Operational with active incidents"
      : status === "degraded"
      ? "Partial System Outage"
      : status === "outage"
      ? "Major Service Outage"
      : "Status Unknown";
  return {
    status,
    statusLabel,
    activeIncidentsCount: activeIncidents.length,
  };
}

function classifyUptime(uptime) {
  if (uptime == null) return "unknown";
  if (uptime >= 99.95) return "good";
  if (uptime >= 99.0) return "warn";
  return "bad";
}

function formatPercent(value) {
  if (value == null || Number.isNaN(value)) return "–";
  return `${value.toFixed(3)}%`;
}

function formatDate(value) {
  if (!value) return "–";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "–";
  return date.toLocaleString(undefined, {
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatShortDate(value) {
  if (!value) return "–";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "–";
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "2-digit",
  });
}

function renderOverview(services, incidents) {
  const overall = summarizeOverallStatus(services, incidents);

  const pill = document.getElementById("overall-status-pill");
  const label = document.getElementById("overall-status-label");
  const lastUpdated = document.getElementById("last-updated-label");

  if (pill) {
    pill.classList.remove("degraded", "outage");
    if (overall.status === "degraded") {
      pill.classList.add("degraded");
    } else if (overall.status === "outage") {
      pill.classList.add("outage");
    }
  }

  if (label) {
    label.textContent = overall.statusLabel;
  }

  if (lastUpdated) {
    lastUpdated.textContent = `Last updated: ${new Date().toLocaleTimeString()}`;
  }
}

function renderServicesTable(services) {
  const tbody = document.getElementById("services-table-body");
  if (!tbody) return;
  tbody.innerHTML = "";

  if (!services.length) {
    const row = document.createElement("tr");
    const cell = document.createElement("td");
    cell.colSpan = 5;
    cell.textContent = "No services configured yet.";
    row.appendChild(cell);
    tbody.appendChild(row);
    return;
  }

  for (const service of services) {
    const row = document.createElement("tr");

    const nameCell = document.createElement("td");
    const nameWrapper = document.createElement("div");
    nameWrapper.className = "service-name";
    const primary = document.createElement("div");
    primary.className = "service-name-primary";
    primary.textContent = service.name;
    const secondary = document.createElement("div");
    secondary.className = "service-name-secondary";
    secondary.textContent = service.description;
    nameWrapper.appendChild(primary);
    nameWrapper.appendChild(secondary);
    nameCell.appendChild(nameWrapper);

    const groupCell = document.createElement("td");
    groupCell.textContent = service.group || "–";

    const statusCell = document.createElement("td");
    const statusPill = document.createElement("span");
    const status = service.status || "unknown";
    statusPill.className = `status-pill ${status}`;
    statusPill.textContent =
      status === "operational"
        ? "Operational"
        : status === "degraded"
        ? "Degraded"
        : status === "outage"
        ? "Outage"
        : "Unknown";
    statusCell.appendChild(statusPill);

    const uptimeCell = document.createElement("td");
    const uptimeClassification = classifyUptime(service.uptime30d);
    const uptimeSpan = document.createElement("span");
    uptimeSpan.className = `uptime-value${
      uptimeClassification === "good"
        ? " uptime-good"
        : uptimeClassification === "warn"
        ? " uptime-warn"
        : uptimeClassification === "bad"
        ? " uptime-bad"
        : ""
    }`;
    uptimeSpan.textContent = formatPercent(service.uptime30d);
    uptimeCell.appendChild(uptimeSpan);

    const lastIncidentCell = document.createElement("td");
    lastIncidentCell.textContent = formatShortDate(service.lastIncidentAt);

    row.appendChild(nameCell);
    row.appendChild(groupCell);
    row.appendChild(statusCell);
    row.appendChild(uptimeCell);
    row.appendChild(lastIncidentCell);

    tbody.appendChild(row);
  }
}

function renderIncidentHistory(incidents, services) {
  const container = document.getElementById("incident-list");
  if (!container) return;
  container.innerHTML = "";

  if (!incidents.length) {
    const empty = document.createElement("div");
    empty.className = "incident-empty";
    empty.textContent = "No incidents recorded yet.";
    container.appendChild(empty);
    return;
  }

  const serviceMap = new Map(services.map((service) => [service.id, service]));

  for (const incident of incidents) {
    const card = document.createElement("article");
    card.className = "incident-card";

    const left = document.createElement("div");
    const title = document.createElement("div");
    title.className = "incident-title";
    title.textContent = incident.title;
    const meta = document.createElement("div");
    meta.className = "incident-meta";
    const started = formatDate(incident.startedAt);
    const resolved = incident.resolvedAt ? formatDate(incident.resolvedAt) : "";
    meta.textContent = resolved
      ? `${started} → ${resolved}`
      : `${started} • ongoing`;
    left.appendChild(title);
    left.appendChild(meta);

    const middle = document.createElement("div");
    middle.className = "incident-services";
    for (const serviceId of incident.services || []) {
      const service = serviceMap.get(serviceId);
      const badge = document.createElement("span");
      badge.className = "incident-service-pill";
      badge.textContent = service ? service.name : serviceId;
      middle.appendChild(badge);
    }

    const right = document.createElement("div");
    const severity = document.createElement("div");
    severity.className = `incident-severity ${incident.severity}`;
    severity.textContent =
      incident.severity === "critical"
        ? "Critical"
        : incident.severity === "major"
        ? "Major"
        : incident.severity === "minor"
        ? "Minor"
        : "Info";
    right.appendChild(severity);

    card.appendChild(left);
    card.appendChild(middle);
    card.appendChild(right);

    container.appendChild(card);
  }
}

function getDaysToDisplay() {
  const width = window.innerWidth || 0;
  if (width >= 1200) return 90;
  if (width >= 900) return 60;
  if (width >= 640) return 30;
  return 14;
}

function buildServiceHistory(service, days) {
  const today = new Date();
  const history = [];
  const downIndexes = [5, 36];
  const partialIndexes = [12, 20, 48, 72];
  for (let offset = days - 1; offset >= 0; offset -= 1) {
    const date = new Date(today);
    date.setDate(today.getDate() - offset);
    let successPct = 99.5 + (Math.random() - 0.5);
    if (downIndexes.includes(offset)) {
      successPct = 40 + Math.random() * 10;
    } else if (partialIndexes.includes(offset)) {
      successPct = 65 + Math.random() * 20;
    }
    const state =
      successPct <= 50
        ? "down"
        : successPct <= 92
        ? "partial"
        : "up";
    history.push({ date, state, successPct });
  }
  return history;
}

function handleBarEnter(event) {
  const bar = event.currentTarget;
  const tooltip = document.getElementById("uptime-tooltip");
  if (!tooltip) return;
  const status = bar.dataset.status;
  const serviceName = bar.dataset.service;
  const dateValue = bar.dataset.date;
  const pctValue = bar.dataset.pct;
  const pctNumber = pctValue ? Number(pctValue) : null;
  const date = dateValue ? new Date(dateValue) : null;
  let statusLabel = "Unknown";
  let description = "";
  if (status === "up") {
    statusLabel = "Operational";
    description = "No downtime recorded on this day.";
  } else if (status === "partial") {
    statusLabel = "Partial outage";
    description = pctNumber
      ? `${pctNumber.toFixed(1)}% successful checks on this day.`
      : "Partial outage recorded on this day.";
  } else if (status === "down") {
    statusLabel = "Complete outage";
    description = pctNumber
      ? `${pctNumber.toFixed(1)}% successful checks on this day.`
      : "Complete outage recorded on this day.";
  }
  const dateLabel =
    date && !Number.isNaN(date.getTime())
      ? date.toLocaleDateString(undefined, {
          month: "short",
          day: "2-digit",
        })
      : "";
  const firstLine = dateLabel || serviceName;
  const secondLine =
    dateLabel && serviceName ? `${serviceName} – ${statusLabel}` : statusLabel;
  const details = description;
  tooltip.innerHTML = `${firstLine}<br>${secondLine}<br>${details}`;
  const rect = bar.getBoundingClientRect();
  tooltip.style.left = `${rect.left + rect.width / 2}px`;
  tooltip.style.top = `${rect.top - 8}px`;
  tooltip.classList.add("visible");
}

function handleBarLeave() {
  const tooltip = document.getElementById("uptime-tooltip");
  if (!tooltip) return;
  tooltip.classList.remove("visible");
}

function renderServiceUptimeList(services, days) {
  const container = document.getElementById("service-uptime-list");
  if (!container) return;
  container.innerHTML = "";

  if (!services.length) {
    const empty = document.createElement("div");
    empty.className = "incident-empty";
    empty.textContent = "No services configured yet.";
    container.appendChild(empty);
    return;
  }

  for (const service of services) {
    const section = document.createElement("section");
    section.className = "service-row";

    const header = document.createElement("div");
    header.className = "service-row-header";

    const titleWrapper = document.createElement("div");
    titleWrapper.className = "service-row-title";

    const nameLabel = document.createElement("span");
    nameLabel.className = "service-name-label";
    nameLabel.textContent = service.name;

    const help = document.createElement("span");
    help.className = "service-help";
    help.textContent = "?";

    titleWrapper.appendChild(nameLabel);
    titleWrapper.appendChild(help);

    const statusLabel = document.createElement("div");
    statusLabel.className = "service-status-label";
    const status = service.status || "unknown";
    if (status === "operational") {
      statusLabel.classList.add("status-operational");
      statusLabel.textContent = "Operational";
    } else if (status === "degraded") {
      statusLabel.classList.add("status-degraded");
      statusLabel.textContent = "Degraded Performance";
    } else if (status === "outage") {
      statusLabel.classList.add("status-outage");
      statusLabel.textContent = "Major Outage";
    } else {
      statusLabel.textContent = "Status Unknown";
    }

    header.appendChild(titleWrapper);
    header.appendChild(statusLabel);

    const body = document.createElement("div");
    body.className = "service-row-body";

    const bars = document.createElement("div");
    bars.className = "uptime-bars";
    const history = buildServiceHistory(service, days);
    for (const entry of history) {
      const bar = document.createElement("span");
      bar.className = "uptime-bar";
      if (entry.state === "up") {
        bar.classList.add("uptime-bar-up");
      } else if (entry.state === "partial") {
        bar.classList.add("uptime-bar-partial");
      } else if (entry.state === "down") {
        bar.classList.add("uptime-bar-down");
      }
      bar.dataset.date = entry.date.toISOString();
      bar.dataset.status = entry.state;
      bar.dataset.service = service.name;
      bar.dataset.pct = entry.successPct.toFixed(1);
      bar.addEventListener("mouseenter", handleBarEnter);
      bar.addEventListener("mouseleave", handleBarLeave);
      bars.appendChild(bar);
    }

    const axis = document.createElement("div");
    axis.className = "uptime-axis";

    const leftLabel = document.createElement("span");
    leftLabel.textContent = `${days} days ago`;

    const centerLabel = document.createElement("span");
    centerLabel.className = "uptime-axis-center";
    centerLabel.textContent = `${formatPercent(service.uptime30d)} uptime`;

    const rightLabel = document.createElement("span");
    rightLabel.textContent = "Today";

    axis.appendChild(leftLabel);
    axis.appendChild(centerLabel);
    axis.appendChild(rightLabel);

    body.appendChild(bars);
    body.appendChild(axis);

    section.appendChild(header);
    section.appendChild(body);

    container.appendChild(section);
  }
}

function initializeDashboard() {
  const services = mockServices;
  const incidents = mockIncidents;
  let currentDays = getDaysToDisplay();
  renderOverview(services, incidents);
  renderServiceUptimeList(services, currentDays);
  let resizeTimeoutId;
  window.addEventListener("resize", () => {
    if (resizeTimeoutId) {
      window.clearTimeout(resizeTimeoutId);
    }
    resizeTimeoutId = window.setTimeout(() => {
      const nextDays = getDaysToDisplay();
      if (nextDays !== currentDays) {
        currentDays = nextDays;
        renderServiceUptimeList(services, currentDays);
      }
    }, 120);
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initializeDashboard);
} else {
  initializeDashboard();
}
