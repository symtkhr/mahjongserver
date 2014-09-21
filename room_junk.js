
var jang_cond = new JangTable;
var gPsgID = 0;  
var gStep = 0;

$(document).ready(function(){
    //create a new WebSocket object.
    var wsUri = "ws://localhost:9000"; 	
    var websocket = new WebSocket(wsUri); 
    
    websocket.onopen = function(ev) {
      $('#sel_haifu').append('<span>Connected!</span>');
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
      if(getRequest()) msg["player"] = getRequest().shift();
      websocket.send(JSON.stringify(msg));
    };

    $('#set_step').click(get_stats);

    $('#init_step').click(function(){
	jang_cond.haifu = [];
	var msg = { "size": 0, "h":"", "q":"init" };
	if(getRequest()) msg["player"] = getRequest().shift();
	websocket.send(JSON.stringify(msg));
      });

    $("#join").click(function() {
	var msg = { "q":"login", 
		    "name": $("#login_name").val(), 
		    "pass":$("#passwd").val() };
	if(getRequest()) msg["player"] = getRequest().shift();
	websocket.send(JSON.stringify(msg));
      });
    
    //#### Message received from server?
    websocket.onmessage = function(ev) {
      var msg = JSON.parse(ev.data); //PHP sends Json data
      var type = msg.type; //message type
      if (msg.haifu) {
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
      }
      jang_cond.dump_wangpai();
      jang_cond.check_extra();
      $("#step").html(jang_cond.haifu.length);
      
      $(".inhand").click(function(){
	  var haifu = $(this).attr("id").split("hand_").join("DISC_");
	  if ($("#reach" + haifu.substr(0,1)).attr("checked")) 
	    haifu = haifu.split("DISC_").join("DISCR_");
	  var msg = { "size": jang_cond.haifu.length, "h":haifu };
	  if(getRequest()) msg["player"] = getRequest().shift();
	  websocket.send(JSON.stringify(msg));
      });

      $(".decl").click(function(){
	  var JpInstance = jang_cond.jp;
	  var haifu = $(this).attr("id");
	  var msg = { "size": jang_cond.haifu.length, 
		      "h":haifu };
	  if(getRequest()) msg["player"] = getRequest().shift();

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
	  switch(haifu.substr(1)) {
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
