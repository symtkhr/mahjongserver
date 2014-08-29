
//var jang_cond = new JangTable;
var gPsgID = 0;  
var gStep = 0;

$(document).ready(function(){
    //create a new WebSocket object.
    var wsUri = "ws://localhost:9000"; 	
    var websocket = new WebSocket(wsUri); 
    
    websocket.onopen = function(ev) {
    $("#connectForm").hide();
    $("#loginForm").show();
    $("#connected_srv").html($("input#serverName").val() + " (<b>Connected</b>)");

    //      $('#sel_haifu').append('<span>Connected!</span>');
      var name = "";
      for(var i = 0; i < 2 + Math.random() * 2; i++) {
	var c = String.fromCharCode(Math.random() * 0x52 + 0x3041);
	if(c.match(/[ぁぃぅぇぉゃゅょっゎ]/) && i==0) continue;
	name += c;
      }
      $("#loginName").val(name);
      if(getRequest()) get_stats();
    }
    
    var get_stats = function(){
      jang_cond.haifu = [];
      var msg = { "size": 0, "h": "", sb:"history"};
      if(getRequest()) msg["player"] = getRequest().shift();
      websocket.send(JSON.stringify(msg));
    };

    $('#set_step').click(get_stats);

    $('#init_step').click(function(){
	jang_cond.haifu = [];
	var msg = { "size": 0, "h":"", "sb":"init" };
	if(getRequest()) msg["player"] = getRequest().shift();
	websocket.send(JSON.stringify(msg));
      });

    $("#login").click(function() {
	var msg = { "sb":"login", 
		    "name": $("#loginName").val(), 
		    "pass":$("#passwd").val() };
	if(getRequest()) msg["player"] = getRequest().shift();
	websocket.send(JSON.stringify(msg));
      });
    
    //#### Message received from server?
    websocket.onmessage = function(ev) {
      var msg = JSON.parse(ev.data); //PHP sends Json data
      var type = msg.type; //message type
      if (msg.type ==="login") {
	location.href = "room_junk.html?" + msg.token;
      }
      return 0;
    };
    
    websocket.onerror = function(ev){
      $('#alert_mes').append('<div class="system_error">Error:' + ev.data + "</div>");
    }; 
    websocket.onclose = function(ev){
      $('#alert_mes').append('<div class="system_msg">Disconnected</div>');
    }; 
    
  });

var getRequest = function(){
  if(location.search.length > 1){
    var get = new Object();
    var ret = location.search.substr(1).split("&");
    return ret;
  } else {
    return false;
  }
}
