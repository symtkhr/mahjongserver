
var jang_cond = new JangTable;

var main = function(index) {
  if(index == undefined){
    index = 0;
  } else {
    gStep = 0;
    jang_cond.dora = [];
    jang_cond.yama = 70;
  }

  var full_step = $("#sel_haifu span").length;
  if(full_step <= gStep){
    toggle_play(true);
    return;
  }

  for(var j = gStep; j < full_step; j++) {
    var obj = $("#sel_haifu span").eq(j);
    var pos = obj.position().top - $("#sel_haifu span").eq(0).position().top;
    $("#sel_haifu").scrollTop(pos - $("#sel_haifu").height() / 2);

    var step = obj.html().replace(/[^0-9A-z]/g, "");
    if(step.indexOf("_") < 0) step += "_0";
    if(step.indexOf("DORA") == 0) step = "x" + step;
    var reg = step.match(/^([0-3x])(D[A-Z]+)_([0-9a-f]+)$/);
    if(!reg) continue;
    $("#sel_haifu span").css("color", "black");
    obj.css("color","red");
    jang_cond.eval_command(step);
    if(!step.match(/DECL|DISC|DRAW/)) continue;
    if(j < index) continue;
    j++;
    break;
  }
   gStep = j;

  $("#step").html("Step " + gStep + ": " + step);

  var JpInstance = jang_cond.jp;
  for(var i = 0; i < JpInstance.length; i++) 
    JpInstance[i].dump_stat(jang_cond.turn, step);
  jang_cond.dump_wangpai();
  jang_cond.check_extra();

}

var toggle_play = function(is_force_stop) {
  if(typeof is_force_stop === "undefined") is_force_stop = false;
  if($("#auto_step").hasClass("play") || is_force_stop){
    $("#auto_step").html("▶▷").removeClass("play");
    clearInterval(gPsgID);
  } else {
    $("#auto_step").html("▮▮").addClass("play");
    main(); 
    gPsgID = setInterval('main()',1000);
  }
}

var gPsgID = 0;  
var gStep = 0;
$(document).ready( function() {
    jang_cond.table_init();
    main(0);

    $("#sel_haifu span").click(function(){
	var index = $("#sel_haifu span").index(this);
	main(index);
      });

    $(window).keydown(function(e){ 
	if(e.keyCode == 0x5a) main();
	if(e.keyCode == 0x58) { toggle_play(true); main(0); }
	if(e.keyCode == 0x43) toggle_play();
      });

    $("#one_step").click(function(){ main(); });
    $("#reset_step").click(function() { toggle_play(true); main(0); });
    $("#auto_step").click(function(){ toggle_play(); });
    $("#editor").click(function(){toggle_edit();});

    $('input[name="yourDirection"]:radio').change( function() {
       var JpInstance = jang_cond.jp;
       var player = $(this).val() * 1;
       JpInstance[player].pos = ePos.bottom;
       JpInstance[(player + 1) % 4].pos = ePos.right;
       JpInstance[(player + 2) % 4].pos = ePos.top;
       JpInstance[(player + 3) % 4].pos = ePos.left;

       for(var i = 0; i < JpInstance.length; i++) 
	 JpInstance[i].dump_stat(jang_cond.turn, 
				 $("#sel_haifu span").eq(gStep - 1).html());
       jang_cond.dump_wangpai();

    });

    var toggle_edit = function(){
      if($("#editor").html() === "Edit"){

	$("#sel_haifu_edit").show();
	$("#sel_haifu").hide();
	var obj = $("#sel_haifu span");

	for(var i = 0; i < obj.size(); i++)
	  $("textarea#sel_haifu_edit").append(obj.eq(i).html() + "\n");

	$("#sel_haifu_edit").focus();
	$("#editor").html("Set");
	toggle_play(true);

      } else {

	var haifu = $("#sel_haifu_edit").val().split("\n");
	$("#sel_haifu_edit").hide();
	$("#sel_haifu").html("").show();

	for(var i = 0; i < haifu.length; i++)
	  $("#sel_haifu").append("<span>" + haifu[i] + "</span>\n");

	$("#editor").html("Edit");
	main(0);
	toggle_play(true);
	$("#sel_haifu span").click(function(){
	    var index = $("#sel_haifu span").index(this);
	    main(index);
	  });
      }
    }

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
 
