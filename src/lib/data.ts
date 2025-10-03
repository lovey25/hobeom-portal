import fs from "fs";
import path from "path";
import csvParser from "csv-parser";
import { User, AppIcon } from "@/types";

const DATA_DIR = path.join(process.cwd(), "data");

// CSV 파일이 없을 때 샘플 파일로부터 초기화
async function ensureDataFile(filename: string): Promise<void> {
  const filepath = path.join(DATA_DIR, filename);
  const sampleFilepath = path.join(DATA_DIR, filename.replace(".csv", ".sample.csv"));

  if (!fs.existsSync(filepath) && fs.existsSync(sampleFilepath)) {
    console.log(`Initializing ${filename} from sample file...`);
    fs.copyFileSync(sampleFilepath, filepath);
  }
}

export async function readCSV<T>(filename: string): Promise<T[]> {
  // 파일이 없으면 샘플 파일로부터 초기화
  await ensureDataFile(filename);

  const filepath = path.join(DATA_DIR, filename);
  const results: T[] = [];

  return new Promise((resolve, reject) => {
    if (!fs.existsSync(filepath)) {
      reject(new Error(`File not found: ${filepath} (and no sample file available)`));
      return;
    }

    fs.createReadStream(filepath)
      .pipe(csvParser())
      .on("data", (data) => results.push(data))
      .on("end", () => resolve(results))
      .on("error", reject);
  });
}

export async function writeCSV<T extends Record<string, any>>(filename: string, data: T[]): Promise<void> {
  const filepath = path.join(DATA_DIR, filename);

  if (data.length === 0) {
    throw new Error("No data to write");
  }

  const headers = Object.keys(data[0]).join(",");
  const rows = data.map((row) =>
    Object.values(row)
      .map((value) => (typeof value === "string" && value.includes(",") ? `"${value}"` : String(value)))
      .join(",")
  );

  const csvContent = [headers, ...rows].join("\n");

  fs.writeFileSync(filepath, csvContent, "utf-8");
}

export async function getUsers(): Promise<User[]> {
  try {
    const rawUsers = await readCSV<any>("users.csv");
    return rawUsers.map((user) => ({
      id: user.id,
      username: user.username,
      email: user.email,
      name: user.name,
      role: user.role as "admin" | "user",
      createdAt: user.created_at,
      lastLogin: user.last_login || undefined,
      passwordHash: user.password_hash, // 내부적으로만 사용
    }));
  } catch (error) {
    console.error("Error reading users:", error);
    return [];
  }
}

export async function getUserByUsername(username: string): Promise<(User & { passwordHash: string }) | null> {
  try {
    const rawUsers = await readCSV<any>("users.csv");
    const user = rawUsers.find((u) => u.username === username);

    if (!user) return null;

    return {
      id: user.id,
      username: user.username,
      email: user.email,
      name: user.name,
      role: user.role as "admin" | "user",
      createdAt: user.created_at,
      lastLogin: user.last_login || undefined,
      passwordHash: user.password_hash,
    };
  } catch (error) {
    console.error("Error reading user:", error);
    return null;
  }
}

export async function getApps(): Promise<AppIcon[]> {
  try {
    const rawApps = await readCSV<any>("apps.csv");
    return rawApps.map((app) => ({
      id: app.id,
      name: app.name,
      description: app.description,
      icon: app.icon,
      href: app.href,
      requireAuth: app.require_auth === "true",
      category: app.category as "public" | "dashboard" | "admin",
      order: parseInt(app.order),
      isActive: app.is_active === "true",
    }));
  } catch (error) {
    console.error("Error reading apps:", error);
    return [];
  }
}

export async function getAppsByCategory(category: "public" | "dashboard" | "admin"): Promise<AppIcon[]> {
  const apps = await getApps();
  return apps.filter((app) => app.category === category && app.isActive);
}

export async function getAllUsers(): Promise<User[]> {
  try {
    const rawUsers = await readCSV<any>("users.csv");
    return rawUsers.map((user) => ({
      id: user.id,
      username: user.username,
      email: user.email,
      name: user.name,
      role: user.role as "admin" | "user",
      createdAt: user.created_at,
      lastLogin: user.last_login || undefined,
    }));
  } catch (error) {
    console.error("Error reading all users:", error);
    return [];
  }
}

export async function updateUser(userId: string, updates: Partial<User>): Promise<void> {
  try {
    const rawUsers = await readCSV<any>("users.csv");
    const userIndex = rawUsers.findIndex((u) => u.id === userId);

    if (userIndex === -1) {
      throw new Error("사용자를 찾을 수 없습니다.");
    }

    // 업데이트할 필드들 적용
    if (updates.role) {
      rawUsers[userIndex].role = updates.role;
    }
    if (updates.name) {
      rawUsers[userIndex].name = updates.name;
    }
    if (updates.email) {
      rawUsers[userIndex].email = updates.email;
    }

    await writeCSV("users.csv", rawUsers);
  } catch (error) {
    console.error("Error updating user:", error);
    throw error;
  }
}

export async function deleteUser(userId: string): Promise<void> {
  try {
    const rawUsers = await readCSV<any>("users.csv");
    const filteredUsers = rawUsers.filter((u) => u.id !== userId);

    if (rawUsers.length === filteredUsers.length) {
      throw new Error("사용자를 찾을 수 없습니다.");
    }

    await writeCSV("users.csv", filteredUsers);
  } catch (error) {
    console.error("Error deleting user:", error);
    throw error;
  }
}

export async function getUserByEmail(email: string): Promise<(User & { passwordHash: string }) | null> {
  try {
    const rawUsers = await readCSV<any>("users.csv");
    const user = rawUsers.find((u) => u.email === email);

    if (!user) return null;

    return {
      id: user.id,
      username: user.username,
      email: user.email,
      name: user.name,
      role: user.role as "admin" | "user",
      createdAt: user.created_at,
      lastLogin: user.last_login || undefined,
      passwordHash: user.password_hash,
    };
  } catch (error) {
    console.error("Error reading user by email:", error);
    return null;
  }
}

export async function createUser(userData: {
  username: string;
  email: string;
  name: string;
  passwordHash: string;
  role: "admin" | "user";
}): Promise<User> {
  try {
    const rawUsers = await readCSV<any>("users.csv");

    // 새 ID 생성 (기존 ID들 중 최대값 + 1)
    const maxId = rawUsers.reduce((max, user) => Math.max(max, parseInt(user.id) || 0), 0);
    const newId = (maxId + 1).toString();

    const now = new Date().toISOString();

    const newRawUser = {
      id: newId,
      username: userData.username,
      email: userData.email,
      name: userData.name,
      password_hash: userData.passwordHash,
      role: userData.role,
      created_at: now,
      last_login: "",
    };

    rawUsers.push(newRawUser);
    await writeCSV("users.csv", rawUsers);

    return {
      id: newId,
      username: userData.username,
      email: userData.email,
      name: userData.name,
      role: userData.role,
      createdAt: now,
    };
  } catch (error) {
    console.error("Error creating user:", error);
    throw error;
  }
}

export async function updateUserLastLogin(userId: string): Promise<void> {
  try {
    const rawUsers = await readCSV<any>("users.csv");
    const userIndex = rawUsers.findIndex((u) => u.id === userId);

    if (userIndex === -1) {
      throw new Error("사용자를 찾을 수 없습니다.");
    }

    // 현재 시간으로 last_login 업데이트
    rawUsers[userIndex].last_login = new Date().toISOString();

    await writeCSV("users.csv", rawUsers);
  } catch (error) {
    console.error("Error updating user last login:", error);
    throw error;
  }
}
