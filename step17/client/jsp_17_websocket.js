$(function(){   
    $("#show_rule").click(function(){ $("#rule").show(); $("#main").hide(); });
    $("#hide_rule").click(function(){ $("#rule").hide(); $("#main").show(); });
    if (location.hash === "#debugplay17") return debug_play17();// return $.getScript("debug_play17.js");
    $("#serverName").val(location.host + ":" + SRVPORT);
    launch_websocket();
});

const SRVPORT = 51234;
const DIV = ";";
const STATE = { CONNECT:0, LOGIN:1, LOBBY:2, PLAYROOM:3, };
let game = {
    state: STATE.CONNECT,
    users: [],
    rooms: [],
    ws: null,
};

//--- Connection to server
let launch_websocket = function() {
  game.ws = new WebSocket( "ws://" + $("input#serverName").val());
  game.ws.onopen = function(){
      $("#connectForm").hide();
      $("#loginForm").show();
      $("#connected_srv").html($("input#serverName").val() + " (<b>Connected</b>)");
  };
  game.ws.onclose = function() { alertlog("Good bye!"); };
  game.ws.onmessage = function(event) {
      let received = event.data;
      let command = received.split(DIV);
      debuglog(game.state + ":" + received);

      switch(game.state) {
      case STATE.CONNECT: {
	  if (received === "perror"){ $("#alert").append("error"); return; }
	  game.state = STATE.LOGIN;
	  break;
      }
      case STATE.LOGIN: {
	  if (login_gate(received)) game.state = STATE.LOBBY;
	  break;
      }
      case STATE.LOBBY: {
	  lobby_room(command);
	  break;
      }
      case STATE.PLAYROOM: {
	  play17(command);
	  break;
      }
      }
  };  
  game.ws.onerror = function(event) { 
      alertlog("Connection error"); 
      $("#connection").remove("disabled"); 
  };

  $("button#connection").click(launch_websocket);
  $("button#login").click( function(){
      game.state = STATE.CONNECT;
      if ($("input#loginName").val() === "") return;
      ws_send("login;" + $("input#loginName").val());
  });
};

let ws_send = function(mes){
    debuglog(mes + " [sent]");
    game.ws.send(mes);
};

//-- Send Command for websocket debug.
$("#command").click(function(){ ws_send($("input#command").val()); });
const debuglog = (txt) => $("textarea#debug").append(txt + "\n");
const alertlog = (txt) => $("#alert").append("<li>" + txt).show();

//-- Login
let login_gate = function(received) {
  let name = $("input#loginName").val();
  if (received === "rename") {
    $("#message").text( "Error: Name '"+ name +"' Already Used." );
    return false;
  }
  $("div#ui").hide();
  $("#loginState").text('Login: ' + name);
  $("div#titlebox").hide();
  $("div#presentation").show();
  $("#commandbutton").click(function(){ ws_send($("input#command").val());});
  return true;
};

//-- Lobby Room
let lobby_room = function(command){
    const handler = {
	"state": (command) => {
	    let index = command.shift() - 0;
	    command.shift();
	    let name = command.shift();
	    let max = command.shift() - 0;
	    let login = command.length;
	    if (game.rooms.indexOf(name) == -1) {
		game.rooms.push(name);
		let id = "r " + index;
		let mes = "<li>" + name + " [ <span class=login>" + login + "</span> / "  + max + " ]";
		mes += "<input class='reserve' id='" + id + "' type='button' value='Reserve'></li>";
	    	$("#lobby ol").append(mes);
	    } else {
		$("#lobby .login").eq(index - 1).text(login);
	    }
	},
	"game_start": (command) => {
	    game.state = STATE.PLAYROOM;
	    let mes = ( command.shift() );
	    $("div#lobby").html("Start" + mes);
	    return mes;
	},
	"chat": (command) => {
	    let from = command.shift();
	    return "from [" + from + "]: " + command.join(DIV);
	},
	"login":  (command) => command.join(DIV) + " is Logged in.",
	"logout": (command) => command.join(DIV) + " is Logged in.",
	"logins": (command) =>  "Login:   " + command.join(', '),
	"quit":    () => { game.state = STATE.CONNECT; },
	"void":    () => "",
	"unknown": () =>  "Unknown command.",
    };
    
    let mes = (handler[command.shift().trim()] || handler.unkwown)(command);
    $("#make_hands, #discard_tiles").hide();
};

//-- Reserve on Lobby Room
$(document).on("click", "#lobby :button.reserve", function(){
    let com = $(this).attr("id");
    $(this).attr('disabled', true);
    ws_send(com);
});

//-- Play Room
let play17 = function(command){
    const mes = (message) => $("#message").append(message);
    const handler = {
	"quit": () => {
	    $("#lobby").show();
	    $("#make_hands, #discard_tiles").hide();
	    game.state = STATE.LOBBY;
	},
	"make_hand":    (tile) => { make_hand(tile); },
	"discard":      (tile) => { draw_river(tile); },
	"discard_item": (tile) => { disp_discard_item(tile); },
	"hand": (hand) => {
	    let id = game.users.indexOf($("input#loginName").val());
	    $("#p" + id + " .handset").html(hand.map(hi => hi_tag(hi)).join(""));
	},
	"final_hands": (command) => {
	    let id = game.users.indexOf(command.shift().trim());
	    let target = command.pop();
	    $("#p" + id + " .handset").html(command.map(hi => hi_tag(hi)).join("") + " " + hi_tag(target)).show();
	    payment(id, command, target);
	    $("#p" + id).css("background-color", "#def");
	},
	"draw": () => {
	    let mes = '<pre style="width:100%; background-color:#eec;">[ D r a w ]</pre>';
	    $("#discard_tiles").append(mes);
	},
	"turn":    () => { ask_user_discard(); },
	"check":   () => { ask_finish(); },
	"finish":  () => { declare_finish(); },
	"continue":() => { ask_continue(); },
	"clear":   () => { $("#message").text(""); },
	"void":    () => {},
	"confirm": () => {},
	"init":    () => { mes(command.join("<br>")); },
	"message": () => { mes(command.join("<br>")); },
	"unknown": () => { mes("Unknown Command Was Detected."); },
    };
    (handler[command.shift().trim()] || handler.unknown)(command);
};

//-- Draw Handmaking Field
let make_hand = function(yamahi){
    game.users = [];
    $("#subtitle").text("手作り");
    $("#lobby, #discard_tiles").hide();
    $("#make_hands").show();
    $(":button#clear, :button#sort, :button#start").show();
    $("#message").text("配牌25枚から13枚を選んで聴牌形をつくってください。");
    $("#dealt, #handset").text("");
    $("#dealt").append(yamahi.map((hi,i) => 
	    '<li class="yama_hi" id="' + i + '_add' + hi + '">'
	    + hi_tag(hi) + "</li>").join(""));
    
    $(".yama_hi").bind("click", function(){ 
	$(this).hide();
	let artmp = $(this).attr("id").split("_add");
	let hi = yamahi[artmp[0] - 0];
	let mes = '<span class="te_hi" id="' + artmp.join("_del") + '">' 
	  + hi_tag(hi) + "</span> ";
	$("#handset").append(mes);
	$("#start").attr('disabled', $("span.te_hi").length != 13);
    });
    $("#handset").on("click", "span.te_hi", function(){ 
	$("#" + $(this).attr("id").split("_del").join("_add")).show();
	$(this).remove();
	$("#start").attr('disabled', $("span.te_hi").length!=13);
    });
    $(":button#clear").click(function(){
	$(".yama_hi").show(); 
	$("span.te_hi").remove();
    });
    $(":button#sort").click(function(){
	let $tag = $("span.te_hi").map(function(){
	    return $(this).attr("id").split("_del").shift() - 0;
	}).get().sort((x,y)=>(x - y)).map(hinum => {
	    let hi = yamahi[hinum];
	    return '<span class="te_hi" id="' + hinum + "_del" + hi + '">' 
		+ hi_tag(hi) + "</span> ";
	}).join("");
	$("#handset").html($tag);
    });
    $(":button#start").unbind().click(function(){
	if ($("span.te_hi").length != 13) return;
	$(".yama_hi").unbind();
	$(":button#clear, :button#sort, :button#start").hide();
	$("#message").text('お待ちください');
	let tehai = $("span.te_hi").unbind().map(function(){
	    let hai = $(this).attr("id").split("_del").pop() - 0;
	    yamahi.splice(yamahi.indexOf(hai), 1);
	    return hai;
	}).get();
	ws_send(tehai.join(";"));
    }).attr('disabled', true);
};

//-- Draw status in Battle Field
let draw_battle_field = (user) => {
    const $player = ["#p0", "#p1", "#p2"];
    if (game.users.length == 0) {
	$(".handset, .turn, #askron, #make_hands, #askcontinue").hide();
	$("#discard_tiles, #p0 .handset").show();
	$("#subtitle").text("打ち合い");
	$("#discard_tiles pre").remove();
	$player.forEach($dom => $($dom + " .name").text(""));
    }
    id = $player.findIndex($dom => {
	if ($($dom + " .name").text()) return false;
	$($dom + " .name").text(user);
	$($dom + " .handset").html(hi_tag(-1).repeat(13)).show();
	$($dom).show();
	game.users.push(user);
	return true;
    });
    if (id < 0) alertlog("Error: overflow num of users");
    return id;
};

let draw_river = (sutehi) => {
    let user = sutehi.shift();
    let id = game.users.indexOf(user);
    if (id < 0) id = draw_battle_field(user);
    $("#p" + id + " .river").html(sutehi.map(hi => hi_tag(hi)).join(""));
};

let disp_discard_item = function(sutehi){
    $("#discard0").html(sutehi.map((hi, i) =>
	'<li class="disc_hi" id="disc' + (i + 1) + '">' + hi_tag(hi) + "</li>"
    ).join(""));
};

//-- Draw options in Battle Field
let ask_user_discard = () => {
  $("#message").text("あなたの手番です。打牌してください。");
  $("#discard0 li.disc_hi").css("cursor","pointer").click(function(){
      if ($(this) == null) return;
      $(this).hide();
      let dischi = $(this).attr("id").replace("disc","");
      ws_send(dischi);
      $("span#message").text("");
      $("li.disc_hi").unbind("click").css("cursor","default");
  });
};
  
let ask_finish = () => {
  $("#askron").show();
  $(":button.yes").unbind().click(function(){ 
      ws_send("finish"); 
      $("#askron").hide();
  });
  $(":button.no").unbind().click(function(){ 
      ws_send("void"); 
      $("#askron").hide();
  });
};

//-- Draw result in Battle Field
let declare_finish = function() {
  let mes = '<div style="clear:both;"></div>';
  mes += '<pre style="width:100%; background-color:#eec;">';
  mes +="     ________    ___＿       \n";
  mes +="    /       /            /        /  /\n";
  mes +="   /       /            /        /  /\n";
  mes +="  /       /           ／        /  /\n";
  mes +=" /       /          ／         /  /\n";
  mes +=" ￣￣￣￣         ￣          o  o</pre>";
  $("#discard_tiles").append(mes);
};

let payment = function(i, handset, ag){
  $("#result").text("").show();
  $("#sidebox").show();
  let HandObj = new HandSet();
  HandObj.hai = handset;
  HandObj.hai.push(ag);
  let CalcObj = new HandCalc();
  CalcObj.is_mangan77 = true;
  CalcObj.ba_kz = 0;
  CalcObj.ch_kz = -1;
  CalcObj.tsumo = 0; //(.river.length <15) ? 0:2;
  CalcObj.reach = 1; //(.river.length == 1) ? 2:1;
  CalcObj.tsumi = 0;
  CalcObj.dora  = 0;
  CalcObj.aghi  = ag;
  let ResObj  = new JangResult();
  ResObj.get_result_by_hand(HandObj, CalcObj);
  let res = "<br>";
  res += CalcObj.yaku().join( " + " );
  let fu = CalcObj.fu() == 25 ? 25 : Math.ceil(CalcObj.fu()/10) * 10;
  res += " = " + CalcObj.han() + "翻" + fu + "符 " + CalcObj.point(0) + "点";
  $("#p" + i + " .handset").append(res);
  let budget = CalcObj.point(0)/1000;// + gTsumi;
};

let ask_continue = function() {
  $("#askcontinue").show();
  $(":button.yes").unbind().click(function(){ 
      ws_send("continue");       
      $("#askcontinue").hide();
  });
  $(":button.no").unbind().click(function(){ 
      ws_send("exit"); 
      $("#askcontinue").hide();
  });
};

//--  Draw tile
var hi_tag = (hi) =>
{
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

