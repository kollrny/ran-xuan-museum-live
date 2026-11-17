
function mergeWishBackup(entries, current) {
  if (!Array.isArray(entries) || entries.length > 100) throw new Error('请选择愿望册导出的备份文件。');
  const result = {...current};
  let recognized = 0;
  for (const entry of entries) {
    if (!entry || typeof entry.title !== 'string' || !['planned', 'done', '未选择', ''].includes(entry.status)) throw new Error('备份格式不完整，请检查文件。');
    const index = wishIdeas.findIndex(idea => idea.title === entry.title && idea.category === entry.category);
    if (index < 0) throw new Error('这份备份与当前愿望册不匹配。');
    recognized += 1;
    if (entry.status === 'done') result[index] = 'done';
    if (entry.status === 'planned' && result[index] !== 'done') result[index] = 'planned';
  }
  if (!recognized) throw new Error('备份里没有愿望记录。');
  return result;
}
const wishIdeas = [
  {
    "category": "日常里的偏心",
    "title": "一起买菜做晚饭"
  },
  {
    "category": "日常里的偏心",
    "title": "给对方准备早餐"
  },
  {
    "category": "日常里的偏心",
    "title": "雨天共撑一把伞"
  },
  {
    "category": "日常里的偏心",
    "title": "饭后牵手散步"
  },
  {
    "category": "日常里的偏心",
    "title": "一起整理房间"
  },
  {
    "category": "日常里的偏心",
    "title": "交换一天的歌单"
  },
  {
    "category": "日常里的偏心",
    "title": "为对方挑一杯饮料"
  },
  {
    "category": "日常里的偏心",
    "title": "一起逛花店"
  },
  {
    "category": "日常里的偏心",
    "title": "给彼此写一张便签"
  },
  {
    "category": "日常里的偏心",
    "title": "睡前分享今天的小确幸"
  },
  {
    "category": "日常里的偏心",
    "title": "一起晒被子"
  },
  {
    "category": "日常里的偏心",
    "title": "互相学一道拿手菜"
  },
  {
    "category": "日常里的偏心",
    "title": "周末慢慢吃早午餐"
  },
  {
    "category": "日常里的偏心",
    "title": "一起选一对杯子"
  },
  {
    "category": "日常里的偏心",
    "title": "陪对方完成一件拖延的小事"
  },
  {
    "category": "日常里的偏心",
    "title": "一起做水果酸奶"
  },
  {
    "category": "日常里的偏心",
    "title": "给彼此拍一张生活照"
  },
  {
    "category": "日常里的偏心",
    "title": "一起收拾旅行行李"
  },
  {
    "category": "日常里的偏心",
    "title": "留一个不看手机的晚上"
  },
  {
    "category": "日常里的偏心",
    "title": "一起认真过一个普通星期二"
  },
  {
    "category": "出门约会",
    "title": "去公园野餐"
  },
  {
    "category": "出门约会",
    "title": "一起看日落"
  },
  {
    "category": "出门约会",
    "title": "去书店各选一本书"
  },
  {
    "category": "出门约会",
    "title": "看一场电影"
  },
  {
    "category": "出门约会",
    "title": "一起逛博物馆"
  },
  {
    "category": "出门约会",
    "title": "去美术馆看画"
  },
  {
    "category": "出门约会",
    "title": "在河边走一段路"
  },
  {
    "category": "出门约会",
    "title": "坐公交到没去过的街区"
  },
  {
    "category": "出门约会",
    "title": "一起逛夜市"
  },
  {
    "category": "出门约会",
    "title": "找一家安静的咖啡店"
  },
  {
    "category": "出门约会",
    "title": "去植物园看花"
  },
  {
    "category": "出门约会",
    "title": "一起骑行一小段路"
  },
  {
    "category": "出门约会",
    "title": "去旧书店寻宝"
  },
  {
    "category": "出门约会",
    "title": "看一场现场音乐演出"
  },
  {
    "category": "出门约会",
    "title": "一起做陶艺"
  },
  {
    "category": "出门约会",
    "title": "逛一次周末市集"
  },
  {
    "category": "出门约会",
    "title": "拍一组大头贴"
  },
  {
    "category": "出门约会",
    "title": "一起去看海"
  },
  {
    "category": "出门约会",
    "title": "在陌生城市寄明信片"
  },
  {
    "category": "出门约会",
    "title": "规划一次两天一夜的小旅行"
  },
  {
    "category": "宅家的快乐",
    "title": "一起拼完一幅拼图"
  },
  {
    "category": "宅家的快乐",
    "title": "合作通关一款游戏"
  },
  {
    "category": "宅家的快乐",
    "title": "交换最喜欢的一部电影"
  },
  {
    "category": "宅家的快乐",
    "title": "一起烤小饼干"
  },
  {
    "category": "宅家的快乐",
    "title": "做一顿家常火锅"
  },
  {
    "category": "宅家的快乐",
    "title": "各自画一张对方的肖像"
  },
  {
    "category": "宅家的快乐",
    "title": "一起搭积木"
  },
  {
    "category": "宅家的快乐",
    "title": "在家办一次双人电影夜"
  },
  {
    "category": "宅家的快乐",
    "title": "做一本手工相册"
  },
  {
    "category": "宅家的快乐",
    "title": "互相教一个小技能"
  },
  {
    "category": "宅家的快乐",
    "title": "一起试一道新甜点"
  },
  {
    "category": "宅家的快乐",
    "title": "玩一次桌游"
  },
  {
    "category": "宅家的快乐",
    "title": "一起做纸花"
  },
  {
    "category": "宅家的快乐",
    "title": "整理共同喜欢的歌单"
  },
  {
    "category": "宅家的快乐",
    "title": "给房间换一束花"
  },
  {
    "category": "宅家的快乐",
    "title": "一起制作冰饮"
  },
  {
    "category": "宅家的快乐",
    "title": "翻看彼此愿意分享的旧照片"
  },
  {
    "category": "宅家的快乐",
    "title": "一起学一段简单舞蹈"
  },
  {
    "category": "宅家的快乐",
    "title": "录一段合唱"
  },
  {
    "category": "宅家的快乐",
    "title": "做一个只属于我们的小游戏"
  },
  {
    "category": "四季慢慢过",
    "title": "春天一起看花"
  },
  {
    "category": "四季慢慢过",
    "title": "找一棵喜欢的树合影"
  },
  {
    "category": "四季慢慢过",
    "title": "一起放风筝"
  },
  {
    "category": "四季慢慢过",
    "title": "夏天分享一根冰淇淋"
  },
  {
    "category": "四季慢慢过",
    "title": "傍晚去吹一会儿风"
  },
  {
    "category": "四季慢慢过",
    "title": "一起吃一次西瓜"
  },
  {
    "category": "四季慢慢过",
    "title": "听一场夏夜的雨"
  },
  {
    "category": "四季慢慢过",
    "title": "秋天捡几片落叶"
  },
  {
    "category": "四季慢慢过",
    "title": "穿舒服的衣服走一条林荫路"
  },
  {
    "category": "四季慢慢过",
    "title": "一起吃热烤红薯"
  },
  {
    "category": "四季慢慢过",
    "title": "拍下同一地点的四季"
  },
  {
    "category": "四季慢慢过",
    "title": "冬天喝一杯热可可"
  },
  {
    "category": "四季慢慢过",
    "title": "一起看雪"
  },
  {
    "category": "四季慢慢过",
    "title": "堆一个小雪人"
  },
  {
    "category": "四季慢慢过",
    "title": "给对方挑一条围巾"
  },
  {
    "category": "四季慢慢过",
    "title": "一起包饺子"
  },
  {
    "category": "四季慢慢过",
    "title": "为新年写一张愿望卡"
  },
  {
    "category": "四季慢慢过",
    "title": "一起布置节日的小角落"
  },
  {
    "category": "四季慢慢过",
    "title": "在生日当天留一张合照"
  },
  {
    "category": "四季慢慢过",
    "title": "为下一次纪念日准备惊喜"
  },
  {
    "category": "把以后留下",
    "title": "互写一封一年后打开的信"
  },
  {
    "category": "把以后留下",
    "title": "给共同相册起个名字"
  },
  {
    "category": "把以后留下",
    "title": "录一段给未来的问候"
  },
  {
    "category": "把以后留下",
    "title": "一起做一张旅行地图"
  },
  {
    "category": "把以后留下",
    "title": "各写十件喜欢对方的小事"
  },
  {
    "category": "把以后留下",
    "title": "拍一次同姿势的纪念照"
  },
  {
    "category": "把以后留下",
    "title": "为一次约会留下票根"
  },
  {
    "category": "把以后留下",
    "title": "一起选一本空白手账"
  },
  {
    "category": "把以后留下",
    "title": "记录一道共同喜欢的菜"
  },
  {
    "category": "把以后留下",
    "title": "给未来的家画一张草图"
  },
  {
    "category": "把以后留下",
    "title": "各分享一个童年故事"
  },
  {
    "category": "把以后留下",
    "title": "一起学几句新的语言"
  },
  {
    "category": "把以后留下",
    "title": "定一个可以完成的小目标"
  },
  {
    "category": "把以后留下",
    "title": "互相陪伴完成一次运动计划"
  },
  {
    "category": "把以后留下",
    "title": "一起种一盆植物"
  },
  {
    "category": "把以后留下",
    "title": "为愿望册补一张完成照片"
  },
  {
    "category": "把以后留下",
    "title": "整理一次值得重看的聊天"
  },
  {
    "category": "把以后留下",
    "title": "每月选一张最喜欢的合照"
  },
  {
    "category": "把以后留下",
    "title": "为彼此设计一次约会"
  },
  {
    "category": "把以后留下",
    "title": "一年后一起重读这份愿望册"
  }
];
let wishView = '全部';
let wishLimit = 20;
let wishState = {};
try { wishState = JSON.parse(localStorage.getItem('rx-wish100') || '{}') || {}; } catch {}
if (typeof wishState !== 'object' || Array.isArray(wishState)) wishState = {};
function saveWishState() {
  try { localStorage.setItem('rx-wish100', JSON.stringify(wishState)); return true; }
  catch { return false; }
}
const originalWishPage = renderWishes;
renderWishes = function () {
  originalWishPage();
  const panel = document.createElement('section');
  panel.className = 'wish-book';
  const finished = wishIdeas.filter((_, i) => wishState[i] === 'done').length;
  const planned=wishIdeas.filter((_,i)=>wishState[i]==='planned').length;
  panel.innerHTML = '<header class="wish-book-heading"><div class="wish-cover-copy"><span class="eyebrow"><span class="wish-blue">盛梓轩</span> & <span class="wish-pink">方然</span> · 愿望册</span><h1>还有好多事，<br>想和你一起。</h1><p>不赶着完成，挑一件喜欢的，<br>留给下次见面。</p><button class="wish-write-link" type="button">＋ 写一件我们的愿望</button></div><div class="wish-cover-object" aria-hidden="true"><span class="wish-ribbon blue-ribbon"></span><span class="wish-ribbon pink-ribbon"></span><small>我们的小小以后</small><strong>100</strong><span>件想一起做的事</span><i>ran & xuan</i></div></header><div class="wish-summary"><p><b>'+planned+'</b> 件放进计划</p><div class="wish-completion"><p role="status"><b>'+finished+'</b> / 100 件已完成</p><progress max="100" value="'+finished+'" aria-label="愿望完成进度"></progress></div></div><div class="wish-toolbar"><div class="wish-status-tabs" aria-label="按进度筛选"></div><div class="wish-book-filters" aria-label="按主题筛选"></div></div><div class="wish-list-caption"><h2>从一件小事开始</h2><span class="wish-result-count"></span></div><div class="wish-book-grid"></div><details class="wish-backup"><summary>保存与备份 <span>当前浏览器保存</span></summary><p class="small">这100件是可挑选的约会建议。计划与完成记录保存在当前浏览器，不会自动同步。</p><div><button id="wish100-export">导出这本愿望册</button><button id="wish100-import" type="button">恢复愿望备份</button></div><input id="wish100-file" type="file" accept=".json,application/json" hidden></details><p id="wish100-status" role="status"></p>';
  document.getElementById('app').prepend(panel);
  const customHeading = document.querySelector('.wish-head h1');
  if (customHeading) customHeading.outerHTML = '<h2>再写一件，我们自己的愿望。</h2>';
  panel.querySelector('.wish-write-link').onclick=()=>{document.querySelector('.wish-head').scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'});document.getElementById('wish-text').focus({preventScroll:true})};
  const categories = ['全部','已计划','已完成',...new Set(wishIdeas.map(x=>x.category))];
  for (const name of categories) {
    const button = document.createElement('button'); button.textContent = name;
    button.setAttribute('aria-pressed', String(wishView === name));
    button.onclick = () => { wishView = name; wishLimit = 20; renderWishes(); document.querySelector('.wish-book').scrollIntoView({block:'start'}); };
    panel.querySelector(['全部','已计划','已完成'].includes(name)?'.wish-status-tabs':'.wish-book-filters').append(button);
  }
  let matchedCount = 0;
  wishIdeas.forEach((idea, index) => {
    const state = wishState[index] || '';
    if (wishView === '已计划' && state !== 'planned') return;
    if (wishView === '已完成' && state !== 'done') return;
    if (!['全部','已计划','已完成'].includes(wishView) && idea.category !== wishView) return;
    matchedCount += 1;
    if (matchedCount > wishLimit) return;
    const card = document.createElement('article'); card.className = 'wish-page '+state;card.dataset.wishIndex=index;
    const category = document.createElement('small'); category.textContent = idea.category;
    const number=document.createElement('span');number.className='wish-number';number.textContent=String(index+1).padStart(3,'0');
    const title = document.createElement('h3'); title.textContent = idea.title;
    const plan = document.createElement('button'); plan.textContent = state === 'planned' ? '已计划 · 取消' : '放进计划'; plan.setAttribute('aria-pressed',String(state === 'planned'));
    const done = document.createElement('button'); done.textContent = state === 'done' ? '已完成 · 撤销' : '标记完成'; done.setAttribute('aria-pressed',String(state === 'done'));
    function change(next) {
      const previous = wishState[index]; wishState[index] = state === next ? '' : next;
      if (!saveWishState()) { wishState[index] = previous; panel.querySelector('#wish100-status').textContent = '浏览器未能保存，请先导出备份。'; return; }
      const y = window.scrollY; renderWishes(); window.scrollTo(0,y);document.querySelector('[data-wish-index="'+index+'"] .wish-row-actions button:nth-child('+(next==='planned'?1:2)+')')?.focus({preventScroll:true});
    }
    plan.onclick=()=>change('planned'); done.onclick=()=>change('done');
    const copy=document.createElement('div');copy.className='wish-row-copy';copy.append(category,title);const actions=document.createElement('div');actions.className='wish-row-actions';actions.append(plan,done);card.append(number,copy,actions); panel.querySelector('.wish-book-grid').append(card);
  });
  panel.querySelector('.wish-result-count').textContent=matchedCount+' 件 · '+wishView;
  const more = document.createElement('button');
  more.className = 'wish-more';
  more.textContent = '再翻20件 · 还有'+Math.max(0,matchedCount-wishLimit)+'件';
  more.hidden = matchedCount <= wishLimit;
  more.onclick = () => {
    const y = window.scrollY;
    wishLimit += 20;
    renderWishes();
    window.scrollTo(0,y);
  };
  panel.querySelector('.wish-book-grid').after(more);
  if (!panel.querySelector('.wish-page')) panel.querySelector('.wish-book-grid').textContent = '这一页还空着，去挑一件想一起做的事吧。';

  const backupInput = panel.querySelector('#wish100-file');
  panel.querySelector('#wish100-import').onclick = () => backupInput.click();
  backupInput.onchange = async () => {
    const file = backupInput.files[0];
    if (!file) return;
    const status = panel.querySelector('#wish100-status');
    try {
      if (file.size > 200000) throw new Error('备份文件过大，请选择愿望册导出的JSON文件。');
      const merged = mergeWishBackup(JSON.parse(await file.text()), wishState);
      const previous = wishState;
      wishState = merged;
      if (!saveWishState()) { wishState = previous; throw new Error('浏览器保存失败，请保留备份后再试。'); }
      renderWishes();
      document.getElementById('wish100-status').textContent = '备份已合并，完成记录已保留。';
    } catch (error) {
      status.textContent = error instanceof SyntaxError ? '文件无法读取，请选择导出的JSON备份。' : error.message;
    }
    backupInput.value = '';
  };
  panel.querySelector('#wish100-export').onclick = () => {
    const data = wishIdeas.map((idea,index)=>({...idea,status:wishState[index]||'未选择'}));
    const url = URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/json'}));
    const link = document.createElement('a'); link.href=url; link.download='想和你一起做的100件事.json'; link.click(); setTimeout(()=>URL.revokeObjectURL(url),1000);
  };
};

// Restore the full wish book when opening its route directly.
if(typeof route!=='undefined' && route==='wishes')renderWishes();
