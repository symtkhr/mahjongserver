var Layout = function() {
  var op2str = {
    "DECLC":"吃", "DECLP":"碰", "DECLK":"槓", "DECL0":"パス",
    "DECLF":"和了", "DRAW":"摸", "DISC":"打", "DISCR":"立直"};
  var wind2name = ["東","南", "西", "北"];  
  
  this.init_layout = function() {
    for(var j = 0; j < 4; j++) {
      for(var i = 0; i < 4; i++) {
        $("#furo_" + posname[j] + i).hide();
      }
    }
    $("#point_table, #reservation").hide();
    $("#point_table").html("");
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
  };
    
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
      if (jp.is_reach) {
	$("#reach").parent().css("color", "blue");
	$("#reach").attr("checked", true);
	$("#reach").attr("disabled", true);
      } else {
        var is_menzen = true;
        for (var i = 0; i < jp.furo_from.length; i++) {
          if (jp.furo_from[i] == 0) continue;
          is_menzen = false;
        }
        if (is_menzen) {

        } else {
          $("#reach").attr("disabled", true);
	  $("#reach").parent().css("color", "gray");
        }
      }
    }

    for (i = 0; i < menu.length; i++) {
      if (menu[i] === "DISC") continue;
      $("#" + menu[i].split("_").shift()).show();
    }
  };

  this.update_table_info = function() {
    if (jang_cond.jp.length != 4) return;
    for (var i = 0; i < 4; i++) {
      var jp = jang_cond.jp[i];
      var this_pos = posname[jp.pos];

      $(".wind_" + this_pos + " .pt").html(jp.pt.toString(10));
      $(".wind_" + this_pos + " .ch").html(wind2name[jp.wind]);
      $(".wind_" + this_pos + " .name").html(jp.name);
    }
  };
  
  this.set_call_info = function(call, qplayer) {
    var jp = jang_cond.jp[qplayer];
    var this_pos = posname[jp.pos];
    $("#call_" + this_pos).html(call).show();

  }

  this.update_call_info = function(op, posname, is_horizon, qplayer, turn) {
    var jp = jang_cond.jp[qplayer];
    var str_flag = "";

    if (jp.is_reach) {
      var path = is_horizon ? "trans/reach-" : "reach";
      path = "../kappa12/haiga/" + path + ".png";
      str_flag += '<img src="' + path + '">';

    }
    if (jp.is_houki) {
      str_flag += "[放棄]";
    }

    $("#stat_" + posname).html(str_flag);
    //str_flag += jp.is_1patsu  ? "[即]" : "";
    //str_flag += jp.is_furiten ? "[振]" : "";
    //str_flag += jp.tempai_target.length > 0  ? "[聴]" : "";
    str_flag = jp.is_hora ? "和了" : "";
    
    $("#call_" + posname).html(str_flag);
    if (jp.wind == turn && op !== "DECLF" && op2str[op]) { 
      $("#call_" + posname).append(" " + op2str[op]);
      $("#call_" + posname).show();
    } else {
      $("#call_" + posname).hide();
    }
  };

  this.dump_stat = function(qplayer, turn, haifu){
    this.qplayer = qplayer;
    var jp = jang_cond.jp[qplayer];
    var op = haifu.replace(/[^A-Z]/g,"");
    var this_pos = posname[jp.pos];
    var is_vertical = (jp.pos == ePos.left  || jp.pos == ePos.right);
    var is_reverse = (jp.pos == ePos.right || jp.pos == ePos.top);
    var sp = is_vertical ? "<br>" : " ";

    var imgpath = function(id, is_yoko) 
    {
      if(typeof is_yoko === "undefined") is_yoko = false;
      var is_trans = (is_vertical && !is_yoko) || (!is_vertical && is_yoko);
      var cmd0 =  cmd[id2num(id)];
      if (is_trans) cmd0 = "trans/" + cmd0 + "-";
      return  "../kappa12/haiga/" + cmd0 + ".gif";
    };

    // Table info
    $(".wind_" + this_pos + " .pt").html(jp.pt.toString(10));
    $(".wind_" + this_pos + " .ch").html(wind2name[jp.wind]);
    var obj = $(".wind_" + this_pos + " .name").html(jp.name);
    obj.html(jp.name);
    obj.css("color", jp.is_connect ? "" : "red");
    var obj = $(".wind_" + this_pos);
    obj.css("background-color", turn == jp.wind ? "green" : "")
       .css("color", turn == jp.wind ? "white" : "black");
    if (jp.is_hora) {
      obj.css("background-color","yellow").css("color", "black");
    }
    $(".wind_" + this_pos).css("z-index", turn == jp.wind ? 0 : 1);  

    this.update_call_info(op, this_pos, is_vertical, qplayer, turn);

    // 手牌表示
    var objarr = [];
    
    for (var i = 0; i < jp.tehai.length; i++) {
      if ((jp.wind == turn) && (i == jp.tehai.length - 1) &&
          (op === "DRAW" || op === "HAND")) objarr.push(sp);
      var id = jp.tehai[i];
      var attr = { "src" : imgpath(id),
                   "class" : (jp.wind == turn && (!jp.is_reach || i == jp.tehai.length - 1)) ? "inhand" : "",
                   "id"  : jp.wind + "hand_" + id.toStrByteHex() };
      objarr.push($("<img>").attr(attr));
    }

    var obj= $("#inhand_" + this_pos);
    obj.html("");
    for(var n = 0; n < objarr.length; n++) {
      var i = (!is_reverse) ? n : objarr.length - n - 1;
      obj.append(objarr[i]);
      if(is_vertical) obj.append("<br>");
    }

    for (var i = 0; i < jp.tehai_furo.length; i++) {
      var objarr = [];
      var furo = jp.tehai_furo[i];
      for (var j = 0; j < furo.length; j++) {
        var id = furo[j];
        if(jp.typfuro[i] == ANKAN){
          var path0 = (j == 1 || j == 2) ? imgpath(0) : imgpath(id);
        } else if(furo.length == 4) {
          var path0 = (j == 3 && jp.furo_from[i] == 3) || 
            (j != 2 && j + 1 == jp.furo_from[i]) ? imgpath(id, true) : imgpath(id);
        } else {
          var path0 = (j + 1 == jp.furo_from[i]) ? imgpath(id, true) : imgpath(id);
        }
        if(id == undefined) alert(i + "/" + j);
        var attr = { "src" : path0, 
          "id" : "hand_" + id.toStrByteHex(),
          "style" : "position:relative; "
          };
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

    //捨牌表示
    var objarr = [];
    for (var i = 0; i < jp.sutehai.length; i++) {
      var id = jp.sutehai[i];
      if (id == 0) continue;
      var attr = { "id" : "disc_" + id.toStrByteHex() };
      switch(jp.sutehai_type[i]){
      case 1: 
        attr.src = imgpath(id);
        attr.style = "opacity:.4"; //border:red 1px solid;";
        break;
      case 2:
        attr.src = imgpath(id, true);
        break;
      case 3:
        attr.src = imgpath(id, true);
        attr.style = "opacity:.4;";
        break;
      default: 
        attr.src = imgpath(id);
        break;
      }
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
    if($(".ex_selected").length == 0) {
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


  this.click_arrow_button = function(button_id) {
    var obj = selected_object($(this).attr("id") === "move_l");
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

  this.display_handle_haifu = function(got_haifu) {
    var newest_haifu = got_haifu[got_haifu.length - 1];
    var JpInstance = jang_cond.jp;
    for (var i = 0; i < JpInstance.length; i++) {
      this.dump_stat(i, jang_cond.turn, newest_haifu);
    }
  }
  
  this.layout_payment = function(msg) {
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
    res += "<td>和了</td>";
    res += "<td>本場</td>";
    res += "<td>供託</td>";
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
    
    if(msg.call) {
      var layoutObj = new Layout;
      for (var i = 0; i <  msg.call.length; i++) {
	layoutObj.set_call_info(msg.call[i], i);
      }
    }
    
    if(0) {
      var res = "NEXT = ";
      var strwind = ["T","N","S","P"];
      res += strwind[parseInt(msg.next / 4)] + (msg.next % 4 + 1);
      $("#point_table").append(res);
    }
    $("#point_table").fadeIn();
    $("#call_top, #call_left, #call_right, #call_bottom").show();
    $("#operation .op").hide();
    $("#operation .ops").hide();
    $("#approval").show();
    this.showtable_button();
  };

  this.showtable_button = function() {
    $("#show_table").show().unbind().click(function() { 
	if($(this).hasClass("showTable")) {
	  $(this).html("卓表示").removeClass("showTable");
	  $("#point_table").fadeIn();
	} else {
	  $(this).html("点数表示").addClass("showTable");
	  $("#point_table").fadeOut();
	}
      });
  };


  this.show_handcalc = function(CalcObj, point) {
    var imgpath = function(id, is_yoko) 
    {
      var cmd0 =  cmd[id2num(id)];
      if(is_yoko) cmd0 = "trans/" + cmd0 + "-";
      return  "../kappa12/haiga/" + cmd0 + ".gif";
    };

    // 点数表示
    var res = '<div class="payment" id="point_calc">';
    res += '<div style="float:right;" id="doradisp"></div>';
    res += CalcObj.yaku().join(", ");
    if (CalcObj.dora > 0) res += ", ドラ" + CalcObj.dora;
    res += "<br>";
    res += "= " + CalcObj.han() + "翻";
    res += (10 * Math.ceil(CalcObj.fu() / 10)) + "符";
    if (point.length == 1)
      res += " = <b>" + CalcObj.point(0) + "点</b>";
    else if (point.length == 2) 
      res += " = <b>" + point[1] + "点オール</b>";
    else if (point.length == 3)
      res += " = <b>" + point[1] + " / " + point[2] + "点</b>";
    res += "</div>";
    $("#point_table").append(res);

    //王牌表示
    $("#doradisp").append("<b>王牌</b><br>");
    for (var i = 0; i < jang_cond.dora.length; i++) {
      if (i * 2 == jang_cond.dora.length && CalcObj.reach > 0) 
	$("#doradisp").append("<br>");
      var id = jang_cond.dora[i];
      var attr = { "src" : imgpath(id) };
      $("#doradisp").append($("<img>").attr(attr));
    }
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
  this.aspect = 0;

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

  // 要整理:Layout制御
  this.dump_wangpai = function(){
    var cmd = [	 "back",
		 "1m","2m","3m","4m","5m","6m","7m","8m","9m",
		 "1p","2p","3p","4p","5p","6p","7p","8p","9p",
		 "1s","2s","3s","4s","5s","6s","7s","8s","9s",
		 "ton","nan","sha","pei","hak","hat","chu"];
    $("#deck").html("残" + this.yama);

    var obj = $("#wangpai");
    for(var i = 0; i < 7; i++) {
      var obj0 = obj.children("img").eq(i);
      if ( 1 < i && i - 2 < this.dora.length ) {
        var cmd0 = cmd[id2num(this.dora[i - 2])];
        obj0.attr({"src" : "../kappa12/haiga/" + cmd0 + ".gif"});
      } else {
        obj0.attr({"src" : "../kappa12/haiga/back.gif"});
      }
    }
  }

  this.change_position = function() {
    if (this.jp.length != 4) return;
    var JpInstance = this.jp;
    var myself = -1;
    for (var i = 0; i < JpInstance.length; i++) {
      if (!JpInstance[i].operable) continue;
      myself = i;
      break;
    }
    JpInstance[myself].pos = ePos.bottom;
    JpInstance[(myself + 1) % 4].pos = ePos.right;
    JpInstance[(myself + 2) % 4].pos = ePos.top;
    JpInstance[(myself + 3) % 4].pos = ePos.left;
  };
    
  this.eval_command = function(haifu){
    if (!haifu) return;
    if (haifu === "END") { this.is_end = true; return; }
    var reg = haifu.match(/^([0-3x])([A-Z0]+)_([0-9a-f]+)$/);
    if (!reg) return alert("Invalid format:" + reg);
    var qplayer = reg[1] * 1;
    var op = reg[2];
    var qtarget = reg[3];
    var jp = this.jp[qplayer];

    switch(op){
    case "DEAL":
      this.change_position(); // 要整理:Layout制御
      for (var i = 0; i < 13; i++)
        jp.tehai.push(parseInt(qtarget.substr(i * 2, 2), 16));
      break;

    case "DRAW":
      this.turn = qplayer;
      jp.draw_tile(parseInt(qtarget, 16));
      this.is_rag = false;
      this.yama--;
      break;

    case "DORA":
      for (var i = 0; i < qtarget.length; i += 2)
        this.dora.push(parseInt(qtarget.substr(i, 2), 16));
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
      break;
      
    case "DECLF":
      jp.declare_hora(this.turn);
      break;

    case "DECLF0":
      jp.declare_chombo(qtarget);
      break;

    case "DECLC":
    case "DECLP":
    case "DECLK":  
      if (qplayer == this.turn && op === "DECLK") {
        var naki_type = jp.declare_own_kong(qtarget);
        if (!naki_type) return alert("Invalid kong"); 
      } else {
        var nakare = this.jp[this.turn];
        var pos_discard = nakare.sutehai.length - 1;
        var nakihai = nakare.sutehai[pos_discard];
        jp.expose_tiles(this.turn, nakihai, op, qtarget);
        nakare.sutehai_type[pos_discard] |= DISCTYPE_STOLEN;
        this.turn = qplayer;
      }
      if (op === "DECLK") this.lingshang--; // [todo: needs after kong flag? 
      break;

    case "HAND":
      jp.tehai = [];
      for(var i = 0; i < qtarget.length / 2; i++)
        jp.tehai.push(parseInt(qtarget.substr(i * 2, 2), 16));
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

  this.dora_length = function(mai) {
    var doralen = 0;
    for (var j = 0; j < this.dora.length; j++) {
      var dora = id2num(this.dora[j]) - 1;
      if(dora % 9 == 8) dora -= 8;
      else if(dora == hi.pei) dora = hi.ton;
      else if(dora == hi.chu) dora = hi.hak;
      else dora++;
      doralen += mai[dora];
    }
    return doralen;
  }

  this.calc_payment = function(wind, is_display){
    var jp = this.jp[wind];
    if (!jp.is_hora && is_display) return;

    var target = this.finish_target(jp);
    var HandObj = this.translate_to_handset(jp);

    var CalcObj = new HandCalc();
    CalcObj.ba_kz = Math.floor(this.aspect / 4); // 場 [0-4=東南西北]
    CalcObj.ch_kz = jp.wind; // 家 [0-4=東南西北]

    // 和了り方 [0=ロン, 1=ツモ, 2=牌底ロン, 3=牌底ツモ, 
    //          4=搶槓ロン, 5=嶺上ツモ, 6=配牌ロン, 7=配牌ツモ]
    CalcObj.tsumo = (this.turn == jp.wind);
    if (jp.is_kaihua) CalcObj.tsumo = 5;
    else if (jp.is_changkong > 0) CalcObj.tsumo = 4;
    else if (this.yama <= 0) CalcObj.tsumo += 2;
    else if (jp.is_tenho) CalcObj.tsumo += 6;

    // 立直 [0=ダマ, 1=立直, 2=立直一発, 3=W立直, 4=W立直一発]
    CalcObj.reach = (jp.is_reach == 2) ? 3 : jp.is_reach;
    if (CalcObj.reach > 0) CalcObj.reach += jp.is_1patsu ? 1 : 0;

    CalcObj.tsumi = 0; // 積み棒
    CalcObj.aghi = id2num(target) - 1; // 和了牌
    HandObj.addhi(CalcObj.aghi, -1);
    CalcObj.dora = this.dora_length(HandObj.mai());

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

    (new Layout).show_handcalc(CalcObj, point);
    return point;
  }
}

