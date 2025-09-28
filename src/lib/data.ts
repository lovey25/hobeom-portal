import fs from "fs";
import path from "path";
import csvParser from "csv-parser";
import { User, AppIcon } from "@/types";

const DATA_DIR = path.join(process.cwd(), "data");

export async function readCSV<T>(filename: string): Promise<T[]> {
  const filepath = path.join(DATA_DIR, filename);
  const results: T[] = [];

  return new Promise((resolve, reject) => {
    if (!fs.existsSync(filepath)) {
      reject(new Error(`File not found: ${filepath}`));
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
