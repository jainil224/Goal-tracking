export interface Subtask {
  id: string;
  text: string;
  completed: boolean;
}

export interface Goal {
  id: string;
  username: string;
  title: string;
  description: string;
  progress: number; // 0 to 100
  streak: number; // days count
  connections: string[]; // IDs of connected goals
  x: number; // Galaxy coordinate X
  y: number; // Galaxy coordinate Y
  subtasks: Subtask[];
  createdAt: string;
}

export interface User {
  username: string;
  displayName: string;
}

// Generate coordinates that are not too close to existing goals
export function generateGalaxyCoordinates(existingGoals: Goal[]): { x: number; y: number } {
  const minDistance = 120; // Ensure stars are at least 120px apart
  const range = 500; // Galaxy radius range
  let attempts = 0;
  
  while (attempts < 100) {
    // Generate coordinate within a circle
    const angle = Math.random() * Math.PI * 2;
    const distance = 80 + Math.random() * range;
    const x = Math.round(Math.cos(angle) * distance);
    const y = Math.round(Math.sin(angle) * distance);
    
    // Check distance to all existing stars
    let tooClose = false;
    for (const goal of existingGoals) {
      const dx = goal.x - x;
      const dy = goal.y - y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < minDistance) {
        tooClose = true;
        break;
      }
    }
    
    if (!tooClose) {
      return { x, y };
    }
    attempts++;
  }
  
  // Fallback if space is crowded
  return {
    x: Math.round((Math.random() - 0.5) * range * 1.5),
    y: Math.round((Math.random() - 0.5) * range * 1.5),
  };
}

// Load data from LocalStorage
const USERS_KEY = "galaxy_users";
const GOALS_KEY = "galaxy_goals";
const SESSION_KEY = "galaxy_session";

function getStoredUsers(): Record<string, string> {
  const data = localStorage.getItem(USERS_KEY);
  return data ? JSON.parse(data) : {};
}

function getStoredUserProfiles(): Record<string, User> {
  const data = localStorage.getItem("galaxy_user_profiles");
  return data ? JSON.parse(data) : {};
}

export function getStoredGoals(): Goal[] {
  const data = localStorage.getItem(GOALS_KEY);
  return data ? JSON.parse(data) : [];
}

function saveGoals(goals: Goal[]) {
  localStorage.setItem(GOALS_KEY, JSON.stringify(goals));
}

// Seed sample goals if database is empty
export function seedDemoData(username: string) {
  const currentGoals = getStoredGoals();
  const userGoals = currentGoals.filter(g => g.username === username);
  if (userGoals.length > 0) return;

  const demoGoals: Goal[] = [
    {
      id: "demo-1",
      username,
      title: "Establish Colony",
      description: "Setup basic life support systems and planetary shelters on Mars.",
      progress: 80,
      streak: 15,
      connections: ["demo-2", "demo-3"],
      x: 0,
      y: -100,
      subtasks: [
        { id: "s1", text: "Deploy atmospheric scrubbers", completed: true },
        { id: "s2", text: "Drill for sub-surface ice", completed: true },
        { id: "s3", text: "Erect dome pressure shielding", completed: false }
      ],
      createdAt: new Date().toISOString()
    },
    {
      id: "demo-2",
      username,
      title: "Bio-Dome Irrigation",
      description: "Construct hydroponic farming cycles to feed initial colony waves.",
      progress: 45,
      streak: 6,
      connections: ["demo-1"],
      x: -180,
      y: 80,
      subtasks: [
        { id: "s4", text: "Synthesize soil nitrifiers", completed: true },
        { id: "s5", text: "Install LED growth grids", completed: false }
      ],
      createdAt: new Date().toISOString()
    },
    {
      id: "demo-3",
      username,
      title: "Fusion Matrix",
      description: "Ignite the Deuterium reactor core to generate infinite base power.",
      progress: 95,
      streak: 24,
      connections: ["demo-1", "demo-4"],
      x: 180,
      y: 90,
      subtasks: [
        { id: "s6", text: "Calibrate magnetic injectors", completed: true },
        { id: "s7", text: "Inject helium-3 isotope", completed: true },
        { id: "s8", text: "Stable confinement field lock", completed: true }
      ],
      createdAt: new Date().toISOString()
    },
    {
      id: "demo-4",
      username,
      title: "Quantum Relay Array",
      description: "Configure FTL communication mesh to link with Earth command.",
      progress: 20,
      streak: 3,
      connections: ["demo-3"],
      x: 120,
      y: 240,
      subtasks: [
        { id: "s9", text: "Entangle target atom matrix", completed: true },
        { id: "s10", text: "Synchronize phase frequencies", completed: false }
      ],
      createdAt: new Date().toISOString()
    }
  ];

  const updatedGoals = [...currentGoals, ...demoGoals];
  saveGoals(updatedGoals);
}

// Auth API
export function getCurrentUser(): User | null {
  const session = localStorage.getItem(SESSION_KEY);
  return session ? JSON.parse(session) : null;
}

export function loginUser(username: string, passwordHash: string): { success: boolean; error?: string } {
  const users = getStoredUsers();
  const profiles = getStoredUserProfiles();
  
  const normUser = username.trim().toLowerCase();
  if (users[normUser] && users[normUser] === passwordHash) {
    const profile = profiles[normUser] || { username: normUser, displayName: username };
    localStorage.setItem(SESSION_KEY, JSON.stringify(profile));
    seedDemoData(normUser);
    return { success: true };
  }
  return { success: false, error: "Invalid username or password" };
}

export function registerUser(username: string, passwordHash: string, displayName: string): { success: boolean; error?: string } {
  const users = getStoredUsers();
  const profiles = getStoredUserProfiles();
  
  const normUser = username.trim().toLowerCase();
  if (users[normUser]) {
    return { success: false, error: "Username already exists" };
  }

  users[normUser] = passwordHash;
  profiles[normUser] = { username: normUser, displayName: displayName.trim() || username };

  localStorage.setItem(USERS_KEY, JSON.stringify(users));
  localStorage.setItem("galaxy_user_profiles", JSON.stringify(profiles));
  
  // Auto-login after registration
  localStorage.setItem(SESSION_KEY, JSON.stringify(profiles[normUser]));
  seedDemoData(normUser);

  return { success: true };
}

export function logoutUser() {
  localStorage.removeItem(SESSION_KEY);
}

// Goal Management API
export function getUserGoals(username: string): Goal[] {
  const normUser = username.toLowerCase();
  return getStoredGoals().filter(g => g.username === normUser);
}

export function createGoal(
  username: string,
  title: string,
  description: string,
  progress: number,
  streak: number,
  connections: string[],
  subtasks: Subtask[]
): Goal {
  const normUser = username.toLowerCase();
  const currentGoals = getStoredGoals();
  const userGoals = currentGoals.filter(g => g.username === normUser);
  
  const { x, y } = generateGalaxyCoordinates(userGoals);
  
  const newGoal: Goal = {
    id: "goal-" + Math.random().toString(36).substring(2, 11),
    username: normUser,
    title: title.trim(),
    description: description.trim(),
    progress: Math.min(100, Math.max(0, progress)),
    streak: Math.max(0, streak),
    connections: connections,
    x,
    y,
    subtasks: subtasks,
    createdAt: new Date().toISOString()
  };

  // Bidirectionally connect if selected
  connections.forEach(connId => {
    const found = currentGoals.find(g => g.id === connId);
    if (found && !found.connections.includes(newGoal.id)) {
      found.connections.push(newGoal.id);
    }
  });

  currentGoals.push(newGoal);
  saveGoals(currentGoals);
  return newGoal;
}

export function updateGoal(
  id: string,
  updates: Partial<Omit<Goal, "id" | "username" | "x" | "y" | "createdAt">>
): Goal | null {
  const currentGoals = getStoredGoals();
  const index = currentGoals.findIndex(g => g.id === id);
  if (index === -1) return null;

  const oldGoal = currentGoals[index];
  const oldConnections = [...oldGoal.connections];
  
  const updatedGoal: Goal = {
    ...oldGoal,
    ...updates,
    title: updates.title ? updates.title.trim() : oldGoal.title,
    description: updates.description ? updates.description.trim() : oldGoal.description,
  };

  currentGoals[index] = updatedGoal;

  // Handle connection edits (adding and removing bidirectional links)
  if (updates.connections) {
    const newConns = updates.connections;

    // Added connections
    newConns.forEach(connId => {
      const found = currentGoals.find(g => g.id === connId);
      if (found && !found.connections.includes(id)) {
        found.connections.push(id);
      }
    });

    // Removed connections
    const removedConns = oldConnections.filter(c => !newConns.includes(c));
    removedConns.forEach(connId => {
      const found = currentGoals.find(g => g.id === connId);
      if (found) {
        found.connections = found.connections.filter(c => c !== id);
      }
    });
  }

  saveGoals(currentGoals);
  return updatedGoal;
}

export function deleteGoal(id: string) {
  let currentGoals = getStoredGoals();
  const toDelete = currentGoals.find(g => g.id === id);
  if (!toDelete) return;

  // Remove bidirectional connections in other goals
  currentGoals.forEach(g => {
    if (g.connections.includes(id)) {
      g.connections = g.connections.filter(c => c !== id);
    }
  });

  currentGoals = currentGoals.filter(g => g.id !== id);
  saveGoals(currentGoals);
}
