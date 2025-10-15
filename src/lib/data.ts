import fs from "fs";
import path from "path";
import csvParser from "csv-parser";
import bcrypt from "bcryptjs";
import { User, AppIcon, TravelTypeTemplate, TravelItem, Bag, TripList, TripItem, BagStats } from "@/types";

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

/**
 * CSV 값을 RFC 4180 표준에 따라 이스케이프
 * - 쉼표, 따옴표, 개행이 있으면 따옴표로 감싸기
 * - 따옴표는 ""로 이스케이프
 */
function escapeCSVValue(value: any): string {
  if (value === null || value === undefined) {
    return "";
  }

  const stringValue = String(value);

  // 쉼표, 따옴표, 개행 문자가 있으면 이스케이프 필요
  if (
    stringValue.includes(",") ||
    stringValue.includes('"') ||
    stringValue.includes("\n") ||
    stringValue.includes("\r")
  ) {
    // 따옴표를 ""로 이스케이프하고 전체를 따옴표로 감싸기
    return `"${stringValue.replace(/"/g, '""')}"`;
  }

  return stringValue;
}

export async function writeCSV<T extends Record<string, any>>(filename: string, data: T[]): Promise<void> {
  const filepath = path.join(DATA_DIR, filename);

  if (data.length === 0) {
    throw new Error("No data to write");
  }

  const headers = Object.keys(data[0]).join(",");
  const rows = data.map((row) => Object.values(row).map(escapeCSVValue).join(","));

  const csvContent = [headers, ...rows].join("\n");

  fs.writeFileSync(filepath, csvContent, "utf-8");
}

export async function getUsers(): Promise<User[]> {
  const rawUsers = await readCSV("users.csv");

  return rawUsers.map((user: any) => ({
    id: user.id,
    username: user.username,
    email: user.email,
    name: user.name,
    passwordHash: user.passwordHash || user.password_hash,
    role: (user.role as "admin" | "user") || "user",
    createdAt: user.createdAt || user.created_at,
    lastLogin: user.lastLogin || user.last_login,
    lastAccess: user.lastAccess || user.last_access,
  }));
}

export async function getUsersWithoutPassword(): Promise<Omit<User, "passwordHash">[]> {
  const rawUsers = await readCSV("users.csv");

  return rawUsers.map((user: any) => ({
    id: user.id,
    username: user.username,
    email: user.email,
    name: user.name,
    role: (user.role as "admin" | "user") || "user",
    createdAt: user.createdAt || user.created_at,
    lastLogin: user.lastLogin || user.last_login,
    lastAccess: user.lastAccess || user.last_access,
  }));
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
      createdAt: user.createdAt,
      lastLogin: user.lastLogin || undefined,
      lastAccess: user.lastAccess || undefined,
      passwordHash: user.passwordHash,
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
      passwordHash: user.passwordHash,
      createdAt: user.createdAt,
      lastLogin: user.lastLogin || undefined,
      lastAccess: user.lastAccess || undefined,
    }));
  } catch (error) {
    console.error("Error reading all users:", error);
    return [];
  }
}

export async function getAllUsersWithStats(): Promise<User[]> {
  const rawUsers = await readCSV("users.csv");

  return rawUsers.map((user: any) => ({
    id: user.id,
    username: user.username,
    email: user.email,
    name: user.name,
    passwordHash: user.passwordHash || user.password_hash,
    role: (user.role as "admin" | "user") || "user",
    createdAt: user.createdAt || user.created_at,
    lastLogin: user.lastLogin || user.last_login,
    lastAccess: user.lastAccess || user.last_access,
  }));
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
    if (updates.passwordHash) {
      rawUsers[userIndex].password_hash = updates.passwordHash;
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
      createdAt: user.createdAt,
      lastLogin: user.lastLogin || undefined,
      lastAccess: user.lastAccess || undefined,
      passwordHash: user.passwordHash,
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
  password: string;
  role?: "admin" | "user";
}): Promise<User> {
  try {
    const rawUsers = await readCSV<any>("users.csv");

    // 새 ID 생성 (기존 ID들 중 최대값 + 1)
    const maxId = rawUsers.reduce((max, user) => Math.max(max, parseInt(user.id) || 0), 0);
    const userId = (maxId + 1).toString();

    const now = new Date().toISOString();

    // 비밀번호 해시화
    const hashedPassword = await bcrypt.hash(userData.password, 10);

    const newUser: User = {
      id: userId,
      username: userData.username,
      email: userData.email,
      name: userData.name,
      passwordHash: hashedPassword,
      role: userData.role || "user",
      createdAt: now,
      lastLogin: undefined,
      lastAccess: undefined,
    };

    rawUsers.push(newUser);
    await writeCSV("users.csv", rawUsers);

    return newUser;
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

    // 현재 시간으로 lastLogin 업데이트
    rawUsers[userIndex].lastLogin = new Date().toISOString();

    await writeCSV("users.csv", rawUsers);
  } catch (error) {
    console.error("Error updating user last login:", error);
    throw error;
  }
}

/**
 * 사용자 최종 접속 시간 업데이트 (API 호출 시마다)
 */
export async function updateUserLastAccess(userId: string): Promise<void> {
  const users = await getUsers();
  const user = users.find((u) => u.id === userId);

  if (user) {
    user.lastAccess = new Date().toISOString();
    await writeCSV<User>("users.csv", users);
  }
}

// ============================================
// Travel Prep Data Functions
// ============================================

/**
 * 여행 종류 템플릿 목록 조회
 */
export async function getTravelTypes(): Promise<TravelTypeTemplate[]> {
  try {
    const rawTypes = await readCSV<any>("travel-types.csv");
    return rawTypes.map((t) => ({
      id: t.id,
      name: t.name,
      days: parseInt(t.days),
      type: t.type as "여행" | "출장",
    }));
  } catch (error) {
    console.error("Error reading travel types:", error);
    return [];
  }
}

/**
 * 여행 준비물 마스터 데이터 조회
 */
export async function getTravelItems(activeOnly = true): Promise<TravelItem[]> {
  try {
    const rawItems = await readCSV<any>("travel-items.csv");
    const items = rawItems.map((item) => ({
      id: item.id,
      name: item.name,
      width: parseFloat(item.width),
      height: parseFloat(item.height),
      depth: parseFloat(item.depth),
      weight: parseFloat(item.weight),
      category: item.category,
      importance: parseInt(item.importance),
      isActive: item.is_active === "true",
    }));
    return activeOnly ? items.filter((item) => item.isActive) : items;
  } catch (error) {
    console.error("Error reading travel items:", error);
    return [];
  }
}

/**
 * 여행 준비물 아이템 생성
 */
export async function createTravelItem(data: {
  name: string;
  category: string;
  importance: number;
  width: number;
  height: number;
  depth: number;
  weight: number;
}): Promise<TravelItem> {
  try {
    const rawItems = await readCSV<any>("travel-items.csv");
    const maxId = rawItems.reduce((max, item) => Math.max(max, parseInt(item.id) || 0), 0);
    const newId = (maxId + 1).toString();

    const newItem = {
      id: newId,
      name: data.name,
      width: data.width.toString(),
      height: data.height.toString(),
      depth: data.depth.toString(),
      weight: data.weight.toString(),
      category: data.category,
      importance: data.importance.toString(),
      is_active: "true",
    };

    rawItems.push(newItem);
    await writeCSV("travel-items.csv", rawItems);

    return {
      id: newId,
      name: data.name,
      width: data.width,
      height: data.height,
      depth: data.depth,
      weight: data.weight,
      category: data.category,
      importance: data.importance,
      isActive: true,
    };
  } catch (error) {
    console.error("Error creating travel item:", error);
    throw error;
  }
}

/**
 * 여행 준비물 아이템 수정
 */
export async function updateTravelItem(
  itemId: string,
  data: {
    name?: string;
    category?: string;
    importance?: number;
    width?: number;
    height?: number;
    depth?: number;
    weight?: number;
  }
): Promise<void> {
  try {
    const rawItems = await readCSV<any>("travel-items.csv");
    const itemIndex = rawItems.findIndex((item) => item.id === itemId);

    if (itemIndex === -1) {
      throw new Error("아이템을 찾을 수 없습니다.");
    }

    if (data.name !== undefined) rawItems[itemIndex].name = data.name;
    if (data.category !== undefined) rawItems[itemIndex].category = data.category;
    if (data.importance !== undefined) rawItems[itemIndex].importance = data.importance.toString();
    if (data.width !== undefined) rawItems[itemIndex].width = data.width.toString();
    if (data.height !== undefined) rawItems[itemIndex].height = data.height.toString();
    if (data.depth !== undefined) rawItems[itemIndex].depth = data.depth.toString();
    if (data.weight !== undefined) rawItems[itemIndex].weight = data.weight.toString();

    await writeCSV("travel-items.csv", rawItems);
  } catch (error) {
    console.error("Error updating travel item:", error);
    throw error;
  }
}

/**
 * 여행 준비물 아이템 삭제 (소프트 삭제)
 */
export async function deleteTravelItem(itemId: string): Promise<void> {
  try {
    const rawItems = await readCSV<any>("travel-items.csv");
    const itemIndex = rawItems.findIndex((item) => item.id === itemId);

    if (itemIndex === -1) {
      throw new Error("아이템을 찾을 수 없습니다.");
    }

    // 소프트 삭제
    rawItems[itemIndex].is_active = "false";

    await writeCSV("travel-items.csv", rawItems);
  } catch (error) {
    console.error("Error deleting travel item:", error);
    throw error;
  }
}

/**
 * 가방 마스터 데이터 조회
 */
export async function getBags(activeOnly = true): Promise<Bag[]> {
  try {
    const rawBags = await readCSV<any>("bags.csv");
    const bags = rawBags.map((bag) => ({
      id: bag.id,
      name: bag.name,
      width: parseFloat(bag.width),
      height: parseFloat(bag.height),
      depth: parseFloat(bag.depth),
      weight: parseFloat(bag.weight),
      isActive: bag.is_active === "true",
    }));
    return activeOnly ? bags.filter((bag) => bag.isActive) : bags;
  } catch (error) {
    console.error("Error reading bags:", error);
    return [];
  }
}

/**
 * 가방 생성
 */
export async function createBag(data: {
  name: string;
  width: number;
  height: number;
  depth: number;
  weight: number;
}): Promise<Bag> {
  try {
    const rawBags = await readCSV<any>("bags.csv");
    const maxId = rawBags.reduce((max, bag) => Math.max(max, parseInt(bag.id) || 0), 0);
    const newId = (maxId + 1).toString();

    const newBag = {
      id: newId,
      name: data.name,
      width: data.width.toString(),
      height: data.height.toString(),
      depth: data.depth.toString(),
      weight: data.weight.toString(),
      is_active: "true",
    };

    rawBags.push(newBag);
    await writeCSV("bags.csv", rawBags);

    return {
      id: newId,
      name: data.name,
      width: data.width,
      height: data.height,
      depth: data.depth,
      weight: data.weight,
      isActive: true,
    };
  } catch (error) {
    console.error("Error creating bag:", error);
    throw error;
  }
}

/**
 * 가방 수정
 */
export async function updateBag(
  bagId: string,
  data: {
    name?: string;
    width?: number;
    height?: number;
    depth?: number;
    weight?: number;
  }
): Promise<void> {
  try {
    const rawBags = await readCSV<any>("bags.csv");
    const bagIndex = rawBags.findIndex((bag) => bag.id === bagId);

    if (bagIndex === -1) {
      throw new Error("가방을 찾을 수 없습니다.");
    }

    if (data.name !== undefined) rawBags[bagIndex].name = data.name;
    if (data.width !== undefined) rawBags[bagIndex].width = data.width.toString();
    if (data.height !== undefined) rawBags[bagIndex].height = data.height.toString();
    if (data.depth !== undefined) rawBags[bagIndex].depth = data.depth.toString();
    if (data.weight !== undefined) rawBags[bagIndex].weight = data.weight.toString();

    await writeCSV("bags.csv", rawBags);
  } catch (error) {
    console.error("Error updating bag:", error);
    throw error;
  }
}

/**
 * 가방 삭제 (소프트 삭제 + 아이템 미배정 처리)
 */
export async function deleteBag(bagId: string): Promise<void> {
  try {
    // 가방 소프트 삭제
    const rawBags = await readCSV<any>("bags.csv");
    const bagIndex = rawBags.findIndex((bag) => bag.id === bagId);

    if (bagIndex === -1) {
      throw new Error("가방을 찾을 수 없습니다.");
    }

    rawBags[bagIndex].is_active = "false";
    await writeCSV("bags.csv", rawBags);

    // 해당 가방에 배정된 아이템들을 미배정 상태로 변경
    const rawItems = await readCSV<any>("trip-items.csv");
    const updatedItems = rawItems.map((item) => {
      if (item.bag_id === bagId) {
        return { ...item, bag_id: "" };
      }
      return item;
    });

    await writeCSV("trip-items.csv", updatedItems);
  } catch (error) {
    console.error("Error deleting bag:", error);
    throw error;
  }
}

/**
 * 특정 사용자의 여행 리스트 조회
 */
export async function getTripLists(userId: string): Promise<TripList[]> {
  try {
    const rawLists = await readCSV<any>("trip-lists.csv");
    const userLists = rawLists
      .filter((list) => list.user_id === userId)
      .map((list) => ({
        id: list.id,
        userId: list.user_id,
        travelTypeId: list.travel_type_id || undefined,
        name: list.name,
        days: parseInt(list.days),
        type: list.type as "여행" | "출장",
        createdAt: list.created_at,
        lastUsed: list.last_used,
      }))
      .sort((a, b) => new Date(b.lastUsed).getTime() - new Date(a.lastUsed).getTime());
    return userLists;
  } catch (error) {
    console.error("Error reading trip lists:", error);
    return [];
  }
}

/**
 * 여행 리스트 생성
 */
export async function createTripList(data: {
  userId: string;
  travelTypeId?: string;
  name: string;
  days: number;
  type: "여행" | "출장";
}): Promise<TripList> {
  try {
    const rawLists = await readCSV<any>("trip-lists.csv");
    const maxId = rawLists.reduce((max, list) => Math.max(max, parseInt(list.id) || 0), 0);
    const newId = (maxId + 1).toString();
    const now = new Date().toISOString();

    const newList = {
      id: newId,
      user_id: data.userId,
      travel_type_id: data.travelTypeId || "",
      name: data.name,
      days: data.days.toString(),
      type: data.type,
      created_at: now,
      last_used: now,
    };

    rawLists.push(newList);
    await writeCSV("trip-lists.csv", rawLists);

    return {
      id: newId,
      userId: data.userId,
      travelTypeId: data.travelTypeId,
      name: data.name,
      days: data.days,
      type: data.type,
      createdAt: now,
      lastUsed: now,
    };
  } catch (error) {
    console.error("Error creating trip list:", error);
    throw error;
  }
}

/**
 * 여행 리스트 마지막 사용 시간 업데이트
 */
export async function updateTripListLastUsed(tripListId: string): Promise<void> {
  try {
    const rawLists = await readCSV<any>("trip-lists.csv");
    const listIndex = rawLists.findIndex((list) => list.id === tripListId);

    if (listIndex === -1) {
      throw new Error("여행 리스트를 찾을 수 없습니다.");
    }

    rawLists[listIndex].last_used = new Date().toISOString();
    await writeCSV("trip-lists.csv", rawLists);
  } catch (error) {
    console.error("Error updating trip list last used:", error);
    throw error;
  }
}

/**
 * 특정 여행의 아이템 목록 조회
 */
export async function getTripItems(tripListId: string): Promise<TripItem[]> {
  try {
    const rawItems = await readCSV<any>("trip-items.csv");
    return rawItems
      .filter((item) => item.trip_list_id === tripListId)
      .map((item) => ({
        id: item.id,
        tripListId: item.trip_list_id,
        itemId: item.item_id,
        itemType: item.item_type as "item" | "bag",
        bagId: item.bag_id || undefined,
        isPrepared: item.is_prepared === "true",
        quantity: parseInt(item.quantity) || 1,
        order: parseInt(item.order),
      }))
      .sort((a, b) => a.order - b.order);
  } catch (error) {
    console.error("Error reading trip items:", error);
    return [];
  }
}

/**
 * 여행에 아이템 추가 (가방 또는 준비물)
 */
export async function addTripItem(data: {
  tripListId: string;
  itemId: string;
  itemType: "item" | "bag";
  bagId?: string;
}): Promise<TripItem> {
  try {
    const rawItems = await readCSV<any>("trip-items.csv");
    const maxId = rawItems.reduce((max, item) => Math.max(max, parseInt(item.id) || 0), 0);
    const newId = (maxId + 1).toString();

    // 해당 여행의 최대 order 값 찾기
    const tripItems = rawItems.filter((item) => item.trip_list_id === data.tripListId);
    const maxOrder = tripItems.reduce((max, item) => Math.max(max, parseInt(item.order) || 0), 0);

    const newItem = {
      id: newId,
      trip_list_id: data.tripListId,
      item_id: data.itemId,
      item_type: data.itemType,
      bag_id: data.bagId || "",
      is_prepared: "false",
      quantity: "1",
      order: (maxOrder + 1).toString(),
    };

    rawItems.push(newItem);
    await writeCSV("trip-items.csv", rawItems);

    return {
      id: newId,
      tripListId: data.tripListId,
      itemId: data.itemId,
      itemType: data.itemType,
      bagId: data.bagId,
      isPrepared: false,
      quantity: 1,
      order: maxOrder + 1,
    };
  } catch (error) {
    console.error("Error adding trip item:", error);
    throw error;
  }
}

/**
 * 여행에 여러 아이템을 배치로 추가 (한 번에 CSV 쓰기)
 */
export async function addTripItemsBatch(
  tripListId: string,
  items: Array<{ itemId: string; itemType: "item" | "bag"; bagId?: string }>
): Promise<TripItem[]> {
  try {
    const rawItems = await readCSV<any>("trip-items.csv");

    // 최대 ID와 order 계산
    const maxId = rawItems.reduce((max, item) => Math.max(max, parseInt(item.id) || 0), 0);
    const tripItems = rawItems.filter((item) => item.trip_list_id === tripListId);
    const maxOrder = tripItems.reduce((max, item) => Math.max(max, parseInt(item.order) || 0), 0);

    const newItems: TripItem[] = [];
    const newRawItems: any[] = [];

    // 모든 새 아이템 생성
    items.forEach((item, index) => {
      const newId = (maxId + index + 1).toString();
      const order = maxOrder + index + 1;

      const newRawItem = {
        id: newId,
        trip_list_id: tripListId,
        item_id: item.itemId,
        item_type: item.itemType,
        bag_id: item.bagId || "",
        is_prepared: "false",
        quantity: "1",
        order: order.toString(),
      };

      newRawItems.push(newRawItem);

      newItems.push({
        id: newId,
        tripListId: tripListId,
        itemId: item.itemId,
        itemType: item.itemType,
        bagId: item.bagId,
        isPrepared: false,
        quantity: 1,
        order: order,
      });
    });

    // 한 번에 모든 아이템 추가하고 CSV 쓰기
    rawItems.push(...newRawItems);
    await writeCSV("trip-items.csv", rawItems);

    return newItems;
  } catch (error) {
    console.error("Error adding trip items batch:", error);
    throw error;
  }
}

/**
 * 여행 아이템 업데이트 (준비 상태, 가방 할당, 수량 등)
 */
export async function updateTripItem(
  itemId: string,
  updates: { bagId?: string; isPrepared?: boolean; quantity?: number }
): Promise<void> {
  try {
    const rawItems = await readCSV<any>("trip-items.csv");
    const itemIndex = rawItems.findIndex((item) => item.id === itemId);

    if (itemIndex === -1) {
      throw new Error("아이템을 찾을 수 없습니다.");
    }

    if (updates.bagId !== undefined) {
      rawItems[itemIndex].bag_id = updates.bagId;
    }
    if (updates.isPrepared !== undefined) {
      rawItems[itemIndex].is_prepared = updates.isPrepared ? "true" : "false";
    }
    if (updates.quantity !== undefined) {
      rawItems[itemIndex].quantity = updates.quantity.toString();
    }

    await writeCSV("trip-items.csv", rawItems);
  } catch (error) {
    console.error("Error updating trip item:", error);
    throw error;
  }
}

/**
 * 여행 아이템 삭제
 */
export async function deleteTripItem(itemId: string): Promise<void> {
  try {
    const rawItems = await readCSV<any>("trip-items.csv");
    const itemToDelete = rawItems.find((item) => item.id === itemId);

    if (!itemToDelete) {
      throw new Error("아이템을 찾을 수 없습니다.");
    }

    // 가방 삭제인 경우, 해당 가방에 배정된 아이템들의 bagId를 제거
    let updatedItems = rawItems;
    if (itemToDelete.itemType === "bag") {
      const bagId = itemToDelete.itemId;
      updatedItems = rawItems.map((item) => {
        if (item.itemType === "item" && item.bagId === bagId) {
          return { ...item, bagId: "" };
        }
        return item;
      });
    }

    // 해당 아이템 삭제
    const filteredItems = updatedItems.filter((item) => item.id !== itemId);

    await writeCSV("trip-items.csv", filteredItems);
  } catch (error) {
    console.error("Error deleting trip item:", error);
    throw error;
  }
}

/**
 * 여행 아이템 배치 삭제
 */
export async function deleteTripItemsBatch(itemIds: string[]): Promise<number> {
  try {
    const rawItems = await readCSV<any>("trip-items.csv");
    const itemIdsSet = new Set(itemIds);
    const filteredItems = rawItems.filter((item) => !itemIdsSet.has(item.id));

    const deletedCount = rawItems.length - filteredItems.length;

    if (deletedCount === 0) {
      throw new Error("삭제할 아이템을 찾을 수 없습니다.");
    }

    await writeCSV("trip-items.csv", filteredItems);
    return deletedCount;
  } catch (error) {
    console.error("Error deleting trip items batch:", error);
    throw error;
  }
}

/**
 * 여행 아이템 배치 가방 변경
 */
export async function updateTripItemsBagBatch(itemIds: string[], newBagId: string): Promise<number> {
  try {
    const rawItems = await readCSV<any>("trip-items.csv");
    const itemIdsSet = new Set(itemIds);
    let updatedCount = 0;

    const updatedItems = rawItems.map((item) => {
      if (itemIdsSet.has(item.id)) {
        updatedCount++;
        return { ...item, bag_id: newBagId };
      }
      return item;
    });

    if (updatedCount === 0) {
      throw new Error("업데이트할 아이템을 찾을 수 없습니다.");
    }

    await writeCSV("trip-items.csv", updatedItems);
    return updatedCount;
  } catch (error) {
    console.error("Error updating trip items bag batch:", error);
    throw error;
  }
}

/**
 * 가방별 통계 계산
 */
export async function calculateBagStats(tripListId: string, volumeRatio = 0.7): Promise<BagStats[]> {
  try {
    const tripItems = await getTripItems(tripListId);
    const allTravelItems = await getTravelItems(false);
    const allBags = await getBags(false);

    // 여행에 추가된 가방들
    const bagItems = tripItems.filter((item) => item.itemType === "bag");
    const stats: BagStats[] = [];

    for (const bagItem of bagItems) {
      const bag = allBags.find((b) => b.id === bagItem.itemId);
      if (!bag) continue;

      // 이 가방에 담긴 아이템들
      const itemsInBag = tripItems.filter((item) => item.itemType === "item" && item.bagId === bagItem.itemId);

      const itemsWithDetails = itemsInBag
        .map((tripItem) => {
          const travelItem = allTravelItems.find((ti) => ti.id === tripItem.itemId);
          if (!travelItem) return null;
          return {
            ...travelItem,
            isPrepared: tripItem.isPrepared,
            quantity: tripItem.quantity, // 수량 정보 추가
          };
        })
        .filter((item): item is TravelItem & { isPrepared: boolean; quantity: number } => item !== null);

      // 무게 계산 (수량 반영)
      const itemsWeight = itemsWithDetails.reduce((sum, item) => sum + item.weight * item.quantity, 0);
      const totalWeight = bag.weight + itemsWeight;

      // 부피 계산 (수량 반영)
      const bagVolume = bag.width * bag.height * bag.depth;
      const usedVolume = itemsWithDetails.reduce(
        (sum, item) => sum + item.width * item.height * item.depth * item.quantity,
        0
      );
      const saturation = Math.min((usedVolume / bagVolume) * volumeRatio * 100, 100);

      stats.push({
        bagId: bag.id,
        bag,
        items: itemsWithDetails,
        totalWeight,
        totalVolume: usedVolume,
        saturation,
      });
    }

    return stats;
  } catch (error) {
    console.error("Error calculating bag stats:", error);
    return [];
  }
}

// ============================================
// Daily Tasks Data Functions
// ============================================

/**
 * 사용자의 할일 목록 조회
 */
export async function getDailyTasks(userId: string, activeOnly = true): Promise<any[]> {
  try {
    const rawTasks = await readCSV<any>("daily-tasks.csv");
    let tasks = rawTasks.filter((task) => task.user_id === userId);

    if (activeOnly) {
      tasks = tasks.filter((task) => task.is_active === "true");
    }

    return tasks
      .map((task) => ({
        id: task.id,
        userId: task.user_id,
        title: task.title,
        description: task.description,
        importance: parseInt(task.importance),
        isActive: task.is_active === "true",
        createdAt: task.created_at,
        displayOrder: parseInt(task.display_order) || 0,
      }))
      .sort((a, b) => a.displayOrder - b.displayOrder);
  } catch (error) {
    console.error("Error reading daily tasks:", error);
    return [];
  }
}

/**
 * 할일 생성
 */
export async function createDailyTask(data: {
  userId: string;
  title: string;
  description: string;
  importance: number;
}): Promise<any> {
  try {
    const rawTasks = await readCSV<any>("daily-tasks.csv");

    const maxId = rawTasks.reduce((max, task) => Math.max(max, parseInt(task.id) || 0), 0);
    const newId = (maxId + 1).toString();

    // 해당 사용자의 최대 display_order 찾기
    const userTasks = rawTasks.filter((t) => t.user_id === data.userId && t.is_active === "true");
    const maxOrder = userTasks.reduce((max, task) => Math.max(max, parseInt(task.display_order) || 0), 0);

    const newTask = {
      id: newId,
      user_id: data.userId,
      title: data.title,
      description: data.description,
      importance: data.importance.toString(),
      is_active: "true",
      created_at: new Date().toISOString(),
      display_order: (maxOrder + 1).toString(),
    };

    rawTasks.push(newTask);
    await writeCSV("daily-tasks.csv", rawTasks);

    return {
      id: newId,
      userId: data.userId,
      title: data.title,
      description: data.description,
      importance: data.importance,
      isActive: true,
      createdAt: newTask.created_at,
      displayOrder: maxOrder + 1,
    };
  } catch (error) {
    console.error("Error creating daily task:", error);
    throw error;
  }
}

/**
 * 할일 수정
 */
export async function updateDailyTask(
  taskId: string,
  data: {
    title?: string;
    description?: string;
    importance?: number;
    isActive?: boolean;
  }
): Promise<void> {
  try {
    const rawTasks = await readCSV<any>("daily-tasks.csv");
    const taskIndex = rawTasks.findIndex((task) => task.id === taskId);

    if (taskIndex === -1) {
      throw new Error("할일을 찾을 수 없습니다.");
    }

    if (data.title !== undefined) rawTasks[taskIndex].title = data.title;
    if (data.description !== undefined) rawTasks[taskIndex].description = data.description;
    if (data.importance !== undefined) rawTasks[taskIndex].importance = data.importance.toString();
    if (data.isActive !== undefined) rawTasks[taskIndex].is_active = data.isActive.toString();

    await writeCSV("daily-tasks.csv", rawTasks);
  } catch (error) {
    console.error("Error updating daily task:", error);
    throw error;
  }
}

/**
 * 할일 삭제 (소프트 삭제)
 */
export async function deleteDailyTask(taskId: string): Promise<void> {
  try {
    const rawTasks = await readCSV<any>("daily-tasks.csv");
    const taskIndex = rawTasks.findIndex((task) => task.id === taskId);

    if (taskIndex === -1) {
      throw new Error("할일을 찾을 수 없습니다.");
    }

    rawTasks[taskIndex].is_active = "false";
    await writeCSV("daily-tasks.csv", rawTasks);
  } catch (error) {
    console.error("Error deleting daily task:", error);
    throw error;
  }
}

/**
 * 할일 순서 변경
 */
export async function reorderDailyTasks(userId: string, taskId: string, direction: "up" | "down"): Promise<void> {
  try {
    const rawTasks = await readCSV<any>("daily-tasks.csv");

    // 사용자의 활성 할일만 필터링
    const userTasks = rawTasks.filter((t) => t.user_id === userId && t.is_active === "true");
    userTasks.sort((a, b) => (parseInt(a.display_order) || 0) - (parseInt(b.display_order) || 0));

    // 현재 할일 찾기
    const currentIndex = userTasks.findIndex((t) => t.id === taskId);
    if (currentIndex === -1) throw new Error("할일을 찾을 수 없습니다.");

    // 교환할 인덱스 계산
    const targetIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= userTasks.length) {
      return; // 이동 불가 (맨 위/아래)
    }

    // display_order 교환
    const tempOrder = userTasks[currentIndex].display_order;
    userTasks[currentIndex].display_order = userTasks[targetIndex].display_order;
    userTasks[targetIndex].display_order = tempOrder;

    // 전체 목록에 업데이트
    userTasks.forEach((userTask) => {
      const index = rawTasks.findIndex((t) => t.id === userTask.id);
      if (index !== -1) {
        rawTasks[index].display_order = userTask.display_order;
      }
    });

    await writeCSV("daily-tasks.csv", rawTasks);
  } catch (error) {
    console.error("Error reordering daily tasks:", error);
    throw error;
  }
}

/**
 * 특정 날짜의 할일 로그 조회
 */
export async function getDailyTaskLogs(userId: string, date: string): Promise<any[]> {
  try {
    const rawLogs = await readCSV<any>("daily-task-logs.csv");
    const logs = rawLogs.filter((log) => log.user_id === userId && log.date === date);

    return logs.map((log) => ({
      id: log.id,
      userId: log.user_id,
      taskId: log.task_id,
      date: log.date,
      isCompleted: log.is_completed === "true",
      completedAt: log.completed_at || null,
    }));
  } catch (error) {
    console.error("Error reading daily task logs:", error);
    return [];
  }
}

/**
 * 할일 완료 상태 토글
 */
export async function toggleTaskCompletion(userId: string, taskId: string, date: string): Promise<void> {
  try {
    const rawLogs = await readCSV<any>("daily-task-logs.csv");
    const logIndex = rawLogs.findIndex((log) => log.user_id === userId && log.task_id === taskId && log.date === date);

    if (logIndex === -1) {
      // 로그가 없으면 새로 생성
      const maxId = rawLogs.reduce((max, log) => Math.max(max, parseInt(log.id) || 0), 0);
      const newLog = {
        id: (maxId + 1).toString(),
        user_id: userId,
        task_id: taskId,
        date: date,
        is_completed: "true",
        completed_at: new Date().toISOString(),
      };
      rawLogs.push(newLog);
    } else {
      // 기존 로그 토글
      const currentStatus = rawLogs[logIndex].is_completed === "true";
      rawLogs[logIndex].is_completed = (!currentStatus).toString();
      rawLogs[logIndex].completed_at = !currentStatus ? new Date().toISOString() : "";
    }

    await writeCSV("daily-task-logs.csv", rawLogs);
  } catch (error) {
    console.error("Error toggling task completion:", error);
    throw error;
  }
}

/**
 * 일일 통계 저장
 */
export async function saveDailyStats(
  userId: string,
  date: string,
  totalTasks: number,
  completedTasks: number
): Promise<void> {
  try {
    const rawStats = await readCSV<any>("daily-stats.csv");

    // 해당 날짜의 기록이 이미 있는지 확인
    const existingIndex = rawStats.findIndex((stat) => stat.user_id === userId && stat.date === date);

    const completionRate = totalTasks > 0 ? ((completedTasks / totalTasks) * 100).toFixed(2) : "0.00";

    if (existingIndex !== -1) {
      // 기존 기록 업데이트
      rawStats[existingIndex].total_tasks = totalTasks.toString();
      rawStats[existingIndex].completed_tasks = completedTasks.toString();
      rawStats[existingIndex].completion_rate = completionRate;
      rawStats[existingIndex].created_at = new Date().toISOString();
    } else {
      // 새 기록 추가
      const maxId = rawStats.reduce((max, stat) => Math.max(max, parseInt(stat.id) || 0), 0);
      const newStat = {
        id: (maxId + 1).toString(),
        user_id: userId,
        date: date,
        total_tasks: totalTasks.toString(),
        completed_tasks: completedTasks.toString(),
        completion_rate: completionRate,
        created_at: new Date().toISOString(),
      };
      rawStats.push(newStat);
    }

    await writeCSV("daily-stats.csv", rawStats);
  } catch (error) {
    console.error("Error saving daily stats:", error);
    throw error;
  }
}

/**
 * 일일 통계 조회
 */
export async function getDailyStats(userId: string, startDate?: string, endDate?: string): Promise<any[]> {
  try {
    const rawStats = await readCSV<any>("daily-stats.csv");
    let stats = rawStats.filter((stat) => stat.user_id === userId);

    if (startDate) {
      stats = stats.filter((stat) => stat.date >= startDate);
    }

    if (endDate) {
      stats = stats.filter((stat) => stat.date <= endDate);
    }

    return stats
      .map((stat) => ({
        id: stat.id,
        userId: stat.user_id,
        date: stat.date,
        totalTasks: parseInt(stat.total_tasks),
        completedTasks: parseInt(stat.completed_tasks),
        completionRate: parseFloat(stat.completion_rate),
        createdAt: stat.created_at,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));
  } catch (error) {
    console.error("Error reading daily stats:", error);
    return [];
  }
}

/**
 * 할일 리셋 및 완료율 기록 (사용자가 며칠간 접속하지 않은 경우 고려)
 */
export async function resetDailyTasksForUser(userId: string, lastAccessDate: string): Promise<void> {
  try {
    // 한국 시간 기준 오늘 날짜
    const now = new Date();
    const kstOffset = 9 * 60 * 60 * 1000;
    const today = new Date(now.getTime() + kstOffset).toISOString().split("T")[0]; // YYYY-MM-DD

    // 마지막 접속일과 오늘 사이의 모든 날짜에 대해 완료율 기록
    const lastDate = new Date(lastAccessDate);
    const currentDate = new Date(today);

    // 마지막 접속일의 완료율 계산 및 저장
    while (lastDate < currentDate) {
      // 한국 시간 기준 날짜 계산
      const dateKST = new Date(lastDate.getTime() + kstOffset);
      const dateStr = dateKST.toISOString().split("T")[0];

      // 해당 날짜의 로그 조회
      const logs = await getDailyTaskLogs(userId, dateStr);
      const tasks = await getDailyTasks(userId);

      const totalTasks = tasks.length;
      const completedTasks = logs.filter((log) => log.isCompleted).length;

      // 통계 저장 (이미 있으면 업데이트, 없으면 생성)
      await saveDailyStats(userId, dateStr, totalTasks, completedTasks);

      // 다음 날로 이동
      lastDate.setDate(lastDate.getDate() + 1);
    }

    // 오늘 날짜의 로그 초기화 (새로운 날짜의 로그 생성)
    const tasks = await getDailyTasks(userId);
    const rawLogs = await readCSV<any>("daily-task-logs.csv");

    // 오늘 날짜의 기존 로그 제거
    const filteredLogs = rawLogs.filter((log) => !(log.user_id === userId && log.date === today));

    // 각 활성 할일에 대해 미완료 로그 생성
    let maxId = filteredLogs.reduce((max, log) => Math.max(max, parseInt(log.id) || 0), 0);

    for (const task of tasks) {
      maxId += 1;
      filteredLogs.push({
        id: maxId.toString(),
        user_id: userId,
        task_id: task.id,
        date: today,
        is_completed: "false",
        completed_at: "",
      });
    }

    await writeCSV("daily-task-logs.csv", filteredLogs);
  } catch (error) {
    console.error("Error resetting daily tasks:", error);
    throw error;
  }
}

/**
 * 모든 사용자의 오늘 할일 현황 조회 (관리자용)
 */
export async function getAllUsersDailyStatus(date: string): Promise<any[]> {
  try {
    const users = await getAllUsers();
    const result = [];

    for (const user of users) {
      const tasks = await getDailyTasks(user.id);
      const logs = await getDailyTaskLogs(user.id, date);

      const totalTasks = tasks.length;
      const completedTasks = logs.filter((log) => log.isCompleted).length;
      const completionRate = totalTasks > 0 ? ((completedTasks / totalTasks) * 100).toFixed(2) : "0.00";

      result.push({
        userId: user.id,
        username: user.username,
        name: user.name,
        totalTasks,
        completedTasks,
        completionRate: parseFloat(completionRate),
        tasks: tasks.map((task) => {
          const log = logs.find((l) => l.taskId === task.id);
          return {
            ...task,
            isCompleted: log?.isCompleted || false,
          };
        }),
      });
    }

    return result;
  } catch (error) {
    console.error("Error getting all users daily status:", error);
    return [];
  }
}

// ============================================
// User Settings Data Functions
// ============================================

/**
 * 사용자 설정 조회
 */
export async function getUserSettings(userId: string): Promise<any> {
  try {
    const rawSettings = await readCSV<any>("user-settings.csv");
    const userSettings = rawSettings.filter((s) => s.user_id === userId);

    // 기본값
    const defaultSettings = {
      display: {
        dashboardColumns: 4,
        cardSize: "medium",
        language: "ko",
      },
      dailyTasks: {
        resetTime: "00:00",
        excludeWeekends: false,
        statsPeriod: 30,
        completionGoal: 80,
      },
      notifications: {
        dailyTasksEnabled: true,
        travelPrepEnabled: true,
        emailEnabled: false,
        travelNotificationDays: 3, // 여행 3일 전부터 알림
        encouragementEnabled: true, // 응원 메시지 활성화
        dailyTasksReminderEnabled: false, // 접속 유도 알림 비활성화
        dailyTasksReminderTimes: ["09:00", "12:00", "18:00", "21:00"], // 기본 알림 시간
      },
    };

    // CSV 데이터를 객체로 변환
    userSettings.forEach((setting) => {
      const category = setting.category as keyof typeof defaultSettings;
      const key = setting.key;
      const value = setting.value;

      if (defaultSettings[category]) {
        // 타입 변환
        let parsedValue: any = value;
        if (value === "true") parsedValue = true;
        else if (value === "false") parsedValue = false;
        else if (!isNaN(Number(value))) parsedValue = Number(value);
        else if (key === "dailyTasksReminderTimes") {
          try {
            parsedValue = JSON.parse(value);
          } catch {
            parsedValue = ["09:00", "12:00", "18:00", "21:00"];
          }
        }

        (defaultSettings[category] as any)[key] = parsedValue;
      }
    });

    return defaultSettings;
  } catch (error) {
    console.error("Error getting user settings:", error);
    // 파일이 없으면 기본값 반환
    return {
      display: {
        dashboardColumns: 4,
        cardSize: "medium",
        language: "ko",
      },
      dailyTasks: {
        resetTime: "00:00",
        excludeWeekends: false,
        statsPeriod: 30,
        completionGoal: 80,
      },
      notifications: {
        dailyTasksEnabled: true,
        travelPrepEnabled: true,
        emailEnabled: false,
      },
    };
  }
}

/**
 * 사용자 설정 업데이트
 */
export async function updateUserSetting(userId: string, category: string, key: string, value: any): Promise<void> {
  try {
    const rawSettings = await readCSV<any>("user-settings.csv");

    // 기존 설정 찾기
    const existingIndex = rawSettings.findIndex(
      (s) => s.user_id === userId && s.category === category && s.key === key
    );

    // 배열이나 객체는 JSON.stringify, 그 외는 String()
    const valueStr = Array.isArray(value) || typeof value === "object" ? JSON.stringify(value) : String(value);

    if (existingIndex !== -1) {
      // 업데이트
      rawSettings[existingIndex].value = valueStr;
      rawSettings[existingIndex].updated_at = new Date().toISOString();
    } else {
      // 새로 추가
      const maxId = rawSettings.reduce((max, s) => Math.max(max, parseInt(s.id) || 0), 0);
      rawSettings.push({
        id: (maxId + 1).toString(),
        user_id: userId,
        category,
        key,
        value: valueStr,
        updated_at: new Date().toISOString(),
      });
    }

    await writeCSV("user-settings.csv", rawSettings);
  } catch (error) {
    console.error("Error updating user setting:", error);
    throw error;
  }
}

/**
 * 여러 설정 일괄 업데이트
 */
export async function updateUserSettings(userId: string, settings: any): Promise<void> {
  try {
    const updates: Array<{ category: string; key: string; value: any }> = [];

    // settings 객체를 flat하게 변환
    Object.keys(settings).forEach((category) => {
      Object.keys(settings[category]).forEach((key) => {
        updates.push({
          category,
          key,
          value: settings[category][key],
        });
      });
    });

    // 각 설정 업데이트
    for (const update of updates) {
      await updateUserSetting(userId, update.category, update.key, update.value);
    }
  } catch (error) {
    console.error("Error updating user settings:", error);
    throw error;
  }
}

// ============================================
// User App Settings Data Functions
// ============================================

/**
 * 사용자별 앱 설정 조회
 */
export async function getUserAppSettings(userId: string): Promise<any[]> {
  try {
    await ensureDataFile("user-app-settings.csv");
    const settings = await readCSV<any>("user-app-settings.csv");
    return settings.filter((s) => s.user_id === userId);
  } catch (error) {
    console.error("Error getting user app settings:", error);
    return [];
  }
}

/**
 * 사용자별 앱 표시 여부 업데이트
 */
export async function updateUserAppVisibility(userId: string, appId: string, isVisible: boolean): Promise<void> {
  try {
    const settings = await readCSV<any>("user-app-settings.csv");
    const index = settings.findIndex((s) => s.user_id === userId && s.app_id === appId);

    if (index !== -1) {
      settings[index].is_visible = isVisible.toString();
    } else {
      // 없으면 새로 추가
      const apps = await readCSV<any>("apps.csv");
      const app = apps.find((a) => a.id === appId);
      if (app) {
        const maxId = settings.reduce((max, s) => Math.max(max, parseInt(s.id) || 0), 0);
        settings.push({
          id: (maxId + 1).toString(),
          user_id: userId,
          app_id: appId,
          is_visible: isVisible.toString(),
          custom_order: app.order,
          category: app.category,
        });
      }
    }

    await writeCSV("user-app-settings.csv", settings);
  } catch (error) {
    console.error("Error updating app visibility:", error);
    throw error;
  }
}

/**
 * 사용자별 앱 순서 업데이트
 */
export async function updateUserAppOrder(
  userId: string,
  category: string,
  appOrders: Array<{ appId: string; order: number }>
): Promise<void> {
  try {
    const settings = await readCSV<any>("user-app-settings.csv");

    for (const { appId, order } of appOrders) {
      const index = settings.findIndex((s) => s.user_id === userId && s.app_id === appId && s.category === category);

      if (index !== -1) {
        settings[index].custom_order = order.toString();
      }
    }

    await writeCSV("user-app-settings.csv", settings);
  } catch (error) {
    console.error("Error updating app order:", error);
    throw error;
  }
}

/**
 * 사용자별 앱 설정 일괄 생성 (최초 사용자 생성 시)
 */
export async function initializeUserAppSettings(userId: string): Promise<void> {
  try {
    const settings = await readCSV<any>("user-app-settings.csv");
    const existingSettings = settings.filter((s) => s.user_id === userId);

    // 이미 설정이 있으면 스킵
    if (existingSettings.length > 0) {
      return;
    }

    const apps = await readCSV<any>("apps.csv");
    let maxId = settings.reduce((max, s) => Math.max(max, parseInt(s.id) || 0), 0);

    for (const app of apps) {
      settings.push({
        id: (++maxId).toString(),
        user_id: userId,
        app_id: app.id,
        is_visible: "true",
        custom_order: app.order,
        category: app.category,
      });
    }

    await writeCSV("user-app-settings.csv", settings);
  } catch (error) {
    console.error("Error initializing user app settings:", error);
    throw error;
  }
}

// ============================================
// Activity Logs Data Functions
// ============================================

/**
 * 활동 로그 추가
 */
export async function addActivityLog(
  userId: string,
  actionType: string,
  actionDescription: string,
  appId?: string
): Promise<void> {
  try {
    await ensureDataFile("activity-logs.csv");
    const logs = await readCSV<any>("activity-logs.csv");
    const maxId = logs.reduce((max, l) => Math.max(max, parseInt(l.id) || 0), 0);

    logs.push({
      id: (maxId + 1).toString(),
      user_id: userId,
      action_type: actionType,
      action_description: actionDescription,
      created_at: new Date().toISOString(),
      app_id: appId || "",
    });

    await writeCSV("activity-logs.csv", logs);
  } catch (error) {
    console.error("Error adding activity log:", error);
    throw error;
  }
}

/**
 * 사용자 활동 로그 조회 (최근 N개)
 */
export async function getActivityLogs(userId: string, limit = 10): Promise<any[]> {
  try {
    await ensureDataFile("activity-logs.csv");
    const logs = await readCSV<any>("activity-logs.csv");
    const userLogs = logs
      .filter((l) => l.user_id === userId)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, limit);

    return userLogs.map((log) => ({
      id: log.id,
      userId: log.user_id,
      actionType: log.action_type,
      actionDescription: log.action_description,
      createdAt: log.created_at,
      appId: log.app_id,
    }));
  } catch (error) {
    console.error("Error getting activity logs:", error);
    return [];
  }
}

// ============================================
// 앱 전역 활성화 관리 (관리자 전용)
// ============================================

/**
 * 앱의 전역 활성화 상태를 변경합니다 (관리자 전용)
 */
export async function updateAppGlobalStatus(appId: string, isActive: boolean): Promise<void> {
  try {
    const apps = await readCSV<any>("apps.csv");
    const appIndex = apps.findIndex((app) => app.id === appId);

    if (appIndex === -1) {
      throw new Error("앱을 찾을 수 없습니다.");
    }

    apps[appIndex].is_active = isActive.toString();

    await writeCSV("apps.csv", apps);
  } catch (error) {
    console.error("Error updating app global status:", error);
    throw error;
  }
}

/**
 * 모든 앱 목록 조회 (관리자용 - 비활성화된 앱 포함)
 */
export async function getAllApps(): Promise<AppIcon[]> {
  return await getApps();
}

// ============================================================================
// Web Push 구독 관리
// ============================================================================

export interface PushSubscriptionData {
  user_id: string;
  endpoint: string;
  p256dh_key: string;
  auth_key: string;
  device_name: string; // 예: "Chrome on Windows", "Safari on iPhone"
  device_type: "desktop" | "mobile" | "tablet"; // 디바이스 타입
  browser: string; // 예: "Chrome", "Safari", "Edge"
  os: string; // 예: "Windows", "macOS", "iOS", "Android"
  created_at: string;
  last_used: string;
}

/**
 * 사용자의 모든 푸시 구독 정보 조회 (다중 디바이스)
 */
export async function getPushSubscriptions(userId: string): Promise<PushSubscriptionData[]> {
  try {
    console.log("[Data] getPushSubscriptions 시작:", userId);
    const subscriptions = await readCSV<PushSubscriptionData>("subscriptions.csv");
    console.log("[Data] 전체 구독 수:", subscriptions.length);

    const userSubscriptions = subscriptions.filter((sub) => sub.user_id === userId);
    console.log("[Data] 사용자 구독 수:", userSubscriptions.length);

    return userSubscriptions;
  } catch (error) {
    console.error("[Data] 구독 조회 오류:", error);
    return [];
  }
}

/**
 * 특정 endpoint의 푸시 구독 정보 조회
 */
export async function getPushSubscriptionByEndpoint(
  userId: string,
  endpoint: string
): Promise<PushSubscriptionData | null> {
  try {
    const subscriptions = await readCSV<PushSubscriptionData>("subscriptions.csv");
    return subscriptions.find((sub) => sub.user_id === userId && sub.endpoint === endpoint) || null;
  } catch (error) {
    console.error("[Data] 구독 조회 오류:", error);
    return null;
  }
}

/**
 * @deprecated 하위 호환성을 위해 유지. getPushSubscriptions 사용 권장
 */
export async function getPushSubscription(userId: string): Promise<PushSubscriptionData | null> {
  const subscriptions = await getPushSubscriptions(userId);
  return subscriptions[0] || null;
}

/**
 * 모든 푸시 구독 정보 조회
 */
export async function getAllPushSubscriptions(): Promise<PushSubscriptionData[]> {
  try {
    return await readCSV<PushSubscriptionData>("subscriptions.csv");
  } catch (error) {
    console.error("Error reading subscriptions:", error);
    return [];
  }
}

/**
 * 푸시 구독 추가/업데이트 (다중 디바이스 지원)
 */
export async function savePushSubscription(
  userId: string,
  endpoint: string,
  p256dhKey: string,
  authKey: string,
  deviceName: string,
  deviceType: "desktop" | "mobile" | "tablet",
  browser: string,
  os: string
): Promise<void> {
  try {
    console.log("[Data] savePushSubscription 시작:", {
      userId,
      endpoint: endpoint.substring(0, 50) + "...",
      deviceName,
    });

    const subscriptions = await readCSV<PushSubscriptionData>("subscriptions.csv");
    console.log("[Data] 기존 구독 수:", subscriptions.length);

    // user_id + endpoint를 복합키로 사용
    const existingIndex = subscriptions.findIndex((sub) => sub.user_id === userId && sub.endpoint === endpoint);
    console.log("[Data] 기존 구독 인덱스:", existingIndex);

    const now = new Date().toISOString();
    const subscriptionData: PushSubscriptionData = {
      user_id: userId,
      endpoint,
      p256dh_key: p256dhKey,
      auth_key: authKey,
      device_name: deviceName,
      device_type: deviceType,
      browser,
      os,
      created_at: existingIndex >= 0 ? subscriptions[existingIndex].created_at : now,
      last_used: now,
    };

    if (existingIndex >= 0) {
      console.log("[Data] 기존 디바이스 구독 업데이트");
      subscriptions[existingIndex] = subscriptionData;
    } else {
      console.log("[Data] 새 디바이스 구독 추가");
      subscriptions.push(subscriptionData);
    }

    console.log("[Data] CSV 쓰기 시작, 총 구독 수:", subscriptions.length);
    await writeCSV("subscriptions.csv", subscriptions);
    console.log("[Data] CSV 쓰기 완료!");
  } catch (error) {
    console.error("[Data] 구독 저장 오류:", error);
    throw error;
  }
}

/**
 * 특정 디바이스의 푸시 구독 삭제
 */
export async function deletePushSubscription(userId: string, endpoint: string): Promise<void> {
  try {
    console.log("[Data] deletePushSubscription:", { userId, endpoint: endpoint.substring(0, 50) + "..." });
    const subscriptions = await readCSV<PushSubscriptionData>("subscriptions.csv");
    const filtered = subscriptions.filter((sub) => !(sub.user_id === userId && sub.endpoint === endpoint));

    if (filtered.length === subscriptions.length) {
      throw new Error("구독 정보를 찾을 수 없습니다.");
    }

    await writeCSV("subscriptions.csv", filtered);
    console.log("[Data] 디바이스 구독 삭제 완료");
  } catch (error) {
    console.error("[Data] 구독 삭제 오류:", error);
    throw error;
  }
}

/**
 * 사용자의 모든 디바이스 푸시 구독 삭제
 */
export async function deleteAllUserPushSubscriptions(userId: string): Promise<void> {
  try {
    console.log("[Data] deleteAllUserPushSubscriptions:", userId);
    const subscriptions = await readCSV<PushSubscriptionData>("subscriptions.csv");
    const filtered = subscriptions.filter((sub) => sub.user_id !== userId);

    if (filtered.length === subscriptions.length) {
      throw new Error("구독 정보를 찾을 수 없습니다.");
    }

    await writeCSV("subscriptions.csv", filtered);
  } catch (error) {
    console.error("Error deleting subscription:", error);
    throw error;
  }
}

/**
 * endpoint로 푸시 구독 삭제 (만료된 구독 정리용)
 */
export async function deletePushSubscriptionByEndpoint(endpoint: string): Promise<void> {
  try {
    const subscriptions = await readCSV<PushSubscriptionData>("subscriptions.csv");
    const filtered = subscriptions.filter((sub) => sub.endpoint !== endpoint);

    if (filtered.length < subscriptions.length) {
      await writeCSV("subscriptions.csv", filtered);
    }
  } catch (error) {
    console.error("Error deleting subscription by endpoint:", error);
  }
}
