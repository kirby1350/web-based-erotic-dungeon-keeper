// Settings constants: chat prose styles, image styles / tag presets, and the
// shared image prompt helpers (ported from lib/types.ts + lib/prompts.ts).
window.Dungeon = window.Dungeon || {};
(function (D) {
  'use strict';

  var PROSE_STYLE_LABELS = {
    standard: { label: '标准', hint: '均衡叙事，仅常驻去油约束' },
    dense: { label: '重油堆叠', hint: '写到乳、奶头、阴蒂、阴道、尿道或肛门时必须使用词库原词。转场套话仍然禁止' },
  };

  // Optional prose-style injection appended to the DM system prompt.
  var PROSE_STYLE_PROMPTS = {
    standard: '',
    dense: '【文风：重油堆叠】\n' +
      '本段覆盖文风禁令里「禁止套用现成比喻」和「不得重复同一个喻体」。转场套话和言情滥腔仍然禁止。禁止照抄范文里的人名、年数、符箓、女仙和地名。\n' +
      '1. 本回合正文里被触碰、被看或被说出的词库部位，必须使用该词库的质地原词，至少四个，连在部位名词前面。可以调整顺序，不要换成更干净的同义词。没被写到的部位一句带过。\n' +
      '2. 可以用性用途或性史作定语。乳房和奶头上，「胀、漏、敏感、一挤就出」可以再出现；阴蒂上，「肥、大、硬、一捏就出」可以再出现；阴道和肛门上，「肥、嫩、紧、一拨就湿」可以再出现；尿道上，「肥、嫩、紧、一插就进」可以再出现。同一句不要把同一个说法写两遍。\n' +
      '3. 每个主画面至少调动质感、温度、气味、声音中的三样，并绑定到具体部位，不要空泛写「雌臭弥漫」。\n' +
      '4. 喻体必须本回合新写，禁止复用上一回合已用过的喻体。乳房和奶头允许使用蜜瓜、山峦、圆饼、椰枣、筛子、决堤。阴道允许使用馒头、蜜桃。「馒头」只许写阴道，不许拿去写别的部位。阴蒂允许使用红果子。「红果子」只许写阴蒂。肛门允许使用肉菊。「肉菊」只许写肛门。禁止把「吊钟、奶山、肉山、磨盘、螺纹、章鱼嘴」当作固定公式。\n' +
      '5. 乳房、奶头、阴蒂、阴道、尿道和肛门每段可以用两到三个能拆开读懂的复合词。其他部位每段最多一个自造四字词。\n' +
      '6. 细节要闭环：颜色、道具、服装前后呼应。挤出或渗出的液体要落到衣襟、肚兜、衣裤或皮肤上，留下痕迹。\n' +
      '句法：对白先点出分量或敏感，下一句立刻用动作验证。尺寸落到眼前的身体上，例如有脑袋大、能埋住脸、半截指节。收束时可以邀请对方亲手掂一掂或验一验。\n' +
      '【乳与奶头词库】\n' +
      '乳肉：脂附油肥、厚脂满溢、雌腻爆硕、糯软肥奶、沉甸甸、圆肥挺翘、鼓胀饱满、痴肥溢汁、乳香肉奶、厚腻骚焖、肉厚焖肥、爆乳、糜腴肉浪、颤巍巍、弹嫩雪滑、厚重肥乳、下流肥奶、宽厚浑圆、尺寸豪硕、深乳沟、油亮雌汗。\n' +
      '奶头：肥肿酡红、厚肉奶头、肥长奶头、直挺挺、外头软里头硬、圆饼乳晕。\n' +
      '动作：托起、五指陷入、轻挤、捏住、掀开遮挡、舌尖绕着乳晕、含住吸吮、咬住奶孔往外扯、隔着衣料蹭、依偎时奶肉从缝里溢出来。\n' +
      '只有角色正在泌乳、带有泌乳状态，或本回合剧情已经写出奶水时，才使用：奶孔合不拢、奶孔翕张、奶珠、乳白浓浆、奶痕、漏奶的筛子、嗤地喷出、咕嘟咕嘟、又腥又甜、决堤、衣襟洇湿。没有奶水依据时，只写肥、沉、软、油和晃，不要写喷奶。\n' +
      '【阴道词库】\n' +
      '屄肉：肥厚无毛、馒头肉屄、粉嫩屄肉、油亮水光、肥嫩多汁、厚实宣软、雌臭排卵、滑嫩肥屄、肥厚饱满、肥厚软糯、外头软里头紧得发烫。\n' +
      '唇缝：肥厚阴唇、阴唇翕张、粉嫩屄缝、屄口翕张。\n' +
      '动作：掀开遮挡、指尖拨开阴唇、舌头舔开屄缝、含住用力吸、隔着衣料在大腿上蹭。\n' +
      '渗出、淫痕、把阴唇浸得油亮，可以在这个部位被拨开、舔到或说出来时使用。喷出老远、决堤、咕嘟咕嘟往外喷，只在本回合写高潮时使用。没有高潮时不要写喷水。\n' +
      '【阴蒂词库】\n' +
      '肉粒：硕大红润、肥硕饱满、油亮、挺在屄肉顶端、直挺挺地翘着、半截指节长短、外头软里头胀得发硬。\n' +
      '肉孔：阴蒂尖端一粒肉孔、肉孔翕张。\n' +
      '动作：指尖捏住、缓缓一挤、舌头卷住、含住用力吸、牙齿咬住肉孔往外扯。\n' +
      '渗出、淫痕、把阴唇浸得油亮，可以在阴蒂被捏住、舔到或说出来时使用。嗤地喷出、喷出老远、决堤、咕嘟咕嘟往外喷，只在本回合写高潮时使用。没有高潮时不要写阴蒂喷水。\n' +
      '【肛门词库】\n' +
      '穴口：粉嫩鲜红、多褶屁穴、紧致肥焖屁眼、粉嫩肉褶、屁眼翕张、肥厚饱满、油亮水光、外头软里头紧得发烫。\n' +
      '臀：肥厚软糯的臀肉、臀缝、直挺挺地翘着。\n' +
      '动作：双手掰开臀肉、指尖拨开肉褶、舌头舔开肉褶、含住用力吸、隔着衣料在大腿上蹭。有尾巴的角色可以先把尾巴翘起来再掰。没有尾巴就不要写尾巴。\n' +
      '渗出、肠液、淫痕、把臀缝浸得油亮，可以在这个部位被掰开、舔到或说出来时使用。喷出老远、决堤、咕嘟咕嘟往外喷，只在本回合写高潮时使用。没有高潮时不要写喷肠液。\n' +
      '【尿道词库】\n' +
      '质地：又肥又嫩、最是紧致、外头软里头紧得发烫。\n' +
      '动作：舌头舔开、指尖插进去、磨蹭、轻轻一插。\n' +
      '不要把屁眼、肉褶、肠液、肉菊写到尿道上。\n' +
      '渗出可以在尿道被舔到、被插入或说出来时使用。喷出老远、决堤、咕嘟咕嘟往外喷，只在本回合写高潮时使用。没有高潮时不要写尿道喷水。\n' +
      '同一段里同一个喻体最多两次。用词库里的原词来写，不要把词库的标题和顿号列表原样抄进正文。',
  };

  var IMAGE_STYLES = {
    none: { label: '无', tags: '' },
    'dk.senie': { label: 'dk.senie', tags: 'dk.senie, watercolor, soft lineart, pastel colors, dreamy lighting' },
    hakai_shin: { label: 'Hakai Shin', tags: 'hakai_shin, detailed shading, dynamic pose, vibrant colors, anime illustration' },
    shiokonbu: { label: 'shiokonbu', tags: 'shiokonbu, detailed lineart, soft shading, moe style, clean illustration' },
    piromizu: { label: 'piromizu', tags: 'piromizu, glossy skin, detailed body, soft gradient, erotic illustration' },
    nohito: { label: 'nohito', tags: 'nohito, expressive face, fine details, dramatic lighting, anime art style' },
    masami_chie: { label: 'masami chie', tags: 'masami chie, soft lineart, delicate shading, warm palette, detailed illustration' },
    thirty_8ght: { label: 'thirty_8ght', tags: 'thirty_8ght, glossy skin, detailed shading, thick thighs, erotic illustration' },
  };

  var IMAGE_TAG_PRESETS = {
    none: { label: '无', tags: '' },
    curvy: {
      label: '丰乳肥臀',
      tags: 'curvy, huge breasts, huge nipples, huge areolae, large clitoris, clitoris, fat mons, lactation, female ejaculation',
    },
  };

  var IMAGE_PROMPT_PROFILES = {
    illustrious: {
      qualityPrefix: '',
      negative: 'lowres, bad anatomy, bad hands, extra fingers, missing fingers, extra limbs, fused bodies, text, watermark, signature, child, loli, shota',
    },
    sdxl: {
      qualityPrefix: 'highly detailed, sharp focus',
      negative: 'lowres, bad anatomy, bad hands, extra digits, missing fingers, cropped, watermark, blurry, child, loli, shota',
    },
    flux: {
      qualityPrefix: '',
      negative: 'child, loli, shota',
    },
  };
  var IMAGE_NEGATIVE_PROMPT = IMAGE_PROMPT_PROFILES.illustrious.negative;
  var DEFAULT_SCENE_PROMPT = 'dungeon entrance, stone corridor, torchlight, dark fantasy, adult';
  var DRAW_MODEL = 'anime';
  var DRAW_DIMENSION = 'portrait';

  // ---- Self-host image providers (used by the /api/image/* fallback in draw.js) ----
  // Mirrors lib/types.ts IMAGE_MODELS / TENSORART_MODELS.
  var IMAGE_MODELS = {
    tsubaki_v2: { label: 'Tsubaki v2', modelId: '1983308862240288769', family: 'illustrious' },
  };
  var TENSORART_MODELS = {
    wai_nsfw_v16: { label: 'WAI-NSFW-V16', modelId: '943946051788787917', family: 'illustrious' },
    jankuv6: { label: 'JANKUV6', modelId: '934122074308367585', family: 'illustrious' },
  };
  var IMAGE_PROVIDERS = {
    pixai: { label: 'PixAI' },
    tensorart: { label: 'TensorArt' },
  };
  var IMAGE_WIDTH = 768;
  var IMAGE_HEIGHT = 1280;
  var IMAGE_BATCH = 4;

  // ---- Chat providers (used by the /api/chat fallback in ai.js) ----
  // The /api/chat route picks the provider server-side from CHAT_MODELS, but we
  // mirror the grok id list so the client can pass the right key when the user
  // supplies one. Anything not listed here is treated as the DZMM default.
  var GROK_MODEL_IDS = ['grok-4-latest', 'grok-3', 'grok-3-mini'];
  function isGrokModel(id) {
    if (!id) return false;
    return GROK_MODEL_IDS.indexOf(id) !== -1 || /^grok/i.test(id);
  }

  var QUALITY_TAG = /^(?:masterpiece|best quality)$/i;

  function splitPromptTags(value) {
    return String(value || '').split(',').map(function (tag) { return tag.trim(); })
      .filter(function (tag) { return tag && !QUALITY_TAG.test(tag); });
  }

  function latinNameTag(name) {
    return String(name || '').trim().toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_()]/g, '');
  }

  function buildAppearanceAnchor(character) {
    var c = character || {};
    var nameTag = latinNameTag(c.name);
    var tags = splitPromptTags(c.danbooruTags).filter(function (tag) {
      var key = tag.toLowerCase();
      return key !== 'adult' && (!nameTag || key !== nameTag);
    });
    tags.push('adult');
    if (nameTag) tags.push(nameTag);
    return tags.join(', ');
  }

  function resolveImagePromptFamily(model) {
    if (model && model.family) return model.family;
    var hay = ((model && model.label) || '') + ' ' + ((model && model.modelId) || '');
    hay = hay.toLowerCase();
    if (/\bflux\b/.test(hay)) return 'flux';
    if (/sdxl|sd\s*1\.?5|\bsd15\b/.test(hay)) return 'sdxl';
    return 'illustrious';
  }

  function dedupeTags(tags) {
    var seen = {};
    var unique = [];
    tags.forEach(function (tag) {
      var key = tag.toLowerCase();
      if (seen[key]) return;
      seen[key] = true;
      unique.push(tag);
    });
    return unique;
  }

  // Scene tags only. Empty input becomes the adult default. Does not add masterpiece.
  function withQualityPrefix(tags) {
    var cleaned = splitPromptTags(tags);
    return cleaned.length ? cleaned.join(', ') : DEFAULT_SCENE_PROMPT;
  }

  // Mirrors lib/prompts.ts buildImagePrompt. Order: appearance anchor, then scene tags.
  function buildImagePrompt(options) {
    var opts = options || {};
    var family = opts.family || 'illustrious';
    var profile = IMAGE_PROMPT_PROFILES[family] || IMAGE_PROMPT_PROFILES.illustrious;
    var anchor = buildAppearanceAnchor(opts.character);
    var scene = withQualityPrefix(opts.scene || '');
    var extras = [];
    (opts.extraTags || []).forEach(function (part) { extras = extras.concat(splitPromptTags(part)); });
    if (family === 'flux') {
      var sceneClause = [scene].concat(extras).filter(Boolean).join(', ');
      return { prompt: anchor + '. ' + sceneClause + '.', negative: profile.negative };
    }
    var tags = dedupeTags(splitPromptTags(profile.qualityPrefix).concat(splitPromptTags(anchor), splitPromptTags(scene), extras));
    return { prompt: tags.join(', '), negative: profile.negative };
  }

  D.config = {
    PROSE_STYLE_LABELS: PROSE_STYLE_LABELS,
    PROSE_STYLE_PROMPTS: PROSE_STYLE_PROMPTS,
    IMAGE_STYLES: IMAGE_STYLES,
    IMAGE_TAG_PRESETS: IMAGE_TAG_PRESETS,
    IMAGE_MODELS: IMAGE_MODELS,
    TENSORART_MODELS: TENSORART_MODELS,
    IMAGE_PROVIDERS: IMAGE_PROVIDERS,
    IMAGE_WIDTH: IMAGE_WIDTH,
    IMAGE_HEIGHT: IMAGE_HEIGHT,
    IMAGE_BATCH: IMAGE_BATCH,
    IMAGE_PROMPT_PROFILES: IMAGE_PROMPT_PROFILES,
    IMAGE_NEGATIVE_PROMPT: IMAGE_NEGATIVE_PROMPT,
    DEFAULT_SCENE_PROMPT: DEFAULT_SCENE_PROMPT,
    DRAW_MODEL: DRAW_MODEL,
    DRAW_DIMENSION: DRAW_DIMENSION,
    GROK_MODEL_IDS: GROK_MODEL_IDS,
    isGrokModel: isGrokModel,
    withQualityPrefix: withQualityPrefix,
    buildAppearanceAnchor: buildAppearanceAnchor,
    resolveImagePromptFamily: resolveImagePromptFamily,
    buildImagePrompt: buildImagePrompt,
  };
})(window.Dungeon);
