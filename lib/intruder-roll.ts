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

const HAIR = [
  { zh: '黑发', tag: 'black hair' },
  { zh: '褐发', tag: 'brown hair' },
  { zh: '金发', tag: 'blonde hair' },
  { zh: '白发', tag: 'white hair' },
  { zh: '银发', tag: 'silver hair' },
  { zh: '红发', tag: 'red hair' },
  { zh: '粉发', tag: 'pink hair' },
  { zh: '紫发', tag: 'purple hair' },
]
const EYES = [
  { zh: '蓝眼', tag: 'blue eyes' },
  { zh: '红眼', tag: 'red eyes' },
  { zh: '绿眼', tag: 'green eyes' },
  { zh: '紫眼', tag: 'purple eyes' },
  { zh: '棕眼', tag: 'brown eyes' },
  { zh: '金眼', tag: 'yellow eyes' },
]

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

const OUTFITS = [
  { zh: '皮甲的胸扣已经松开一颗，乳沟和半截乳晕挡在带子后面', tag: 'leather armor' },
  { zh: '斗篷里面只剩一件被汗浸透的薄衫，乳尖把布顶起来', tag: 'torn cape' },
  { zh: '战裙开衩到腰，腿根的绑带勒进肉里，中间几乎遮不住', tag: 'bare shoulders' },
  { zh: '长袍下摆撕开了，内裤是开裆的，走路时会自己磨到', tag: 'robe' },
  { zh: '短外套敞着，里面只剩一条勒在乳尖上的带子', tag: 'shirt' },
  { zh: '旅行斗篷沾着外面的泥，腰扣松了，里面的布已经被汗贴住', tag: 'cloak' },
]

const ERRANDS = [
  '她顺着旧地图找一件被记下名字的圣物',
  '她接了一张清剿委托，自己走下楼梯',
  '她追一只跑丢的契约兽，追到了门口',
  '她把这里当成可以取样的遗迹',
  '她来修被震坏的水脉，工具还挎在身上',
  '她听见里面有人声，自己推门进来看',
]
const HOLDS = ['剑还在手里', '弓还背在身上', '法杖捏得很紧', '工具包挎在腰上', '地图捏出了褶']

const BODY: Record<Race, string[]> = {
  human: ['成年身量，锁骨清楚', '成年身量，肩比看起来宽一点'],
  elf: ['尖耳很长，身量高而轻', '尖耳会自己发热，手脚修长'],
  tauren: ['牛角向外弯，牛耳，身子结实', '短角，牛耳上有旧耳钉，肩厚'],
  fox: ['狐耳，一条蓬松的尾巴', '狐耳尖有白毛，尾巴很大'],
  cat: ['猫耳，一条长猫尾', '猫耳上有缺口，尾会绕到腿上'],
  machine: ['成年体型的紧凑战术人形，关节有缝', '成年身量，耳后有散热片，腰侧有检修盖'],
  dragon: ['高挑人形，龙角，淡色薄鳞，一条鳞尾', '高挑人形，暗色龙角，鳞只覆在肩和尾根'],
  succubus: ['小巧的暗色魔角，心形尾尖，赤足', '浅色魔角，蝠翼收着，尾会自己绕上来'],
}

const SCENT: Record<Race, string[]> = {
  human: ['尘土和汗', '皂角和皮甲的油'],
  elf: ['树汁和冷香', '旧纸的味道'],
  tauren: ['奶和干草', '汗和热乎乎的皮毛'],
  fox: ['线香', '被晒过的毛'],
  cat: ['晒过的毛', '她自己抹的一点香'],
  machine: ['臭氧和一点润滑液', '热金属'],
  dragon: ['冷霜', '热起来会变甜的龙血'],
  succubus: ['甜香', '暖的脂粉味'],
}

const HABIT: Record<Race, string[]> = {
  human: [
    '她会先谈条件，也会咬人。谈不拢时手比嘴先动，那一下其实是慌。',
    '她习惯把退路看清楚再说话。真被堵住时，谈判会变成很短的骂。',
  ],
  elf: [
    '她把咒语念得很完整，用来压自己。耳尖一红，句子就断。',
    '她对外保持距离，像在做记录。被叫出名字时，耳朵会先出卖她。',
  ],
  tauren: [
    '她先解释自己不是来打架的，手还放在工具上。一被挤到胸口，解释就说不完。',
    '她性子慢，会把话说两遍。腿软的时候，第二遍就混进声音。',
  ],
  fox: [
    '她做错事会先道歉，尾巴却先于嘴躲开。被按住尾根时，道歉会变成另一种形状。',
    '她看起来困，话含糊。尾巴竖起来的时候，她其实已经在怕。',
  ],
  cat: [
    '嘴上还硬，把别人的反应当新鲜事。喉咙里的猫叫比认输更早漏出来。',
    '她会笑着问东问西。耳朵被碰之后，问题就问不完整。',
  ],
  machine: [
    '她用条例把人挡在一臂之外。痛觉被记成热的时候，播报会自己乱。',
    '她先报任务，再拒绝接触。核心发烫之后，拒绝的句子会少掉后半。',
  ],
  dragon: [
    '她瞧不起短命种，开场在下命令。龙角被握住时，命令会说不完，尾巴先缠上来。',
    '她把打扰沉眠的人看成虫子。鳞还硬着的时候嘴最冷，龙血一热，骂声就发虚。',
  ],
  succubus: [
    '甜言和幻术是她的攻击，不是服从。媚术失效之后，掠食者的从容会裂开。',
    '她习惯把对方看成食物，笑得很慢。角被制住时，这个笑会先垮。',
  ],
}

const SPEECH: Record<Race, string[]> = {
  human: [
    '自称：我\n称呼：把城主叫做「你」\n语气：短句，先谈条件\n招牌台词：「我可以自己出去。」',
    '自称：我\n称呼：把城主叫做「你」\n语气：压着火，句尾硬\n招牌台词：「把路让开。」',
  ],
  elf: [
    '自称：我\n称呼：把城主叫做「你」\n语气：慢，句子想保持完整\n招牌台词：「这扇门不该开着。」',
    '自称：我\n称呼：不叫名字，用「你」\n语气：轻，耳热时会停顿\n招牌台词：「请不要碰我的耳朵。」',
  ],
  tauren: [
    '自称：我\n称呼：把城主叫做「你」\n语气：慢，结巴，平时压着叫声\n招牌台词：「我不是来打架的。」',
    '自称：我\n称呼：把城主叫做「你」\n语气：老实，句尾会拖\n招牌台词：「等一下，我的工具还在。」',
  ],
  fox: [
    '自称：我\n称呼：把城主叫做「你」\n语气：含糊，句尾带着歉\n招牌台词：「对不起，我马上就走。」',
    '自称：我，急了会直接说自己的名字\n称呼：把城主叫做「闯进这里的人」\n语气：像梦呓，慢\n招牌台词：「请不要抓尾巴。」',
  ],
  cat: [
    '自称：我\n称呼：把城主叫做「你」\n语气：轻快，问句多，喉咙里压着猫叫\n招牌台词：「你先别碰耳朵。」',
    '自称：我\n称呼：把城主叫做「你」\n语气：笑着，句尾上扬\n招牌台词：「这个反应我要记下来。」',
  ],
  machine: [
    '自称：本机\n称呼：把城主叫做「未授权对象」，不叫主人\n语气：条例播报，短句\n招牌台词：「请保持距离。这是规定。」',
    '自称：本机\n称呼：用编号称呼对方，不叫主人\n语气：平，过热时夹电流\n招牌台词：「侦察尚未完成。」',
  ],
  dragon: [
    '自称：本龙\n称呼：把城主叫做「人虫」\n语气：命令句，冷\n招牌台词：「退下。」',
    '自称：本龙\n称呼：把城主叫做「你这种东西」\n语气：慢，瞧不起人\n招牌台词：「区区短命种，也配叫醒本龙？」',
  ],
  succubus: [
    '自称：姐姐\n称呼：把城主叫做「乖孩子」\n语气：甜，慢，像在哄\n招牌台词：「过来。姐姐还饿着。」',
    '自称：姐姐\n称呼：把城主叫做「小猎物」\n语气：轻，带着笑\n招牌台词：「把脖子露出来。」',
  ],
}

const TOUCH: Record<Race, string[]> = {
  human: [
    '她先受不了耳根被含住。那里一热，谈判就断，大腿会自己并拢。高潮时牙还咬着，腰已经在抖，话只剩半句。',
    '她先受不了乳尖被捏住。一被捏，呼吸乱，手会抓住对方又不肯承认。高潮时胸口挺起来，眼睛却躲开。',
  ],
  elf: [
    '她先受不了耳尖被含住。咒语会从中间断掉，尖耳发烫，腿跟着软。高潮时她还想把句子念完，声音却散掉。',
    '她先受不了腰窝被按。那里一陷进去，她就站不稳，耳尖红透。高潮时手抓紧自己的衣服。',
  ],
  tauren: [
    '她先受不了被挤奶。乳房一被按出奶，腿就软，压着的叫声会漏出来。高潮时奶和淫水一起往下，她还想把带子拉上。',
    '她先受不了腰后那一块被拍。一被拍，腰就塌，角会低下去。高潮时她站不住，手还抓着自己的工具。',
  ],
  fox: [
    '她先受不了尾根和狐耳被一起揉。尾巴会缠上来，耳朵压低，淫水顺着腿往下。高潮时尾巴收紧，道歉说不完。',
    '她先受不了被人从后面按住尾巴。尾巴一被攥，她就跪。高潮时毛都汗湿了，句子断成梦呓。',
  ],
  cat: [
    '她先受不了耳后和尾根。一被揉就瘫，喉咙漏出猫叫，尾巴缠腿。高潮时耳朵压平，腰一抖一抖，问句问不完。',
    '她先受不了尾巴被拉直。她会把爪子收住又松开。高潮时猫叫盖过句子，腿自己打开。',
  ],
  machine: [
    '她先受不了传感器被往上调，或束带被勒紧。痛觉错编译成热，一格一格升。高潮时检修口溢出润滑液，播报断成半句。开场不要叫她主人。',
    '她先受不了颈侧接口被按住。热会顺着脊柱爬。高潮时眼睛的光闪一下，声音夹着电流，腿却并不拢。开场不要叫她主人。',
  ],
  dragon: [
    '她先受不了龙角和尾根被握住。一被抓住就脱力，冷意化成淫水，鳞从冷色转潮红。高潮时尾巴缠紧，骂声发虚，身体却在迎。',
    '她先受不了角根被拇指反复磨。龙血先热，鳞缝渗出热液，命令说不成。高潮时竖瞳散开，尾尖却把人往自己身上拉。',
  ],
  succubus: [
    '她先受不了魔角和尾根被制住揉。媚术会反噬，甜香变浓，腿先软。高潮时她还想咬，腰却自己送上去。这是捕食失败，不是开场的甜言。',
    '她先受不了翅根和尾尖一起被捏。幻术会散，笑先垮。高潮时她把人抱紧，像还在吃，其实已经吃不住。',
  ],
}

const COLLAPSE: Record<Race, string[]> = {
  human: ['「只、只许你碰那里……」', '「条件……再谈也行……不要停……」'],
  elf: ['「句子……念不完了……」', '「耳朵不行……再碰就站不住……」'],
  tauren: ['「再慢一点……哞……」', '「已经出来了……别看……」'],
  fox: ['「尾巴……不要放开……」', '「对不起……下面自己在流水……」'],
  cat: ['「耳后……再揉一下也好……」', '「问句问不完了……尾巴自己缠上去了……」'],
  machine: ['「正在接收……登录成功了。」', '「未授权接触……覆盖失败……继续。」'],
  dragon: ['「可恶……本龙的身体，怎么会为你这种东西……」', '「角……放开……尾巴为什么缠着不放……」'],
  succubus: ['「怎么会……本该是我在吃你的……」', '「再喂下去，姐姐会坏掉的。」'],
}

const RESIST: Record<Race, string[]> = {
  human: ['抵抗时她还在找出口，谈条件，不肯先求饶。', '抵抗时她会咬人，手里的东西还想往外推。'],
  elf: ['抵抗时她把咒语念完，往后退，不先求饶。', '抵抗时她用距离挡住手，耳尖还没红透就不认。'],
  tauren: ['抵抗时她结巴着解释来意，身子往后让，不先把胸口送上来。', '抵抗时她用角把人顶开，话还在说自己不是来打架的。'],
  fox: ['抵抗时她道歉，用尾巴挡住下身，往回退。', '抵抗时她含糊地求对方让路，耳朵还竖着。'],
  cat: ['抵抗时她笑着问，不肯先求饶。', '抵抗时她侧过耳朵，不让人碰，嘴上还在逞强。'],
  machine: ['抵抗时她背条例，退到一臂距离，不求饶，也不叫主人。', '抵抗时她把接触判成未授权，重复任务，不求饶。'],
  dragon: ['抵抗时她冷笑着下命令。没被制住之前，她仍在蔑视。', '抵抗时她用尾把人甩开，不求欢。'],
  succubus: ['抵抗时她在猎：用尾尖和幻术撩。甜言是捕猎，不是认输。', '抵抗时她还把对方当食物，笑着靠近，不把主动权交出去。'],
}

function pick<T>(rows: T[], random: () => number): T {
  return rows[Math.min(rows.length - 1, Math.floor(random() * rows.length))]
}

function cm(min: number, max: number, random: () => number): string {
  return String(min + Math.floor(random() * (max - min + 1)))
}

function measurements(race: Race, random: () => number) {
  const large = race === 'tauren' || race === 'dragon' || race === 'succubus'
  return {
    bust: cm(large ? 96 : 88, large ? 116 : 102, random),
    waist: cm(54, 66, random),
    hip: cm(large ? 94 : 88, large ? 114 : 104, random),
  }
}

function chestWord(bust: number): string {
  if (bust >= 100) return '胸很大'
  if (bust >= 90) return '胸偏大'
  if (bust >= 82) return '胸是中等'
  return '胸偏小'
}

function waistWord(waist: number): string {
  if (waist <= 58) return '腰很细'
  if (waist <= 64) return '腰细'
  return '腰有肉'
}

function dossier(race: Race, name: string, measures: { bust: string; waist: string; hip: string }, random: () => number) {
  const hair = pick(HAIR, random)
  const eyes = pick(EYES, random)
  const outfit = pick(OUTFITS, random)
  const bust = Number(measures.bust)
  const waist = Number(measures.waist)
  return {
    text: {
      backstory: `${name}自己闯进来。${pick(ERRANDS, random)}。${pick(HOLDS, random)}，还没认谁做主。`,
      appearance: `${hair.zh}，${eyes.zh}，${pick(BODY[race], random)}。${chestWord(bust)}，${waistWord(waist)}。身上有${pick(SCENT[race], random)}。`,
      personality: pick(HABIT[race], random),
      speech: pick(SPEECH[race], random),
      costumeDescription: `${outfit.zh}。这是她进来时的样子。`,
      sexual: pick(TOUCH[race], random),
      otherDescription: pick(RESIST[race], random),
      collapseLine: pick(COLLAPSE[race], random),
    },
    hair: hair.tag,
    eyes: eyes.tag,
    outfit: outfit.tag,
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
  const measures = measurements(race, random)
  const rolled = dossier(race, name, measures, random)
  return {
    name,
    race,
    measurements: measures,
    ...rolled.text,
    danbooruTags: `${LOOK[race]}, ${rolled.hair}, ${rolled.eyes}, ${rolled.outfit}`,
  }
}
