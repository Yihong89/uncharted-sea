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
};

export const SEA_CHART = "SEA_CHART"; // 第一张海图 id

export const PORTS: Port[] = [
  {
    id: "start_port",
    name: "临澜港",
    lon: 103.8,
    lat: 1.35,
    isStart: true,
    color: 0xe8c97a,
    // 海峡枢纽 · 起始港（新加坡海峡一带）
    goods: [
      { name: "胡椒", basePrice: PRICE["胡椒"], ratio: 1.18, amount: 30 }, // 出发港：胡椒便宜(本地出产)
      { name: "香料", basePrice: PRICE["香料"], ratio: 0.9, amount: 12 },
      { name: "檀香木", basePrice: PRICE["檀香木"], ratio: 0.85, amount: 10 },
    ],
  },
  {
    id: "strait_post",
    name: "潮涡驿",
    lon: 102.25,
    lat: 2.2,
    color: 0x4fc3f7,
    // 海峡商栈（马六甲一带）
    goods: [
      { name: "胡椒", basePrice: PRICE["胡椒"], ratio: 1.9, amount: 40 }, // 这里胡椒稀缺→高价收
      { name: "丝绸", basePrice: PRICE["丝绸"], ratio: 1.3, amount: 15 },
    ],
  },
  {
    id: "island_south",
    name: "椒澜渡",
    lon: 106.8,
    lat: -6.1,
    color: 0x66bb6a,
    // 群岛南渡口（爪哇/巴城一带）
    goods: [
      { name: "香料", basePrice: PRICE["香料"], ratio: 1.85, amount: 35 }, // 香料需求高
      { name: "稻米", basePrice: PRICE["稻米"], ratio: 0.8, amount: 20 },
    ],
  },
  {
    id: "river_bay",
    name: "碧稻湾",
    lon: 106.7,
    lat: 10.8,
    color: 0xffca28,
    // 大河入海湾（湄公河/西贡一带）
    goods: [
      { name: "稻米", basePrice: PRICE["稻米"], ratio: 1.2, amount: 12 },
      { name: "珍珠", basePrice: PRICE["珍珠"], ratio: 0.75, amount: 8 },
      { name: "鱼获", basePrice: PRICE["鱼获"], ratio: 0.7, amount: 25 },
    ],
  },
  {
    id: "gold_isle",
    name: "金珍屿",
    lon: 120.98,
    lat: 14.6,
    color: 0xef5350,
    // 东北金屿（吕宋/马尼拉一带）
    goods: [
      { name: "金银器", basePrice: PRICE["金银器"], ratio: 1.4, amount: 10 },
      { name: "檀香木", basePrice: PRICE["檀香木"], ratio: 0.9, amount: 12 },
      { name: "鱼获", basePrice: PRICE["鱼获"], ratio: 1.15, amount: 15 },
    ],
  },
  {
    id: "silk_dale",
    name: "绸岚郡",
    lon: 100.5,
    lat: 13.75,
    color: 0xab47bc,
    // 西北绸乡（暹罗内地一带）
    goods: [
      { name: "丝绸", basePrice: PRICE["丝绸"], ratio: 0.8, amount: 18 }, // 当地丝绸便宜
      { name: "茶叶", basePrice: PRICE["茶叶"], ratio: 0.85, amount: 14 },
    ],
  },
  {
    id: "sandal_reef",
    name: "檀香砥",
    lon: 114.6,
    lat: -3.3,
    color: 0x26a69a,
    // 大岛檀香岸（婆罗洲一带）
    goods: [
      { name: "檀香木", basePrice: PRICE["檀香木"], ratio: 1.5, amount: 20 },
      { name: "金银器", basePrice: PRICE["金银器"], ratio: 0.9, amount: 6 },
    ],
  },
];

/** 起始港 */
export const START_PORT = PORTS.find((p) => p.isStart)!;

/** 世界尺寸（地图逻辑坐标）。相机看 900x600 物理区域，但港口用比例 0..1。 */
export const MAP_W = 1600;
export const MAP_H = 1000;
