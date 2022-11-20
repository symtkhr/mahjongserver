var jang_cond = new JangTable;
var jang_disp = new Layout;

var jang_player_set = function(obj) {
  if (obj.q === "renew")
    jang_cond.jp[obj.wind] = new JangPlayer;
  
  var jpobj = jang_cond.jp[obj.wind];
  jpobj.wind = obj.wind;
  
  if (obj.q === "calc") {
    jpobj.is_kaihua = obj.is_kaihua;
    jpobj.is_tenho  = obj.is_tenho;
    jpobj.is_reach  = obj.is_reach;
    jpobj.is_1patsu = obj.is_1patsu;
    jpobj.is_changkong = obj.changkong;
    jang_cond.is_end = true;

    var point = jang_cond.calc_payment(obj.wind, true);
    jang_cond.msgstock.push({p:point, q:"calc", wind:jpobj.wind});
    return;
  }

  jpobj.name = obj.name;
  jpobj.pt = obj.pt;
  jpobj.operable = obj.operable;
};

$.wait = function(msec) {
  var d = new $.Deferred;
  setTimeout(function() { d.resolve(); }, msec);
  return d.promise();
};

var jang_table_set = function(obj) {
  if (obj.q === "renew") jang_cond = new JangTable;
  jang_cond.aspect = obj.aspect;
  jang_cond.apply_tileset(obj.tileset);
  jang_disp.layout_aspect(obj);
};

var SocketHandler = function() {
  var wsUri = "ws://" + getRequest().srv;
  var wsUri = getRequest().srv;
  var websocket = new WebSocket(wsUri || "ws://localhost");
  //var websocket = {onopen:null, onclose:null, onmessage:null};
  var gSpareTime = 10;
  var gPassTime = 3;
  var gPsgID = 0;  

  websocket.onopen = function(ev) {
    $('#sel_haifu').append("<span>Connected!</span>\n");
    if (getRequest()) get_stats();
  };

  websocket.onmessage = function(ev) {
    var msg = JSON.parse(ev.data);
    msglist.push(msg);
    parse_msg();

    // for debug
    var res = "";
    for (var i in msg) res += (i + ":" + msg[i] + "/");
    $("#sel_haifu").append(res + "\n");
  };

  websocket.onerror = function(ev){
    $('#message').append('通信エラー発生(' + ev.data + ")");
  }; 

  websocket.onclose = function(ev){
    var res = "[切断]<br>接続が切れました。<br>再読込してください。";
    $('#point_calc').show().html(res);
    $("#point_table").show();
  }; 

   this.onmessage_test = function(msg) {
	msglist.push(msg);
	parse_msg();
  };
  
  var get_stats = function(){
    jang_cond.haifu = [];
    var msg = {"size": 0, h: "", q:"history"};
    jang_disp.is_loading = true;
    if (getRequest()) msg["id"] = getRequest().token;
    websocket.send(JSON.stringify(msg));
  };
  
  var handle_haifu = function(msg) {
    var func = [];
    var got_haifu = msg.haifu.split(";");
    var step = function(haifu) {
      return function() {
	var d = new $.Deferred;
	jang_cond.eval_command(haifu);
	var msec = (haifu.match(/DEAL/)) ? 1 : 500;
	if (haifu.match(/DISCT?R/) || haifu.match(/DECLF0/)) {
	  msec = 1500;
	}
	return $.wait(msec);
      };
    };

    if (jang_disp.is_loading) {
      for (var i = 0; i < got_haifu.length; i++) {
	jang_cond.eval_command(got_haifu[i]);
      }
      jang_disp.dump_stat(got_haifu[i - 1]);
      jang_disp.is_loading = false;
      is_waiting = false;
      parse_msg();
    } else {
      // console.log("not loading");
      $("#message").html("");
      var call = $.wait(10);
      for (var i = 0; i < got_haifu.length; i++) {
	call = call.then(step(got_haifu[i]));
      }
      call.then(function(){ is_waiting = false; parse_msg(); });
    }
    return;
  }

  //layout制御?
  var startCount = function(timeout_event, timer, is_long) {
    gSpareTime = timer;
    gPassTime = 1 + (is_long ? 10 : 5);
    clearInterval(gPsgID);
    //return;
    gPsgID = setInterval(function() {
	if (0 < gPassTime) 
	  gPassTime--;
	else
	  gSpareTime--; 
	$("#count").show().html(gPassTime.toString(10) + "+" + 
				gSpareTime.toString(10));
	if (0 <= gPassTime + gSpareTime) return;
	timeout_event();
      }, 1000);
  };
  
  var approval_ok = function() {
    var msg = { "q" : "approval" };
    if (getRequest()) msg["id"] = getRequest().token;
    websocket.send(JSON.stringify(msg));
    $("#approval").unbind().attr("disabled", true);
    $("#message").html("おまちください");
  };

  var send_msgstock = function() {
    while (jang_cond.msgstock.length > 0) {
      var msg = jang_cond.msgstock.shift();
      if (getRequest()) msg.id = getRequest().token;
      websocket.send(JSON.stringify(msg));
    }
  };

  var msglist = [];
  var undealt_haifu = [];
  var is_waiting = false;

  var parse_msg = function() {
    if (is_waiting) return;
    if (msglist.length == 0) return;

    var msg = msglist.shift();
    var type = msg.type;

    switch (msg.type) {
    case "table":
      jang_disp.init_layout();
      jang_table_set(msg);
      break;
      
    case "player":
      jang_player_set(msg);
      send_msgstock();
      jang_disp.update_table_info();
      break;

    case "haifu":
      is_waiting = true;
      handle_haifu(msg);
      break;
     
    case "layout":
      layout_set(msg);
      break;
      
    case "disconnect":
      jang_cond.jp[msg.wind].is_connect = false;
      jang_disp.update_table_info();
      break;
      
    case "to_gate":
      location.href = "login_junk.html";
      break;

    default:
      // for debug
      for(var key in msg) {
	$("#sel_haifu").append(key + " = " + msg[key] + "<br>");
      }
      /*
      for(var i in msg.jp) {
	for(var key in msg.jp[i]){
	  $("#sel_haifu").append("jp[" + i + "]."+key + " = " +
				 msg.jp[i][key] + "<br>");
	}
      }
      */
      break;
    }
    parse_msg();
  };
  
  var layout_set = function(obj) {
    switch(obj.op) {
    case "payment":
      $(window).unbind("keydown"); 
      count_stop();
      jang_disp.layout_payment(obj);
      $("#approval").show().unbind().click(approval_ok).focus().attr("disabled", false);
      break;

    case "approval":
      //Layout制御
      $(".op, .ops, #show_table").hide();
      $("#operation .opc").hide();
      jang_cond.change_position();
      jang_disp.update_table_info();
      $("#point_calc").html("[半荘開始]").show();
      $("#point_agenda").html("[OK]ボタンをおしてください。").show();

      //Socket制御
      $("#approval").show().unbind().click(approval_ok).focus().attr("disabled", false);
      break;

    case "waiting":
      $(".op, .opc, .ops").hide();
      $("#message").html("予約中です...");
      break;

    case "finish":
      finished_ranking();
      break;

    default:
      turning_operation(obj);
      break;
    }
  };

  var turning_operation = function(obj) {
    count_stop();
    if (jang_cond.is_end) return;
    jang_disp.show_operation(obj.op);
    $("#rc, #move_l, #move_r, .decl, .inhand").unbind();
    $("#point_table, .payment").hide();
    
    $(window).unbind("keydown"); 
    $(window).keydown(function(e) {
      if (e.keyCode == "R".charCodeAt(0))
	$("#reach").attr("checked", !$("#reach").attr("checked"));
      if (e.keyCode == "N".charCodeAt(0))
	$("#unsteal").attr("checked", !$("#unsteal").attr("checked"));
      // for debug
      if (e.keyCode == "1".charCodeAt(0)) w = top.user01_frame.focus();
      if (e.keyCode == "2".charCodeAt(0)) w = top.user02_frame.focus();
      if (e.keyCode == "3".charCodeAt(0)) w = top.user03_frame.focus();
      if (e.keyCode == "4".charCodeAt(0)) w = top.user04_frame.focus();
      });
    
    if (!obj.op) return;
    if (obj.op.indexOf("DISC") < 0) {
      calling_turn(obj);
    } else {
      discard_turn(obj);
    }
  };

  var calling_turn = function(obj) {
    $(".decl").click(click_declaration);
    if ($("#unsteal").attr("checked")) {
      $("#DECLK, #DECLC, #DECLP").hide();
    }
    if ($("#unrong").attr("checked")) {
      $("#DECLF").hide();
    }
    if (auto_pass(obj.op)) {
      declare_sender("DECL0");
      return;
    }
    startCount(declare_sender, obj.time, false);
    $(".last_discard").css("border", "red 2px solid");
    ring_your_turn();
    $(window).keydown(function(e) {
	if (e.keyCode == "O".charCodeAt(0)) declare_sender("DECL0");
	if (e.keyCode == "C".charCodeAt(0)) declare_sender("DECLC");
	if (e.keyCode == "P".charCodeAt(0)) declare_sender("DECLP");
	if (e.keyCode == "K".charCodeAt(0)) declare_sender("DECLK");
	if (e.keyCode == "H".charCodeAt(0)) declare_sender("DECLF");
	
	if (0 < $(".ops:focus").length) {
	  //console.log($(".ops:focus").next().attr("id"));
	  if (e.keyCode == 0x27) $(".ops:focus").next().focus();
	  if (e.keyCode == 0x25) $(".ops:focus").prev().focus();
	} else {
	  if (e.keyCode == 0x25) $("#DECL0").focus();
	  if (e.keyCode == 0x27) $("#DECL0").focus();
	}
      });
  }

  var discard_turn = function(obj) {
    $(".decl").click(click_declaration);
    if (auto_discard(obj.op)) {
      discard_sender();
      return;
    }
    $(".inhand, #rc").click(inhand_click);
    $("#move_l, #move_r").click(function() {
	jang_disp.click_arrow_button($(this).attr("id"));
      });
    startCount(discard_sender, obj.time, false);
    ring_your_turn();
    
    $(window).keydown(function(e) {
	if (e.keyCode == 0x25) jang_disp.click_arrow_button("move_l");
	if (e.keyCode == 0x27) jang_disp.click_arrow_button("move_r");
	if (e.keyCode == 0x0d) discard_sender();
	if (e.keyCode == "K".charCodeAt(0)) declare_sender("DECLK");
	if (e.keyCode == "H".charCodeAt(0)) declare_sender("DECLF");
	return false;
      });
  }

  var finished_ranking = function() {
    var rank = [0, 1, 2, 3].sort(function(a,b){
	return jang_cond.jp[b].pt - jang_cond.jp[a].pt; 
      });
    
    var res = "<ol>";
    var res = "";
    for (var i = 0; i < 4; i++){
      res += "[" + (i + 1) + "位] ";
      //res += "<li>" 
      res += jang_cond.jp[rank[i]].name;
      res += " (" + jang_cond.jp[rank[i]].pt + ")<br>";
    }
    //res += "</ol>";
    $(".payment").hide();
    $("#point_calc").html("[半荘終了]").show();
    $("#point_agenda").html(res).show();
    $("#message").html('<a href="login_junk.html">トップに戻る</a>');
  }

  var ring_your_turn = function() {
    //return;
    var audio = new Audio("./pon.mp3");
    audio.play();
  }

  var auto_discard = function(op) {
    if (!jang_cond.jp[jang_cond.turn].is_reach) return false;
    if ((op.indexOf("DECLF") < 0) && (op.indexOf("DECLK") < 0)) return true;
    return false;
  }

  var auto_pass = function(op) {
    var unsteal = $("#unsteal").attr("checked");
    var unrong = $("#unrong").attr("checked");
    if (unrong && unsteal) return true;
    if (unsteal && op.indexOf("DECLF") < 0) return true;
    if (unrong && !op.match(/DECL[CPK]/)) return true;
    return false;
  }

  var inhand_click = function() {
    if (!jang_disp.click_inhand($(this))) return false;
    if ($(".ex_selected").length != 1) return false;   
    discard_sender();
  }
  
  var discard_sender = function() {
    count_stop();

    //layout制御
    var obj = ($(".ex_selected").length != 1) ? 
    $(".inhand:last") : $(".ex_selected");
    
    // socket制御
    var haifu = obj.attr("id").split("hand_").join("DISC_");
    if ($("#reach").attr("checked")) 
      haifu = haifu.split("DISC_").join("DISCR_");

    var msg = { 
      "size": jang_cond.haifu.length, 
      "h": haifu, 
      "q":"haifu",
      "time" : gSpareTime + (gPassTime == 6 ? 1 : 0),
    };

    if (getRequest()) msg["id"] = getRequest().token;
    websocket.send(JSON.stringify(msg));

    // Layout制御
    $("#operation .op").hide();
    $("#operation .ops").hide();
    $("#rc").html("");
    $("#message").html("おまちください");
  }
  
  var jp_operable = function() {
    for (var i = 0; i < jang_cond.jp.length; i++)
      if (jang_cond.jp[i].operable) return i;
    return -1;
  }

  var pass_process = function(msg) {
    var haifu = msg.h;
    if (!haifu.match(/^[0-3]DECL0/)) return false;
    msg.h += "_0";
    websocket.send(JSON.stringify(msg));
    waiting_message(msg);
    return true;
  }

  var selective_declaration = function(msg) {
    // TODO: ex_selected 消し, 操作ボタン系判定
    if ($(".ex_selected").length == 0) return false;
    msg.h += "_";
    $(".ex_selected").each(function(){
	msg.h += $(this).attr("id").split("hand_").pop();
      });
    websocket.send(JSON.stringify(msg));
    waiting_message(msg);
    return true;
  }
  
  var hora_process = function (msg) {
    if (!msg.h.match(/DECLF/)) return false;
    var player = parseInt(msg.h.substr(0, 1));
    var point = jang_cond.calc_payment(player, false);
    if (point == 0) msg.h += "0";
    msg.h += "_0";
    websocket.send(JSON.stringify(msg));
    waiting_message(msg);
    return true;
  }

  var waiting_message = function(msg) {
    // console.log(msg);
    $("#message").html("おまちください");
    $(".last_discard").css("border", "none").removeClass("last_discard");
  }
  
  var kong_process = function(msg) {
    if (!msg.h.match(/DECLK/)) return false;
    var player = parseInt(msg.h.substr(0, 1));
    var jp = jang_cond.jp[player];
    
    if (jang_cond.turn != jp.wind) {
      var nakihai = jang_cond.discard_tile_just_now();
      msg.h += "_" + nakihai.toStrByteHex();
    } else {
      var targets = jp.find_target("DECLK");
      //console.log(targets);
      if (targets.length != 1) 
      {
	jp.show_kong_tile_selection(targets);
	$("#message").html("牌選択 → 槓");
	$(".decl").attr("disabled", false);
	startCount(discard_sender, msg.time, false);
	return true;
      }
      msg.h += "_" + targets[0].toStrByteHex();
    }
    websocket.send(JSON.stringify(msg));
    waiting_message(msg);
    return true;
  }

  var chipong_process = function(msg) {
    if (!msg.h.match(/DECL[CP]/)) return false;

    var nakihai = jang_cond.discard_tile_just_now();
    var player = parseInt(msg.h.substr(0, 1));
    var jp = jang_cond.jp[player];
    var targets = jp.find_target(msg.h, id2num(nakihai));

    if (2 < targets.length) {
      jp.show_expose_tile_selection(targets);
      $("#message").html("牌選択 → " + (msg.h.match(/DECLP/) ? "碰" : "吃"));
      $(".decl").attr("disabled", false);
      startCount(declare_sender, msg.time, true);
      return true;
    }

    if (targets.length != 2) {
      $("#message").html("不正な宣言:" + targets.join(";")); 
      return true;
    }

    msg.h += "_";
    for (var i = 0; i < targets.length; i++) {
      msg.h += targets[i].toStrByteHex();
    }
    websocket.send(JSON.stringify(msg));
    waiting_message(msg);
    return true;
  }
  
  var click_declaration = function() {
    declare_sender($(this).attr("id"));
  }

  var count_stop = function() {
    clearInterval(gPsgID);
    $("#count").hide();
    $(".decl").attr("disabled", true);
    $("#count, #move_l, #move_r, #rc").hide();
  }

  var declare_sender = function(op){
    if (op === undefined) op = "DECL0";
    if ($("#" + op).is(":hidden")) return;

    count_stop();

    var msg = { 
      "size": jang_cond.haifu.length, 
      "h": (jp_operable() + op),
      "q": "haifu",
      "time" : gSpareTime,
    };
    if (getRequest()) msg.id = getRequest().token;
    if (pass_process(msg)) return;
    if (selective_declaration(msg)) return;
    if (hora_process(msg)) return;
    if (kong_process(msg)) return;
    if (chipong_process(msg)) return;
    
    $(this).append("/" + haifu);
  }
  
};

SocketHandler.prototype.unit_test = function()
{
  var msg = {wind:0, q:"renew"};
  for(var i = 0; i < 4; i++) {
    jang_cond.jp[i] = new JangPlayer;
    jang_cond.jp[i].wind = i;
  }
  $("#reservation").hide();
  
  jang_cond.jp[2].operable = true;
  
  var msg = {type: "haifu", haifu:
  [
   "0DEAL_0c121426333e454d4f506b6f88",
   "1DEAL_0407133b4a5460626471747d7f",
   "2DEAL_1632383a3f4046525c5d697284",
   "3DEAL_05222d2e3547515658797a8087",
   "xDORA_57",
   
   "0DRAW_0d",
   "0DISC_88",
   "1DRAW_82",
   "1DISC_04",
   "2DRAW_63",
   "2DISC_84",
   "3DRAW_17",
   "3DISC_47",
   "0DRAW_0a",
   "0DISC_6f",
   "1DRAW_55",
   "1DISC_07",
   "2DRAW_75",
   "2DISC_75",
   "3DRAW_39",
   "3DISC_80",
   
"0DRAW_06",
   "0DISC_6b",
   "1DRAW_81",
   "1DISC_13",
   "0DECLP_1412",
   "0DISC_26",
   "1DRAW_7c",
   "1DISC_7c",
   "3DECLP_797a",
   "3DISC_87",
   "0DRAW_67",
   "0DISC_67",
   "1DRAW_70",
   "1DISC_3b",
   "2DRAW_73",
   "2DISC_69",
   "3DRAW_85",
   "3DISC_85",
   "0DRAW_34",
   "0DISC_3e",
   "1DRAW_59",
   "1DISC_4a",
   "2DRAW_41",
   "2DISC_32",
   "0DECLP_3334",
   "0DISC_0d",
   "1DRAW_7e",
   "1DISC_70",
   "2DRAW_1b",
   "2DISCR_52",
   "3DRAW_0f",
   "3DISC_22",
   "0DRAW_4e",
   "0DECLK_4e",
   "xDORA_03",
   "0DRAW_36",
   "0DISC_06",
   "1DRAW_23",
   "1DISC_23",
   //      "2DRAW_13",
   
   "2DRAW_7b",
   "2DISC_7b",
   "3DRAW_3d",
   "3DISC_58",
   "0DRAW_53",
   "0DISC_53",
   "1DRAW_2a",
   "1DISC_2a",
   "2DRAW_5a",
   "2DISC_5a",
   "3DECLC_5156",
   "3DISC_05",
   "0DRAW_31",
   //*
   "0DECLK_31",
   
   "0DRAW_0b",
   "0DISC_45",
   "xDORA_6e",
   "1DRAW_1c",
   "1DISC_1c",
   "2DRAW_09",
   "2DISC_09",
   
   "0DECLK_0c",
   "0DRAW_21",
   //"0DRAW_".sprintf("%02x", (5+9)*4-1),
   //*
   "0DISC_36",
   "xDORA_28",
   "1DRAW_68",
   "1DISC_64",
   "2DRAW_61",
   "2DISC_61",
   "3DRAW_78",
   "3DISC_78",
   "0DRAW_11",
   "0DECLK_11",
   "3DECLF_0",
   "3HAND_",
   //"0DRAW_24"
   ].join(";")
  };
    var msgs = [
	{type:"table", q:"renew", tileset:"transp;wron",aspect:7, honba:0, banked:-20 },
//  {type:"table", q:"renew", aspect:7, honba:0, banked:-20 },
  {type:"player", q:"renew", wind:1, pt:10, name:"SpringFire",  operable:false},
  {type:"player", q:"renew", wind:2, pt:20, name:"SummerWater", operable:false},
  {type:"player", q:"renew", wind:3, pt:0, name:"AutumnWind",  operable:true },
  {type:"player", q:"renew", wind:0, pt:-10, name:"WinterEarth", operable:false},
  {type:"haifu", haifu:"1DEAL_00000000000000000000000000;2DEAL_00000000000000000000000000;3DEAL_060a0e12161a1e2d2e33373a3e;0DEAL_00000000000000000000000000;xDORA_88;0DRAW_00;0DISCT_85;1DRAW_00;1DISCT_2f;3DECLP_2d2e;3DISCT_3e;0DRAW_00;0DISC_6d;1DRAW_00;1DISCT_86;2DRAW_00;2DISCT_87;3DRAW_30"},
  {type:"layout", op:"DECLK_30;DISC", time:10}];
    for(var i = 0; i < msgs.length; i++) {
      this.onmessage_test(msgs[i]);
    }
    setTimeout(() => $("#point_calc, #point_table").hide(), 500);
}
  

var show_rule_yaku = function() {
  var yakudef = HandCalc.prototype.yaku_all;
  var yakudis = HandCalc.prototype.yaku_disable; 
  var yakulist = [];

  for (var yakutag in yakudef){
    if(yakudis[yakutag]) continue;
    var han = yakudef[yakutag][0];
    var naki = yakudef[yakutag][1];
    if (!yakulist[han]) yakulist[han] = [];
    yakulist[han]
      .push("<span style='white-space:nowrap;'>" +
	    yakudef[yakutag][2] + "(" + han +
	    (naki != han ? ("/" + naki) : "") + ")</span>");
  }
  $("#yakulist").html("<ul>");
  for (var i = 0; i < yakulist.length; i++) {
    if (!yakulist[i]) continue;
    var res = yakulist[i].join(", ");
    $("#yakulist ul").append("<li>" + res + "</li>");
  }
  $("#open_rule").click(function() { 
      var obj = $("#rule_detail");
      if (obj.is(":hidden")) 
	obj.show();
      else
	obj.hide(); 
  });
}

var hi_tag = function(hi){
    if (hi == "") return "";
    if (hi < 0 || 34 <= hi) hi = 34;

    const hinamej = [
        "一萬","二萬","三萬","四萬","五萬","六萬","七萬","八萬","九萬",
        "一筒","二筒","三筒","四筒","五筒","六筒","七筒","八筒","九筒",
        "一索","二索","三索","四索","五索","六索","七索","八索","九索",
        "東","南","西","北","白","發","中"
    ];

    let x = (hi % 9);
    let y = (hi - x) / 9;
    let img = {
        style: ["left:" + (-x * 18) + 'px', "top:" + (-y * 24) + "px"].join(";"),
        src: "haiga.png",
        alt: hinamej[hi] || "■",
    };

    let $img = "<img " + Object.keys(img).map(key => key + "=" + img[key]).join(" ") + ">";
    return '<span class="tile">' + $img + "</span>";
};


var getRequest = function(){
  if(location.search.length > 1){
      var get = {};
      location.search.slice(1).split("&").map(v => {
	  let factor = v.split("=");
	  get[factor[0]] = factor[1];
      });
      return get;
  }
    return false;
};

$(document).ready(function(){
    show_rule_yaku();

    var socks = new SocketHandler;
    if (location.search == "?unittest") socks.unit_test();
    // for debug
    var id = parseInt(getRequest().token);
    $("#sel_haifu").append(id + "(=" + id.toString(16) + ")\n");
});
