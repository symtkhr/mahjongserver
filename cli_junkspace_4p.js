Array.prototype.index = function(value){
  for (var i = 0; i < this.length; i++)
    if (this[i] == value) return i;
  return -1;
};
Array.prototype.clone = function(){
  var res=[];
  for (var i = 0; i < this.length; i++){ res.push(this[i]); }
  return res;
};
Array.prototype.diff = function(arr){
  for (var i = arr.length; i > 0; i--){ 
    var c = this.index(arr[i - 1]);
    if(c >= 0) this.splice(c, 1);
  }
  return this;
};
Number.prototype.toStrByteHex = function(){
  var s = this.toString(16);
  return (this < 0x10) ? ("0" + s) : s;
}
var posname = [ "top", "left", "bottom", "right"];
var ePos = [];
for (var i = 0; i < posname.length; i++) ePos[posname[i]] = i;
var id2num = function(id){ return Math.ceil(id / 4); }

var CHI   = 1;
var PONG  = 2;
var DMK   = 3;
var KAKAN = 4;
var ANKAN = 5;
var RONG  = 6;
var DISCTYPE_STOLEN = 1;
var DISCTYPE_REACH  = 2;

var exit = function(str){
  alert(str);
  stop_by_undefined_call();
}

var JangPlayer = function(){
  this.name;
  this.wind;
  this.pt;
  this.operable = false;
  this.pos = -1;
  this.tehai = [];
  this.tehai_furo = [];
  this.typfuro = [];
  this.furo_from = [];
  this.sutehai = [];
  this.sutehai_type = [];
  this.is_reach  = 0;
  this.is_1patsu = false; 
  this.tempai_target = [];
  this.is_furiten = false;
  this.is_hora = false;
  this.bit_naki = 0;
  this.token;

  this.draw_tile = function(tile){
    if(this.tehai.length % 3 != 1) exit("tahai or shohai");
    this.tehai.push(tile);
  }

  this.discard = function(target, is_call_reach){
    if (this.tehai.index(target) < 0){
      if (this.tehai.index(0) < 0) exit("invalid discard");
      this.tehai.diff([0]);
    } else { 
      this.tehai.diff([target]);
    }
    this.tehai.sort(function(a, b){ return a - b; });
    this.sutehai.push(target);
    if(is_call_reach) this.is_reach = 1;
    this.sutehai_type.push(is_call_reach ? DISCTYPE_REACH : 0);

    return true;
  }

  this.haifu2target = function(q) {
    var targets = [];
    for(var i = 0; i < q.length / 2; i++){
      var target = parseInt(q.substr(i * 2, 2), 16);
      if (this.tehai.index(target) < 0){
	if (this.tehai.index(0) < 0) return false;
	this.tehai.diff([0]);
      }
      targets.push(target);
    }
    return targets;
  }

  this.expose_tiles = function(turn, nakihai, op, qtarget) {
    var op2type = {
      "DECLC": CHI,
      "DECLP": PONG,
      "DECLK": DMK,
      "DECLF": RONG };
    var tehai = this.tehai;
    var target = this.haifu2target(qtarget);
    var typefuro = op2type[op];

    this.typfuro.push(typefuro);

    if (typefuro == DMK) {
      var gaito = [];
      var furohai = 4 * Math.ceil(nakihai / 4);
      for (var i = 0; i < 4; i++) gaito.push(furohai - i);
    } else {
      var gaito = [nakihai];
      for (var i = 0; i < target.length; i++) gaito.push(target[i]);
    }
    this.tehai = this.tehai.diff(gaito);
    this.tehai_furo.push(gaito);
    this.furo_from.push((this.wind - turn + 4) % 4);
    return true;
  }

  this.declare_hora = function(turn){
    this.is_hora = true;
    this.tempai_target = [];
    return true;
  }

  this.declare_own_kong = function(target){
    var tehai = this.tehai;
    var nakihai = id2num(parseInt(target, 16));

    var gaito = [];
    for(var i = 0; i < this.tehai.length; i++) {
      var id = this.tehai[i];
      if (id2num(id) == nakihai) gaito.push(id);
    }

    var gaito_furo = -1;
    for(var i = 0; i < this.tehai_furo.length; i++){
      var furo = this.tehai_furo[i];
      var nakihai1 = id2num(furo[0]);
      var nakihai2 = id2num(furo[1]);
      if(nakihai1 == nakihai2 && nakihai1 == nakihai){
	gaito_furo = i;
	break;
      }
    }

    // KaKong
    if(gaito_furo >= 0) {
      if(gaito.length != 1 && this.tehai.index(0) < 0) return false;
      var furo_ments = [];
      for (var i = 0; i < 4; i++) 
	furo_ments.push(id2num(parseInt(target, 16)) * 4 - i);
      var len = this.tehai.length;
      this.tehai = this.tehai.diff(furo_ments);
      while(len - this.tehai.length < 1) this.tehai = this.tehai.diff([0]);   
      this.tehai_furo[gaito_furo] = furo_ments;
      this.typfuro[gaito_furo] = KAKAN;
      return KAKAN;
    }
    // AnKong
    else {
      if(gaito.length != 4 && this.tehai.index(0) < 0) return false;
      var furo_ments = [];
      for (var i = 0; i < 4; i++) 
	furo_ments.push(id2num(parseInt(target, 16)) * 4 - i);
      var len = this.tehai.length;
      this.tehai = this.tehai.diff(furo_ments);
      while(len - this.tehai.length < 4) this.tehai = this.tehai.diff([0]);   
      this.tehai_furo.push(furo_ments);
      this.furo_from.push(0);
      this.typfuro.push(ANKAN);
      return ANKAN;
    }
  }

  this.find_target = function(sutenum, op) {
    var targets = [];
    switch(op) {
    case "DECLP":
      for(var i = 0; i < this.tehai.length; i++) {
	var target = this.tehai[i];
	if(sutenum == id2num(target)) targets.push(target);
      }
      break;

    case "DECLC":
      var diff = [-2, -1, 1, 2];
      var neighbors = [[], [], [], []];
      if(sutenum < 1 || 27 < sutenum) break;
      for(var i = 0; i < this.tehai.length; i++) {
	var target = this.tehai[i];
	for(var j = 0; j < diff.length; j++) {
	  var head = (sutenum - 1) % 9 + diff[j] + 1;
	  if(head < 1 || 9 < head) continue;
	  if(sutenum + diff[j] == id2num(target)) neighbors[j].push(target);
	}
      }
      if(neighbors[1].length == 0) neighbors[0] = [];
      if(neighbors[2].length == 0) neighbors[3] = [];

      for(var i = 0; i < neighbors.length; i++) {
	targets = targets.concat(neighbors[i]);
      }
      break;
    }
    return targets;
  }

  this.show_expose_tile_selection = function(targets){
    for (var i = 0; i < targets.length; i++) {
      var id = targets[i];
      var jq_id = this.wind + "hand_" + id.toStrByteHex();
      $("#" + jq_id).css("border", "2px solid blue").click(function(){
	  if($(this).hasClass("ex_selected"))
	    $(this).css("border-color", "blue").removeClass("ex_selected");
	  else
	    $(this).css("border-color", "red").addClass("ex_selected");
      });
    }
  };
};

var Layout = function() {
  var op2str = {"DECLC":"吃", "DECLP":"碰", "DECLK":"槓", "DECL0":"パス",
		"DECLF":"和了", "DRAW":"摸", "DISC":"打", "DISCR":"打"};
  var wind2name = ["東","南", "西", "北"];  
  
  this.init_layout = function() {
    for(var j = 0; j < 4; j++) {
      for(var i = 0; i < 4; i++) {
	$("#furo_" + posname[j] + i).hide();
      }
    }
    $("#point_table").hide();
    $("#point_table").html("");
  };
    
  this.show_operation = function(op) {
    if(op == null) {
      $("#operation").html("");
      return;
    }
    for (var i = 0; i < jang_cond.jp.length; i++)
      if (jang_cond.jp[i].operable) break;
    var jp = jang_cond.jp[i];
    var menu = op.split(";");
    var mes = "";

    if (menu.index("DISC") >= 0) {
      mes += '<button id="move_l" class="op">&lt;&lt;</button>';
      mes += '<div id="rc" class="op"></div>';
      mes += '<button id="move_r" class="op">&gt;&gt;</button>';
      if (!jp.is_reach) {
	var is_menzen = true;
	for (var i = 0; i < jp.furo_from.length; i++) {
          if (jp.furo_from[i] == 0) continue;
          is_menzen = false;
	}
	if (is_menzen) {
          mes += '<label class="reach_opt op">';
          mes += '<input type="checkbox" id="reach' + jp.wind + '">立</label>';
	}
      }
    }
    for (i = 0; i < menu.length; i++) {
      if (menu[i] === "DISC") continue;
      mes += "<button id='" + jp.wind + menu[i] + "' class='decl op'>";
      mes += op2str[menu[i].split("_")[0]] + "</button> ";
    }
    $("#operation").html(mes);
  };

  this.update_table_info = function() {


    
  };
  
  this.update_call_info = function(op, posname, is_horizon, qplayer, turn) {
    var jp = jang_cond.jp[qplayer];
    var str_flag = "";
    if (jp.is_reach) {
      var path = is_horizon ? "trans/reach-" : "reach";
      path = "../kappa12/haiga/" + path + ".png";
      str_flag += '<img src="' + path + '">';
    }
    //str_flag += jp.is_1patsu  ? "[即]" : "";
    //str_flag += jp.is_furiten ? "[振]" : "";
    //str_flag += jp.tempai_target.length > 0  ? "[聴]" : "";
    str_flag += jp.is_hora    ? "和了" : "";
    
    $("#call_" + posname).html(str_flag);
    if (jp.wind == turn && op !== "DECLF" && op !== "HAND" && op2str[op]) { 
      $("#call_" + posname).append(" " + op2str[op]);
    }
  };

  ////// [[Show Situation Notice]] //////
  this.dump_stat = function(qplayer, turn, haifu){
    this.qplayer = qplayer;
    var jp = jang_cond.jp[qplayer];
    var op = haifu.replace(/[^A-Z]/g,"");
    var this_pos = posname[jp.pos];
    var is_vertical = (jp.pos == ePos.left  || jp.pos == ePos.right);
    var is_reverse = (jp.pos == ePos.right || jp.pos == ePos.top);
    var sp = is_vertical ? "<br>" : " ";

    var imgpath = function(id, is_yoko) 
    {
      if(typeof is_yoko === "undefined") is_yoko = false;
      var is_trans = (is_vertical && !is_yoko) || (!is_vertical && is_yoko);
      var cmd0 =  cmd[id2num(id)];
      if (is_trans) cmd0 = "trans/" + cmd0 + "-";
      return  "../kappa12/haiga/" + cmd0 + ".gif";
    };


    // Table info
    $("#wind_" + this_pos + " .pt").html(jp.pt.toString(10));
    $("#wind_" + this_pos + " .ch").html(wind2name[jp.wind]);
    $("#wind_" + this_pos + " .name").html(jp.name);
    var obj = $("#wind_" + this_pos + ", #hand_" + this_pos);
    obj.css("background-color", turn == jp.wind ? "green":"")
       .css("color", turn == jp.wind ? "white" : "black");
    if (jp.is_hora) {
      obj.css("background-color","yellow").css("color", "black");
    }
    $("#wind_" + this_pos).css("z-index", turn == jp.wind ? 0 : 1);  

    this.update_call_info(op, this_pos, is_vertical, qplayer, turn);

    // Display hand
    var objarr = [];
    
    for (var i = 0; i < jp.tehai.length; i++) {
      if ((jp.wind == turn) && (i == jp.tehai.length - 1) &&
          (op === "DRAW" || op === "HAND")) objarr.push(sp);
      var id = jp.tehai[i];
      var attr = { "src" : imgpath(id),
                   "class" : (jp.wind == turn && (!jp.is_reach || i == jp.tehai.length - 1)) ? "inhand" : "",
                   "id"  : jp.wind + "hand_" + id.toStrByteHex() };
      objarr.push($("<img>").attr(attr));
    }

    var obj= $("#inhand_" + this_pos);
    obj.html("");
    for(var n = 0; n < objarr.length; n++) {
      var i = (!is_reverse) ? n : objarr.length - n - 1;
      obj.append(objarr[i]);
      if(is_vertical) obj.append("<br>");
    }

    for (var i = 0; i < jp.tehai_furo.length; i++) {
      var objarr = [];
      var furo = jp.tehai_furo[i];
      for (var j = 0; j < furo.length; j++) {
	var id = furo[j];
	if(jp.typfuro[i] == ANKAN){
	  var path0 = (j == 1 || j == 2) ? imgpath(0) : imgpath(id);
	} else if(furo.length == 4) {
	  var path0 = (j == 3 && jp.furo_from[i] == 3) || 
	    (j != 2 && j + 1 == jp.furo_from[i]) ? imgpath(id, true) : imgpath(id);
	} else {
	  var path0 = (j + 1 == jp.furo_from[i]) ? imgpath(id, true) : imgpath(id);
	}
	if(id == undefined) alert(i + "/" + j);
	var attr = { "src" : path0, 
		     "id" : "hand_" + id.toStrByteHex(),
		     "style" : "position:relative; "
	};
	/*
	if (furo.length == 4) {
	  //right->top, top->left, left->bottom, bottom->right
	  attr.style += posname[(jp.pos + 1) % 4] + ":" + (j * 3) + "pt"; 
	}
	*/
	objarr.push($("<img>").attr(attr));
      }
      var obj = $("#furo_" + this_pos + i);
      obj.show();
      obj.html("");
      for (var n = 0; n < objarr.length; n++) {
	var j = is_reverse ? (objarr.length - n - 1) : n;
	if (objarr.length == 4) 
	  objarr[j].css(is_vertical ? "top" : "left", (n * -3) + "pt");
	obj.append(objarr[j]);
	if (is_vertical) obj.append("<br>");
      }
    }

    var objarr = [];
    for (var i = 0; i < jp.sutehai.length; i++) {
      var id = jp.sutehai[i];
      if (id == 0) continue;
      var attr = { "id" : "disc_" + id.toStrByteHex() };
      switch(jp.sutehai_type[i]){
      case 1: 
	attr.src = imgpath(id);
	attr.style = "opacity:.4"; //border:red 1px solid;";
	break;
      case 2:
	attr.src = imgpath(id, true);
	break;
      case 3:
	attr.src = imgpath(id, true);
	attr.style = "opacity:.4;";
	break;
      default: 
	attr.src = imgpath(id);
	break;
      }
      objarr.push($("<img>").attr(attr));
    }

    for (var j = 0; j < 3; j++) {
      var obj = $("#discard_" + this_pos + j);
      obj.html("");
      for (var i = 0; i < 6; i++) {
	n = j * 6 + (is_reverse ? 5 - i : i);
	if(n < objarr.length){
	  obj.append(objarr[n]);
	  if (is_vertical) obj.append("<br>");
	}
      }
    }
  };
};

/////////////////////////////////////////////////////////////////////////////
var JangTable = function(){
  this.yama = 70;
  this.lingshang = 4;
  this.turn = 0;
  this.jp = [];
  this.haifu = [];
  this.dora = [];
  this.msgstock = [];
  this.banked = 0;
  this.is_rag = false;
  this.is_end = false;
  this.is_haitei = false;
  this.aspect = 0;

  this.init_aspect = function() {
    this.yama = 70;
    this.lingshang = 4;
    this.turn = 0;
    this.haifu = [];
    this.dora = [];
    this.msgstock = [];
    this.is_rag = false;
    this.is_end = false;
    this.is_haitei = false;
  }
  
  this.check_extra = function() {
    var JpInstance = this.jp;
    var cmd = [	 "##",
		 "1m","2m","3m","4m","5m","6m","7m","8m","9m",
		 "1p","2p","3p","4p","5p","6p","7p","8p","9p",
		 "1s","2s","3s","4s","5s","6s","7s","8s","9s",
		 "to","na","sh","pe","hk","ht","ch"];
    var t = [];
    for (var i = 0; i < 4; i++) {
      t = t.concat(JpInstance[i].tehai);
      var arr = JpInstance[i].tehai_furo;
      for (var j = 0; j < arr.length; j++) t = t.concat(arr[j]);
      var arr = JpInstance[i].sutehai;
      for (var j = 0; j < arr.length; j++) 
	if (!(JpInstance[i].sutehai_type[j] & DISCTYPE_STOLEN)) t.push(arr[j]);
    }
    t.sort(function(a, b){ return a-b; });
    var pre_id = 0;
    var mes_alert = "";
    var mes_alert_ex = "";
    for (var i = 0; i <  t.length; i++) {
      var id = t[i];
      if(id > 136) {
      } else if(pre_id + 1 < id){
	for(var j = pre_id + 1; j < id; j++) 
	  mes_alert += ( j.toString(16) + ":" + cmd[id2num(j)] + "/ ");
      } else if(pre_id + 1 > id){
	mes_alert_ex += ( id.toString(16) + ":" + cmd[id2num(id)] + "/ ");
      }
      pre_id = id;
    }
    if(mes_alert_ex || mes_alert) 
      $("#alert_mes").html('重複牌：' + mes_alert_ex);
    //$("#alert_mes").html('(' + mes_alert + ')<br>' + mes_alert_ex);  
    //echo count(t)." tiles\n";
  }

  this.make_haifu = function(str_haifu) {
    this.haifu.push(str_haifu);
  }

  this.dump_wangpai = function(){
    var cmd = [	 "back",
		 "1m","2m","3m","4m","5m","6m","7m","8m","9m",
		 "1p","2p","3p","4p","5p","6p","7p","8p","9p",
		 "1s","2s","3s","4s","5s","6s","7s","8s","9s",
		 "ton","nan","sha","pei","hak","hat","chu"];
    $("#deck").html("残" + this.yama);

    var obj = $("#wangpai");
    for(var i = 0; i < 7; i++) {
      var obj0 = obj.children("img").eq(i);
      if ( 1 < i && i - 2 < this.dora.length ) {
	var cmd0 = cmd[id2num(this.dora[i - 2])];
	obj0.attr({"src" : "../kappa12/haiga/" + cmd0 + ".gif"});
      } else {
	obj0.attr({"src" : "../kappa12/haiga/back.gif"});
      }
    }
  }

  this.change_position = function() {
    var JpInstance = this.jp;
    var myself = -1;
    for (var i = 0; i < JpInstance.length; i++) {
      if (!JpInstance[i].operable) continue;
      myself = i;
      break;
    }
    JpInstance[myself].pos = ePos.bottom;
    JpInstance[(myself + 1) % 4].pos = ePos.right;
    JpInstance[(myself + 2) % 4].pos = ePos.top;
    JpInstance[(myself + 3) % 4].pos = ePos.left;
  };
    
  this.eval_command = function(haifu){
    if (!haifu) return;
    if (haifu === "END") { this.is_end = true; return; }
    var reg = haifu.match(/^([0-3x])([A-Z0]+)_([0-9a-f]+)$/);
    if (!reg) return alert("Invalid format:" + reg);
    var qplayer = reg[1] * 1;
    var op = reg[2];
    var qtarget = reg[3];
    var jp = this.jp[qplayer];

    switch(op){
    case "DEAL":
      this.change_position(); // Layout制御
      for (var i = 0; i < 13; i++)
	jp.tehai.push(parseInt(qtarget.substr(i * 2, 2), 16));
      break;

    case "DRAW":
      this.turn = qplayer;
      jp.draw_tile(parseInt(qtarget, 16));
      this.is_rag = false;
      this.yama--;
      break;

    case "DORA":
      for (var i = 0; i < qtarget.length; i += 2)
	this.dora.push(parseInt(qtarget.substr(i, 2), 16));
      break;

    case "DISC":
    case "DISCR":
    case "DISCT":
    case "DISCRT":
      if (this.turn != jp.wind) return alert("invalid timing");
      var target = parseInt(qtarget, 16);
      var is_valid = jp.discard(target, op.indexOf("R") > 0);
      if (!is_valid) return alert("invalid target");
      this.is_rag = true;
      break;
      
    case "DECLF":
      jp.declare_hora(this.turn);
      break;

    case "DECLC":
    case "DECLP":
    case "DECLK":  
      if (qplayer == this.turn && op === "DECLK") {
	var naki_type = jp.declare_own_kong(qtarget);
	if (!naki_type) return alert("Invalid kong"); 
      } else {
	var nakare = this.jp[this.turn];
	var pos_discard = nakare.sutehai.length - 1;
	var nakihai = nakare.sutehai[pos_discard];
	jp.expose_tiles(this.turn, nakihai, op, qtarget);
	nakare.sutehai_type[pos_discard] |= DISCTYPE_STOLEN;
	this.turn = qplayer;
      }
      if (op === "DECLK") this.lingshang--; // [todo: needs after kong flag? 
      break;

    case "HAND":
      jp.tehai = [];
      for(var i = 0; i < qtarget.length / 2; i++)
	jp.tehai.push(parseInt(qtarget.substr(i * 2, 2), 16));
      break;

    default:
      return alert("invalid command");
    }
    this.make_haifu(haifu);
  }

  this.calc_payment = function(wind, is_display){
    var jp = this.jp[wind];
    if(!jp.is_hora && is_display) return;

    var stolen_jp = this.jp[this.turn];
    if (jp.is_changkong > 0) {
      var target = jp.is_changkong;
    } else if(this.turn == jp.wind) {
      var target = stolen_jp.tehai.pop(); 
      stolen_jp.tehai.push(target);
    } else {
      var target = stolen_jp.sutehai.pop();
      stolen_jp.sutehai.push(target);
    }

    var HandObj = new HandSet();
    for (var i = 0; i < jp.tehai.length; i++){
      HandObj.addhi(id2num(jp.tehai[i]) - 1, -1);
    }
    
    for (var i = 0; i < jp.tehai_furo.length; i++){
      var furo = jp.tehai_furo[i];
      var head = id2num(Math.min.apply(null, furo)) - 1;
      var type = id2num(furo[0]) != id2num(furo[1]) ? typ.chi :
        (furo.length == 3 ?  typ.pon : typ.kan ); // not considered ankong
      var type = jp.typfuro[i];
      if (type == CHI) type = typ.chi;
      else if (type == PONG) type = typ.pon;
      else if (type == DMK || type == KAKAN) type = typ.kan;
      else if (type == ANKAN) type = typ.ankan;
      HandObj.addhi(head, type);
    }

    var CalcObj = new HandCalc();
    CalcObj.ba_kz = Math.floor(this.aspect / 4); // 場 [0=東, 1=南, 2=西, 3=北]
    CalcObj.ch_kz = jp.wind; // 家 [0=東, 1=南, 2=西, 3=北]
    // 和了り方 [0=ロン, 1=ツモ, 2=牌底ロン, 3=牌底ツモ, 
    //          4=搶槓ロン, 5=嶺上ツモ, 6=配牌ロン, 7=配牌ツモ]
    CalcObj.tsumo = (this.turn == jp.wind);
    if (jp.is_kaihua) CalcObj.tsumo = 5;
    else if (jp.is_changkong > 0) CalcObj.tsumo = 4;
    else if (this.yama <= 0) CalcObj.tsumo += 2;
    else if (jp.is_tenho) CalcObj.tsumo += 6;

    // 立直 [0=ダマ, 1=立直, 2=立直一発, 3=W立直, 4=W立直一発]
    CalcObj.reach = (jp.is_reach == 2) ? 3 : jp.is_reach;
    if (CalcObj.reach > 0) CalcObj.reach += jp.is_1patsu ? 1 : 0;
    CalcObj.tsumi = 0; // 積み棒
    CalcObj.aghi = id2num(target) - 1; // 和了牌
    HandObj.addhi(CalcObj.aghi, -1);
    CalcObj.dora  = 0; // ドラ枚数
    var mai = HandObj.mai();

    for (var j = 0; j < this.dora.length; j++) {
      var dora = id2num(this.dora[j]) - 1;
      if(dora % 9 == 8) dora -= 8;
      else if(dora == hi.pei) dora = hi.ton;
      else if(dora == hi.chu) dora = hi.hak;
      else dora++;

      for (var i = 0; i < mai.length; i++) {
	if (i == dora) CalcObj.dora += mai[i];
      }
    }
    var ResObj  = new JangResult();
    ResObj.get_result_by_hand(HandObj, CalcObj);

    var point = [CalcObj.point(0)];
    if (CalcObj.tsumo % 2 == 1) {
      if (CalcObj.ch_kz == 0) 
	point.push(CalcObj.point(1));
      else
	point.push(CalcObj.point(2), CalcObj.point(1));
    }

    if (!is_display) return point[0];

    //Layout制御
    var imgpath = function(id, is_yoko) 
    {
      var cmd0 =  cmd[id2num(id)];
      if(is_yoko) cmd0 = "trans/" + cmd0 + "-";
      return  "../kappa12/haiga/" + cmd0 + ".gif";
    };

    //和了手表示
    if(0) {
    var objarr = [];
    var jp = this;
    if(is_tsumo) jp.tehai.pop();
    for (var i = 0; i < jp.tehai.length; i++) {
      var id = jp.tehai[i];
      var attr = { "src" : imgpath(id),
                    "id"  : jp.wind + "hand_" + id.toStrByteHex() };
      $("#point_table").append($("<img>").attr(attr));
    }
    $("#point_table").append(is_tsumo ? "ツモ" : "ロン");
    var attr = { "src" : imgpath(target),
		 "id"  : jp.wind + "hand_" + id.toStrByteHex() };
    $("#point_table").append($("<img>").attr(attr));

    for (var i = 0; i < jp.tehai_furo.length; i++) {
      var objarr = [];
      var furo = jp.tehai_furo[i];
      $("#point_table").append(" ");
      for (var j = 0; j < furo.length; j++) {
	var id = furo[j];
	if(jp.typfuro[i] == ANKAN){
	  var path0 = (j == 1 || j == 2) ? imgpath(0) : imgpath(id);
	} else if(furo.length == 4) {
	  var path0 = (j == 3 && jp.furo_from[i] == 3) || 
	    (j != 2 && j + 1 == jp.furo_from[i]) ? imgpath(id, true) : imgpath(id);
	} else {
	  var path0 = (j + 1 == jp.furo_from[i]) ? imgpath(id, true) : imgpath(id);
	}
	if(id == undefined) alert(i + "/" + j);
	var attr = { "src" : path0 };
	$("#point_table").append($("<img>").attr(attr));
      }
    }
    }
    // 点数表示
    var res = '<div style="background:white; top:0; right:0; left:0; height:69px; padding:2px;" class="payment">';
    res += '<div style="float:right;" id="doradisp"></div>';
    res += CalcObj.yaku().join(", ");
    if (CalcObj.dora > 0) res += ", ドラ" + CalcObj.dora;
    res += "<br>";
    res += "= " + ResObj.CalcObj.han() + "翻";
    res += (10 * Math.ceil(ResObj.CalcObj.fu() / 10)) + "符";
    if (point.length == 1)
      res += " = <b>" + CalcObj.point(0) + "点</b>";
    else if (point.length == 2) 
      res += " = <b>" + point[1] + "点オール</b>";
    else if (point.length == 3)
      res += " = <b>" + point[1] + " / " + point[2] + "点</b>";
    $("#point_table").append(res);

    //王牌表示
    $("#doradisp").append("<b>王牌</b><br>");
    for(var i = 0; i < this.dora.length; i++) {
      if(i * 2 == this.dora.length && jp.is_reach) $("#doradisp").append("<br>");
      var id = this.dora[i];
      var attr = { "src" : imgpath(id) };
      $("#doradisp").append($("<img>").attr(attr));
    }

    return point;
  }


}

