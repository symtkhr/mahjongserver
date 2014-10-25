
var jang_cond = new JangTable;
var gPsgID = 0;  
var gStep = 0;
var gRtime = 5;

$(document).ready(function(){
    //create a new WebSocket object.
    var wsUri = "ws://localhost:9000"; 	
    var websocket = new WebSocket(wsUri); 
    var id = parseInt(getRequest().shift());
    $("#sel_haifu").append(id + "(=" + id.toString(16) + ")\n");
    
    websocket.onopen = function(ev) {
      $('#sel_haifu').append("<span>Connected!</span>\n");
      /*
      var name = "";
      for(var i = 0; i < 2 + Math.random() * 2; i++) {
	var c = String.fromCharCode(Math.random() * 0x52 + 0x3041);
	if(c.match(/[ぁぃぅぇぉゃゅょっゎ]/) && i==0) continue;
	name += c;
      }
      $("#login_name").val(name);
      */
      if(getRequest()) get_stats();
    }
    
    var get_stats = function(){
      jang_cond.haifu = [];
      var msg = { "size": 0, "h": "", q:"history"};
      if(getRequest()) msg["id"] = getRequest().shift();
      websocket.send(JSON.stringify(msg));
    };

    $('#set_step').click(get_stats);

    $('#init_step').click(function(){
	jang_cond.haifu = [];
	var msg = { "size": 0, "h":"", "q":"init" };
	if(getRequest()) msg["id"] = getRequest().shift();
	websocket.send(JSON.stringify(msg));
      });

    $("#join").click(function() {
	var msg = { "q":"login", 
		    "name": $("#login_name").val(), 
		    "pass":$("#passwd").val() };
	if(getRequest()) msg["id"] = getRequest().shift();
	websocket.send(JSON.stringify(msg));
      });

    //#### Message received from server?
    websocket.onmessage = function(ev) {
      var msg = JSON.parse(ev.data); //PHP sends Json data
      var type = msg.type; //message type
      var JpInstance = jang_cond.jp;
      switch (type) {
      case "player":
	var qplayer = msg.wind;
	JpInstance[qplayer] = new JangPlayer;
	JpInstance[qplayer].wind = qplayer;
	JpInstance[qplayer].name = msg.name;
	JpInstance[qplayer].pt = msg.point;

	//alert(msg.name);
	if (msg.is_yourself) {
	  JpInstance[qplayer].operable = true;
	}

	$("#sel_haifu").append(msg.name 
			       + "_" +  msg.wind + "_" + msg.point
			       + "_" + msg.is_yourself + "\n");
	break;
      case "aspect":
	jang_cond.aspect = msg.aspect;
	var strwind = ["T","N","S","P"];
	var str_fuwo = strwind[parseInt(msg.aspect / 4)] + (msg.aspect % 4 + 1);
	str_fuwo += " " + (msg.hon);
	$("#aspect").html(str_fuwo);
	break;

      case "approval":
	if(msg.point) {
	  var res = (msg.point).join("/");
	  //alert(msg.point);
	} else 
	  var res = "";
	$("#operation").html(res  + "<br>" + (msg.next) +
			     '<button id="approval">OK</button>');
	$("#approval").click(function(){ 
	    var msg = { "q": "approval" };
	    if(getRequest()) msg["id"] = getRequest().shift();
            websocket.send(JSON.stringify(msg));
	    jang_cond = new JangTable;
	    $(this).hide();
	  });
	break;

      case  "haifu":
	$("#sel_haifu").append("====\n" + msg.haifu.split(";").join("\n"));
      
	var got_haifu = msg.haifu.split(";");
	for (var i=0; i < got_haifu.length; i++){
	  jang_cond.eval_command(got_haifu[i]);
	}
	var newest_haifu = got_haifu[got_haifu.length - 1];
	var JpInstance = jang_cond.jp;
	for (var i = 0; i < JpInstance.length; i++) {
	  JpInstance[i].dump_stat(jang_cond.turn, newest_haifu);
	}

	while (jang_cond.msgstock.length > 0) {
	  var msg = jang_cond.msgstock.shift();
	  if(getRequest()) msg["id"] = getRequest().shift();
	  websocket.send(JSON.stringify(msg));
	}

	var startCount = function() {
	  gRtime = 5;
	  clearInterval(gPsgID);
	  gPsgID = setInterval(function() {
	      $("#count").html(gRtime.toString(10));
	      gRtime--; 
	      if (gRtime >= 0) return;
	      
	      clearInterval(gPsgID);
	      var obj = ($(".ex_selected").length != 1) ? 
		$(".inhand:last") : $(".ex_selected");
	      
	      var haifu = obj.attr("id").split("hand_").join("DISC_");
	      if ($("#reach" + haifu.substr(0,1)).attr("checked")) 
		haifu = haifu.split("DISC_").join("DISCR_");
	      var msg = { "size": jang_cond.haifu.length, "h":haifu, "q":"haifu" };
	      if(getRequest()) msg["id"] = getRequest().shift();
	      websocket.send(JSON.stringify(msg));
	      $("#operation").html("おまちください");
	      
	    },1000);
	};

	//consider rong or rag
	if(jang_cond.jp[jang_cond.turn].operable && !jang_cond.is_rag
	   && !jang_cond.is_end) 
	  startCount();

	jang_cond.dump_wangpai();
	jang_cond.check_extra(); // for debug
	$("#step").html(jang_cond.haifu.length);
      }
      
      $(".inhand, #rc").click(function(){
	  if(!$(this).hasClass("ex_selected") && $(this).hasClass("inhand")) {
	    $(".inhand").removeClass("ex_selected").css("border","none");
	    $("#rc").html($(this).clone().attr("id","_").attr("class","")
			  .css("height","80px").css("width","60px"));
	    $(this).addClass("ex_selected").css("border","2px solid red");
	    return;
	  }
	  if($(".ex_selected").length != 1) return;

	  clearInterval(gPsgID);
	  var haifu = $(".ex_selected").attr("id").split("hand_").join("DISC_");
	  if ($("#reach" + haifu.substr(0,1)).attr("checked")) 
	    haifu = haifu.split("DISC_").join("DISCR_");
	  var msg = { "size": jang_cond.haifu.length, "h":haifu, "q":"haifu" };
	  if(getRequest()) msg["id"] = getRequest().shift();
	  websocket.send(JSON.stringify(msg));
	  $("#operation").html("おまちください");
      });

      $("#move_l, #move_r").click(function(){
	  if($(".ex_selected").length == 0) {
	    var obj = $(".inhand:last");
	  } else {
	    var parent = $(".ex_selected").parent().attr("id");
	    //alert(parent);
	    if($(this).attr("id") === "move_l") {
	      var obj = $(".ex_selected").prev();
	      if (!obj.hasClass("inhand")) var obj = $(".inhand:last");
	    } else { 
	      var obj = $(".ex_selected").next();
	      if (!obj.hasClass("inhand")) var obj = $(".inhand:first");
	    }
	  }

	  $(".inhand").removeClass("ex_selected").css("border","none");
	  $("#rc").html(obj.clone().attr("id","").attr("class","")
			.css("height","80px").css("width","60px"));
	  obj.addClass("ex_selected").css("border","2px solid red");
      });

      $(".decl").click(function(){
	  var JpInstance = jang_cond.jp;
	  var haifu = $(this).attr("id");
	  var msg = { "size": jang_cond.haifu.length, 
		      "h":haifu, "q":"haifu"};
	  if(getRequest()) msg["id"] = getRequest().shift();

	  // declare through
	  if(haifu.match(/^[0-3]DECL0/)) {
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
	  var player = haifu.substr(0,1);
	  var targets = JpInstance[player].find_target(id2num(nakihai), haifu.substr(1));
	  switch(haifu.substr(1).split("_").shift()) {
	  case "DECLF":
	    msg.h += "_0";
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


      });

      return 0;
    };
    
    websocket.onerror = function(ev){
      $('#alert_mes').append('<div class="system_error">Error:' + ev.data + "</div>");
    }; 
    websocket.onclose = function(ev){
      $('#alert_mes').append('<div class="system_msg">Disconnected</div>');
    }; 

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


