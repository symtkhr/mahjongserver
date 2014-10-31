
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

var jang_table_renew_user = function(obj) {
  var jp = jang_cond.jp[obj.wind];
  jp = new JangPlayer;
  jp.wind = obj.wind;
  jp.name = obj.name;
  jp.pt = obj.point;
  
  if (obj.is_yourself) {
    jp.operable = true;
  }
}

var jang_table_set_aspect = function(obj) {
  jang_cond.aspect = obj.aspect;
  layout_aspect(obj);
}

var layout_aspect = function(obj) {
  var strwind = ["T","N","S","P"];
  var str_fuwo = strwind[parseInt(obj.aspect / 4)] + (obj.aspect % 4 + 1);
  str_fuwo += " " + (obj.hon);
  $("#aspect").html(str_fuwo);
}

var SocketHandler = function() {
  var wsUri = "ws://localhost:9000"; 	
  this.sock = new WebSocket(wsUri); 

  this.sock.onopen = function(ev) {
    $('#sel_haifu').append("<span>Connected!</span>\n");
    if(getRequest()) get_stats();
  }
    
  var get_stats = function(){
    jang_cond.haifu = [];
    var msg = { "size": 0, "h": "", q:"history"};
    if(getRequest()) msg["id"] = getRequest().shift();
    this.sock.send(JSON.stringify(msg));
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
      Layout.dump_stat(i, jang_cond.turn, newest_haifu);
    }
      
    //socket制御
    while (jang_cond.msgstock.length > 0) {
      var msg = jang_cond.msgstock.shift();
      if(getRequest()) msg["id"] = getRequest().shift();
      this.sock.send(JSON.stringify(msg));
    }
      
    //layout制御
    var startCount = function() {
      gRtime = 5;
      clearInterval(gPsgID);
      gPsgID = setInterval(function() {
	  $("#count").html(gRtime.toString(10));
	  gRtime--; 
	  if (gRtime >= 0) return;
	  discard_sender();
	},1000);
    };
      
    //consider rong or rag
    if(jang_cond.jp[jang_cond.turn].operable && !jang_cond.is_rag
       && !jang_cond.is_end
       ) 
      startCount();
      
    jang_cond.dump_wangpai();
    jang_cond.check_extra(); // for debug
    $("#step").html(jang_cond.haifu.length);
    
    if (jang_cond.is_end) return;

    // layout制御
    $(".inhand, #rc").click(inhand_click);
    $("#move_l, #move_r").click(layout_click_arrow_button);
    $(".decl").click(declare_sender);
  }
  
  this.sock.onmessage = function(ev) {
    var msg = JSON.parse(ev.data);
    var type = msg.type;
    
    for(var i in msg) 
      $("#sel_haifu").append(i + ":" + msg[i] + "/");
    $("#sel_haifu").append("\n");
    
    var JpInstance = jang_cond.jp;
    switch (type) {
    case "player":
      jang_table_renew_user(msg);
      break;
      
    case "aspect":
      jang_table_set_aspect(msg);
      break;
      
    case "approval":
      // layout制御
      if(msg.point) {
	var res = (msg.point).join("/");
      } else {
	var res = "";
      }
      $("#operation").html(res  + "<br>" + (msg.next) +
			   '<button id="approval">OK</button>');
      $("#approval").click(function(){ 
	  var msg = { "q": "approval" };
	  if(getRequest()) msg["id"] = getRequest().shift();
	  this.sock.send(JSON.stringify(msg));
	  jang_cond = new JangTable;
	  $(this).hide();
	});
      break;
      
    case  "haifu":
      handle_haifu(msg);
    return 0;
  };

    var inhand_click = function() {

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
      var obj = ($(".ex_selected").length != 1) ? 
        $(".inhand:last") : $(".ex_selected");

      var haifu = obj.attr("id").split("hand_").join("DISC_");
      if ($("#reach" + haifu.substr(0,1)).attr("checked")) 
	haifu = haifu.split("DISC_").join("DISCR_");
      var msg = { "size": jang_cond.haifu.length, "h":haifu, "q":"haifu" };
      if(getRequest()) msg["id"] = getRequest().shift();
      this.sock.send(JSON.stringify(msg));
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
	this.sock.send(JSON.stringify(msg));
	$(this).parent().html("おまちください");
	return;
      }
      
      // declaration choice out of several patterns
      if($(".ex_selected").length > 0) {
	msg.h += "_";
	$(".ex_selected").each(function(){
	    msg.h += $(this).attr("id").split("hand_").pop();
	  });
	this.sock.send(JSON.stringify(msg));
	$(this).parent().html("おまちください");
	return;
      }
      
      // normal declaration
      var nakare = jang_cond.turn;
      var pos_discard = JpInstance[nakare].sutehai.length - 1;
      var nakihai = JpInstance[nakare].sutehai[pos_discard];
      var player = haifu.substr(0,1);
      var targets = JpInstance[player].find_target(id2num(nakihai), haifu.substr(1));
      switch(haifu.substr(1).split("_").shift()) {
      case "DECLF":
	msg.h += "_0";
	this.sock.send(JSON.stringify(msg));
	$(this).parent().html("おまちください");
	break;
      case "DECLK":
	if(jang_cond.turn != JpInstance[player].wind) {
	  msg.h += "_" + nakihai.toStrByteHex();
	}
	this.sock.send(JSON.stringify(msg));
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
	this.sock.send(JSON.stringify(msg));
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

    this.sock.onerror = function(ev){
      $('#alert_mes').append('<div class="system_error">Error:' + ev.data + "</div>");
    }; 
    this.sock.onclose = function(ev){
      $('#alert_mes').append('<div class="system_msg">Disconnected</div>');
    }; 
}


$(document).ready(function(){
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

var getRequest = function(){
  if(location.search.length > 1){
    var get = new Object();
    var ret = location.search.substr(1).split("&");
    return ret;
  } else {
    return false;
  }
}


