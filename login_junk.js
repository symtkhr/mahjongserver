var gPsgID = 0;  
var gStep = 0;

var socket_open = function(){
  var wsUri = "ws:" + $("#serverName").val();
  var websocket = new WebSocket(wsUri);
  var token = -1;

  $("#connection").click(socket_open);
  
  websocket.onopen = function(ev) {
    $("#connectForm").hide();
    $("#loginForm").show();
    $("#connected_srv").html($("input#serverName").val() + " (<b>Connected</b>)");
    
    var name = "";
    for (var i = 0; i < 2 + Math.random() * 2; i++) {
      var c = String.fromCharCode(Math.random() * 0x52 + 0x3041);
      if (c.match(/[ぁぃぅぇぉゃゅょっゎ]/) && i==0) continue;
      name += c;
    }
    $("#loginName").val(name);
  }
    
  $("#login").click(function() {
      if ($("#loginName").val() === "") return;
      var msg = { "q":"login", 
		  "name": $("#loginName").val(), 
		  "pass":$("#passwd").val() };
      if (getRequest()) msg["player"] = getRequest().shift();
      websocket.send(JSON.stringify(msg));
    });
  
  //#### Message received from server
  websocket.onmessage = function(ev)
  {
    var msg = JSON.parse(ev.data);
    var type = msg.type;
    //console.log(msg);

    if (msg.type === "login") {
      show_robby_room();
      token = msg.id;
    }
    if (msg.type === "waiting") {
      if (msg.table)
	$("#" + msg.table.split(";").join("_")).attr("disabled", true);
      else 
	$(".reserve").attr("disabled", false);
    }

    if (msg.type === "gathered") {
      jump_to_room_junk(msg.id);
    }
    return 0;
  };

  var show_robby_room = function() {
    $("#robby_room").show();
    $("#titlebox").hide();
    $("#loginName, #login").attr("disabled", true);
    $(".reserve").click(function(){
	var msg = {"q" : "reserve",
		   "id": token,
		   "table_id": $(this).attr("id").split("_").join(";")
	};
	console.log(msg);
	websocket.send(JSON.stringify(msg));
    });
    $("#unreserve").click(function() {
	var msg = {"q" : "unreserve",
		   "id": token,
	};
	console.log(msg);
	websocket.send(JSON.stringify(msg));
      });
  }


  var jump_to_room_junk = function (id) {
    location.href = "room_junk.html"
    + "?token=" + id
    + "&srv=" + websocket.url;
  }

    
  websocket.onerror = function(ev){
    $('#error_message').append('[エラー] ' + ev.data + "<br>");
  }; 
  websocket.onclose = function(ev){
    $('#error_message').append('[切断] 接続が切れました。再接続してください。<br>');
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
