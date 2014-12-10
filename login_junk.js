
//var jang_cond = new JangTable;
var gPsgID = 0;  
var gStep = 0;

var socket_open = function(){
  //create a new WebSocket object.
  var wsUri = "ws:" + $("#serverName").val();
  var websocket = new WebSocket(wsUri);

  $("#connection").click(socket_open);
  
  websocket.onopen = function(ev) {
    $("#connectForm").hide();
    $("#loginForm").show();
    $("#connected_srv").html($("input#serverName").val() + " (<b>Connected</b>)");
    
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
  
  $("#login").click(function() {
      if ($("#loginName").val() === "") return;
      var msg = { "q":"login", 
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
      location.href = "room_junk.html?token=" + msg.id + "&" +
	"srv=" + websocket.url;
    }
    return 0;
  };
    
  websocket.onerror = function(ev){
    $('#alert_mes').append('<div class="system_error">Error:' + ev.data + "</div>");
  }; 
  websocket.onclose = function(ev){
    $('#alert_mes').append('<div class="system_msg">Disconnected</div>');
  }; 
  
}
  $(document).ready(function() {
      if (location.host)
      $("#serverName").val(location.host + ":9000");
      else
      $("#serverName").val("localhost:9000");
      socket_open();
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
