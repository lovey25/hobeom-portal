import fs from "fs";
import path from "path";
import csvParser from "csv-parser";
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
