/**
 * 东南亚海图数据（第一张详细海图）—— 半架空世界观
 * - 地图形状借鉴真实东南亚群岛骨架（马来半岛/苏门答腊/婆罗洲/爪哇 的相对位置）
 * - 港口/势力/人物/叙事完全架空，中文古风港名
 * - 商品保留香料/胡椒/丝绸等通用航海意象
 * 港口以"区域特产差价"驱动贸易：产地便宜、异地卖高价。
 */

/** 时代/世界观设定：架空「大航路年代」，不依赖真实历史 */
export const ERA = {
  year: "大航路年代",
  label: "大航路年代 · 群岛商贸",
  desc: "一个香料与珍珠闪耀的群岛世界。海峡枢纽与诸岛商栈林立，冒险者以贸易与航海为业。",
};



export interface PortGood {
  name: string; // 商品名
  basePrice: number; // 基础价（金币）
  ratio: number; // 本港买卖比率；>1 卖贵(这边需求高 / 稀有)，<1 买便宜(这边自产)
  amount: number; // 本港可交易数量
}

export interface Port {
  id: string;
  name: string;
  lon: number; // 真实经度（用于贴合真实地图轮廓）
  lat: number; // 真实纬度
  isStart?: boolean;
  goods: PortGood[];
  color: number; // 港口标记色
}

/** 简明字典：商品 → 基础价；避免重复数字。 */
const PRICE: Record<string, number> = {
  香料: 120,
  胡椒: 90,
  丝绸: 160,
  瓷器: 140,
  檀香木: 110,
  鱼获: 40,
  珍珠: 180,
  稻米: 50,
  茶叶: 100,
  金银器: 200,
  白银: 240,
};

export const SEA_CHART = "SEA_CHART"; // 第一张海图 id

export const PORTS: Port[] = [
  // ── 中国沿海 ──
  {
    id: "guangzhou",
    name: "广州",
    lon: 113.25,
    lat: 23.13,
    color: 0xe8c97a,
    goods: [
      { name: "丝绸", basePrice: PRICE["丝绸"], ratio: 1.3, amount: 30 }, // 广州绸瓷集散
      { name: "瓷器", basePrice: PRICE["瓷器"], ratio: 1.5, amount: 25 },
      { name: "茶叶", basePrice: PRICE["茶叶"], ratio: 1.2, amount: 20 },
    ],
  },
  {
    id: "quanzhou",
    name: "泉州",
    lon: 118.6,
    lat: 24.9,
    color: 0xffca28,
    goods: [
      { name: "瓷器", basePrice: PRICE["瓷器"], ratio: 0.8, amount: 30 }, // 瓷器产地便宜→倒卖
      { name: "丝绸", basePrice: PRICE["丝绸"], ratio: 1.15, amount: 18 },
    ],
  },
  {
    id: "ningbo",
    name: "宁波",
    lon: 121.5,
    lat: 29.9,
    color: 0x66bb6a,
    goods: [
      { name: "茶叶", basePrice: PRICE["茶叶"], ratio: 0.9, amount: 25 },
      { name: "稻米", basePrice: PRICE["稻米"], ratio: 0.85, amount: 20 },
      { name: "瓷器", basePrice: PRICE["瓷器"], ratio: 1.15, amount: 12 },
    ],
  },
  // ── 朝鲜半岛 / 日本 ──
  {
    id: "busan",
    name: "釜山",
    lon: 129.05,
    lat: 35.18,
    color: 0x4fc3f7,
    goods: [
      { name: "鱼获", basePrice: PRICE["鱼获"], ratio: 1.4, amount: 35 }, // 海产
      { name: "金银器", basePrice: PRICE["金银器"], ratio: 1.2, amount: 12 },
    ],
  },
  {
    id: "nagasaki",
    name: "长崎",
    lon: 129.87,
    lat: 32.75,
    color: 0xab47bc,
    goods: [
      { name: "白银", basePrice: PRICE["金银器"], ratio: 1.8, amount: 20 }, // 日本白银贵
      { name: "丝绸", basePrice: PRICE["丝绸"], ratio: 1.6, amount: 15 },
    ],
  },
  {
    id: "sakai",
    name: "堺",
    lon: 135.47,
    lat: 34.58,
    color: 0xef5350,
    goods: [
      { name: "稻米", basePrice: PRICE["稻米"], ratio: 1.3, amount: 18 },
      { name: "金银器", basePrice: PRICE["金银器"], ratio: 1.1, amount: 10 },
      { name: "鱼获", basePrice: PRICE["鱼获"], ratio: 1.1, amount: 20 },
    ],
  },
  // ── 南海 / 东南亚 ──
  {
    id: "malacca",
    name: "马六甲",
    lon: 102.25,
    lat: 2.2,
    color: 0x4fc3f7,
    goods: [
      { name: "胡椒", basePrice: PRICE["胡椒"], ratio: 1.9, amount: 40 }, // 胡椒稀缺高价
      { name: "丝绸", basePrice: PRICE["丝绸"], ratio: 1.3, amount: 15 },
    ],
  },
  {
    id: "start_port",
    name: "新加坡",
    lon: 103.8,
    lat: 1.35,
    isStart: true,
    color: 0xe8c97a,
    goods: [
      { name: "胡椒", basePrice: PRICE["胡椒"], ratio: 1.18, amount: 30 }, // 起始港
      { name: "香料", basePrice: PRICE["香料"], ratio: 0.9, amount: 12 },
      { name: "檀香木", basePrice: PRICE["檀香木"], ratio: 0.85, amount: 10 },
    ],
  },
  {
    id: "batavia",
    name: "巴达维亚",
    lon: 106.8,
    lat: -6.1,
    color: 0x66bb6a,
    goods: [
      { name: "香料", basePrice: PRICE["香料"], ratio: 1.85, amount: 35 },
      { name: "稻米", basePrice: PRICE["稻米"], ratio: 0.8, amount: 20 },
    ],
  },
  {
    id: "saigon",
    name: "西贡",
    lon: 106.7,
    lat: 10.8,
    color: 0xffca28,
    goods: [
      { name: "稻米", basePrice: PRICE["稻米"], ratio: 1.2, amount: 12 },
      { name: "珍珠", basePrice: PRICE["珍珠"], ratio: 0.75, amount: 8 },
      { name: "鱼获", basePrice: PRICE["鱼获"], ratio: 0.7, amount: 25 },
    ],
  },
  {
    id: "manila",
    name: "马尼拉",
    lon: 120.98,
    lat: 14.6,
    color: 0xef5350,
    goods: [
      { name: "金银器", basePrice: PRICE["金银器"], ratio: 1.4, amount: 10 },
      { name: "檀香木", basePrice: PRICE["檀香木"], ratio: 0.9, amount: 12 },
      { name: "鱼获", basePrice: PRICE["鱼获"], ratio: 1.15, amount: 15 },
    ],
  },
  {
    id: "siam",
    name: "暹罗",
    lon: 100.5,
    lat: 13.75,
    color: 0xab47bc,
    goods: [
      { name: "丝绸", basePrice: PRICE["丝绸"], ratio: 0.8, amount: 18 }, // 当地丝绸便宜
      { name: "茶叶", basePrice: PRICE["茶叶"], ratio: 0.85, amount: 14 },
    ],
  },
  {
    id: "borneo",
    name: "婆罗洲",
    lon: 114.6,
    lat: -3.3,
    color: 0x26a69a,
    goods: [
      { name: "檀香木", basePrice: PRICE["檀香木"], ratio: 1.5, amount: 20 },
      { name: "金银器", basePrice: PRICE["金银器"], ratio: 0.9, amount: 6 },
    ],
  },
];

/** 起始港 */
export const START_PORT = PORTS.find((p) => p.isStart)!;

/** 世界尺寸（地图逻辑坐标）。完整世界地图按比例投影 */
export const MAP_W = 2200;
export const MAP_H = 960;
