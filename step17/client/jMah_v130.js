// ver.1.30 since 2014/03/07 (Redesign the whole specs)
// ver.1.22 since 2014/01/30 (Fix the yaku_all as prototype)
// ver.1.21 since 2012/12/20 (Fix the type determinant of minko)

Array.prototype.index = function(value){
  for(var i=0; i<this.length; i++){ if(this[i]==value) return i; }
  return -1;
};
Array.prototype.clone = function(){
  var res=[];
  for(var i=0; i<this.length; i++){ res.push(this[i]); }
  return res;
};

var hiname = 
["m1","m2","m3","m4","m5","m6","m7","m8","m9",
 "p1","p2","p3","p4","p5","p6","p7","p8","p9",
 "s1","s2","s3","s4","s5","s6","s7","s8","s9",
 "ton","nan","sha","pei","hak","hat","chu"];
var hi = [];
for(var i=0; i<34; i++) hi[hiname[i]] = i;
var hi_tag = function(hi){ return (hi==-1)? "# " : hiname[hi] + " "; }
var typename = ["chi", "shun", "twin", "pon", "anko", "kan", "ankan"];
var type_toString = ["明順","暗順","対子","明刻","暗刻","明槓","暗槓"];
var typ = [];
for(var i=0; i<7; i++) typ[typename[i]] = i;


//////////////////////////////////////////////////////
var HandCalc = function() {
  ////////////// コンストラクタ的なもの
  // 入力
  this.tsumo = 0;
  this.reach = 0;
  this.ba_kz = 0;
  this.ch_kz = 0;
  this.aghi  = 0;
  this.dora  = 0;
  this.tsumi = 0;
  // 出力
  var pvt_furo  = 0;
  var pvt_han   = 0;
  var pvt_fu    = 0;
  var pvt_yaku   = [];
  var pvt_fueach = []; // 確定面子の種類と符
  var pvt_point  = [];
  ////////////////////////////
  this.fueach = function(){
    return pvt_fueach;
  }
  this.fu = function() {
    return pvt_fu;
  }
  this.han = function() {
    return pvt_han;
  }
  this.yaku = function() {
    return pvt_yaku;
  }
  this.point = function(cat) {
    return pvt_point[cat];
  }
  // その他内部メンバ
  var yakutag = [];  // 役タグ
  var head = [];  // 各面子の先頭牌
  var type = [];  // 各面子の種別
  var mntlen  = {};
  var typelen = {};
  var machi = {};
  var nlen  = 0;

  var init_private = function(){
    yakutag = [];
    pvt_yaku = [];
    head = [];
    type = [];
    mntlen  = {"man":0, "pin":0, "sou":0, "ji":0, "yao":0};
    typelen = {};
    machi = {"tanki":0, "kan":0, "pen":0, "ryan":0, "shabo":0};
    nlen  = 0;
  }
  ////////////////////////////
  this.yaku_check = function(n) {
    init_private();
    nlen = n.length;
    if( nlen==13 ) return this._check_13orphans(n);
    if( nlen!=5 && nlen!=7 ) return -1;

    n.sort(function(a,b){
      if(a[1]==2) return -1;
      if(b[1]==2) return 1;
      return (a[0]-b[0]);
    });
    for( i=0;i<nlen; i++){
      head.push(n[i][0]);
      type.push(n[i][1]);
    }
    this._assign_mntlen();
    this._calc_fu_tentative(nlen);
    this._assign_typelen();
    this._n2mai();
    this._judge_yaku();
    this._determine_hands();
    this._determine_fu();
    pvt_point = this._cal_point();
    return pvt_han;
  }
  /////////////////// 面子色の腑分け(type[]が変動する_calc_fu_tentative()の前にすべき)
  this._assign_mntlen = function(){
    pvt_furo = 0;
    for(var i=0;i<nlen; i++){
      if( head[i] < 9 ) mntlen.man++;
      else if( head[i] < 18 ) mntlen.pin++;
      else if( head[i] < 27 ) mntlen.sou++;
      else mntlen.ji++;
      if( type[i]==typ.chi || type[i]==typ.pon || type[i]==typ.kan ) pvt_furo++; 
      if( type[i]>=typ.twin && (head[i]%9==0 || head[i]%9==8) && head[i]<27 ) mntlen.yao++; 
      if( type[i]<typ.twin  && (head[i]%9==0 || head[i]%9==6) ) mntlen.yao++;
    }
  }
  /////////////////// 符計算(仮)
  this._calc_fu_tentative = function(nlen){
    var fu = [0,0,0,0,0,0,0];
    var mn = (nlen==5) ? 4:0; // 四面子型と七対型
    for(var i=0;i<=mn;i++){
      if(type[i]==typ.twin && this.aghi==head[i]) machi.tanki = 1;  // 単騎
      if(type[i]==typ.anko && this.aghi==head[i]) machi.shabo = i;  // 双ポン
      if(type[i]==typ.shun){
        if( this.aghi%9!=0 && this.aghi%9!=8 && this.aghi==head[i]+1 ) machi.kan = i; // 嵌張(2-8が中央牌)
        if( this.aghi%9==6 && this.aghi==head[i] )   machi.pen = i; // 辺張(7が先頭牌)
        if( this.aghi%9==2 && this.aghi==head[i]+2 ) machi.pen = i; // 辺張(3が末尾牌)
        if( this.aghi%9<6  && this.aghi==head[i] )   machi.ryan = i; // 両面(1-6が先頭牌)
        if( this.aghi%9>2  && this.aghi==head[i]+2 ) machi.ryan = i; // 両面(4-9が末尾牌)
      }
    }
    if(machi.tanki + machi.pen + machi.kan > 0) fu[6] = 2;

    // ロン面子の明順・明刻化 (符優先順位:単嵌辺 > 両面 > 双ポン(例外:平和))
    if(this.tsumo % 2 == 0 && mn == 4){
      for(var s in machi) if(machi[s]) break;
      if(s != "tanki") type[machi[s]]--;
    }

    var ba_kz = this.ba_kz + 27;
    var ch_kz = this.ch_kz + 27;
    for(var i=0; i<=mn; i++){
      var is_yakuhai = (head[i]==ba_kz || head[i]==ch_kz || head[i]>30);
      if( type[i]==typ.twin && is_yakuhai ){
        fu[i] = ( ba_kz==ch_kz && head[i] == ch_kz && this.is_chuzan)? 4:2;
        continue;
      }
      if( type[i] >= typ.pon ){
        fu[i] = 1<<( type[i]-2 );
        if( head[i]%9==8 || head[i]%9==0 || head[i]>=27 ) fu[i] *=2;
      }
    }
    if( this.tsumo%2==1 ) fu[5] = 2;
    pvt_fueach[0] = fu;
  }
  /////////////////// 面子型の腑分け
  this._assign_typelen = function(){
    for(var i=0; i<7; i++) typelen[typename[i]] = 0;
    for(var i=0; i<nlen; i++){ typelen[typename[type[i]]]++; }
  }
  ////////////////// 各牌の枚数
  this._n2mai = function(){
    pvt_mai = new Array(34);
    for( var i=0; i<pvt_mai.length; i++ ){ pvt_mai[i]=0; }
    for (var i=0; i<nlen; i++){
      switch(type[i]){
      case typ.twin:
        pvt_mai[head[i]]+=2; break;
      case typ.anko:
      case typ.pon:
        pvt_mai[head[i]] += 3; break;
      case typ.ankan: case typ.kan:
        pvt_mai[head[i]] += 4; break;
      case typ.shun:
      case typ.chi:
        pvt_mai[head[i]+0]++;
        pvt_mai[head[i]+1]++;
        pvt_mai[head[i]+2]++;
      }
    }
  }
  //////////////////////////////// 各種役判定
  this._judge_yaku = function(){
    this._check_tile_limited_hand();
    this._check_color_limited_hand();
    this._check_type_limited_hand();
    this._check_4ments_related_hand();
    this._check_3ments_related_hand();
    this._check_2ments_related_hand();
    this._check_context_hand();
    this._check_fu_related_hand();
  }
  //////////////////////////////// 和了状況の役
  this._check_context_hand = function(){
    if(this.tsumo%2==1 && pvt_furo==0) yakutag.push("TSUMO"); 
    if(this.tsumo==2 || this.tsumo==3) yakutag.push("HAITEI"); 
    if(this.tsumo==5 && typelen.kan + typelen.ankan > 0) yakutag.push("RINSHAN"); 
    if(this.tsumo==4 && pvt_mai[this.aghi] <= 1) yakutag.push("CHANKAN"); 
    if(this.reach==1 || this.reach==2) yakutag.push("REACH");   
    if(this.reach==3 || this.reach==4) yakutag.push("WREACH");
    if(this.reach==2 || this.reach==4) yakutag.push("1PATSU");
    if(pvt_furo + typelen.ankan == 4)  yakutag.push("HADAKA"); // 裸単騎※

    // 状況整合
    if( pvt_furo ) this.reach = 0;
  }
  /////////////////////////////// 符計算に関わる役
  this._check_fu_related_hand =  function() {
    var fu = pvt_fueach[0];
    if(fu[0] + fu[1] + fu[2] + fu[3] + fu[4] > 0) return;
    if(fu[5] && !this.is_pinzumo) return;
    if(machi.ryan == 0) return;
    yakutag.push("PINFU"); // 平和
    fu[5] = 0;
    fu[6] = 0;
  }
  ////////////////////////////// 使用牌の制限がある役
  this._check_tile_limited_hand = function() {
    this._check_ryui_hand();
    this._check_toipu_hand();
    this._check_100man_hand();
    this._check_9ren_hand();
    this._check_3gen_hand();
    this._check_4xi_hand();
    this._check_fanpai_hand();
  }

  Array.prototype.havingonlykeys = function(keys){
    for(var i=0; i<this.length; i++)
      if(this[i] > 0 && keys.index(i) < 0) return false;
    return true;
  }
  Array.prototype.searchsubset = function(subset){
    var j=0;
    for(var i=0; i<this.length; i++){
      if(this[i] < subset[j]){
	j = 0;
	if(this[i] < subset[j]) continue;
      }
      j++;
      if(j == subset.length) return i - subset.length + 1;
    }
    return -1;
  }

  this._check_3gen_hand = function(){
    var mntlen_3gen = 0;
    for(var i=1;i<5;i++) 
      if(head[i] >= hi.hak && type[i] >= typ.pon) mntlen_3gen++; 
    if(mntlen_3gen == 3) yakutag.push("DAI3");  // 大三
    if(mntlen_3gen == 2 && head[0] >= hi.hak) yakutag.push("SHO3");  //小三
  }

  this._check_4xi_hand = function(){
    var mntlen_4xi = 0;
    for(var i=1;i<5;i++)
      if(head[i] >= hi.ton && head[i] <= hi.pei && type[i] >= typ.pon) mntlen_4xi++;
    if(mntlen_4xi == 4) yakutag.push("DAI4");  // 大四
    if(mntlen_4xi == 3){
      if( head[0]>=hi.ton && head[0]<=hi.pei ) yakutag.push("SHO4");  //小四
      //if( head[0]<hi.ton && type[i]>=typ.pon ) 
      yakutag.push("3PU");   //三風刻※
    }
  }

  this._check_fanpai_hand = function(){
    var mntlen_fanp = 0;
    for(var i=1; i<5; i++) {
      if(type[i] < typ.pon) continue;
      if(head[i] == this.ba_kz + 27) mntlen_fanp++;
      if(head[i] == this.ch_kz + 27) mntlen_fanp++;
      if(head[i] >= hi.hak) mntlen_fanp++;
    }
    for(var i=0; i<mntlen_fanp; i++) yakutag.push("YAKUHAI"); // 役牌
  }

  this._check_ryui_hand = function(){
    var ryu_hai = [hi.s2, hi.s3, hi.s4, hi.s6, hi.s8, hi.hat];
    if(mntlen.sou + mntlen.ji != 5) return;
    if(pvt_mai.havingonlykeys(ryu_hai)) yakutag.push("RYUI"); // 緑一色
  }
  
  this._check_toipu_hand = function(){
    var tpt_hai = [hi.p1, hi.p2, hi.p3, hi.p4, hi.p5, hi.p8, hi.p9, 
                   hi.s2, hi.s4, hi.s5, hi.s6, hi.s8, hi.s9, hi.hak];
    if(pvt_mai.havingonlykeys(tpt_hai)) yakutag.push("TOIPU"); // 推不倒※
  }

  this._check_100man_hand = function(){
    var hisum = 0;
    for (var i=0; i<9; i++) hisum += (i % 9 + 1) * pvt_mai[i];
    if (mntlen.man == nlen && hisum>=100) yakutag.push("100MAN"); // 百万石※
  }

  this._check_9ren_hand = function(){
    var chu_mai = [3,1,1,1,1,1,1,1,3];
    var subset_head = pvt_mai.searchsubset(chu_mai);
    if(subset_head < 0 || subset_head >= hi.ton || subset_head % 9 != 0) return;
    if(typelen.ankan > 0 || pvt_furo > 0) return;
    if(pvt_mai[this.aghi] == chu_mai[this.aghi%9] + 1) yakutag.push("J9REN"); // 純正九蓮
    yakutag.push("9REN"); // 九蓮
  }
  ////////////////////////////// 色の制限がある役
  this._check_color_limited_hand = function() {
    if(mntlen.man + mntlen.ji == nlen ||
       mntlen.sou + mntlen.ji == nlen || mntlen.pin + mntlen.ji == nlen){
      if(mntlen.ji == 0) yakutag.push("CHIN");  // 清一色
      yakutag.push("HON"); // 混一色
    }
    if(mntlen.ji == nlen)    yakutag.push("TSUI");  // 字一色
    if(mntlen.yao + mntlen.ji == 0) yakutag.push("TAN");  // 断幺
    
    if(mntlen.yao == nlen){
      if( typelen.chi + typelen.shun == 0 ) yakutag.push("CHINRO"); //清老
      yakutag.push("JCHANT"); // 純全帯
    }
    if(mntlen.yao + mntlen.ji==nlen){
      if(typelen.chi + typelen.shun == 0) yakutag.push("HONRO"); //混老
      yakutag.push("CHANT"); // 全帯
    }
    var ji_flag = [false,false];
    if(mntlen.man == 1 && mntlen.sou == 1 && mntlen.pin == 1 && nlen == 5){
      for(var i=0; i<nlen; i++){
        if(head[i]>=hi.hak) ji_flag[0] = true;
        if(head[i]>=hi.ton && head[i]<=hi.pei) ji_flag[1] = true;
      }
      if(ji_flag[0] && ji_flag[1]) yakutag.push("5MENC"); // 五門斉※
    }
  }
  //////////////////////////////////////// 面子タイプに関わる役
  this._check_type_limited_hand = function() {
    if(typelen.twin == 7){
      yakutag.push("7TOI"); // 七対子
    } else if( typelen.anko + typelen.ankan == 4 ){ 
      yakutag.push("4ANK"); // 四暗刻
      if(machi.tanki) yakutag.push("4ANKT"); // 四暗刻単騎
    } else if( typelen.chi + typelen.shun == 0 ){ 
      yakutag.push("TOITOI"); // 対々和
    }

    if(typelen.anko + typelen.ankan == 3) yakutag.push("3ANK"); // 三暗
    if(typelen.kan  + typelen.ankan == 3) yakutag.push("3KAN"); // 三槓
    if(typelen.kan  + typelen.ankan == 4) yakutag.push("4KAN"); // 四槓
  }

  /////////////////////////////////////// 4面子同士の比較に関わる役
  this._check_4ments_related_hand =  function() {
    if( typelen.shun + typelen.chi == 4 ){
      if( head[1] == head[2] && head[3] == head[4] ){
        if(head[2]==head[3]) yakutag.push("1SK4J");  // 一色四順
        yakutag.push("2PEKO"); // 二盃口
      }
      if( head[1]+1==head[2] && head[2]+1==head[3] && head[3]+1==head[4] && head[1]%9<4 ||
          head[1]+2==head[2] && head[2]+2==head[3] && head[3]+2==head[4] && head[1]%9==0 ) 
        yakutag.push( "1SK4PO"); // 一色四歩※
    }
    if( typelen.shun + typelen.chi == 0 && typelen.twin==1 && head[1]%9<6 && head[1]<27 && 
        head[1]+1==head[2] && head[2]+1==head[3] && head[3]+1==head[4] )
      yakutag.push("4RENK"); // 四連刻※
  }
  /////////////////////////////////////// 3面子同士の比較に関わる役
  this._check_3ments_related_hand = function() {
    var combi3 = [[1,2,3],[1,2,4],[1,3,4],[2,3,4]];
    for(var iz=0; iz<combi3.length; iz++){
      var i = combi3[iz][0]; 
      var j = combi3[iz][1]; 
      var k = combi3[iz][2];
      var flag_shn = (type[i]<typ.twin && type[j]<typ.twin && type[k]<typ.twin );
      var flag_koh = (type[i]>typ.twin && type[j]>typ.twin && type[k]>typ.twin &&
                      head[i]<27 && head[j]<27 && head[k]<27 );
      if(!flag_shn && !flag_koh) continue;
      
      var hinum   = [ head[i]%9+1, head[j]%9+1, head[k]%9+1 ].sort();
      var hicolor = [ Math.floor(head[i]/9), Math.floor(head[j]/9), Math.floor(head[k]/9) ];
      var flag_3sk = (hicolor[0]==0 && hicolor[1]==1 && hicolor[2]==2);
      var flag_1sk = (hicolor[0]==hicolor[1] && hicolor[1]==hicolor[2]);
      var flag_1ts = (hinum[0]==1 &&  hinum[1]==4  && hinum[2]==7 ); 
      var flag_doj = (hinum[0]  ==hinum[1] && hinum[1]  ==hinum[2]);
      var flag_3po = (hinum[0]+1==hinum[1] && hinum[1]+1==hinum[2]);
      var flag_6po = (hinum[0]+2==hinum[1] && hinum[1]+2==hinum[2]);
      
      if(flag_shn && flag_3sk && flag_1ts) yakutag.push("3SK1TS"); // 三色一通(花竜)※
      if(flag_shn && flag_3sk && flag_doj) yakutag.push("3SHIKI"); // 三色同順 
      if(flag_shn && flag_3sk && flag_3po) yakutag.push("3SK3PO"); // 三色三歩※
      if(flag_shn && flag_1sk && flag_1ts) yakutag.push("ITTSU");  // 一気通貫
      if(flag_shn && flag_1sk && flag_doj) yakutag.push("1SK3J");  // 一色三順
      if(flag_shn && flag_1sk && (flag_3po || flag_6po)) yakutag.push("1SK3PO"); // 一色三歩※
      if(flag_koh && flag_3sk && flag_doj) yakutag.push("3SKDOK"); // 三色同刻
      if(flag_koh && flag_3sk && flag_3po) yakutag.push("3SKRNK"); // 三色連刻※
      if(flag_koh && flag_1sk && flag_3po) yakutag.push("3RENK");  // 三連刻※
    }
  }
  //////////////////////////////////////// 2面子同士の比較に関わる役
  this._check_2ments_related_hand = function() {
    var combi2 = [[1,2],[1,3],[1,4],[2,3],[2,4],[3,4]];
    for(var iz=0; iz<combi2.length; iz++){
      var i = combi2[iz][0]; 
      var j = combi2[iz][1];
      if(type[i]>=typ.twin || type[j]>=typ.twin) continue;
      if(head[i] == head[j]) yakutag.push("1PEKO"); // 一盃口
    }
  }
  //////////////////////////////////////// 国士無双に関わる役
  this._check_13orphans = function(n){
    var han = 0;
    var flag_13men = false;
    yakutag = ["KOKUSHI"];
    for(var i=0; i<13; i++) 
      if(n[i][1]==2 && n[i][0]==this.aghi) yakutag.push("KOKUSHI13");
    this._exclusion_hands();
    this._yaku2han();
    this._fu_all();
    pvt_point = this._cal_point();
  }
  ////////////////// 役の確定
  this._determine_hands = function() {
    pvt_han = 0;
    yakutag = this._unique(yakutag);
    var yaku2han = {};
    for(var i=0; i<yakutag.length; i++){
      var tag = yakutag[i];
      yaku2han[tag] = this._defined_han(tag, pvt_furo>0);
    }
    yakutag.sort(function(a,b){ return yaku2han[b] - yaku2han[a]; });
    var ypan = [];
    var is_yakuman = yaku2han[yakutag[0]] >= 13;
    for (var i=0; i<yakutag.length; i++){
      var tag = yakutag[i];
      if(!tag || yaku2han[tag] == 0) continue;
      for(var j=0; j<this.exclusive.length; j++){
        if(this.exclusive[j].index(tag)<0) continue;
        for(var k=0; k<this.exclusive[j].length; k++){
          var n = yakutag.index(this.exclusive[j][k]);
          if(n<0) continue;
          yakutag[n] = false;
        }
      }
      if(yaku2han[tag] < 13 && is_yakuman) continue;
      ypan.push(tag);
      pvt_yaku.push(this.yaku_all[tag][2] + "(" + yaku2han[tag] + ")");
      pvt_han += yaku2han[tag];
    }
    yakutag = ypan;
  }
  //////////////////// 重複判定役の削除
  this._unique = function(arr) {
    var storage = {};
    var uniqueArray = [];
    for (var i=0; i<arr.length; i++) {
      var val = arr[i];
      if (this.selfduplicatable.index(val) < 0 && (val in storage)) continue;
      storage[val] = true;
      uniqueArray.push(val);
    }
    return uniqueArray;
  }
  ///////////////////////////
  this._defined_han = function(yakutag, is_furo){
    //var Calc = new HandCalc;
    var yaku_all = this.yaku_all;
    if(!(yakutag in yaku_all)) return 0;
    if(this.yaku_disable[yakutag]) return 0;
    return yaku_all[yakutag][is_furo ? 1:0];
  }
  ////////////////// 翻数取得
  this._yaku2han = function() {
    var han = 0;
    for (var i=0; i<yakutag.length; i++){
      var yaku_this = this.yaku_all[yakutag[i]];
      if(yaku_this == undefined) continue;
      var han_this =  (pvt_furo==0) ? yaku_this[0] : yaku_this[1];
      han += han_this;
      pvt_yaku.push(yaku_this[2] + "(" + han_this + ")");
    }
    if(0 < han && han < 13) 
      han = ( this.dora + han > 13 ) ? 13 : ( this.dora + han );
    pvt_han = han;
  }
  ///////////// 符の確定
  this._determine_fu = function() {
    var fu_all = 20;
    var fu = pvt_fueach[0];
    if(nlen != 5){
      pvt_fu = 25;
      return;
    }
    if( this.tsumo%2==0 && pvt_furo==0 ) fu_all += 10;
    for(var i=0; i<7; i++){ fu_all += fu[i]; }
    if( fu_all==20 && yakutag.index("PINFU") < 0 && this.is_30fu_kuipinfu) fu_all = 30; // 喰い平和型を桁上げ
    pvt_fu = fu_all;
    pvt_fueach[1] = type;
  }
  ////////////// 点数計算
  this._cal_point = function(){
    var tsumi = this.tsumi;
    var fu = pvt_fu;
    var han = pvt_han;
    var point  = [0,0,0];
    var mangan = [8,12,12,16,16,16,24,24,32];
    if(this.triple == 10) mangan[10-5] = 24;
    if(han==0) return [0,0,0];
    if(this.is_hypaethral){
      if(fu!=25) fu = Math.ceil(fu/10)*10;
      point[0] = 16 * fu<<han;
    } else if(han<5){
      if(fu!=25) fu = Math.ceil(fu/10)*10;
      point[0] = 16 * fu<<han;
      if(point[0]>8000 || (this.is_mangan77 && point[0] > 7600))
        point[0]=8000;
    } else if(han>=13){
      point[0] = mangan[8] * 1000 * Math.floor(han/13);
    } else {
      point[0] = mangan[han-5] * 1000;
    }
    if( this.ch_kz==0 ) point[0] = point[0] * 3/2;
    point[0] = Math.ceil(point[0]/100) * 100;  // 切り上げ
    if ( this.tsumo%2==0 ) return [ point[0] + tsumi*300 ];

    // ツモ和了の場合
    if( this.ch_kz == 0 ) {
      point[1] = Math.ceil(point[0]/300)*100 + tsumi*100;
      point[0] = point[1]*3;
    } else {
      point[1] = Math.ceil(point[0]/200)*100;
      point[2] = Math.ceil(point[1]/200)*100 + tsumi*100;
      point[1] += tsumi*100;
      point[0] = point[1] + point[2]*2;
    }
    return point;
  }
}
HandCalc.prototype.yaku_all = {
  "PINFU": [1,0,"平和"],  "TAN":   [1, 1,"断幺"],   "YAKUHAI":[1,1,"役牌"],
  "HAITEI":[1,1,"牌底"],  "TSUMO": [1, 0,"自摸"],   "RINSHAN":[1,1,"嶺上開花"],
  "REACH": [1,0,"立直"],  "WREACH":[2, 0,"W立直"],  "1PATSU": [1,0,"一発"],
  "1PEKO": [1,0,"一盃口"],"2PEKO": [3, 0,"二盃口"], "TOITOI": [2,2,"対々和"],
  "SHO3":  [2,2,"小三元"],"DAI3": [13,13,"大三元"], "ITTSU":  [2,1,"一気通貫"],
  "3ANK":  [2,2,"三暗刻"],"4ANK": [13, 0,"四暗刻"], "4ANKT":  [26,0,"四暗単騎"],
  "HON":   [3,2,"混一色"],"CHIN":  [6, 5,"清一色"], "RYUI":   [13,13,"緑一色"],
  "HONRO": [2,2,"混老頭"],"CHINRO":[13,13,"清老頭"],"TSUI":   [13,13,"字一色"],
  "3KAN":  [2,2,"三槓子"],"4KAN":  [13,13,"四槓子"],"CHANKAN":[1,1,"搶槓"],
  "CHANT": [2,1, "全帯"],      "JCHANT":[ 3, 2,"純全帯"],
  "SHO4":  [13,13,"小四喜"],   "DAI4":  [13,13,"大四喜"],
  "3SHIKI":[2,1, "三色同順"],  "3SKDOK":[ 2, 2,"三色同刻"],
  "9REN":  [13,0, "九蓮宝灯"], "J9REN": [26, 0,"純正九蓮"],
  "KOKUSHI":[13,0,"国士無双"], "KOKUSHI13":[26,0,"国士13面"], "7TOI":[2,0,"七対子"]
  /* the following hands are disable by default */
  , "1SK4J":[13,13,"一色四順"], "1SK3J":[ 3,2,"一色三順"],
  "3RENK":[2,2,"三連刻"],   "4RENK":[ 13,13,"四連刻"], "3PU":[  2,2,"三風刻"],
  "5MENC":[1,1,"五面斉"],   "HADAKA":[1,1,"裸単騎"],   "TOIPU":[2,2,"推不倒"],
  "3SK1TS":[1,0,"花竜"],    "3SKRNK":[1,1,"三色連刻"], "100MAN":[13,13,"百萬石"],
  "1SK4PO":[4,3,"一色四歩"],"1SK3PO":[2,1,"一色三歩"], "3SK3PO":[1,0,"三色三歩"] 
};

HandCalc.prototype.yaku_disable = {
  "4ANKT":true, "J9REN":true, "KOKUSHI13":true,
  "1SK4J":true, "1SK3J":true, "3RENK":true, "4RENK":true, "3PU":true, 
  "5MENC":true, "HADAKA":true, "TOIPU":true, "3SK1TS":true, "3SKRNK":true, "100MAN":true, 
  "1SK4PO":true,"1SK3PO":true, "3SK3PO":true 
};
HandCalc.prototype.exclusive = [
  ["4ANK","4ANKT","TOITOI"], ["9REN","J9REN"], ["KOKUSHI13", "KOKUSHI"],
  ["CHIN", "HON"], 
  ["1PEKO", "2PEKO", "1SK4J", "1SK3J"],
  ["CHANT", "JCHANT", "HONRO", "CHINRO"]
];
HandCalc.prototype.selfduplicatable = ["YAKUHAI"];
HandCalc.prototype.triple = 11;
HandCalc.prototype.is_chuzan = true;
HandCalc.prototype.is_mangan77 = false;
HandCalc.prototype.is_pinzumo = true;
HandCalc.prototype.is_30fu_kuipinfu = true;
HandCalc.prototype.is_hypaethral = false;

//////////////////////////////////////////////////////
var JangResult = function(){
  // 入力
  this.HandObj;
  this.CalcObj;
  // 出力
  var hans = [];
  var result_html = "";
  var pvt_id_res;
  //////////////////
  this.get_result_by_hand = function(HandObj, CalcObj){ // 総合計算
    if(HandObj) this.HandObj = HandObj;
    if(CalcObj) this.CalcObj = CalcObj;
    if( !this.HandObj.split_into_ments(true) ){
      result_html = "不聴";
      return result_html;
    }
    var max_n = this._apply_max();
    result_html = this._draw_result_table( max_n );
    pvt_id_res = this._get_res_id( max_n );
    return result_html;
  }
  ////////////////// 
  this.result_table = function(){
    return result_html;
  }
  ////////////////// 
  this.result_id = function(){
    return pvt_id_res;
  }
  //////////////////
  this._apply_max = function(ns){ // 高点法
    var ns = this.HandObj.ns();
    if(ns.length==0) return false;
    var max_p = 0;
    var max_n = 0;
    var Calc = this.CalcObj;
    
    //alert(ns[max_n]);
    //if(ns.length > 1)
      for(var i=0; i<ns.length; i++){
        Calc.yaku_check(ns[i]);
        hans[i] = (Calc.han()) + "翻" + (Calc.fu() == 25 ? 25 : Math.ceil(Calc.fu()/10)*10 ) + "符";
        if(max_p < Calc.point(0) + Calc.han()){ 
	  max_p = Calc.point(0) + Calc.han(); 
	  max_n = i; 
	}
      }
    Calc.yaku_check(ns[max_n]);
    //this.CalcObj = Calc;
    return max_n;
  }
  //////////////////
  var show_hi = function(n,single_flag){ // 牌表示
    var res ="";
    var num_loop = single_flag ? 1: n.length;
    for(var j=0; j<num_loop; j++){
      var type = single_flag ? n[1] : n[j][1];
      var head = single_flag ? n[0] : n[j][0];
      var pstyle="%1";
      if(type==0) pstyle = "[ %1%2%3 ]"; 
      if(type==1) pstyle = "%1%2%3"  ; 
      if(type==2) pstyle = "%1%1";  
      if(type==3) pstyle = "[ %1%1%1 ]"; 
      if(type==4) pstyle = "%1%1%1"  ; 
      if(type==5) pstyle = "[ %1%1%1%1 ]"; 
      if(type==6) pstyle = "%1" + hi_tag(-1) + hi_tag(-1) + "%1"  ; 
      pstyle = pstyle.split("%1").join( hi_tag(head) );
      pstyle = pstyle.replace( /%2\%3/, hi_tag(head+1) + hi_tag(head+2) );
      res += pstyle + " ";
    }
    return res;
  }
  //////////////////
  this._draw_result_table = function( max_n ){ // 計算結果出力
    var ns = this.HandObj.ns();
    if(ns.length==0) return false;
    var Calc = this.CalcObj;
    var ments = ns[max_n].length;
    //var point = Calc.point;
    var mes = '<table class=r>';

    // mes += '<tr align="center">' + show_hi(ns[max_n], true);
    if( ments == 5 ){ 
      for(var i=0; i<5; i++){
        mes += '<tr align="center">';
        mes += "<td>" + show_hi(ns[max_n][i], true) + "</td>";
        mes += "<td>" + type_toString[Calc.fueach()[1][i]] + Calc.fueach()[0][i] + "符</td>";
        mes += "</tr>";
      }
      mes += '<tr><td> ( 和了牌 = ' + hi_tag(Calc.aghi) + ' ) </td>';
      mes += "<td>ツモ"+ Calc.fueach()[0][5]+"符 ";
      mes += "待ち"+ Calc.fueach()[0][6]+"符 </td>";
      mes += "</tr>";
    } else {
      mes += '<tr><td>' + show_hi(ns[max_n]) + "</td></tr>";
      mes += '<tr><td> ( 和了牌 = ' + hi_tag(Calc.aghi) + ' ) </td></tr>';
    }
    mes += "<tr><td";
    if(ments==5) mes += " colspan=2";
    mes += ">役：" + Calc.yaku().join(",") + "<br>\n";
    mes += "点：" + hans[max_n] + " ";
    mes += "<b>" + Calc.point(0) + "点</b>";
    if( Calc.tsumo%2==1 && Calc.ch_kz==0 ) mes += " ⇒ <b>" + Calc.point(1) + "点オール</b>";
    if( Calc.tsumo%2==1 && Calc.ch_kz>0  ) mes += " ⇒ <b>" + Calc.point(2) + " / " + Calc.point(1) + "点</b>";
    mes += "</td></tr>\n";
    mes += '</table>';
    
    if( ns.length > 1 ){
      mes += '[他の面子の切り方]<br>';
      for(var i=0; i < ns.length; i++){
        if(i==max_n) continue;
        mes += "<li>" + hans[i] + "<br>" + show_hi(ns[i]);
      }
    }
    return mes;
  }
  this._get_res_id = function( max_n ){
    var ns = this.HandObj.ns();
    if(ns.length==0) return false;
    var n = ns[max_n];
    var Calc = this.CalcObj;
    var res_id = Array();
    res_id[0] = (Calc.ba_kz << 2)|(Calc.ch_kz);
    res_id[1] = (Calc.tsumo << 3)|(Calc.reach);
    res_id[2] = Calc.tsumi;
    res_id[3] = Calc.dora;
    res_id[4] = Calc.aghi;
    res_id[5] = n.length;
    if(n.length == 5){
      for(var i=0; i<5; i++) res_id[8+i] = n[i][0];
      res_id[5] = n[0][1] << 3;
      res_id[6] = (n[2][1] << 3) | n[1][1];
      res_id[7] = (n[4][1] << 3) | n[3][1];
    }
    if(n.length == 7){
      for(var i=0; i<7; i++) res_id[6+i] = n[i][0];
    }
    if(n.length == 13){
      for(var i=0; i<13; i++)
        if( n[i][1]==2 ) res_id[6] = n[i][0];
    }
    return base64encode(res_id);
  }
  this.get_result_by_id = function(str_id){
    var res_id = base64decode(str_id);
    var Calc = new HandCalc;
    Calc.ch_kz =  res_id[0] & 0x03;
    Calc.ba_kz = (res_id[0] >> 2) & 0x03;
    Calc.reach =  res_id[1] & 0x07;
    Calc.tsumo = (res_id[1] >> 3) & 0x07;
    Calc.tsumi = res_id[2];
    Calc.dora  = res_id[3];
    Calc.aghi  = res_id[4];
    var ment = res_id[5];
    var n = Array();
    switch(ment){
    case 7:
      for(var i=0; i<7; i++) n.push([res_id[6+i], 2]);
      break;
    case 13:
      break;
    default:
      for(var i=0; i<5; i++){
        var ment_type = res_id[Math.ceil(i/2)+5];
        if(i%2==0) ment_type >>= 3;
        n.push([res_id[8+i], ment_type & 0x7]);
      }
      //alert(n);
      Calc.yaku_check(n);
      break;
    }
    this.CalcObj = Calc;
    this.HandObj = new HandSet;
    this.HandObj.n = n;
    this.HandObj.n2nt();
    this.HandObj.nt2mai();
  }
}
//////////////////////////////////////////////////////
var HandSet = function(){
  this.hai = [];            // 面前牌
  this.n = [];              // 確定面子(副露牌)
  this.t   = new Array(35); // 面前牌枚数

  var pvt_mai = new Array(35); // 手牌枚数
  var pvt_ns = [];             // 面子の切り方
  for( var i=0;i<35;i++ ){ pvt_mai[i]=0; }
  for( var i=0;i<35;i++ ){ this.t[i]=0; }

  var ntmp;
  var ttmp;
  var pvt_is_all;
  
  this.mai = function(){
    return pvt_mai;
  }

  this.ns = function(){
    return pvt_ns;
  }
  //////////////////
  var get_ments = function(i){
    var is_all = pvt_is_all;
    var n = ntmp;
    var t = ttmp;
    while (t[i]==0){ 
      if(i>=33){
        pvt_ns.push(n.clone());
        return true;
      }
      i++;
    }
    if(t[i]==3){  // 刻子
      t[i]-=3;
      n.push([i,4]);
      if( get_ments(i) && !is_all ) return true;
      n.pop();
      t[i]+=3;
    }
    if(i<27 && i%9<7 && t[i+1]>0 && t[i+2]>0 ){ // 順子
      t[i]--; t[i+1]--; t[i+2]--;
      n.push([i,1]);
      if( get_ments(i) && !is_all ) return true;
      n.pop();
      t[i]++; t[i+1]++; t[i+2]++;
    }
    return false;
  };
  //////////////////
  this.split_into_ments = function(is_check_all_pattern){
    if(this.is_valid()) this.hai2t();
    pvt_ns = [];
    pvt_is_all = is_check_all_pattern;
    var n = this.n.clone();
    var t = this.t.clone();
    
    // 七対・国士
    var i = 0;
    var kks_flag = ( n.length>0 ) ? false : true;
    var toi_flag = ( n.length>0 ) ? false : true;
    while (toi_flag || kks_flag){
      if ( t[i]!=0 && t[i]!=2)    toi_flag=false; 
      if ( (i%9==0 || i%9==8 || i>=27) && t[i]==0) kks_flag=false; 
      if ( (i%9!=0 && i%9!=8 && i<27)  && t[i]>0)  kks_flag=false; 
      if(i>=33)  break; 
      i++;
    }
    if(toi_flag || kks_flag){
      if( !is_check_all_pattern ) return true;
      n=[];
      for(var i=0; i<t.length; i++){ if(t[i]>0) n.push([i,t[i]==1?-1:2]);  }
      pvt_ns.push(n.clone());
      n=[];
    }
    
    ntmp = n;
    ttmp = t;
    // 4面子型
    for (i=0;i<34;i++){
      if(t[i]>=2){ // 雀頭
        n.push([i,2]);
        t[i]-=2;
        if( get_ments(0) && !is_check_all_pattern ) return true;
        n.pop();
        t[i]+=2;
      }
    }
    if( is_check_all_pattern && pvt_ns.length > 0 ) return true;
    return false;
    //if( !is_all ||  pvt_ns.length == 0 ) return false;
  }
  //////////////////
  this.n2nt = function(){
    var t = this.t;
    var n = this.n;
    // t = [];
    // for( var i=0;i<35;i++ ){ t.push(0); }
    for(i=this.n.length-1; i>=0; i--){
      var type = this.n[i][1];
      var head = this.n[i][0];
      switch(type){
      case 1:
        t[head+0]++;
        t[head+1]++;
        t[head+2]++;
        //alert(t);
        break;
      case 2:
        t[head]+=2;
        break;
      case 4:
        t[head]+=3;
        break;
      case -1:
        t[head]++;
        break;
      default:
        break;
      }
      if(type==1 || type==2 || type==4 || type==-1) n.splice(i,1);
    }
    this.t = t;
  }
  this.nt2mai = function(){
    pvt_mai = this.t.clone();
    mai = pvt_mai;
    for(i=0; i<this.n.length; i++){
      var type = this.n[i][1];
      var head = this.n[i][0];
      switch(type){
      case 0:
      case 1:
        mai[head+0]++;
        mai[head+1]++;
        mai[head+2]++;
        break;
      case 2:
        mai[head]+=2;
        break;
      case 3:
      case 4:
        mai[head]+=3;
        break;
      case 5:
      case 6:
        mai[head]+=4;
        break;
      case -1:
        mai[head]++;
        break;
      default:
        break;
      }
    }
  }
  this.hai2t = function(){
    var m = this.hai;
    var sum = m.length;
    for( var i=0; i<35;  i++ ) this.t[i]=0;
    for( var i=0; i<sum; i++ ) this.t[m[i]]++;
  }
  this.t2hai = function(){
    this.hai = [];
    for(var i=0; i<35; i++)
      for(var j=0; j<this.t[i]; j++) this.hai.push(i);
  }
  this.is_valid = function(){
    var m = this.hai;
    var n = this.n;
    if(m.length + n.length*3 != 14) return false;
    return true;
  }
  this.sum = function(furo_flag){ // furo_flag: 槓を3枚と看做す
    var m = this.hai;
    var n = this.n;
    return (m.length + n.length*3);
  }
  this.sorthai = function(){
    this.hai.sort(function(a,b){return a-b;});
  }
  this.addhi = function(head, type){
    var m = this.hai;
    var n = this.n;
    var mai = pvt_mai;
    if(this.sum() > 13 ) return;
    if(this.sum() > 11 && type >= 0 ) return;
    switch(type){
    case 0:
    case 1:
      if( head%9>=7 || head>26 ) return;
      if( mai[head]>3 || mai[head+1]>3 || mai[head+1]>3) return;
      mai[head+0]++;
      mai[head+1]++;
      mai[head+2]++;
      break;
    case 2:
      if( mai[head]>2) return;
      mai[head]+=2;
      break;
    case 3:
    case 4:
      if( mai[head]>1) return;
      mai[head]+=3;
      break;
    case 5:
    case 6:
      if( mai[head]>0) return;
      mai[head]+=4;
      break;
    case -1:
      if( mai[head]>3 ) return;
      mai[head]++;
      break;
    default:
      break;
    }
    //if(type==0 || type==3 || type>=5 )
    if(type==-1)
      m.push(head);
    else
      n.push([head,type]);
  }
  
  this.delhi = function(order,is_n){
    var m = HandObj.hai;
    var mai = pvt_mai;
    var n = HandObj.n;
    if(is_n){
      type = n[order][1];
      head = n[order][0];
      if(type==0){ mai[head]--; mai[head+1]--; mai[head+2]--; }
      if(type==3){ mai[head]-=3; }
      if(type>=5){ mai[head]-=4; }
      n.splice(order,1);
    } else {
      mai[m[order]]--;
      m.splice(order,1);
    }
  }
}
var base64list = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
function base64encode(s)
{
  var t="";
  for( var i=0; i<s.length; i++)
    t += base64list.charAt(s[i] & 0x3f);
  return t;
}
function base64decode(t)
{
  var s = Array();
  for( var i=0; i<t.length; i++)
    s[i] = base64list.indexOf(t.substr(i,1));
  return s;
}
//////////////////////////////////////////////////////
