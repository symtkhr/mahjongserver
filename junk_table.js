var Layout = function() {
  var op2str = {
    "DECLC":"吃", "DECLP":"碰", "DECLK":"槓", "DECL0":"パス",
    "DECLF":"和了", "DRAW":"摸", "DISC":"打", "DISCR":"立直",
    "DISCT":"(自摸切)", "DECLF0_bad":"錯和(0翻)", "DECLF0_f": "錯和(振聴)", 
    "DISCR0" : "不聴"};
  var wind2name = ["東","南", "西", "北"];
  this.is_loading = false;

  // 開局時の初期化
  this.init_layout = function() {
    for (var j = 0; j < 4; j++) {
      for (var i = 0; i < 4; i++) {
        $("#furo_" + posname[j] + i).hide();
      }
      for (var i = 0; i < 3; i++) {
	$("#discard_" + posname[j] + i + " span").html("");
      }
      $("#call_" + posname[j]  + ", " + 
	"#reach_" + posname[j] + ", " + 
	"#abandon_" + posname[j]).html("").hide();
    }
    $(".last_margin").removeClass("last_margin");
    $("#reservation").hide();
    $("#reach").attr("disabled", false);
    $("#reach, #unsteal, #unrong").parent()
      .css("color", "black").css("background", "#ccc");
    $("#operation .opc").show();
    $("#reach, #unsteal, #unrong").attr("checked", false).click(function() {
	if ($(this).attr("checked")) {
	  $(this).parent().css("background", "#acf");
	} else {
	  $(this).parent().css("background", "#ccc");
	}
      });
    var res = "<div id='point_calc' class='payment'>[配牌中...]</div>";
    $("#point_table").html(res).show();
  };

  // 操作ボタン表示
  this.show_operation = function(op) {
    $("#operation .op").hide();
    $("#operation .ops").hide();
    if(op == null) {
      return;
    }
    for (var i = 0; i < jang_cond.jp.length; i++)
      if (jang_cond.jp[i].operable) break;
    var jp = jang_cond.jp[i];
    var menu = op.split(";");

    if (0 <= menu.index("DISC")) {
      $("#move_l, #move_r, #rc").show();
      $("#count").css("bottom", 0);
      if (jp.is_reach) {
	$("#reach").parent().css("color", "blue");
	$("#reach").attr("checked", true);
	$("#reach").attr("disabled", true);
	//$("#inhand_" + posname[jp.pos] + " img.last_margin").addClass("inhand");
      } else {
	//$("#inhand_" + posname[jp.pos] + " img").addClass("inhand");
        var is_menzen = true;
        for (var i = 0; i < jp.furo_from.length; i++) {
          if (jp.furo_from[i] == 0) continue;
          is_menzen = false;
        }
        if (!is_menzen) {
          $("#reach").attr("disabled", true);
	  $("#reach").parent().css("color", "gray");
        }
      }
    } else {
      $("#count").css("bottom", "55px");
    }

    for (var i = 0; i < menu.length; i++) {
      if (menu[i] === "DISC") continue;
      $("#" + menu[i].split("_").shift()).show();
    }
  };

  // 終局時ボタン表示
  this.showtable_button = function() {
    $("#show_table").show().unbind().click(function() { 
	if ($(this).hasClass("showTable")) {
	  $(this).html("卓表示").removeClass("showTable");
	  $("#point_table").fadeIn();
	} else {
	  $(this).html("点数表示").addClass("showTable");
	  $("#point_table").fadeOut();
	}
      });
  };

  // 宣言一括
  this.set_call_info = function(call, qplayer) {
    var jp = jang_cond.jp[qplayer];
    var this_pos = posname[jp.pos];
    $("#call_" + this_pos).html(call).show();

  }

  this.update_call_info = function(qplayer, op) {
    var jp = jang_cond.jp[qplayer];
    var this_pos = posname[jp.pos];

    // 卓央表示
    if (jp.is_reach) {
      var is_horizon = (jp.pos == ePos.left  || jp.pos == ePos.right);
      var path = is_horizon ? "reach-" : "reach";
      path = "../kappa12/haiga/" + path + ".png";
      $("#reach_" + this_pos).html('<img src="' + path + '">').show();
    }
    if (jp.is_houki) { 
      var str_flag = "<img src='../kappa12/haiga/houki.svg' width=30 height=30>";
      $("#abandon_" + this_pos).html(str_flag).show();
    }

    // 吹き出し表示
    if ((op.indexOf("DISC") != -1) || (op.indexOf("DECLK") != -1) || true) {
      for (var i = 0; i < 4; i++)
	$("#call_" + posname[jang_cond.jp[i].pos]).html("").hide();
    }
    //if (jang_cond.turn != qplayer || !op2str[op]) return;
    var obj =  $("#call_" + this_pos);
    if (op.match(/^DECL/)) {
      obj.html(" " + op2str[op]).css("font-size", "50pt")
	.css("height", "72px").css("width", "144px");
      obj.animate({"font-size":"14pt"}, {duration: 600, queue:false})
	.animate({"height":"24px", "width":"48px"}, {duration: 600, queue:false});
    }
    if (op.match(/^DISC/)) {
      obj.html("");
      if (0 < op.indexOf("R0")) {
	obj.append(" " + op2str["DISCR0"]).css("font-size", "50pt")
	  .css("height", "72px").css("width", "144px");
      }
      if (0 < op.indexOf("R")) {
	obj.append(" " + op2str["DISCR"]).css("font-size", "50pt")
	  .css("height", "72px").css("width", "144px");
      obj.animate({"font-size":"14pt"}, {duration: 600, queue:false})
	.animate({"height":"24px", "width":"48px"}, {duration: 600, queue:false});
      }
      if (0 < op.indexOf("T")) 
	obj.append(' <span style="font-size:10pt; white-space:nowrap;">' + 
		   op2str["DISCT"] + "</span>");
    }
    if (obj.html()) {
      obj.show();
    } else {
      obj.hide();
    }
  };

  //卓央表示(全簡易)
  this.update_table_info = function() {
    if (jang_cond.jp.length != 4) return; //todo:2->3->0->1の格納がありえる
    jang_cond.change_position(); // 要整理:Layout制御

    for (var i = 0; i < 4; i++) {
      var jp = jang_cond.jp[i];
      try {
	var this_pos = posname[jp.pos];
      } catch(e) {
	break;
      }

      $(".wind_" + this_pos + " .pt").html(jp.pt.toString(10));
      $(".wind_" + this_pos + " .ch").html(wind2name[jp.wind]);
      var obj = $(".wind_" + this_pos + " .name");
      obj.html(jp.name);
      obj.css("color", jp.is_connect ? "" : "red");
    }
  };
  

  //卓央表示(単詳細)
  this.update_table_info_inplay = function() {
    for (var qplayer = 0; qplayer < 4; qplayer++) {
      var jp = jang_cond.jp[qplayer];
      var this_pos = posname[jp.pos];
      var inturn = (jang_cond.turn == jp.wind);
      
      var obj = $(".wind_" + this_pos + " .name");
      obj.css("color", jp.is_connect ? "" : "red");
      var obj = $(".wind_" + this_pos);
      if (inturn) 
	obj.addClass("inturn");
      else
	obj.removeClass("inturn");
      obj//.css("background-color", inturn ? "green" : "")
      $("#hand_" + this_pos).css("background-color", inturn ? "green" : "")

      .css("color", inturn ? "white" : "black"); // 要css化
      $("#fuohbase").css("border-" + this_pos + "-color", 
			 inturn ? "green" : "transparent");
      if (jp.is_hora) {
	$("#fuohbase").css("border-" + this_pos + "-color", "yellow");
	obj.css("color", "black");
	//obj.css("background-color","yellow").css("color", "black");
	$("#hand_" + this_pos).css("background-color", "yellow");
	
      }

      $(".wind_" + this_pos).css("z-index", inturn ? 0 : 1);
    }
  };

  var isSvg = false;
  if (isSvg) {
    var haiga_dir = "../svghaiga/";
    var imgname = ["MJback", 
		 "MJ1wan",  "MJ2wan",  "MJ3wan",  "MJ4wan",  "MJ5wan",  
		 "MJ6wan",  "MJ7wan",  "MJ8wan",  "MJ9wan", 
		 "MJ1bing", "MJ2bing", "MJ3bing", "MJ4bing", "MJ5bing", 
		 "MJ6bing", "MJ7bing", "MJ8bing", "MJ9bing", 
		 "MJ1tiao", "MJ2tiao", "MJ3tiao", "MJ4tiao", "MJ5tiao", 
		 "MJ6tiao", "MJ7tiao", "MJ8tiao", "MJ9tiao", 
		 "MJEastwind", "MJWestwind", "MJSouthwind", "MJNorthwind", 
		 "MJWhitedragon", "MJGreendragon", "MJReddragon", ];
    var expander = ".svg";
  } else {
    var haiga_dir = "../kappa12/haiga/";
    var imgname = cmd;
    var expander = ".gif";
  }

  //牌画表示
  var proto_imgpath = function(is_vertical) {
    return function(id, is_yoko) 
    {
      if (typeof is_yoko === "undefined") is_yoko = false;
      var is_trans = (is_vertical && !is_yoko) || (!is_vertical && is_yoko);
      var cmd0 = imgname[id2num(id)];
      var attr = {style: "", src: ""};
      if (isSvg) {
	if (is_trans) attr.style = "-webkit-transform:rotate(90deg);";
	attr.width = 18;
	attr.height = 24;
      } else {
	if (jang_cond.is_red(id)) cmd0 += "r";
	if (is_trans) cmd0 += "-";
	if (jang_cond.is_black(id)) attr.style += "-webkit-filter:brightness(70%);";
      }
      attr.src = haiga_dir + cmd0 + expander;
      return attr;
    };
  }

  //手牌表示
  this.update_hand = function(qplayer, is_last_margin) {
    this.qplayer = qplayer;
    var jp = jang_cond.jp[qplayer];
    var inturn = (jp.wind == jang_cond.turn);
    var this_pos = posname[jp.pos];
    var is_vertical = (jp.pos == ePos.left  || jp.pos == ePos.right);
    var is_reverse = (jp.pos == ePos.right || jp.pos == ePos.top);
    var sp = is_vertical ? "<br>" : " ";
    var imgpath = proto_imgpath(is_vertical);
    
    var objarr = [];
    var obj = $("#inhand_" + this_pos);
    for (var i = 0; i < jp.tehai.length; i++) {
      var is_last = (i == jp.tehai.length - 1);
      var id = jp.tehai[i];
      var attr = imgpath(id);
      attr.id = jp.wind + "hand_" + id.toStrByteHex();
      var n = (is_reverse) ? (13 - i) : i;
      attr.class = (jp.operable) ? "inhand" : "";
      if (inturn && is_last && is_last_margin) attr.class += " last_margin";
      obj.children("img").eq(n).attr(attr);
    }
    for (var i = jp.tehai.length; i < 14; i++) {
      var n = (is_reverse) ? (13 - i) : i;
      obj.children("img").eq(n).attr("src", "").hide().removeClass("inhand");
    }
    $(".ex_selected").removeClass("ex_selected");

    /*
    var obj = $("#inhand_" + this_pos);
    for (var n = 0; n < objarr.length; n++) {
      var i = (is_reverse) ? (objarr.length - n - 1) : n;
      obj.children("img").eq(i).attr(objarr[i]);
      //if (is_vertical) obj.append("<br>");
    }
    */

    for (var i = 0; i < jp.tehai_furo.length; i++) {
      var objarr = [];
      var furo = jp.tehai_furo[i];
      for (var j = 0; j < furo.length; j++) {
        var id = furo[j];
        if(jp.typfuro[i] == ANKAN){
          var attr = ((j == 1) || (j == 2)) ? imgpath(0) : imgpath(id);
        } else if(furo.length == 4) {
          var attr = 
	    ((j == 3) && (jp.furo_from[i] == 3)) || 
            ((j != 2) && (j + 1 == jp.furo_from[i])) ? 
	    imgpath(id, true) : imgpath(id);
        } else {
          var attr = (j + 1 == jp.furo_from[i]) ? imgpath(id, true) : imgpath(id);
        }
        if (id == undefined) alert(i + "/" + j);
        attr.id = "hand_" + id.toStrByteHex();
	attr.style += "position:relative;"

        objarr.push($("<img>").attr(attr));
      }
      var obj = $("#furo_" + this_pos + i);
      obj.show();
      obj.html("");
      for (var n = 0; n < objarr.length; n++) {
        var j = is_reverse ? (objarr.length - n - 1) : n;
        if (objarr.length == 4) 
          objarr[j].css(is_vertical ? "top" : "left", (n * -3) + "pt");
        obj.append(objarr[j]);
        if (is_vertical) obj.append("<br>");
      }
    }
    $("#deck").html("残" + jang_cond.yama);
  };

  //捨牌表示
  this.update_discard = function (qplayer) {
    var jp = jang_cond.jp[qplayer];
    try{
    var this_pos = posname[jp.pos];
    } catch(e) {
      alert(qplayer);
    }
    var is_vertical = (jp.pos == ePos.left  || jp.pos == ePos.right);
    var is_reverse = (jp.pos == ePos.right || jp.pos == ePos.top);
    var sp = is_vertical ? "<br>" : " ";
    var imgpath = proto_imgpath(is_vertical);

    $(".last_discard").removeClass("last_discard");

    var objarr = [];
    for (var i = 0; i < jp.sutehai.length; i++) {
      var id = jp.sutehai[i];
      if (id == 0) continue;
      switch(jp.sutehai_type[i]){
      case 1: 
        var attr = imgpath(id);
        attr.style += "opacity:.4"; //border:red 1px solid;";
        break;
      case 2:
        var attr = imgpath(id, true);
        break;
      case 3:
        var attr = imgpath(id, true);
        attr.style += "opacity:.4;";
        break;
      default: 
        var attr = imgpath(id);
        break;
      }
      attr.id = "disc_" + id.toStrByteHex();
      if ((i + 1 == jp.sutehai.length) && (qplayer == jang_cond.turn))
	attr.class = "last_discard";
      objarr.push($("<img>").attr(attr));
    }

    var PERLINE = 6;
    for (var j = 0; j < 3; j++) {
      var obj = $("#discard_" + this_pos + j + " span");
      obj.html("");
      var nstart = j * PERLINE;
      var nstop = (j < 2) ? (nstart + PERLINE) : objarr.length;
      for (var n = nstart; n < nstop; n++) {
        var i = is_reverse ? (nstart + nstop - n - 1) : n;
        if (i < objarr.length){
          obj.append(objarr[i]);
          if (is_vertical) obj.append("<br>");
        }
      }
    }
    $("#message").html("");
  };

  this.discard_motion = function(qplayer, op, qtarget) {
    var is_tsumogiri = (op.index("T") != 0);
    var obj = $("#" + qplayer + "hand_"  + qtarget.toStrByteHex());
    var jp = jang_cond.jp[qplayer];
    var this_pos = posname[jp.pos];
    var is_vertical = (jp.pos == ePos.left  || jp.pos == ePos.right);
    var is_reverse = (jp.pos == ePos.right || jp.pos == ePos.top);
    var sp = is_vertical ? "<br>" : " ";
    var len = jp.sutehai.length;
  };

  this.steal_motion = function(qplayer, op, stolen) {

  }

  this.click_inhand = function (jqObj_tile) {
    if (jqObj_tile.hasClass("ex_selected")) return true;
    if (!jqObj_tile.hasClass("inhand")) return true;
    $(".inhand").removeClass("ex_selected").css("border","none");
    $("#rc").html(jqObj_tile.clone().attr("id","_").attr("class","")
		  .css("height","100%").css("width","100%"));
    jqObj_tile.addClass("ex_selected").css("border","2px solid red");
    return false;
  }

  var selected_object = function (is_to_left) {
    if ($(".ex_selected").length == 0) {
      return  $(".inhand:last");
    }

    if (is_to_left) {
      var obj = $(".ex_selected").prev();
      if (!obj.hasClass("inhand")) var obj = $(".inhand:last");
      return obj;
    }
    
    var obj = $(".ex_selected").next();
    if (!obj.hasClass("inhand")) var obj = $(".inhand:first");
    return obj;
  }


  this.click_arrow_button = function(dom_id) {
    if (dom_id === undefined) dom_id = $(this).attr("id");
    var obj = selected_object(dom_id === "move_l");
    // todo: css除去
    $(".inhand").removeClass("ex_selected").css("border","none");
    $("#rc").html(obj.clone().attr("id", "").attr("class", "")
		  .css("height","100%").css("width","100%"));
    obj.addClass("ex_selected").css("border","2px solid red");
  };

  this.layout_aspect = function(obj) {
    var strwind = ["東","南","西","北"];
    var str_fuwo = strwind[parseInt(obj.aspect / 4)] + (obj.aspect % 4 + 1) + "-";
    str_fuwo += (obj.honba);
    str_fuwo += " 供" + (obj.banked);
    $("#aspect").html(str_fuwo);
  };

  /*
  this.display_handle_haifu = function(got_haifu) {
    var JpInstance = jang_cond.jp;
    for (var j = 0; j < got_haifu.length; j++) {
      if (0 < got_haifu.length) j = got_haifu.length - 1;
      for (var i = 0; i < JpInstance.length; i++) {
	this.dump_stat(i, got_haifu[j]);
      }
    }
  */
    /*
    var JpInstance = jang_cond.jp;
    if (not_history) {
      var func = [];
      for (var j = 0; j < got_haifu.length; j++) {
	func[got_haifu.length - j - 1] = this.make_animate();
      }
      func[0] = function() { obj[0].animate(style[0]); };
      for (var j = 0; j < got_haifu.length; j++) {
	func[j + 1] = function() { obj[j].animate(style[j], {complete, func[j]}); };
      }
      func[n]();
    }
    this.dump_stat(all);
    */
  //}
  
  this.layout_payment = function(msg) {
    if (msg.point) {
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
    }
    
    var res = "<div id='point_agenda' class='payment'><table><tr>";
    res += "<td></td><td></td>";
    res += "<td>" + (jang_cond.is_ryukyoku() ? "聴牌" : "和了") + "</td>";
    res += "<td>本場</td>";
    res += "<td>供託</td>";
    res += "<td style='width:1em'></td><td style='width:4ex'></td>";
    res += "</tr>";
    for (var pindex = 0; pindex < 4; pindex++) {
      var wind = (pindex - (jang_cond.aspect % 4) + 4) % 4;
      res += (jang_cond.jp[wind].operable) ? "<tr style='background: #9fc;'>" : "<tr>";
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
    
    if (msg.call) {
      $("#call_top, #call_left, #call_right, #call_bottom").show();
      for (var i = 0; i < 4; i++) {
	this.set_call_info(msg.call[i], i);
      }
    }
    
    if(0) {
      var res = "NEXT = ";
      var strwind = ["T","N","S","P"];
      res += strwind[parseInt(msg.next / 4)] + (msg.next % 4 + 1);
      $("#point_table").append(res);
    }
    $("#point_table").fadeIn();
    $("#operation .op").hide();
    $("#operation .ops").hide();
    $("#approval").show();
    this.showtable_button();
  };

  var round_fu = function(fu) {
    if (fu == 25) return 25;
    return (10 * Math.ceil(fu / 10));
  }

  this.show_handcalc = function(CalcObj, point) {
    // 点数表示
    var wind = CalcObj.ch_kz;
    var res = '<div class="payment" id="point_calc' + wind + '">';
    res += '<div style="float:right;" class="doradisp"></div>';
    res += CalcObj.yaku().join(", ");
    if (0 < CalcObj.dora) res += ", ドラ" + CalcObj.dora;
    res += "<br>";
    res += "= " + CalcObj.han() + "翻";
    res += round_fu(CalcObj.fu()) + "符";
    if (point.length == 1)
      res += " = <b>" + CalcObj.point(0) + "点</b>";
    else if (point.length == 2) 
      res += " = <b>" + point[1] + "点オール</b>";
    else if (point.length == 3)
      res += " = <b>" + point[1] + " / " + point[2] + "点</b>";
    res += "</div>";
    $("#point_table").append(res);

    //王牌表示
    var obj = $("#point_calc" + wind + " .doradisp");
    obj.html("<b>王牌</b><br>");
    for (var i = 0; i < jang_cond.dora.length; i++) {
      var id = jang_cond.dora[i];
      var attr = proto_imgpath(false)(id);
      obj.append($("<img>").attr(attr));
    }
    if (0 < CalcObj.reach) {
      obj.append("<br>");
      var wind = CalcObj.ch_kz;
      for (var i = 0; i < jang_cond.jp[wind].dora.length; i++) {
	var id = jang_cond.jp[wind].dora[i];
	var attr = proto_imgpath(false)(id);
	obj.append($("<img>").attr(attr));
      }
    }
  };

  //王牌表示
  this.dump_wangpai = function(){
    var obj = $("#wangpai");
    for (var i = 0; i < 7; i++) {
      var obj0 = obj.children("img").eq(i);
      var id = ((1 < i) && (i - 2 < jang_cond.dora.length)) ?
        jang_cond.dora[i - 2] : 0;
      obj0.attr(proto_imgpath(false)(id));
    }
  }

  //全表示
  this.dump_stat = function(haifu) {
    var reg = haifu.match(/^([0-3x])([A-Z0]+)_([0-9a-f]+)$/);
    var op = (reg) ? reg[2] : "";
  
    for (var qplayer = 0; qplayer < 4; qplayer++) {
      var jp = jang_cond.jp[qplayer];
      this.update_table_info_inplay(qplayer);
      this.update_hand(qplayer, (op === "DRAW" || (op === "HAND" && jp.is_hora)));
      this.update_discard(qplayer);
      if ((qplayer == jang_cond.turn) || jp.is_hora)
	this.update_call_info(qplayer, op);
    }
    this.dump_wangpai();

  };
};



/////////////////////////////////////////////////////////////////////////////
var JangTable = function(){
  this.yama = 70;
  this.lingshang = 4;
  this.turn = 0;
  this.jp = [];
  this.haifu = [];
  this.dora = [];
  this.msgstock = [];
  this.banked = 0;
  this.is_rag = false;
  this.is_end = false;
  this.is_haitei = false;
  this.red_enable = false;
  this.transp_enable = false;
  this.kuitan_enable = true;
  this.tonpu = false;
  this.aspect = 0;
  this.double_rong = false;

  this.apply_tileset = function(tilesets) {
    var q = tilesets.split(";");
    for (var i = 0; i < q.length; i++) {
      if (q[i] === "red") this.red_enable = true;
      if (q[i] === "transp") this.transp_enable = true;
      if (q[i] === "notan") this.kuitan_enable = false;
      if (q[i] === "east") this.tonpu = true;
      if (q[i] === "wron") this.double_rong = true;
    }
    $("#rule").html((this.kuitan_enable ? "喰" : "") + 
		    (this.red_enable ? "赤" : "") +
		    (this.transp_enable ? "透" : "") +
		    (this.double_rong ? "" : "頭") +
		    (this.tonpu ? "東" : "南") 
		    );
  }

  this.is_ryukyoku = function() {
    if (!this.is_end) return false;
    for (var i = 0; i < 4; i++) if (this.jp[i].is_hora) return false;
    return true;
  }

  this.init_aspect = function() {
    this.yama = 70;
    this.lingshang = 4;
    this.turn = 0;
    this.haifu = [];
    this.dora = [];
    this.msgstock = [];
    this.is_rag = false;
    this.is_end = false;
    this.is_haitei = false;
  }

  this.discard_tile_just_now = function() {
    var nakare = this.turn;
    var jp = this.jp[nakare];
    var pos_discard = jp.sutehai.length - 1;
    return jp.sutehai[pos_discard];
  }

  // テスト動作用
  this.check_extra = function() {
    var JpInstance = this.jp;
    var cmd = [	 "##",
		 "1m","2m","3m","4m","5m","6m","7m","8m","9m",
		 "1p","2p","3p","4p","5p","6p","7p","8p","9p",
		 "1s","2s","3s","4s","5s","6s","7s","8s","9s",
		 "to","na","sh","pe","hk","ht","ch"];
    var t = [];
    for (var i = 0; i < 4; i++) {
      t = t.concat(JpInstance[i].tehai);
      var arr = JpInstance[i].tehai_furo;
      for (var j = 0; j < arr.length; j++) t = t.concat(arr[j]);
      var arr = JpInstance[i].sutehai;
      for (var j = 0; j < arr.length; j++) 
        if (!(JpInstance[i].sutehai_type[j] & DISCTYPE_STOLEN)) t.push(arr[j]);
    }
    t.sort(function(a, b){ return a-b; });
    var pre_id = 0;
    var mes_alert = "";
    var mes_alert_ex = "";
    for (var i = 0; i <  t.length; i++) {
      var id = t[i];
      if(id > 136) {
      } else if(pre_id + 1 < id){
        for(var j = pre_id + 1; j < id; j++) 
          mes_alert += ( j.toString(16) + ":" + cmd[id2num(j)] + "/ ");
      } else if(pre_id + 1 > id){
        mes_alert_ex += ( id.toString(16) + ":" + cmd[id2num(id)] + "/ ");
      }
      pre_id = id;
    }
    if(mes_alert_ex || mes_alert) 
      $("#alert_mes").html('重複牌：' + mes_alert_ex);
    //$("#alert_mes").html('(' + mes_alert + ')<br>' + mes_alert_ex);  
    //echo count(t)." tiles\n";
  }

  this.make_haifu = function(str_haifu) {
    this.haifu.push(str_haifu);
  }

  this.change_position = function() {
    if (this.jp.length != 4) return;
    var myself = -1;
    for (var i = 0; i < this.jp.length; i++) {
      if (typeof this.jp[i] === "undefined") return;
      if (!this.jp[i].operable) continue;
      myself = i;
      break;
    }
    this.jp[myself].pos = ePos.bottom;
    this.jp[(myself + 1) % 4].pos = ePos.right;
    this.jp[(myself + 2) % 4].pos = ePos.top;
    this.jp[(myself + 3) % 4].pos = ePos.left;
  };
    
  this.eval_command = function(haifu){
    if (!haifu) return;
    if (haifu === "END") { 
      this.is_end = true; 
      return; 
    }
    
    var reg = haifu.match(/^([0-3x])([A-Z0]+)_([0-9a-f]+)$/);
    if (!reg) return alert("Invalid format:" + reg);
    var qplayer = (reg[1] === 'x') ? -1 : (reg[1] * 1);
    var op = reg[2];
    var qtarget = reg[3];
    var jp = this.jp[qplayer];

    switch(op){
    case "DEAL":
      for (var i = 0; i < 13 * 2; i += 2)
        jp.tehai.push(parseInt(qtarget.substr(i, 2), 16));
      if (!jang_disp.is_loading) {
	jang_disp.update_hand(qplayer, false);
      }
      break;

    case "DRAW":
      this.turn = qplayer;
      jp.draw_tile(parseInt(qtarget, 16));
      this.is_rag = false;
      this.yama--;
      if (!jang_disp.is_loading) {
	jang_disp.update_call_info(qplayer, op);
	jang_disp.update_hand(qplayer, true);
	jang_disp.update_table_info_inplay();
      }
      break;

    case "DORA":
      for (var i = 0; i < qtarget.length; i += 2) {
	if (qplayer < 0)
	  this.dora.push(parseInt(qtarget.substr(i, 2), 16));
        else 
	  this.jp[qplayer].dora.push(parseInt(qtarget.substr(i, 2), 16));
      }
      if (!jang_disp.is_loading) {
	jang_disp.dump_wangpai();
      }
      break;

    case "DISC":
    case "DISCR":
    case "DISCR0":
    case "DISCT":
    case "DISCTR":
    case "DISCTR0":
      if (this.turn != jp.wind) return alert("invalid timing");
      var target = parseInt(qtarget, 16);
      var is_valid = jp.discard(target, op);
      if (!is_valid) return alert("invalid target");
      this.is_rag = true;
      if (!jang_disp.is_loading) {
	jang_disp.update_call_info(qplayer, op);
	jang_disp.update_discard(qplayer);
	jang_disp.update_hand(qplayer, false);
      }
      break;
      
    case "DECLF":
      jp.declare_hora(this.turn);
      if (!jang_disp.is_loading) {
	jang_disp.update_call_info(qplayer, op);
	jang_disp.update_discard(this.turn);
	jang_disp.update_table_info_inplay();
      }
      break;

    case "DECLF0":
      jp.declare_chombo(qtarget);
      if (!jang_disp.is_loading) {
	jang_disp.update_call_info(qplayer, op + "_" + qtarget);
      }
      break;

    case "DECLK":
      if (qplayer == this.turn) {
        var naki_type = jp.declare_own_kong(qtarget);
        if (!naki_type) return alert("Invalid kong"); 
	if (!jang_disp.is_loading) {
	  jang_disp.update_hand(qplayer, false);
	  jang_disp.update_call_info(qplayer, op);
	}
	break;
      }
      // through
    case "DECLC":
    case "DECLP":
      var nakare = this.jp[this.turn];
      var pos_discard = nakare.sutehai.length - 1;
      var nakihai = nakare.sutehai[pos_discard];
      jp.expose_tiles(this.turn, nakihai, op, qtarget);
      nakare.sutehai_type[pos_discard] |= DISCTYPE_STOLEN;
      this.turn = qplayer;
      if (!jang_disp.is_loading) {
	jang_disp.update_call_info(qplayer, op);
	jang_disp.update_table_info_inplay();
	jang_disp.update_discard(nakare.wind);
	jang_disp.update_hand(qplayer, false);
      }
      break;

    case "HAND":
      jp.tehai = [];
      for (var i = 0; i < qtarget.length; i += 2)
        jp.tehai.push(parseInt(qtarget.substr(i, 2), 16));
      if (!jang_disp.is_loading) {
	jang_disp.update_hand(qplayer, jp.is_hora);
	jang_disp.update_table_info_inplay();
      }
      break;

    default:
      return alert("invalid command");
    }
    this.make_haifu(haifu);
  }

  this.finish_target = function(jp) {
    if (jp.is_changkong > 0) {
      return jp.is_changkong;
    } 
    var stolen_jp = this.jp[this.turn];
    if(this.turn == jp.wind) {
      var target = stolen_jp.tehai.pop(); 
      stolen_jp.tehai.push(target);
      return target;
    }
    var target = stolen_jp.sutehai.pop();
    stolen_jp.sutehai.push(target);
    return target;
  }

  var type_format_to_handset = function(type) {
    if (type == CHI) return typ.chi;
    if (type == PONG) return typ.pon;
    if (type == DMK || type == KAKAN) return typ.kan;
    if (type == ANKAN) return typ.ankan;
    return false;
  }

  this.translate_to_handset = function(jp) {
    var HandObj = new HandSet();

    for (var i = 0; i < jp.tehai.length; i++){
      HandObj.addhi(id2num(jp.tehai[i]) - 1, -1);
    }
    
    for (var i = 0; i < jp.tehai_furo.length; i++){
      var head = id2num(Math.min.apply(null, jp.tehai_furo[i])) - 1;
      var type = type_format_to_handset(jp.typfuro[i]);
      HandObj.addhi(head, type);
    }
    return HandObj;
  }

  this.is_red = function(id) {
    if (!this.red_enable) return false;
    var num = id2num(id);
    if (27 < num) return false;
    if (num % 9 != 5) return false;
    if (id % 4 != 0) return false;
    return true;
  }

  this.is_black = function(id) {
    if (!this.transp_enable) return false;
    if (id % 4 != 3) return false;
    return true;
  }

  this.red_length = function(jp) {
    if (!this.red_enable) return 0;
    var redlen = 0;
    for (var i = 0; i < jp.tehai.length; i++){
      if (this.is_red(jp.tehai[i])) redlen++;
    }
    for (var i = 0; i < jp.tehai_furo.length; i++) {
      var ments = jp.tehai_furo[i];
      for (var j = 0; j < ments.length; j++) { 
	if (this.is_red(ments[j])) redlen++;
      }
    }
    return redlen;
  }

  this.dora_length = function(mai, doradisp) {
    var doralen = 0;
    for (var j = 0; j < doradisp.length; j++) {
      var dora = id2num(doradisp[j]) - 1;
      if(dora % 9 == 8) dora -= 8;
      else if (dora == hi.pei) dora = hi.ton;
      else if (dora == hi.chu) dora = hi.hak;
      else dora++;
      doralen += mai[dora];
    }
    return doralen;
  }

  // 立直 [0=ダマ, 1=立直, 2=立直一発, 3=W立直, 4=W立直一発]
  this.translate_to_reach = function(jp) {
    var ret = (jp.is_reach == 2) ? 3 : jp.is_reach;
    if (0 < ret) ret += jp.is_1patsu ? 1 : 0;
    return ret;
  }


  // 和了り方 [0=ロン, 1=ツモ, 2=牌底ロン, 3=牌底ツモ, 
  //          4=搶槓ロン, 5=嶺上ツモ, 6=配牌ロン, 7=配牌ツモ]
  this.translate_to_tsumo = function(jp) {
    var ret = (this.turn == jp.wind);
    if (jp.is_kaihua) ret = 5;
    else if (jp.is_changkong > 0) ret = 4;
    else if (this.yama <= 0) ret += 2;
    else if (jp.is_tenho) ret += 6;
    return ret;
  }

  this.calc_payment = function(wind, is_display){
    var jp = this.jp[wind];
    if (!jp.is_hora && is_display) return;

    var target = this.finish_target(jp);
    var HandObj = this.translate_to_handset(jp);
    var CalcObj = new HandCalc();

    CalcObj.yaku_all["TAN"][1] = (this.kuitan_enable) ? 1 : 0; // 喰断の翻
    CalcObj.ba_kz = Math.floor(this.aspect / 4); // 場 [0-4=東南西北]
    CalcObj.ch_kz = jp.wind; // 家 [0-4=東南西北]
    CalcObj.tsumo = this.translate_to_tsumo(jp);
    CalcObj.reach = this.translate_to_reach(jp);
    CalcObj.tsumi = 0; // 積み棒
    CalcObj.aghi = id2num(target) - 1; // 和了牌
    HandObj.addhi(CalcObj.aghi, -1);
    CalcObj.dora = 
      this.dora_length(HandObj.mai(), jp.dora.concat(this.dora)) 
    + this.red_length(jp);

    var ResObj  = new JangResult();
    ResObj.get_result_by_hand(HandObj, CalcObj);

    var point = [CalcObj.point(0)];
    if (CalcObj.tsumo % 2 == 1) {
      if (CalcObj.ch_kz == 0) 
        point.push(CalcObj.point(1));
      else
        point.push(CalcObj.point(2), CalcObj.point(1));
    }

    if (!is_display) return point[0];

    jang_disp.show_handcalc(CalcObj, point);
    return point;
  }
}

