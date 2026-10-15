import type { CharacterPreset, Race } from '@/lib/types'

const RACES: Race[] = ['human', 'elf', 'tauren', 'fox', 'cat', 'machine', 'dragon', 'succubus']

const NAMES: Record<Race, string[]> = {
  human: ['沈照晚', '顾晚晴', '周小满', '林见鹿', '陈糯', '宋迟', '叶安安'],
  elf: ['席尔薇', '艾露因', '菲莉涅', '薇尔莎', '露米安'],
  tauren: ['芭尔莎', '穆卡', '塔妮娅', '珂尔'],
  fox: ['白萝', '赤纱', '月离', '小焰'],
  cat: ['橘丸', '暮里', '小椒', '绵绵'],
  machine: ['七号', '枢机', '铃零', '校准员甲'],
  dragon: ['炽珑', '寒澈', '敖眠', '鳞宁'],
  succubus: ['玫兹', '薇尔妲', '娜玛', '丝珀'],
}

const HAIR = ['black hair', 'brown hair', 'blonde hair', 'white hair', 'silver hair', 'red hair', 'pink hair', 'purple hair']
const EYES = ['blue eyes', 'red eyes', 'green eyes', 'purple eyes', 'brown eyes', 'yellow eyes']

const LOOK: Record<Race, string> = {
  human: '1girl, adult, human',
  elf: '1girl, adult, elf, pointy ears',
  tauren: '1girl, adult, cow girl, horns, cow ears, large breasts',
  fox: '1girl, adult, fox girl, fox ears, fox tail',
  cat: '1girl, adult, cat girl, cat ears, cat tail',
  machine: '1girl, adult, robot girl, mechanical parts',
  dragon: '1girl, adult, dragon girl, dragon horns, dragon tail',
  succubus: '1girl, adult, succubus, demon horns, demon wings, demon tail',
}

const CLOTHES = ['torn cape', 'leather armor', 'robe', 'bodysuit', 'shirt', 'cloak', 'bare shoulders']

function pick<T>(rows: T[], random: () => number): T {
  return rows[Math.min(rows.length - 1, Math.floor(random() * rows.length))]
}

function cm(min: number, max: number, random: () => number): string {
  return String(min + Math.floor(random() * (max - min + 1)))
}

function measurements(race: Race, random: () => number) {
  const large = race === 'tauren' || race === 'dragon' || race === 'succubus'
  return {
    bust: cm(large ? 92 : 78, large ? 114 : 98, random),
    waist: cm(54, 70, random),
    hip: cm(large ? 90 : 80, large ? 112 : 100, random),
  }
}

function dossier(race: Race, name: string, random: () => number) {
  const errand = pick([
    '她顺着旧地图找一件被记下名字的圣物',
    '她接了一张清剿委托，自己走下楼梯',
    '她追一只跑丢的契约兽，追到了门口',
    '她把这里当成可以取样的遗迹',
  ], random)
  const hold = pick(['剑还在手里', '弓还背在身上', '法杖捏得很紧', '工具包挎在腰上'], random)
  const cloth = pick([
    '皮甲的胸扣已经松开一颗，乳沟和半截乳晕挡在带子后面',
    '斗篷里面只剩一件被汗浸透的薄衫，乳尖把布顶起来',
    '战裙开衩到腰，腿根的绑带勒进肉里，中间几乎遮不住',
    '长袍下摆撕开了，内裤是开裆的，走路时会自己磨到',
  ], random)
  const weak = pick([
    '耳根被含住会先软',
    '尾根或腰窝一被按就站不稳',
    '乳尖被捏住时大腿会自己并拢',
    '被同一频率顶进去时容易接连潮吹',
  ], random)
  const line = pick([
    '「只、只许你碰那里……」',
    '「再、再深一点也行……」',
    '「不要停……下面在吸……」',
    '「坏掉也没关系，继续用……」',
  ], random)
  const trait = {
    human: '她会谈判，也会咬人。',
    elf: '耳尖一红，咒语就念不完整。',
    tauren: '身子结实，奶已经有一点涨。',
    fox: '尾巴会先于嘴出卖她。',
    cat: '嘴上还硬，喉咙里已经要漏出猫叫。',
    machine: '痛觉回路会把疼记成热。',
    dragon: '鳞还硬着，龙血先热起来。',
    succubus: '她本来想吸一口，结果自己先腿软。',
  }[race]
  return {
    backstory: `${name}自己闯进来。${errand}。${hold}，还没认谁做主。${trait}`,
    costumeDescription: `${cloth}。头发有点乱，鞋上是外面的泥。这是她进来时的样子。`,
    otherDescription: `抵抗时她还找出口，不肯先求饶。死穴是：${weak}。只有那里被按住，或快感明显升高之后，才会红着眼说${line}。这句是崩溃样本。`,
  }
}

/** 词表拼出一名闯入者。不写进角色库，头像留空，门口用姓氏字代替。 */
export function rollIntruder(avoid: string[] = [], random: () => number = Math.random): CharacterPreset {
  const blocked = new Set(avoid)
  let race = pick(RACES, random)
  let name = pick(NAMES[race], random)
  for (let attempt = 0; attempt < 8 && blocked.has(name); attempt += 1) {
    race = pick(RACES, random)
    name = pick(NAMES[race], random)
  }
  if (blocked.has(name)) name = `${name}${Math.floor(random() * 9) + 2}`
  const text = dossier(race, name, random)
  return {
    name,
    race,
    measurements: measurements(race, random),
    ...text,
    danbooruTags: `${LOOK[race]}, ${pick(HAIR, random)}, ${pick(EYES, random)}, ${pick(CLOTHES, random)}`,
  }
}
