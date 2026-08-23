const endpointFor = {
  index: "/agent/briefing",
  today: "/agent/briefing",
  review: "/agent/review",
  inbox: "/agent/inbox/messages",
  calendar: "/agent/calendars?days=7",
  tasks: "/agent/google/tasks",
  settings: "/agent/user/data",
  network: "/agent/career/contacts",
  notebook: "/agent/notebook/pages",
  routes: "/agent/routes",
};

function text(value) {
  return document.createTextNode(String(value));
}

function renderValue(value) {
  const pre = document.createElement("pre");
  pre.className = "data-output";
  pre.textContent = JSON.stringify(value, null, 2);
  return pre;
}

async function loadView(view) {
  const target = document.querySelector("[data-content]");
  if (!target) return;
  document.querySelectorAll("[data-today]").forEach((node) => {
    node.textContent = new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" });
  });

  let response;
  try {
    response = await fetch(endpointFor[view], { credentials: "include", headers: { Accept: "application/json" } });
  } catch (error) {
    target.replaceChildren(Object.assign(document.createElement("p"), { textContent: `Unable to connect to the workspace: ${error.message}` }));
    return;
  }

  if (response.status === 401 || response.status === 403) {
    const next = `${window.location.pathname}${window.location.search}`;
    document.cookie = `openpip_return=${encodeURIComponent(next)}; Path=/login; Max-Age=600; SameSite=Lax`;
    window.location.replace("/login");
    return;
  }

  let data;
  try {
    data = await response.json();
  } catch {
    data = null;
  }
  const section = document.createElement("section");
  section.className = "card";
  const heading = document.createElement("h1");
  heading.textContent = view[0].toUpperCase() + view.slice(1);
  section.appendChild(heading);
  if (data === null || (Array.isArray(data) && data.length === 0) || (data && typeof data === "object" && !Array.isArray(data) && Object.keys(data).length === 0)) {
    const empty = document.createElement("p");
    empty.textContent = "No connected data is available yet.";
    section.appendChild(empty);
  } else if (!response.ok) {
    const error = document.createElement("p");
    error.textContent = "The connected provider returned an error.";
    section.appendChild(error);
  } else {
    section.appendChild(renderValue(data));
  }
  target.replaceChildren(section);
}

export { loadView };
