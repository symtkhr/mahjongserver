var jang_cond = new JangTable;
var gPsgID = 0;  
var gStep = 0;
var gRtime = 5;

var jang_player_set = function(obj) {
  if(obj.q === "renew")
    jang_cond.jp[obj.wind] = new JangPlayer;

  var jpobj = jang_cond.jp[obj.wind];
  jpobj.wind = obj.wind;

  if(obj.q === "calc") {
    jpobj.is_kaihua = obj.is_kaihua;
    jpobj.is_tenho  = obj.is_tenho;
    jpobj.is_reach  = obj.is_reach;
    jpobj.is_1patsu = obj.is_1patsu;
    jpobj.is_changkong = obj.changkong;
    jang_cond.is_end = true;
    clearInterval(gPsgID);
    var point = jang_cond.calc_payment(obj.wind, true);
    jang_cond.msgstock.push({p:point, q:"calc", wind:jpobj.wind});
    return;
  }

  jpobj.name = obj.name;
  jpobj.pt = obj.pt;
  jpobj.operable = obj.operable;

  /*
  for(var key in jang_cond.jp[obj.wind]){
    $("#sel_haifu").append("jp[" + obj.wind + "]."+key + " = " + 
			   jang_cond.jp[obj.wind][key] + "<br>");
  }
  */
};

var jang_table_set = function(obj) {
  if (obj.q === "renew") jang_cond = new JangTable;
  jang_cond.aspect = obj.aspect;
  (new Layout).layout_aspect(obj);
};

var SocketHandler = function() {
  var wsUri = "ws://" + getRequest().srv;
  var wsUri = getRequest().srv;
  //var wsUri = "ws://192.168.11.22:9000"; 	
  var websocket = new WebSocket(wsUri); 
  
  websocket.onopen = function(ev) {
    $('#sel_haifu').append("<span>Connected!</span>\n");
    if(getRequest()) get_stats();
  }
  
  var get_stats = function(){
    jang_cond.haifu = [];
    var msg = { "size": 0, "h": "", q:"history"};
    if (getRequest()) msg["id"] = getRequest().token;
    websocket.send(JSON.stringify(msg));
  };
  
  var handle_haifu = function(msg) {
    //jang_table制御
    var got_haifu = msg.haifu.split(";");
    for (var i = 0; i < got_haifu.length; i++){
      jang_cond.eval_command(got_haifu[i]);
    }

    (new Layout).display_handle_haifu(got_haifu);
    
    //layout制御?
    var startCount = function() {
      gRtime = 5;
      clearInterval(gPsgID);
      return;
      gPsgID = setInterval(function() {
	  $("#count").html(gRtime.toString(10));
	  gRtime--; 
	  if (gRtime >= 0) return;
	  discard_sender();
	}, 1000);
    };
    
    //consider rong or rag
    if (jang_cond.jp[jang_cond.turn].operable && !jang_cond.is_rag
       && !jang_cond.is_end
       ) 
      startCount();
    
    jang_cond.dump_wangpai();
    jang_cond.check_extra(); // for debug
    $("#step").html(jang_cond.haifu.length); // for debug
    
    if (jang_cond.is_end) return;
  }

  var approval_ok = function() {
    var msg = { "q" : "approval" };
    if (getRequest()) msg["id"] = getRequest().token;
    websocket.send(JSON.stringify(msg));
    $("#approval").hide();
    $("#message").html("おまちください");
  };

  var send_msgstock = function() {
    while (jang_cond.msgstock.length > 0) {
      var msg = jang_cond.msgstock.shift();
      if(getRequest()) msg.id = getRequest().token;
      websocket.send(JSON.stringify(msg));
    }
  }

  websocket.onmessage = function(ev) {
    var msg = JSON.parse(ev.data);
    var type = msg.type;
    
    for (var i in msg) 
      $("#sel_haifu").append(i + ":" + msg[i] + "/");
    $("#sel_haifu").append("\n");
    
    var JpInstance = jang_cond.jp;
    switch (type) {
    case "table":
      (new Layout).init_layout();
      jang_table_set(msg);
      break;
      
    case "player":
      jang_player_set(msg);
      send_msgstock();
      break;

    case  "haifu":
      handle_haifu(msg);
      break;
     
    case "layout":
      layout_set(msg);
      break;
      
    case "approval":
      break;

    case "disconnect":
      jang_cond.jp[msg.wind].is_connect = false;
      break;
      
    default:
      // for debug
      for(var key in msg) {
	$("#sel_haifu").append(key + " = " + msg[key] + "<br>");
      }
      for(var i in msg.jp) {
	for(var key in msg.jp[i]){
	  $("#sel_haifu").append("jp[" + i + "]."+key + " = " +
				 msg.jp[i][key] + "<br>");
	}
      }
      break;
    }
  };
  
  var layout_set = function(obj) {
    switch(obj.op) {
    case "payment":
      (new Layout).layout_payment(obj);
      $("#approval").click(approval_ok);
      break;

    case "approval":
      //Layout制御
      $(".op, .ops, #show_table").hide();
      $("#operation .opc").hide();
      $("#approval").show();
      jang_cond.change_position();
      (new Layout).update_table_info();
      //Socket制御
      $("#approval").click(approval_ok);
      break;

    case "waiting":
      $("#reservation").show().html("予約中です... (現在:"  + obj.current + "人)");
      $("#operation .opc").hide();
      break;

    case "finish":
      var rank = [0,1,2,3].sort(function(a,b){
	  return jang_cond.jp[b].pt - jang_cond.jp[a].pt; 
	});

      var res = "<div id='point_calc' class='payment'>[半荘終了]</div>";
      res += "<div id='point_agenda' class='payment'>";
      res += "<ol>";
      for (var i = 0; i < 4; i++){
	res += "<li>" + jang_cond.jp[rank[i]].name;
	res += " (" + jang_cond.jp[rank[i]].pt + ")</li>";
      }
      res += "</ol>";
      res += "</div>";
      $("#point_table").html(res);
      break;

    default:
      (new Layout).show_operation(obj.op);
      $("#rc, #move_l, #move_r, .decl, .inhand").unbind();
      if (obj.op) {
	if (obj.op.indexOf("DISC") < 0) {
	  $(".decl").click(click_declaration);
	  if ($("#unsteal").attr("checked")) {
	    $("#DECLK, #DECLC, #DECLP").hide();
	  }
	  if ($("#unrong").attr("checked")) {
	    $("#DECLF").hide();
	  }
	  if (auto_pass(obj.op)) declare_sender("DECL0");
	} else {
	  $(".inhand, #rc").click(inhand_click);
	  $("#move_l, #move_r").click((new Layout).click_arrow_button);
	  $(".decl").click(click_declaration);
	}
      }
      break;
    }
  };

  var auto_pass = function(op) {
    var unsteal = $("#unsteal").attr("checked");
    var unrong = $("#unrong").attr("checked");
    if (unrong && unsteal) return true;
    if (unsteal && op.indexOf("DECLF") < 0) return true;
    if (unrong && !op.match(/DECL[CPK]/)) return true;
    return false;
  }

  var inhand_click = function() {
    if (!(new Layout).click_inhand($(this))) return false;
    if ($(".ex_selected").length != 1) return false;   
    discard_sender();
  }
  
  var discard_sender = function() {
    clearInterval(gPsgID);
    
    //layout制御
    var obj = ($(".ex_selected").length != 1) ? 
    $(".inhand:last") : $(".ex_selected");
    
    // socket制御
    var haifu = obj.attr("id").split("hand_").join("DISC_");
    if ($("#reach").attr("checked")) 
      haifu = haifu.split("DISC_").join("DISCR_");

    var msg = { "size": jang_cond.haifu.length, "h":haifu, "q":"haifu" };
    if (getRequest()) msg["id"] = getRequest().token;
    websocket.send(JSON.stringify(msg));

    // Layout制御
    $("#operation .op").hide();
    $("#operation .ops").hide();
    $("#rc").html("");
    $("#messsage").html("おまちください");
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
    $("#message").html("おまちください");
    return true;
  }

  var selective_declaration = function(msg) {
    if ($(".ex_selected").length == 0) return false;
    msg.h += "_";
    $(".ex_selected").each(function(){
	msg.h += $(this).attr("id").split("hand_").pop();
      });
    websocket.send(JSON.stringify(msg));
    $("#message").html("おまちください");
    return true;
  }
  
  var hora_process = function (msg) {
    if (!msg.h.match(/DECLF/)) return false;
    var player = parseInt(msg.h.substr(0, 1));
    var point = jang_cond.calc_payment(player, false);
    if (point == 0) msg.h += "0";
    msg.h += "_0";
    websocket.send(JSON.stringify(msg));
    $("#message").html("おまちください");
    return true;
  }
  
  var kong_process = function(msg) {
    if (!msg.h.match(/DECLK/)) return false;
    var nakihai = jang_cond.discard_tile_just_now();
    var player = parseInt(msg.h.substr(0, 1));
    var jp = jang_cond.jp[player];

    if (jang_cond.turn != jp.wind) {
      msg.h += "_" + nakihai.toStrByteHex();
    } else {
      msg.h += "_" + $(this).attr("target");
    }
    websocket.send(JSON.stringify(msg));
    $("#message").html("おまちください");
   return true;
  }

  var chipong_process = function(msg) {
    if (!msg.h.match(/DECL[CP]/)) return false;

    var nakihai = jang_cond.discard_tile_just_now();
    var player = parseInt(msg.h.substr(0, 1));
    var jp = jang_cond.jp[player];
    var targets = jp.find_target(id2num(nakihai), msg.h.substr(1));

    if (targets.length > 2) {
      jp.show_expose_tile_selection(targets);
      return true;
    }

    if (targets.length != 2) {
      alert(targets); 
      return true;
    }

    msg.h += "_";
    for (var i = 0; i < targets.length; i++){
      msg.h += targets[i].toStrByteHex();
    }
    websocket.send(JSON.stringify(msg));
    $("#message").html("おまちください");
    return true;
  }
  
  var click_declaration = function() {
    declare_sender($(this).attr("id"));
  }

  var declare_sender = function(op){
    clearInterval(gPsgID);
    var msg = { "size": jang_cond.haifu.length, 
		"h": (jp_operable() + op),
		"q": "haifu"
    };
    if (getRequest()) msg.id = getRequest().token;
    if (pass_process(msg)) return;
    if (selective_declaration(msg)) return;
    if (hora_process(msg)) return;
    if (kong_process(msg)) return;
    if (chipong_process(msg)) return;
    
    $(this).append("/" + haifu);
  }
  
  websocket.onerror = function(ev){
    $('#message').append('通信エラー発生(' + ev.data + ")");
  }; 
  websocket.onclose = function(ev){
    $('#reservation').show().html('接続が切れました。再読込してください');
  }; 
};
  
$(document).ready(function(){
    show_rule_yaku();
    var socks = new SocketHandler;
    // for debug
    var id = parseInt(getRequest().token);
    $("#sel_haifu").append(id + "(=" + id.toString(16) + ")\n");
  });

var show_rule_yaku = function() {
  var yakudef = HandCalc.prototype.yaku_all;
  var yakudis = HandCalc.prototype.yaku_disable; 
  var yaku_rule = [];

  for (var yakutag in yakudef){
    if(yakudis[yakutag]) continue;
    yaku_rule.push(yakudef[yakutag][2] + "(" + yakudef[yakutag][0] + ")");
  }
  $("#yakulist").html(yaku_rule.join(", "));
}

var cmd = [	 "back",
		 "1m","2m","3m","4m","5m","6m","7m","8m","9m",
		 "1p","2p","3p","4p","5p","6p","7p","8p","9p",
		 "1s","2s","3s","4s","5s","6s","7s","8s","9s",
		 "ton","nan","sha","pei","hak","hat","chu"
	  ];

var hi_tag = function(hi){
  var hinamej = new Array
  ( "■", "一萬","二萬","三萬","四萬","五萬","六萬","七萬","八萬","九萬",
      "一筒","二筒","三筒","四筒","五筒","六筒","七筒","八筒","九筒",
      "一索","二索","三索","四索","五索","六索","七索","八索","九索",
      "東","南","西","北","白","發","中"
      );
  return '<img src="../kappa12/haiga/' + cmd[hi + 1] + '.gif" ' +
    'width=18 height=24 alt="' + hiname[hi + 1] + '">';
}


var getRequest = function(){
  if(location.search.length > 1){
    var get = new Object();
    var ret = location.search.substr(1).split("&");
    for(var i = 0; i < ret.length; i++) {
      factor = ret[i].split("=");
      get[factor[0]] = factor[1];
    }
    return get;
  } else {
    return false;
  }
}


