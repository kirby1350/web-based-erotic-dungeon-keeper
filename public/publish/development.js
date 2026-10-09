// Body-development settlement. Mirrors lib/body-development.ts.
// Level and exp are not taken from the model: the prose of this turn decides the gain.
window.Dungeon = window.Dungeon || {};
(function (D) {
  'use strict';

  var PARTS = ['breast', 'clitoris', 'urethra', 'vagina', 'anus'];
  var MILD = 10;
  var INTENSE = 40;
  var WINDOW = 40;
  var PART_PATTERNS = {
    breast: /乳头|乳晕|乳房|乳沟|乳肉|乳尖|奶子|奶头|双乳|巨乳|酥胸|奶肉/,
    clitoris: /阴蒂|阴核|豆豆/,
    urethra: /尿道|尿孔|尿口/,
    vagina: /阴道|子宫|宫口|花心|花穴|蜜穴|骚穴|嫩穴|淫穴|小穴|穴口|穴内|肉穴|肉壁|腔道|甬道/,
    anus: /肛门|肛口|后庭|菊穴|后穴|菊蕾|屁眼|肠壁|肠内/,
  };
  var CONTACT = /插入|抽插|抽送|挺入|顶入|顶弄|没入|贯穿|操|肏|舔弄|舔过|舔舐|吮吸|吸吮|含住|揉捏|揉弄|抠挖|抠弄|磨蹭|蹭弄|爱抚|抚摸|玩弄|蹂躏|射进|射入|灌入|撑开|搅弄|吞入|吞没|夹紧|缠住|缠上|吸住|咬住|按住|压住|捣入|抽动|撞击/;
  var CLIMAX = /高潮|绝顶|喷潮|潮吹|潮喷/;

  function near(text, index, length, pattern) {
    return pattern.test(text.slice(Math.max(0, index - WINDOW), Math.min(text.length, index + length + WINDOW)));
  }

  function developmentAwards(narrative, pleasureBefore, pleasureAfter) {
    var text = narrative || '';
    var rose = pleasureAfter - pleasureBefore;
    var intense = CLIMAX.test(text) || rose >= 20 || (pleasureAfter >= 80 && rose > 0);
    var gain = intense ? INTENSE : MILD;
    var awards = {};
    PARTS.forEach(function (part) {
      var matcher = new RegExp(PART_PATTERNS[part].source, 'g');
      var involved = false;
      var match;
      while ((match = matcher.exec(text))) {
        if (near(text, match.index, match[0].length, CONTACT) || near(text, match.index, match[0].length, CLIMAX) || rose > 0) involved = true;
        if (!match[0].length) matcher.lastIndex += 1;
      }
      if (involved) awards[part] = gain;
    });
    return awards;
  }

  function settleBodyDevelopment(current, narrative, pleasureBefore, pleasureAfter) {
    var source = current || {};
    var awards = developmentAwards(narrative, pleasureBefore, pleasureAfter);
    var exp = Object.assign({}, source.exp || {});
    var next = Object.assign({}, source, { exp: exp });
    PARTS.forEach(function (part) {
      var level = source[part] || 0;
      var partExp = (source.exp && source.exp[part]) || 0;
      var gain = awards[part] || 0;
      if (gain > 0 && level < 5) {
        partExp += gain;
        while (partExp >= 100 && level < 5) {
          partExp -= 100;
          level += 1;
        }
        if (level >= 5) partExp = 0;
      }
      next[part] = level;
      exp[part] = partExp;
    });
    return next;
  }

  D.development = { settleBodyDevelopment: settleBodyDevelopment, developmentAwards: developmentAwards };
})(window.Dungeon);
