// src/hooks/tourStorage.ts

const VISITED_KEY = "tour_pages_visited";
const COMPLETED_KEY = "tour_completed";

// Load visited pages from localStorage
function loadVisited() {
  try {
    return JSON.parse(localStorage.getItem(VISITED_KEY) || "{}");
  } catch {
    return {};
  }
}

// Check if page already visited
export function isPageVisited(page: string): boolean {
  const visited = loadVisited();
  return visited[page] === true;
}

// Check if full tour completed
export function isTourCompleted(): boolean {
  return localStorage.getItem(COMPLETED_KEY) === "true";
}

// Mark page visited locally
export function markPageVisited(page: string) {
  const visited = loadVisited();
  visited[page] = true;
  localStorage.setItem(VISITED_KEY, JSON.stringify(visited));
}

// Mark tour completed locally
export function markTourCompleted() {
  localStorage.setItem(COMPLETED_KEY, "true");
}

// Reset all on logout
export function resetTourOnLogout() {
  localStorage.removeItem(VISITED_KEY);
  localStorage.removeItem(COMPLETED_KEY);
}
