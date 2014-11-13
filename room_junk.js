
var jang_cond = new JangTable;
var gPsgID = 0;  
var gStep = 0;
var gRtime = 5;

var layout_click_arrow_button = function(){
  if($(".ex_selected").length == 0) {
    var obj = $(".inhand:last");
  } else {
    var parent = $(".ex_selected").parent().attr("id");
    if($(this).attr("id") === "move_l") {
      var obj = $(".ex_selected").prev();
      if (!obj.hasClass("inhand")) var obj = $(".inhand:last");
    } else { 
      var obj = $(".ex_selected").next();
      if (!obj.hasClass("inhand")) var obj = $(".inhand:first");
    }
  }
  
  $(".inhand").removeClass("ex_selected").css("border","none");
  $("#rc").html(obj.clone().attr("id","").attr("class", "")
		.css("height","80px").css("width","60px"));
  obj.addClass("ex_selected").css("border","2px solid red");
};

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
    /*
    var stolen_jp = jang_cond.jp[jang_cond.turn];
    if (jpobj.is_changkong) {
      var target = obj.changkong;
    } else if(jang_cond.turn == jpobj.wind) {
      var target = stolen_jp.tehai.pop(); 
      stolen_jp.tehai.push(target);
    } else {
      var target = stolen_jp.sutehai.pop();
      stolen_jp.sutehai.push(target);
    }
    */
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
  if(obj.q === "renew") jang_cond = new JangTable;
  jang_cond.aspect = obj.aspect;
  layout_aspect(obj);
};

var layout_aspect = function(obj) {
  var strwind = ["東","南","西","北"];
  var str_fuwo = strwind[parseInt(obj.aspect / 4)] + (obj.aspect % 4 + 1) + "-";
  str_fuwo += (obj.honba) + "<br>";
  str_fuwo += "供" + (obj.banked);
  $("#aspect").html(str_fuwo);
};

var layout_payment = function(msg) {
  if(msg.point) {
    var res = (msg.point).join("/");
  } else {
    var res = "";
  }
  var windname = ["東", "南", "西", "北"];
  var ptr = [];
  for (var pindex = 0; pindex < 4; pindex++) {
    var wind = (pindex - (jang_cond.aspect % 4) + 4) % 4;
    ptr[wind] = jang_cond.jp[wind].pt + msg.point[pindex * 3] 
      + msg.point[pindex * 3 + 1] + msg.point[pindex * 3 + 2];
    res += "<td>" + pt + "</td>";
  }
  res += "</table>";

  var res = "<div id='point_agenda' class='payment'><table><tr>";
  res += "<td></td><td></td>";
  res += "<td style='width:4ex'>和了</td>";
  res += "<td style='width:4ex'>本場</td>";
  res += "<td style='width:4ex'>供託</td>";
  res += "<td style='width:1em'></td><td style='width:4ex'></td>";
  res += "</tr>";
  for (var pindex = 0; pindex < 4; pindex++) {
    var wind = (pindex - (jang_cond.aspect % 4) + 4) % 4;
    res += "<tr>";
    res += "<td>" + windname[wind] + ":";
    res += /* jang_cond.jp[wind].name.substr(0, 6) + */ "</td>";
    res += "<td>" + jang_cond.jp[wind].pt + "</td>";
    for(var i = 0; i < 3; i++) {
      var pt = msg.point[pindex * 3 + i];
      if (pt < 0) res += "<td style='color:red'>";
      else if(pt > 0) res += "<td style='color:blue'>+";
      else res += "<td>+";
      res += pt;
      res += "</td>";
    }
    res += "<td>=</td>";
    res += "<th>" + ptr[wind] + "</th>";
    res += "</tr>";
  }
  res += "</table></div>";
  $("#point_table").append(res);
  if(0) {
    var res = "NEXT = ";
    var strwind = ["T","N","S","P"];
    res += strwind[parseInt(msg.next / 4)] + (msg.next % 4 + 1);
    $("#point_table").append(res);
  }
  $("#point_table").fadeIn();
  $("#call_top, #call_left, #call_right").fadeOut();
  
  $("#operation").html('<button id="approval">OK</button>');
  $("#operation").append('<button id="show_table">卓表示</button>');
  $("#show_table").click(function() { 
      if($(this).hasClass("showTable")) {
	$(this).html("卓表示").removeClass("showTable");
	$("#point_table").fadeIn();
	$("#call_top, #call_left, #call_right").fadeOut();
      } else {
	$(this).html("点数表示").addClass("showTable");
	$("#point_table").fadeOut();
	$("#call_top, #call_left, #call_right").fadeIn();
      }
    });
};
  
var SocketHandler = function() {
  var wsUri = "ws://localhost:9000"; 	
  //var wsUri = "ws://192.168.11.22:9000"; 	
  var websocket = new WebSocket(wsUri); 
  
  websocket.onopen = function(ev) {
    $('#sel_haifu').append("<span>Connected!</span>\n");
    //alert("connect");
    if(getRequest()) get_stats();
  }
  
  var get_stats = function(){
    jang_cond.haifu = [];
    var msg = { "size": 0, "h": "", q:"history"};
    if(getRequest()) msg["id"] = getRequest().shift();
    websocket.send(JSON.stringify(msg));
  };
  
  var handle_haifu = function(msg) {
	//jang_table制御
    var got_haifu = msg.haifu.split(";");
    for (var i = 0; i < got_haifu.length; i++){
      jang_cond.eval_command(got_haifu[i]);
    }
    
    //layout制御
    var newest_haifu = got_haifu[got_haifu.length - 1];
    var JpInstance = jang_cond.jp;
	for (var i = 0; i < JpInstance.length; i++) {
	  (new Layout).dump_stat(i, jang_cond.turn, newest_haifu);
	}
    
    //layout制御?
    var startCount = function() {
      gRtime = 5;
      clearInterval(gPsgID);
      gPsgID = setInterval(function() {
	  $("#count").html(gRtime.toString(10));
	  gRtime--; 
	  if (gRtime >= 0) return;
	  discard_sender();
	}, 1000);
    };
    
    //consider rong or rag
    if(jang_cond.jp[jang_cond.turn].operable && !jang_cond.is_rag
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
    if (getRequest()) msg["id"] = getRequest().shift();
    websocket.send(JSON.stringify(msg));
    $(this).hide();
  };

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
      //socket制御
      while (jang_cond.msgstock.length > 0) {
	var msg = jang_cond.msgstock.shift();
	if(getRequest()) msg.id = getRequest().shift();
	websocket.send(JSON.stringify(msg));
      }
      break;
      
    case "layout":
      layout_set(msg);
      break;
      
    case "approval":
      // sock制御
      break;
      
    case  "haifu":
      handle_haifu(msg);
      return 0;

    default:
      for(var key in msg) {
	$("#sel_haifu").append(key + " = " + msg[key] + "<br>");
      }
      
      for(var i in msg.jp) {
	for(var key in msg.jp[i]){
	  $("#sel_haifu").append("jp[" + i + "]."+key + " = " + msg.jp[i][key] + "<br>");
	}
      }
      
    }
  };
  
  var layout_set = function(obj) {
    if (obj.op === "payment"){
      layout_payment(obj);
      $("#approval").click(approval_ok);
    } else {
      (new Layout).show_operation(obj.op);
      // layout制御
      $(".inhand, #rc").click(inhand_click);
      $("#move_l, #move_r").click(layout_click_arrow_button);
      $(".decl").click(declare_sender);
    }
  };

  var inhand_click = function() {
    // layout 制御
    if(!$(this).hasClass("ex_selected") && $(this).hasClass("inhand")) {
      $(".inhand").removeClass("ex_selected").css("border","none");
      $("#rc").html($(this).clone().attr("id","_").attr("class","")
		    .css("height","80px").css("width","60px"));
      $(this).addClass("ex_selected").css("border","2px solid red");
      return false;
    }
    if($(".ex_selected").length != 1) return false;
    
    discard_sender();
  }
  
  var discard_sender = function() {
    clearInterval(gPsgID);
    
    //layout制御
    var obj = ($(".ex_selected").length != 1) ? 
    $(".inhand:last") : $(".ex_selected");
    
    var haifu = obj.attr("id").split("hand_").join("DISC_");
    if ($("#reach" + haifu.substr(0, 1)).attr("checked")) 
      haifu = haifu.split("DISC_").join("DISCR_");
    
    var msg = { "size": jang_cond.haifu.length, "h":haifu, "q":"haifu" };
    if(getRequest()) msg["id"] = getRequest().shift();
    websocket.send(JSON.stringify(msg));
    $("#operation").html("おまちください");
  }
  
  var declare_sender = function(){
    clearInterval(gPsgID);
    var JpInstance = jang_cond.jp;
    var haifu = $(this).attr("id");
    var msg = { "size": jang_cond.haifu.length, 
		"h":haifu, "q":"haifu"};
    if(getRequest()) msg["id"] = getRequest().shift();
    
    // declare through
    if (haifu.match(/^[0-3]DECL0/)) {
      msg.h += "_0";
      websocket.send(JSON.stringify(msg));
      $(this).parent().html("おまちください");
      return;
    }
    
    // declaration choice out of several patterns
    if($(".ex_selected").length > 0) {
      msg.h += "_";
      $(".ex_selected").each(function(){
	  msg.h += $(this).attr("id").split("hand_").pop();
	});
      websocket.send(JSON.stringify(msg));
      $(this).parent().html("おまちください");
      return;
    }
    
    // normal declaration
    var nakare = jang_cond.turn;
    var pos_discard = JpInstance[nakare].sutehai.length - 1;
    var nakihai = JpInstance[nakare].sutehai[pos_discard];
    var player = haifu.substr(0, 1);
    var targets = JpInstance[player].find_target(id2num(nakihai), haifu.substr(1));
    switch(haifu.substr(1).split("_").shift()) {
    case "DECLF":
      var point = jang_cond.calc_payment(parseInt(player), false);
      if (point == 0) msg.h += "0";
      msg.h += "_0";
      alert(msg.h);
      websocket.send(JSON.stringify(msg));
      $(this).parent().html("おまちください");
      break;
    case "DECLK":
      if(jang_cond.turn != JpInstance[player].wind) {
	msg.h += "_" + nakihai.toStrByteHex();
      }
      websocket.send(JSON.stringify(msg));
      $(this).parent().html("おまちください");
      break;
    case "DECLC":
    case "DECLP":
      if(targets.length > 2) {
	JpInstance[player].show_expose_tile_selection(targets);
	return;
      }
    msg.h += "_";
    if(targets.length == 2) {
      for(var i = 0; i < targets.length; i++){
	msg.h += targets[i].toStrByteHex();
      }
      websocket.send(JSON.stringify(msg));
      $(this).parent().html("おまちください");
    } else {
      alert(targets);
    }
    break;
    default:
      $(this).append("/"+haifu);
      break;
    }
  }
  
  websocket.onerror = function(ev){
    $('#alert_mes').append('<div class="system_error">Error:' + ev.data + "</div>");
  }; 
  websocket.onclose = function(ev){
    $('#alert_mes').append('<div class="system_msg">Disconnected</div>');
  }; 
};
  
//var socks;

$(document).ready(function(){
    //return;
    var socks = new SocketHandler;
    var id = parseInt(getRequest().shift());
    $("#sel_haifu").append(id + "(=" + id.toString(16) + ")\n");
  });

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
    return ret;
  } else {
    return false;
  }
}


