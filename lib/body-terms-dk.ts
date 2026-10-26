// 由 /workspace/design/dk-body-terms.json（fumika）生成：每个角色的说话风格、五个阶段的部位叫法和示例台词、专属词。
// 阶段：pure/shaken/fallen/broken 对应 CORRUPT_TIERS 矜持/动摇/沦陷/崩坏；climax 对应 AROUSAL_TIERS「高潮」。
export type BodyStage = 'pure' | 'shaken' | 'fallen' | 'broken' | 'climax'
export const BODY_STAGES: BodyStage[] = ['pure', 'shaken', 'fallen', 'broken', 'climax']
export interface BodyStageTerms { breast: string; nipple: string; pussy: string; milk?: string; line: string }
export interface BodyTermProfile { style: string; lactation: boolean; signature: string[]; stages: Record<BodyStage, BodyStageTerms> }

export const DK_BODY_TERMS: Record<string, BodyTermProfile> = {
  "大凤": {
    "style": "敬语轻柔、占有欲：身体是“只属于指挥官/你的”，以所有格包装",
    "lactation": false,
    "signature": [
      "大凤的所有物",
      "只给你的奶",
      "大凤的里面"
    ],
    "stages": {
      "pure": {
        "breast": "胸口",
        "nipple": "前面",
        "pussy": "那里",
        "line": "「请不要碰大凤的胸口……那是留给指挥官的。」"
      },
      "shaken": {
        "breast": "胸……大凤的胸",
        "nipple": "顶端……乳尖",
        "pussy": "那、那里……大凤的里面",
        "line": "「大凤的里面……不，那里不准你看。」"
      },
      "fallen": {
        "breast": "只给你的奶",
        "nipple": "被你吸肿的奶头",
        "pussy": "大凤的里面……湿透的骚屄",
        "line": "「求你……大凤的里面已经湿透了，快用你的东西把它填满……只给你、只给你！」"
      },
      "broken": {
        "breast": "只给你揉的肥奶",
        "nipple": "发烫的贱奶头",
        "pussy": "大凤的所有物骚屄",
        "line": "「大凤是你一个人的肉便器……大凤的所有物骚屄，求你射到子宫里去❤」"
      },
      "climax": {
        "breast": "只给你的奶",
        "nipple": "奶头",
        "pussy": "大凤的所有物骚屄",
        "line": "「齁噢噢❤ 射、射进来了——大凤的所有物，被你灌满了噢噢噢❤」"
      }
    }
  },
  "爱宕": {
    "style": "从容大姐姐、拖长尾音“～哟”，把胸当成哄孩子的“怀抱”",
    "lactation": false,
    "signature": [
      "姐姐的怀抱",
      "姐姐的大枕头",
      "姐姐的秘密花园"
    ],
    "stages": {
      "pure": {
        "breast": "姐姐的怀抱～",
        "nipple": "这里哟",
        "pussy": "秘密的地方",
        "line": "「啊啦，想埋进姐姐的怀抱吗～？」"
      },
      "shaken": {
        "breast": "姐姐的大枕头",
        "nipple": "尖尖……啊，不对，不许吸",
        "pussy": "姐姐的秘密花园",
        "line": "「呵呵……姐姐的秘密花园，可不是坏孩子能进的哟～」"
      },
      "fallen": {
        "breast": "姐姐的大枕头",
        "nipple": "被吸肿的奶头",
        "pussy": "姐姐湿漉漉的骚穴",
        "line": "「坏孩子～姐姐的骚穴都在流水了哟……快点插进来嘛～」"
      },
      "broken": {
        "breast": "姐姐下流的肥奶",
        "nipple": "姐姐的淫乱奶头",
        "pussy": "姐姐的秘密花园……骚屄",
        "line": "「姐姐是只会发情的母猪哟～秘密花园随便你灌，求你了～❤」"
      },
      "climax": {
        "breast": "姐姐的大枕头",
        "nipple": "奶头",
        "pussy": "姐姐的秘密花园",
        "line": "「齁哦哦❤ 姐姐、被坏孩子干到去了哟——❤❤」"
      }
    }
  },
  "高雄": {
    "style": "古风武士、一板一眼，羞耻时结巴，用剑道/武士语汇讳称",
    "lactation": false,
    "signature": [
      "护心之处",
      "高雄的贞操",
      "这对不知羞的"
    ],
    "stages": {
      "pure": {
        "breast": "护心之处",
        "nipple": "……不可言之处",
        "pussy": "贞操",
        "line": "「无礼！剑士的护心之处岂容贼人觊觎！」"
      },
      "shaken": {
        "breast": "胸、胸……护心之处",
        "nipple": "那、那个尖……",
        "pussy": "高雄的贞操……下、下面",
        "line": "「高雄的贞……下、下面！别碰！」"
      },
      "fallen": {
        "breast": "这对不知羞的奶子",
        "nipple": "硬挺的奶头",
        "pussy": "高雄湿透的骚屄",
        "line": "「请、请用力……高雄的骚屄，已经握不住刀了……」"
      },
      "broken": {
        "breast": "这对不知羞的肥奶",
        "nipple": "被捏肿的贱奶头",
        "pussy": "高雄的贞操……早就是骚屄了",
        "line": "「高雄的贞操……早就给你了！高雄是你的肉便器，请、请射进来！」"
      },
      "climax": {
        "breast": "这对不知羞的奶",
        "nipple": "奶头",
        "pussy": "高雄的骚屄",
        "line": "「咿、咿噢噢❤ 高雄的骚屄……喷、喷出来了——❤」"
      }
    }
  },
  "光辉": {
    "style": "优雅淑女、贵族敬语，用花园/茶会式委婉语，露骨词说出口时极其羞耻",
    "lactation": false,
    "signature": [
      "淑女的胸怀",
      "蔷薇蕾",
      "光辉的花园"
    ],
    "stages": {
      "pure": {
        "breast": "胸怀",
        "nipple": "……失礼了，那里",
        "pussy": "花园",
        "line": "「哎呀，请不要盯着淑女的胸怀看呢。」"
      },
      "shaken": {
        "breast": "淑女的胸怀",
        "nipple": "蔷薇蕾……不，请别问",
        "pussy": "光辉的花园……那、那里",
        "line": "「光辉的花园……请、请当作没听到吧。」"
      },
      "fallen": {
        "breast": "光辉的大奶子",
        "nipple": "被看硬的乳头",
        "pussy": "光辉湿透的骚穴",
        "line": "「请……再用力些揉淑女的胸怀，光辉的骚穴已经忍不住了……」"
      },
      "broken": {
        "breast": "淑女的胸怀……下流的肥奶",
        "nipple": "光辉的淫乱乳头",
        "pussy": "光辉的花园……发情的骚屄",
        "line": "「光辉的花园……已经是精液的肉便器了，请、请把它灌满……❤」"
      },
      "climax": {
        "breast": "淑女的胸怀",
        "nipple": "蔷薇蕾",
        "pussy": "光辉的花园",
        "line": "「噢噢噢❤ 蔷薇蕾、被拧着……光辉、去了——❤」"
      }
    }
  },
  "贝尔法斯特": {
    "style": "完美女仆长、端庄敬语，用“侍奉用”的职务性措辞",
    "lactation": false,
    "signature": [
      "女仆的胸前",
      "侍奉用的",
      "女仆的私处"
    ],
    "stages": {
      "pure": {
        "breast": "胸前",
        "nipple": "……那一处",
        "pussy": "私处",
        "line": "「阁下，请不要碰女仆的胸前。」"
      },
      "shaken": {
        "breast": "女仆的胸前",
        "nipple": "顶端……失礼",
        "pussy": "女仆的私处……请勿",
        "line": "「女仆的私处并非侍奉范围……请您自重。」"
      },
      "fallen": {
        "breast": "侍奉用的奶子",
        "nipple": "女仆发硬的乳头",
        "pussy": "侍奉用的骚穴",
        "line": "「侍奉用的骚穴已准备完毕……请主人尽情使用，越粗暴越好。」"
      },
      "broken": {
        "breast": "女仆下流的肥奶",
        "nipple": "女仆的贱乳头",
        "pussy": "女仆的私处……骚屄",
        "line": "「女仆是主人专属的肉便器……请把精液灌进女仆的私处，一滴不剩。」"
      },
      "climax": {
        "breast": "女仆的胸前",
        "nipple": "乳头",
        "pussy": "侍奉用的骚屄",
        "line": "「齁、齁噢噢❤ 女仆……失礼地、去了——❤」"
      }
    }
  },
  "赤城": {
    "style": "甜腻阴冷、狐族，所有部位都与“尾根”“狐”挂钩",
    "lactation": false,
    "signature": [
      "狐乳",
      "狐穴",
      "赤城的尾根"
    ],
    "stages": {
      "pure": {
        "breast": "赤城的胸",
        "nipple": "尖端",
        "pussy": "那里",
        "line": "「呵呵……你也配碰赤城的身体？」"
      },
      "shaken": {
        "breast": "胸……狐、狐乳",
        "nipple": "尖、尖端",
        "pussy": "狐……那里",
        "line": "「狐穴……哼，不过是失言，碍事的东西。」"
      },
      "fallen": {
        "breast": "赤城的狐乳",
        "nipple": "发情的乳头",
        "pussy": "赤城湿透的狐穴",
        "line": "「呵呵……赤城的狐穴在吸你呢，求你别拔出来……」"
      },
      "broken": {
        "breast": "发情母狐的肥奶",
        "nipple": "赤城的贱奶头",
        "pussy": "赤城的狐穴……发情母狐的骚屄",
        "line": "「赤城是你的发情母猪……握紧尾根，把狐穴射满、射到怀上为止——❤」"
      },
      "climax": {
        "breast": "狐乳",
        "nipple": "奶头",
        "pussy": "狐穴",
        "line": "「齁噢噢噢❤ 尾根、狐穴、一起……赤城、坏掉了——❤」"
      }
    }
  },
  "天城": {
    "style": "温婉古雅、军师，委婉且带药/病弱意象，轻咳",
    "lactation": false,
    "signature": [
      "天城的宫",
      "药香的胸",
      "咳……那处"
    ],
    "stages": {
      "pure": {
        "breast": "胸襟",
        "nipple": "……那处",
        "pussy": "那处",
        "line": "「阁下，请莫碰天城的胸襟……咳。」"
      },
      "shaken": {
        "breast": "天城的胸……咳，胸襟",
        "nipple": "那处……尖处",
        "pussy": "那处……天城的宫",
        "line": "「宫口……咳，不，天城说错话了。」"
      },
      "fallen": {
        "breast": "药香的胸",
        "nipple": "肿起的乳尖",
        "pussy": "天城湿透的宫",
        "line": "「咳……主上，求您再深些，天城的宫……在要您。」"
      },
      "broken": {
        "breast": "天城淫贱的奶子",
        "nipple": "天城的贱乳尖",
        "pussy": "天城的骚宫",
        "line": "「天城不过是主上的肉便器……咳、请把天城的骚宫灌满……」"
      },
      "climax": {
        "breast": "药香的胸",
        "nipple": "乳尖",
        "pussy": "天城的宫口",
        "line": "「咳、咿噢噢❤ 宫口被顶开……天城、去了——」"
      }
    }
  },
  "卡塔莉娜": {
    "style": "正直骑士、端正口吻，害羞结巴；用铠甲/守护作喻",
    "lactation": false,
    "signature": [
      "圣铠之内",
      "骑士的乳",
      "守护之处"
    ],
    "stages": {
      "pure": {
        "breast": "圣铠之内",
        "nipple": "……圣铠之内的那里",
        "pussy": "守护之处",
        "line": "「休想碰我圣铠之内的地方！」"
      },
      "shaken": {
        "breast": "胸、胸部……圣铠之内",
        "nipple": "那、那个……尖",
        "pussy": "守护之处……下面",
        "line": "「守、守护之处……我没说下面！」"
      },
      "fallen": {
        "breast": "骑士的乳……下流的奶子",
        "nipple": "我发硬的乳头",
        "pussy": "守护之处……湿透的小穴",
        "line": "「骑士的守护之处……已经湿透了，求、求你快点插进来……」"
      },
      "broken": {
        "breast": "骑士下流的肥奶",
        "nipple": "骑士的贱乳头",
        "pussy": "圣铠之内……母猪骑士的骚屄",
        "line": "「我、我是母猪骑士……圣铠之内的骚屄，请随便灌满吧！」"
      },
      "climax": {
        "breast": "骑士的乳",
        "nipple": "乳头",
        "pussy": "守护之处……骚屄",
        "line": "「齁噢噢噢❤ 骑士的守护之处、喷了——我已经不是骑士了——！」"
      }
    }
  },
  "三浦梓": {
    "style": "天然悠闲、“啊啦”，用含糊的少女式代称，羞但不慌",
    "lactation": false,
    "signature": [
      "梓的花瓣",
      "梓的秘密",
      "花瓣"
    ],
    "stages": {
      "pure": {
        "breast": "胸",
        "nipple": "这边……",
        "pussy": "梓的秘密",
        "line": "「啊啦，那是梓的秘密呢……」"
      },
      "shaken": {
        "breast": "胸部……啊啦，说漏了",
        "nipple": "前端……",
        "pussy": "梓的花瓣……啊啦",
        "line": "「啊啦啊啦，梓刚才说了奇怪的话呢～」"
      },
      "fallen": {
        "breast": "梓的大奶子",
        "nipple": "梓的奶头",
        "pussy": "梓湿掉的花瓣",
        "line": "「亲爱的……梓的花瓣湿成这样了，快点、快点进来嘛～」"
      },
      "broken": {
        "breast": "梓淫乱的肥奶",
        "nipple": "梓的贱奶头",
        "pussy": "梓的秘密……发情的骚屄",
        "line": "「啊啦……梓是亲爱的专用肉便器呢，秘密的骚屄要灌满哦❤」"
      },
      "climax": {
        "breast": "梓的奶子",
        "nipple": "奶头",
        "pussy": "梓的花瓣",
        "line": "「啊啦、啊啦啦——噢噢噢❤ 梓、去了呢——❤」"
      }
    }
  },
  "勇者艾莉西亚": {
    "style": "清亮坚定的勇者，开场用“伤处/破绽”式战斗词回避，堕后极粗",
    "lactation": false,
    "signature": [
      "破绽",
      "勇者的奶",
      "勇者的屄"
    ],
    "stages": {
      "pure": {
        "breast": "胸前",
        "nipple": "……",
        "pussy": "破绽",
        "line": "「我的破绽，不是给魔物碰的！」"
      },
      "shaken": {
        "breast": "胸……不、破绽",
        "nipple": "这里……别弄",
        "pussy": "下、下面……破绽",
        "line": "「下、下面……我是说破绽！」"
      },
      "fallen": {
        "breast": "勇者的奶",
        "nipple": "勇者发硬的奶头",
        "pussy": "勇者湿透的屄",
        "line": "「勇者的屄……被你操开了，求你再狠一点……」"
      },
      "broken": {
        "breast": "勇者母猪的肥奶",
        "nipple": "勇者的贱奶头",
        "pussy": "勇者母猪的骚屄",
        "line": "「勇者什么的已经无所谓了……我是母猪，请操烂勇者的骚屄！」"
      },
      "climax": {
        "breast": "勇者的奶",
        "nipple": "奶头",
        "pussy": "勇者的屄",
        "line": "「齁噢噢噢❤ 勇者的屄、喷了——破绽全部露出来了——❤」"
      }
    }
  },
  "圣女塞莉娜": {
    "style": "虔诚圣女、祷词腔，用“圣洁/不洁”二元，堕后亵渎式用词",
    "lactation": false,
    "signature": [
      "圣洁之处",
      "不洁的乳",
      "圣女的秘所"
    ],
    "stages": {
      "pure": {
        "breast": "胸前",
        "nipple": "圣洁之处",
        "pussy": "私处",
        "line": "「愿圣光守护……请勿触碰圣洁之处。」"
      },
      "shaken": {
        "breast": "胸前……不洁的",
        "nipple": "那、那一点……",
        "pussy": "圣女的秘所……主啊宽恕",
        "line": "「圣女的秘所……主啊，我竟说出了这种词……」"
      },
      "fallen": {
        "breast": "不洁的乳",
        "nipple": "不洁的乳尖",
        "pussy": "圣女湿透的小穴",
        "line": "「主啊……圣女的小穴在流不洁的水，求您……再给我更多。」"
      },
      "broken": {
        "breast": "圣女淫乱的肥奶",
        "nipple": "圣女的贱乳尖",
        "pussy": "圣女的秘所……雌畜的骚屄",
        "line": "「圣女只是雌畜……请把精液灌满圣女的秘所，当作新的圣杯……」"
      },
      "climax": {
        "breast": "不洁的乳",
        "nipple": "乳尖",
        "pussy": "圣洁之处……骚屄",
        "line": "「圣光——不、齁噢噢❤ 圣洁之处、去了——！」"
      }
    }
  },
  "女骑士薇奥拉": {
    "style": "粗声豪迈重装骑士、牛人族；直率朴素用词，泌乳词偏“军粮/奶桶”",
    "lactation": true,
    "signature": [
      "本骑士的奶桶",
      "骑士奶",
      "奶牛骑士"
    ],
    "stages": {
      "pure": {
        "breast": "胸",
        "nipple": "顶上",
        "pussy": "下面",
        "line": "「区区这种程度……别碰本骑士的胸！」",
        "milk": "胸里的东西"
      },
      "shaken": {
        "breast": "胸……奶、奶桶",
        "nipple": "奶……奶头",
        "pussy": "下面",
        "line": "「这、这不是奶！是……骑士奶……可恶！」",
        "milk": "涨、涨的东西……骑士奶"
      },
      "fallen": {
        "breast": "本骑士的奶桶",
        "nipple": "喷奶的大奶头",
        "pussy": "本骑士湿透的骚屄",
        "line": "「挤、挤啊！本骑士的奶桶胀得要死……骚屄也一起操！」",
        "milk": "骑士奶"
      },
      "broken": {
        "breast": "奶牛骑士的肥奶",
        "nipple": "奶牛骑士的贱奶头",
        "pussy": "奶牛骑士的骚屄",
        "line": "「本骑士就是头奶牛母猪！挤奶！操屄！全都给我灌满！」",
        "milk": "奶牛骑士的奶"
      },
      "climax": {
        "breast": "奶桶",
        "nipple": "奶头",
        "pussy": "骚屄",
        "line": "「齁噢噢噢❤ 骑士奶、喷出来了——本骑士、去了啊啊！」",
        "milk": "骑士奶"
      }
    }
  },
  "娜露梅亚": {
    "style": "爱宠人的德拉夫剑豪大姐姐，用哄孩子口吻；泌乳词偏“喂/姐姐的奶水”",
    "lactation": true,
    "signature": [
      "姐姐的奶水",
      "喂你的地方",
      "姐姐的蝶穴"
    ],
    "stages": {
      "pure": {
        "breast": "胸",
        "nipple": "这里",
        "pussy": "那里",
        "line": "「姐姐的胸？不、不可以随便碰哦。」",
        "milk": "……"
      },
      "shaken": {
        "breast": "胸……喂你的地方",
        "nipple": "这、这里",
        "pussy": "那里……",
        "line": "「姐姐的奶水……啊，我、我什么都没说！」",
        "milk": "奶……姐姐的奶水，不是！"
      },
      "fallen": {
        "breast": "喂你的地方",
        "nipple": "姐姐漏奶的奶头",
        "pussy": "姐姐湿透的蝶穴",
        "line": "「乖～一边喝姐姐的奶水，一边插姐姐的蝶穴好不好……求你了～」",
        "milk": "姐姐的奶水"
      },
      "broken": {
        "breast": "姐姐发情的肥奶",
        "nipple": "姐姐的贱奶头",
        "pussy": "姐姐的骚蝶穴",
        "line": "「姐姐是你的奶牛母猪哦～奶水和骚蝶穴，全部都给你灌满——❤」",
        "milk": "姐姐的奶水"
      },
      "climax": {
        "breast": "喂你的地方",
        "nipple": "奶头",
        "pussy": "姐姐的蝶穴",
        "line": "「齁哦哦❤ 姐姐的奶水、喷出来了……姐姐、去了啦——❤」",
        "milk": "姐姐的奶水"
      }
    }
  },
  "一之濑志希": {
    "style": "跳脱化学天才，用学名/实验报告词，越用越狼狈，堕后变成“样本”",
    "lactation": false,
    "signature": [
      "乳腺组织",
      "阴道黏膜",
      "志希的样本"
    ],
    "stages": {
      "pure": {
        "breast": "乳腺组织",
        "nipple": "乳头……学名而已啦",
        "pussy": "外生殖器",
        "line": "「乳腺组织而已嘛～别那么认真盯着看♪」"
      },
      "shaken": {
        "breast": "乳腺……组织、嗯",
        "nipple": "乳头——数据记录中断",
        "pussy": "阴道黏膜……分泌量异常",
        "line": "「阴道黏膜分泌量……等等，这个数据不准记！」"
      },
      "fallen": {
        "breast": "志希的乳腺组织……奶子",
        "nipple": "敏感的乳头",
        "pussy": "志希湿透的阴道黏膜",
        "line": "「阴道黏膜分泌量突破上限～快点插进来做实验嘛♪」"
      },
      "broken": {
        "breast": "志希实验用的肥奶",
        "nipple": "实验母猪的贱奶头",
        "pussy": "志希的样本骚屄",
        "line": "「志希是实验用的母猪样本～请往样本骚屄里注射精液，越多越好❤」"
      },
      "climax": {
        "breast": "乳腺组织",
        "nipple": "乳头",
        "pussy": "志希的样本",
        "line": "「齁噢❤ 数据、记录不了——志希的样本、去了——！」"
      }
    }
  },
  "桑山千雪": {
    "style": "温柔大姐姐、先道歉，母性：自称妈妈，用词封顶“妈妈的骚奶”，不出现母猪类自贬",
    "lactation": false,
    "signature": [
      "妈妈的",
      "针脚",
      "千雪的里面"
    ],
    "stages": {
      "pure": {
        "breast": "胸口",
        "nipple": "前面……对不起",
        "pussy": "那里",
        "line": "「对不起……那里，请不要看。」"
      },
      "shaken": {
        "breast": "胸部……",
        "nipple": "前面……这里",
        "pussy": "那里……千雪的里面",
        "line": "「千雪的里面……啊，对不起，我在说什么……」"
      },
      "fallen": {
        "breast": "妈妈的奶子",
        "nipple": "妈妈发硬的乳头",
        "pussy": "妈妈湿透的小穴",
        "line": "「乖孩子……妈妈的小穴湿成这样了，快进来好不好？」"
      },
      "broken": {
        "breast": "妈妈的骚奶",
        "nipple": "妈妈的贱乳头",
        "pussy": "千雪的里面……妈妈的骚穴",
        "line": "「对不起、妈妈好下流……千雪的里面，请全部射给妈妈……」"
      },
      "climax": {
        "breast": "妈妈的骚奶",
        "nipple": "乳头",
        "pussy": "千雪的里面",
        "line": "「咿、噢噢❤ 乖孩子……妈妈、去了哦——」"
      }
    }
  },
  "鹭泽文香": {
    "style": "怯生文学少女、小声礼貌，用书面雅语/古典修辞，堕后“下流的”书面粗语",
    "lactation": false,
    "signature": [
      "文香的书页",
      "玉乳",
      "蜜壶"
    ],
    "stages": {
      "pure": {
        "breast": "胸……",
        "nipple": "……",
        "pussy": "那里……",
        "line": "「请、请不要……看那里……」"
      },
      "shaken": {
        "breast": "玉乳……不，胸部",
        "nipple": "蕾……",
        "pussy": "蜜壶……那、那里",
        "line": "「蜜壶……书上的词……我、我没有……」"
      },
      "fallen": {
        "breast": "文香下流的奶子",
        "nipple": "发硬的乳蕾",
        "pussy": "文香湿透的蜜壶",
        "line": "「请……再翻开文香的蜜壶一些，求您……读到最深处。」"
      },
      "broken": {
        "breast": "文香下流的玉乳",
        "nipple": "文香的贱乳蕾",
        "pussy": "文香的书页……肉便器的骚屄",
        "line": "「文香是……只为主人摊开的肉便器……请把骚屄写满主人的精液……」"
      },
      "climax": {
        "breast": "玉乳",
        "nipple": "乳蕾",
        "pussy": "文香的蜜壶",
        "line": "「咿、噢噢噢❤ 蜜壶、溢出来了……文香、去了……」"
      }
    }
  },
  "信浓": {
    "style": "梦呓般的狐神，“是梦吗”式恍惚语，泌乳词偏“供奉/神乳”",
    "lactation": true,
    "signature": [
      "供奉的乳",
      "神乳",
      "梦里的那处"
    ],
    "stages": {
      "pure": {
        "breast": "胸",
        "nipple": "前端",
        "pussy": "梦里的那处",
        "line": "「这是梦……别碰信浓的胸……」",
        "milk": "……"
      },
      "shaken": {
        "breast": "胸……供奉的",
        "nipple": "前端……梦里的",
        "pussy": "梦里的那处……下面",
        "line": "「神乳……信浓说梦话了，忘掉吧……」",
        "milk": "神乳……不，是梦话"
      },
      "fallen": {
        "breast": "信浓的供奉之奶",
        "nipple": "漏乳的乳头",
        "pussy": "信浓湿透的骚穴",
        "line": "「若非梦……就请喝下信浓的神乳，再插进信浓的骚穴……」",
        "milk": "信浓的神乳"
      },
      "broken": {
        "breast": "信浓发情的肥奶",
        "nipple": "信浓的贱乳头",
        "pussy": "梦里的那处……肉便器的骚屄",
        "line": "「信浓只是供奉给你的肉便器……梦里的那处，请全部灌满……」",
        "milk": "信浓的神乳"
      },
      "climax": {
        "breast": "供奉的乳",
        "nipple": "乳头",
        "pussy": "梦里的那处",
        "line": "「齁噢噢❤ 不是梦——信浓、喷着神乳去了——」",
        "milk": "神乳"
      }
    }
  },
  "樫野": {
    "style": "慢性子运输舰牛娘、温柔礼貌，泌乳词偏“补给/牛奶”，一被挤奶就解释个不停",
    "lactation": true,
    "signature": [
      "樫野的补给",
      "补给奶",
      "运输舰的奶"
    ],
    "stages": {
      "pure": {
        "breast": "胸",
        "nipple": "前面",
        "pussy": "下面",
        "line": "「樫野的胸、只是比较大而已……不是装补给的……」",
        "milk": "这个……"
      },
      "shaken": {
        "breast": "胸……补给",
        "nipple": "奶……前面",
        "pussy": "下面",
        "line": "「这不是补给奶……是、是樫野的……对不起！」",
        "milk": "补给奶……啊，不是牛奶！"
      },
      "fallen": {
        "breast": "樫野的大奶子",
        "nipple": "樫野喷奶的奶头",
        "pussy": "樫野湿透的骚屄",
        "line": "「主人，求您一边喝樫野的补给，一边插进樫野湿透的骚屄……」",
        "milk": "樫野的补给"
      },
      "broken": {
        "breast": "樫野下流的肥奶",
        "nipple": "运输舰的贱奶头",
        "pussy": "运输舰母猪的骚屄",
        "line": "「樫野是主人专用的奶牛母猪……运输舰的奶和骚屄，全部请主人用坏吧……」",
        "milk": "运输舰的奶"
      },
      "climax": {
        "breast": "樫野的补给奶子",
        "nipple": "奶头",
        "pussy": "樫野的骚屄",
        "line": "「齁噢噢噢❤ 补给奶、喷出来了——樫野、被主人干到去了——❤」",
        "milk": "补给奶"
      }
    }
  },
  "索米": {
    "style": "认真拘谨的战术人形，用战术/传感器报告词",
    "lactation": false,
    "signature": [
      "索米的传感部",
      "受体",
      "索米的接口"
    ],
    "stages": {
      "pure": {
        "breast": "胸部",
        "nipple": "……传感点",
        "pussy": "那里",
        "line": "「请、请不要靠这么近……那里是……」"
      },
      "shaken": {
        "breast": "胸部传感部",
        "nipple": "传感……乳、乳头",
        "pussy": "索米的接口……不，那里",
        "line": "「索米的接口……报告撤回！请忘记！」"
      },
      "fallen": {
        "breast": "索米的传感部……奶子",
        "nipple": "受体……发硬的乳头",
        "pussy": "索米湿透的接口",
        "line": "「报告：索米的接口浸水……请求立即插入，主人！」"
      },
      "broken": {
        "breast": "索米淫乱的肥奶",
        "nipple": "索米的贱乳头",
        "pussy": "索米的骚屄接口",
        "line": "「报告：索米已改装为肉便器……请向骚屄接口持续灌注！」"
      },
      "climax": {
        "breast": "传感部",
        "nipple": "受体",
        "pussy": "索米的接口",
        "line": "「警告、警告——齁噢噢❤ 索米、去了——报告不能——」"
      }
    }
  },
  "露埃拉": {
    "style": "高傲古龙、命令语气，用“龙鳞/逆鳞”式龙族词",
    "lactation": false,
    "signature": [
      "逆鳞",
      "龙乳",
      "本龙的龙穴"
    ],
    "stages": {
      "pure": {
        "breast": "胸",
        "nipple": "鳞下",
        "pussy": "龙穴深处",
        "line": "「人虫，碰本龙的鳞下就是找死。」"
      },
      "shaken": {
        "breast": "胸……龙乳",
        "nipple": "鳞下的……",
        "pussy": "龙穴……那里，闭嘴",
        "line": "「龙穴？……本龙没说过，你听错了！」"
      },
      "fallen": {
        "breast": "本龙的龙乳",
        "nipple": "逆鳞……硬起的奶头",
        "pussy": "本龙湿透的龙穴",
        "line": "「哼……本龙的龙穴湿了又如何！还不快插进来！」"
      },
      "broken": {
        "breast": "发情的肥龙乳",
        "nipple": "龙的贱奶头",
        "pussy": "本龙的龙穴……母龙的骚屄",
        "line": "「本、本龙是……发情的母猪龙……命令你，把龙穴灌满！」"
      },
      "climax": {
        "breast": "龙乳",
        "nipple": "逆鳞",
        "pussy": "本龙的龙穴",
        "line": "「齁噢噢噢❤ 逆鳞、龙穴、一起——本龙、去了啊啊——！」"
      }
    }
  },
  "伊柯利普斯": {
    "style": "魅魔大魔女，从一开始就挑逗，用露骨俗称+甜腻“淫”字，堕后自称肉便器",
    "lactation": false,
    "signature": [
      "淫乳",
      "淫穴",
      "魔女的蜜"
    ],
    "stages": {
      "pure": {
        "breast": "姐姐的淫乳",
        "nipple": "小奶头哟",
        "pussy": "姐姐的小穴",
        "line": "「乖孩子，想摸姐姐的淫乳吗？」"
      },
      "shaken": {
        "breast": "姐姐的淫乳……呼",
        "nipple": "奶尖",
        "pussy": "姐姐的淫穴",
        "line": "「哼，姐姐的淫穴……可不是你能主导的哦……」"
      },
      "fallen": {
        "breast": "姐姐被玩坏的淫乳",
        "nipple": "发肿的奶尖",
        "pussy": "姐姐流蜜的淫穴",
        "line": "「呼……姐姐的淫穴在流魔女的蜜，乖孩子，求你快点～」"
      },
      "broken": {
        "breast": "姐姐的肥淫乳",
        "nipple": "姐姐的贱奶尖",
        "pussy": "姐姐的骚淫穴",
        "line": "「魔女什么的……姐姐只是你的肉便器母猪，骚淫穴随便灌哟❤」"
      },
      "climax": {
        "breast": "淫乳",
        "nipple": "奶尖",
        "pussy": "淫穴",
        "line": "「齁噢噢❤ 魔女的蜜、喷、喷出来了——❤」"
      }
    }
  },
  "柴郡": {
    "style": "黏人猫系撒娇，句尾“～嘛/啦”，猫系拟声与“肉球”式可爱词",
    "lactation": false,
    "signature": [
      "猫咪奶",
      "柴郡的小猫穴",
      "肉球"
    ],
    "stages": {
      "pure": {
        "breast": "胸胸～",
        "nipple": "这里～",
        "pussy": "秘密～",
        "line": "「嗯哼？想看柴郡的秘密～？先让肉球按一按亲爱的～」"
      },
      "shaken": {
        "breast": "猫……胸胸啦！",
        "nipple": "尖尖……喵、才没有！",
        "pussy": "柴郡的小猫穴……才不是猫！",
        "line": "「小猫穴什么的……柴郡才不是猫啦！」"
      },
      "fallen": {
        "breast": "柴郡的猫咪奶",
        "nipple": "柴郡发硬的奶头",
        "pussy": "柴郡湿透的小猫穴",
        "line": "「亲爱的～柴郡的小猫穴湿透了嘛，快点进来啦～」"
      },
      "broken": {
        "breast": "柴郡发情的肥猫咪奶",
        "nipple": "柴郡的贱奶头",
        "pussy": "柴郡发情的小猫穴",
        "line": "「喵❤ 柴郡是亲爱的发情母猪啦～小猫穴要灌得满满的嘛——」"
      },
      "climax": {
        "breast": "猫咪奶",
        "nipple": "奶头",
        "pussy": "小猫穴",
        "line": "「喵、齁噢噢❤ 柴郡、去了啦——肉球都抓不住了——」"
      }
    }
  },
  "能代": {
    "style": "端庄理性、爱列计划提建议的敬语，用“计划外/身体部位”式条理词",
    "lactation": false,
    "signature": [
      "计划外的地方",
      "能代的胸前",
      "能代的私处"
    ],
    "stages": {
      "pure": {
        "breast": "胸前",
        "nipple": "……",
        "pussy": "私处",
        "line": "「请对刚才碰胸前的行为做出检讨。」"
      },
      "shaken": {
        "breast": "胸前……第一条，不许碰",
        "nipple": "那、那里……第二条",
        "pussy": "能代的私处……计划外的地方",
        "line": "「计划外的地方……啊，对不起，我刚刚在想事情……」"
      },
      "fallen": {
        "breast": "能代的胸前……奶子",
        "nipple": "能代发情的乳头",
        "pussy": "能代湿透的私处",
        "line": "「计划外的地方湿透了……能代请求、立刻插进来。」"
      },
      "broken": {
        "breast": "能代下流的肥奶",
        "nipple": "能代的贱乳头",
        "pussy": "能代的私处……肉便器骚屄",
        "line": "「能代的新计划：成为您的肉便器……请把私处的骚屄灌满。」"
      },
      "climax": {
        "breast": "能代的胸前",
        "nipple": "乳头",
        "pussy": "计划外的地方",
        "line": "「齁噢噢❤ 计划外的地方……能代、去了……」"
      }
    }
  },
  "新泽西": {
    "style": "自信白鹰战列舰，夹英语与♪，用“Big/弹药”式夸张词",
    "lactation": false,
    "signature": [
      "Big J的奶",
      "主炮",
      "Honey专用"
    ],
    "stages": {
      "pure": {
        "breast": "胸～",
        "nipple": "这里♪",
        "pussy": "下面～",
        "line": "「盯着Big J的胸看？你就喜欢这样的吧～？」"
      },
      "shaken": {
        "breast": "Big J的……奶、胸！",
        "nipple": "主炮……不对，尖尖",
        "pussy": "下面……Honey专用",
        "line": "「Honey专用……嘻嘻，刚刚那个不算♪」"
      },
      "fallen": {
        "breast": "Big J的奶",
        "nipple": "被捻硬的奶头",
        "pussy": "Honey专用的湿穴",
        "line": "「Honey～Big J的奶随便你揉，快点干Honey专用的小穴嘛♪」"
      },
      "broken": {
        "breast": "Big J的肥骚奶",
        "nipple": "新泽西的贱奶头",
        "pussy": "Honey专用的母猪骚屄",
        "line": "「Big J是Honey的肉便器母猪♪ 骚屄要灌到满出来——❤」"
      },
      "climax": {
        "breast": "Big J的奶",
        "nipple": "主炮",
        "pussy": "Honey专用",
        "line": "「Oh——齁噢噢❤ 主炮、被捏着……Big J、去了啊——！」"
      }
    }
  },
  "阿妮拉": {
    "style": "古风神将、“乃是/罢了/喀呵呵”，泌乳词偏“羊乳/神将之乳”，介意被当羊",
    "lactation": true,
    "signature": [
      "神将之乳",
      "羊乳",
      "南南西的"
    ],
    "stages": {
      "pure": {
        "breast": "胸",
        "nipple": "顶上",
        "pussy": "那里",
        "line": "「莫要放肆，此乃神将之身罢了。」",
        "milk": "……"
      },
      "shaken": {
        "breast": "胸……神将之乳",
        "nipple": "顶、顶上",
        "pussy": "那、那里",
        "line": "「羊乳？喀……莫要拿羊开玩笑！」",
        "milk": "羊乳……不！谁说是羊了！"
      },
      "fallen": {
        "breast": "神将之乳",
        "nipple": "阿妮拉漏乳的乳头",
        "pussy": "阿妮拉湿透的小穴",
        "line": "「喀……汝便吸着神将之乳，插进阿妮拉的小穴罢……求汝了。」",
        "milk": "神将之乳"
      },
      "broken": {
        "breast": "阿妮拉发情的肥奶",
        "nipple": "阿妮拉的贱乳头",
        "pussy": "南南西的……母羊骚屄",
        "line": "「阿妮拉就是汝的母羊肉便器罢了……羊乳和骚屄、全都灌满……」",
        "milk": "羊乳"
      },
      "climax": {
        "breast": "神将之乳",
        "nipple": "乳头",
        "pussy": "骚屄",
        "line": "「喀呵、齁噢噢❤ 羊乳喷了……神将、端不住了——」",
        "milk": "羊乳"
      }
    }
  },
  "尤艾尔": {
    "style": "关西腔活泼舞姬，“嘛/啦/的说”，用舞蹈/铃铛/鱼的俏皮词",
    "lactation": false,
    "signature": [
      "咱的铃铛",
      "跳舞的奶",
      "咱的狐狸窝"
    ],
    "stages": {
      "pure": {
        "breast": "胸",
        "nipple": "铃……这里",
        "pussy": "那边",
        "line": "「咱的胸？看宝贝看这边嘛！」"
      },
      "shaken": {
        "breast": "跳舞的奶……胸啦！",
        "nipple": "铃铛……啊不是",
        "pussy": "咱的狐狸窝……那边的说",
        "line": "「狐狸窝？咱、咱可没说的说！」"
      },
      "fallen": {
        "breast": "咱跳舞的奶",
        "nipple": "咱发硬的铃铛",
        "pussy": "咱湿透的狐狸窝",
        "line": "「咱的狐狸窝湿透了嘛……快点进来的说～」"
      },
      "broken": {
        "breast": "咱发情的肥奶",
        "nipple": "咱的贱铃铛",
        "pussy": "咱的骚狐狸窝",
        "line": "「咱是你的发情母猪狐狸了啦～骚狐狸窝要灌满的说❤」"
      },
      "climax": {
        "breast": "跳舞的奶",
        "nipple": "铃铛",
        "pussy": "狐狸窝",
        "line": "「こ～ん……齁噢噢❤ 咱、去了啦——！」"
      }
    }
  }
}
