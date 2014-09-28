
Array.prototype.index = function(value){
  for(var i=0; i<this.length; i++){ if(this[i]==value) return i; }
  return -1;
};
Array.prototype.clone = function(){
  var res=[];
  for(var i=0; i<this.length; i++){ res.push(this[i]); }
  return res;
};
Array.prototype.diff = function(arr){
  for(var i = arr.length; i > 0; i--){ 
    var c = this.index(arr[i - 1]);
    if(c >= 0) this.splice(c, 1);
  }
  return this;
};
Number.prototype.toStrByteHex = function(){
  var s = this.toString(16);
  return (this < 0x10) ? ("0" + s) : s;
}
var posname = [ "top", "left", "bottom", "right"];
var ePos = [];
for(var i=0; i < posname.length; i++) ePos[posname[i]] = i;

var CHI   = 1;
var PONG  = 2;
var DMK   = 3;
var KAKAN = 4;
var ANKAN = 5;
var RONG  = 6;
var DISCTYPE_STOLEN = 1;
var DISCTYPE_REACH  = 2;


var exit = function(str){
  alert(str);
  stop_by_undefined_call();
}

//////////////////////////////////////////////
var JangPlayer = function(){
  this.name;
  this.wind;
  this.pt;
  this.operable = false;
  this.pos = -1;
  this.tehai = [];
  this.tehai_furo = [];
  this.typfuro = [];
  this.furo_from = [];
  this.sutehai = [];
  this.sutehai_type = [];
  this.is_reach  = false;
  this.is_1patsu = false; 
  this.tempai_target = [];
  this.is_furiten = false;
  this.is_hora = false;
  this.bit_naki = 0;
  this.token;

  this.draw_tile = function(tile){
    if(this.tehai.length % 3 != 1) exit("tahai or shohai");
    this.tehai.push(tile);
    //(no call if the load haifu)
    if(!this.is_reach) this.furiten = false;
  }

  ////// [[Discard tiles]] //////
  this.discard = function(turn, target, is_call_reach){
    if(turn != this.wind) return false;
    var tehai = this.tehai;

    // normal update of tehai & sutehai
    if(this.tehai.index(target) < 0){
      if(this.tehai.index(0) < 0) exit("invalid discard");
      this.tehai.diff([0]);
    } else { 
      this.tehai.diff([target]);
    }
    this.tehai.sort(function(a,b){ return a-b; });
    this.sutehai.push(target);
    this.sutehai_type.push(0);
    
    // tempai check (no need if the load haifu)
    this.tempaihan();

    // 1patsu should be erased if already reached
    is_valid_call = false;
    if(this.is_reach){
      this.is_1patsu = false;
    }
    // apply reach
    else if(is_call_reach){
      is_valid_call = this.declare_reach();
    }
    return true;
  }

  this.declare_reach = function(){
    this.is_reach = true;
    this.is_1patsu = true;
    this.sutehai_type[this.sutehai_type.length - 1] = DISCTYPE_REACH;
    return true;
  }

  ////// [[Judge Cutting]] //////
  this.nakihan = function(turn, sutehai){
    if(this.wind == turn) return;
    BIT_RON = 8;
    BIT_KAN = 4;
    BIT_PON = 2;
    BIT_CHI = 1;

    var mai = [];
    this.bit_naki = 0;
    var sutenum = id2num(sutehai);

    // Get the number of tiles
    for(var i=0; i<=34; i++) mai[i] = 0;
    for(var i=0; i<this.tehai.length; i++) mai[id2num(this.tehai[i])]++;

    // Check Rong Flag
    if(this.tempai_target.length > 0){
      if(0 <= this.tempai_target.index(sutenum)) this.bit_naki |= BIT_RON;
      /*
      var test_hand = this.tehai.clone();
      test_hand.push(sutehai);
      */
      //hands_check = new FinCheck;
      //if ( hands_check.agari_hantei(test_hand) ) this.bit_naki |= BIT_RON;
    }
    
    // Check Kong/Pong Flag
    if(!this.is_reach ){
      if( mai[sutenum] == 3 ) this.bit_naki |= BIT_KAN | BIT_PON;
      if( mai[sutenum] == 2 ) this.bit_naki |= BIT_PON;
    }

    // Check Chie Flag 
    if(this.wind == (turn + 1) % 4){
      if(sutenum > 27 || this.is_reach) return; // 字牌,立直者除く
      if(sutenum     % 9 > 1 && mai[sutenum+1] && mai[sutenum-1]) // 嵌張チー[1,9]除く
	this.bit_naki |= BIT_CHI;    
      if((sutenum-1) % 9 < 7 && mai[sutenum+1] && mai[sutenum+2]) // 下目チー[8,9]除く
	this.bit_naki |= BIT_CHI; 
      if((sutenum-1) % 9 > 1 && mai[sutenum-2] && mai[sutenum-1]) // 上目チー[1,2]除く
	this.bit_naki |= BIT_CHI;
    }
  }

  this.tempaihan = function(){
    var HandObj = new HandSet();
    for(var i = 0; i < this.tehai.length; i++){
      HandObj.hai.push(id2num(this.tehai[i]) - 1);
    }
    for(var i = 0; i < this.tehai_furo.length; i++){
      var furo = this.tehai_furo[i];
      var head = id2num(Math.min.apply(null, furo)) - 1;
      var type = id2num(furo[0]) != id2num(furo[1]) ? typ.chi :
        (furo.length == 3 ?  typ.pon : typ.kan ); // not considered ankong
      HandObj.n.push([head, type]);
    } 
    var ag = [];
    for(var i = 0; i < 34; i++) {
      if(HandObj.mai()[i] == 4) continue;
      HandObj.hai.push(i);
      if( HandObj.split_into_ments(false) ) ag.push(i + 1);
      HandObj.hai.pop();
    }
    if(ag.length > 0){ this.tempai_target = ag;   return true; }
    return false; 
    /*
    this.is_tempai = ( hands_check.tenpai_hantei(this.tehai) );
    if(this.is_tempai) {
      for(var i = 0; i < this.sutehai.length; i++){
	var sutehai = this.sutehai[i];
	if(this.is_furiten) break;
	for(var i = 0; i < this.is_tempai.length; i++){
	  var machi = this.is_tempai[i];
	  if(machi != id2num(sutehai)) continue;
	  this.is_furiten = true;
	  break;
	}
      }
    }
    */
  }
  
  this.set_reservation = function(naki_type, target) {
    this.bit_naki = 0;
    this.rsv_naki["type"] = naki_type;
    this.rsv_naki["target"] = target;
  }

  this.haifu2target = function(q) {
    var targets= [];
    for(var i = 0; i < q.length / 2; i++){
      var target = parseInt(q.substr(i * 2, 2), 16);
      if(this.tehai.index(target) < 0){
	if(this.tehai.index(0) < 0) return false;
	this.tehai.diff([0]);
      }
      targets.push(target);
    }
    return targets;
  }

  this.expose_tiles = function(turn, nakihai, op, qtarget) {
    var op2type = {
      "DECLC": CHI,
      "DECLP": PONG,
      "DECLK": DMK,
      "DECLF": RONG };
    var tehai = this.tehai;
    var target = this.haifu2target(qtarget);
    var typefuro = op2type[op];

    this.typfuro.push(typefuro);

    if(typefuro == DMK){
      var gaito = [];
      var furohai = 4 * Math.ceil(parseInt(nakihai, 16) / 4);
      for(var i = 0; i < 4; i++) gaito.push(furohai - i);
    } else {
      var gaito = [nakihai];
      for(var i = 0; i < target.length; i++) gaito.push(target[i]);
    }
    this.tehai = this.tehai.diff(gaito);
	
    //here should be kakan consideration(maikka)
    this.tehai_furo.push(gaito);
    this.furo_from.push((this.wind - turn + 4) % 4);

    return true;
  }

  this.delare_tsumo = function(){
    var turn = this.wind;
    //var hands_check = new FinCheck;
    //if(!hands_check.agari_hantei(this.tehai)) return false;
    this.is_hora = true;
    this.tempai_target = [];
    return true;
  }

  this.declare_hora = function(turn){
    //turn == this.wind;
    this.is_hora = true;
    this.tempai_target = [];
    /*
    // Tsumo
    if(turn == this.wind){
      hands_check = new FinCheck;
      if(!hands_check.agari_hantei(this.tehai) ) return false;
      return true;
    }
    // Rong
    */
    return true;
  }

  this.declare_kong = function(target){
    var tehai = this.tehai;
    var nakihai = id2num(parseInt(target, 16));

    var gaito = [];
    for(var i=0; i < this.tehai.length; i++) {
      var id = this.tehai[i];
      if(id2num(id) == nakihai) gaito.push(id);
    }
    

    var gaito_furo = -1;
    for(var i = 0; i < this.tehai_furo.length; i++){
      var furo = this.tehai_furo[i];
      var nakihai1 = id2num(furo[0]);
      var nakihai2 = id2num(furo[1]);
      if(nakihai1 == nakihai2 && nakihai1 == nakihai){
	gaito_furo = i;
	break;
      }
    }

    // KaKong
    if(gaito_furo >= 0) {
      if(gaito.length != 1 && this.tehai.index(0) < 0) return false;
      this.tehai_furo[gaito_furo].push(parseInt(target, 16));
      this.tehai = this.tehai.diff(this.tehai_furo[gaito_furo]);
      this.typfuro[gaito_furo] = KAKAN;
      return KAKAN;
    }
    // AnKong
    else {
      if(gaito.length != 4 && this.tehai.index(0) < 0) return false;
      var furo_ments = [];
      this.tehai = this.tehai.diff(gaito); // todo: consider including unknown tile
      this.tehai_furo.push(gaito);
      this.furo_from.push(0);
      this.typfuro.push(ANKAN);
      return ANKAN;
    }
  }
  this.find_target = function(sutenum, op) {
    var targets = [];
    switch(op) {
    case "DECLP":
      for(var i = 0; i < this.tehai.length; i++) {
	var target = this.tehai[i];
	if(sutenum == id2num(target)) targets.push(target);
      }
      break;

    case "DECLC":
      var diff = [-2, -1, 1, 2];
      var neighbors = [[], [], [], []];
      if(sutenum < 1 || 27 < sutenum) break;
      for(var i = 0; i < this.tehai.length; i++) {
	var target = this.tehai[i];
	for(var j = 0; j < diff.length; j++) {
	  var head = (sutenum - 1) % 9 + diff[j] + 1;
	  if(head < 1 || 9 < head) continue;
	  if(sutenum + diff[j] == id2num(target)) neighbors[j].push(target);
	}
      }
      if(neighbors[1].length == 0) neighbors[0] = [];
      if(neighbors[2].length == 0) neighbors[3] = [];


      for(var i = 0; i < neighbors.length; i++) {
	targets = targets.concat(neighbors[i]);
      }
      //alert(neighbors +  "/" + neighbors.length + "/" + targets);
      break;
    }
    return targets;
  }
  this.show_expose_tile_selection = function(targets){
    //alert(targets);
    for(var i = 0; i < targets.length; i++) {
      var id = targets[i];
      var jq_id = this.wind + "hand_" + id.toStrByteHex();
      $("#" + jq_id).css("border", "2px solid blue").click(function(){
	  if($(this).hasClass("ex_selected"))
	    $(this).css("border-color", "blue").removeClass("ex_selected");
	  else
	    $(this).css("border-color", "red").addClass("ex_selected");
      });
    }
  };

  /*
  this.make_haifu = function(op, target){
    fp = fopen("haifu.dat","a+");
    fout = sprintf("%01d%s_", this.wind, op);
    if(!is_array(target)) 
      fout += sprintf("%02x", target);
    else 
      foreach(target as targetj) fout += sprintf("%02x",targetj);
    echo "[".fout."]";
    //fputs(fp, fout."\n");
    fclose(fp);
  }
  */

  ////// [[Show Cutting Notice]] //////
  this.show_naki_form = function(){
    if( this.bit_naki == 0 || !this.operable) return ""; 
    
    var menu_all = ["DECLC","DECLP","DECLK","DECLF"];
    var menu = [];

    for(var i = 0; i < menu_all.length; i++){
      if((this.bit_naki >> i) & 0x01) // Check each bit
        menu.push(menu_all[i]);
    }
    if(menu.length == 0) return "";
    
    var mes = "<span id='" +  this.wind + "DECL0' class='decl'>(0)</span> ";

    for(i = 0; i < menu.length; i++) {
      mes += "<span id='" + this.wind + menu[i] + "' class='decl'>";
      mes += "(" + menu[i].substr(-1) + ")";
      mes += "</span> ";
    }
    return mes;
  }

  ////// [[Show Declaration Notice]] //////
  this.show_decl_form = function(){
    var menu = [];
    var mai = [];
    var cmd_sort = "";
    var mes = "";
    if(!this.operable) return "";

    if (!this.is_reach) {
      var is_menzen = true;
      for(var i = 0; i < this.furo_from.length; i++) {
	if(this.furo_from[i] == 0) continue;
	is_menzen =false;
      }
      //alert(is_menzen);
      if(is_menzen)
	mes += ' <input type="checkbox" id="reach' + this.wind + '">R';

    }
    // Check Tsumo Flag
    if(this.tempai_target.length > 0){
      if(0 <= this.tempai_target.index(id2num(this.tehai[this.tehai.length -1])))
	menu.push("F");
    }
    for(var j = 0; j <= 34; j++) mai[j] = 0;
    // Get the number of tiles
    for(var j = 0; j < 14; j++) if(this.tehai[j] > 0) mai[id2num(this.tehai[j])]++;
    // Check AnKan Flag
    for(var i = 0; i < mai.length; i++)
      if(mai[i] == 4 && i > 0)  menu.push("K_" + (i * 4).toStrByteHex());

    // Check KaKan Flag
    for(var i in this.tehai_furo){
      var furo = this.tehai_furo[i];
      var nakihai1 = id2num(furo[0]);
      if(nakihai1 == undefined) break;
      var nakihai2 = id2num(furo[1]);
      if(nakihai1 == nakihai2 && mai[nakihai1] > 0 && nakihai1 > 0){
        menu.push("K_" + furo[0].toStrByteHex());
      }
    }
    if(menu.length == 0) return mes;

    for(var j = 0; j < menu.length; j++) {
      mes += "<span id='" + this.wind + "DECL" + menu[j] + "' class='decl'>";
      mes += "(" + menu[j].substr(0, 1);
      mes += id2num(menu[j].split("_").pop().toString(16)) + ")";
      mes += "</span> ";
    }



    return mes;
  }
  /*
  ////// [[Show Situation Notice]] //////
  this.dump_stat_cli = function(turn){
    var str_te = "";
    var num_te = "";
    var str_st = "";
    var cmd = [	 "##",
		 "1m","2m","3m","4m","5m","6m","7m","8m","9m",
		 "1s","2s","3s","4s","5s","6s","7s","8s","9s",
		 "1p","2p","3p","4p","5p","6p","7p","8p","9p",
		 "to","na","sh","pe","hk","ht","ch"];
    
    for (var i = 0; i < this.tehai.length; i++) {
      var id = this.tehai[i];
      str_te += cmd[id2num(id)] + " ";
      num_te += id.toStrByteHex() + " ";
    }

    for(var i = 0; i < this.tehai_furo.length; i++) {
      var furo = this.tehai_furo[i];
      str_te += " / ";
      num_te += " / ";
      for(var j = 0; j < furo.length; j++){
	var id = furo[j];
	if(this.typfuro[i] == ANKAN) str_te +="##";
	else 
	  str_te += (id > 0) ? cmd[id2num(id)] : ""; 
	if(id == undefined) alert(i+"/"+j);
	num_te += (id > 0) ? id.toStrByteHex() : "";
      }
    }
    var mes  = (this.bit_naki) ? this.show_naki_form() : "";
    mes += (turn == this.wind) ? this.show_decl_form() : "";

    var str_flag  = this.is_reach   ? "[rch]" : "";
    str_flag += this.is_1patsu  ? "[1pt]" : "";
    str_flag += this.is_tempai  ? "[tmp]" : "";
    str_flag += this.is_furiten ? "[fri]" : "";
    
    var printf =  "&lt;" + this.name + "> " + str_te + " | " + mes + "\n";
    printf += (turn == this.wind ? "*   " : "    ") + num_te + " | " + str_flag + "\n";

    printf += "   [";
    for(var i=0; i < this.sutehai.length; i++) {
      var id = this.sutehai[i];
      if(id == 0) continue;
      var s = cmd[id2num(id)];
      switch(this.sutehai_type[i]){
      case 1: printf += "<s>" + s + "</s>"; break;
      case 2: printf += "<b>" + s + "</b>"; break;
      default: printf += s; break;
      }
      printf += " ";
    }
    printf += "]\n";
    $("#mes").append(printf);
  } 
  */
 ////// [[Show Situation Notice]] //////
  this.dump_stat = function(turn, haifu){
    var op2str = {"DECLC":"吃", "DECLP":"碰", "DECLK":"槓", 
		  "DECLF":"和了", "DRAW":"摸", "DISC":"打", "DISCR":"打"};
    var op = haifu.replace(/[^A-Z]/g,"");

    var this_pos = posname[this.pos];
    var is_horizon = (this.pos == ePos.left  || this.pos == ePos.right);
    var is_reverse = (this.pos == ePos.right || this.pos == ePos.top);
    var sp = is_horizon ? "<br>" : "&#32;";

    var imgpath = function(id, is_reach) {
      if(typeof is_reach === "undefined") is_reach = false;
      var is_yoko = (is_horizon && !is_reach) || (!is_horizon && is_reach);
      var cmd0 =  cmd[id2num(id)];
      if(is_yoko) cmd0 = "trans/" + cmd0 + "-";
      return  "../kappa12/haiga/" + cmd0 + ".gif";
    };
    var wind2name = ["東","南", "西", "北"];

    // Table info
    $("#wind_" + this_pos).html(wind2name[this.wind] + this.name + this.pt);
    var obj = $("#wind_" + this_pos + ", #hand_" + this_pos + ", #call_" + this_pos);
    obj.css("background-color", turn == this.wind ? "green":"")
       .css("color", turn == this.wind ? "white":"black");
    if(this.is_hora) obj.css("background-color","yellow").css("color", "black");

    var str_flag  = (this.bit_naki) ? this.show_naki_form() : "";
    str_flag += (turn == this.wind) ? this.show_decl_form() : "";
    if(this.is_reach) {
      var path = is_horizon ? "trans/reach-" : "reach";
      path = "../kappa12/haiga/" + path + ".png";
      str_flag += '<img src="' + path + '">';
    }
    str_flag += this.is_1patsu  ? "[即]" : "";
    str_flag += this.is_furiten ? "[振]" : "";
    str_flag += this.tempai_target.length > 0  ? "[聴]" : "";
    str_flag += this.is_hora    ? "和了" : "";
    
    $("#call_" + this_pos).html(str_flag);
    if(this.wind == turn && op !== "DECLF") 
      $("#call_" + this_pos).append(" " + op2str[op]);

    // Display hand
    var objarr = [];

    for (var i = 0; i < this.tehai.length; i++) {
      if(this.wind == turn && op === "DRAW" && i == this.tehai.length - 1) 
	objarr.push(sp);
      var id = this.tehai[i];
      var attr = { "src" : imgpath(id),
		   "class" : (this.wind == turn) ? "inhand" : "",
		   "id"  : this.wind + "hand_" + id.toStrByteHex() };
      objarr.push($("<img>").attr(attr));
    }

    var obj= $("#inhand_" + this_pos);
    obj.html("");
    for(var n = 0; n < objarr.length; n++) {
      var i = (!is_reverse) ? n : objarr.length - n - 1;
      obj.append(objarr[i]);
      if(is_horizon) obj.append("<br>");
    }

    var objarr = [];
    for(var i = this.tehai_furo.length - 1; i >= 0; i--) {
      var furo = this.tehai_furo[i];
      objarr.push(sp);
      for(var j = 0; j < furo.length; j++){
	var id = furo[j];
	if(this.typfuro[i] == ANKAN){
	  var path0 = (j==1 || j==2) ? imgpath(0) : imgpath(id);
	} else if(furo.length == 4) {
	  var path0 = (j == 3 && this.furo_from[i] == 3) || 
	    (j != 2 && j + 1 == this.furo_from[i]) ? imgpath(id, true) : imgpath(id);
	} else{
	  var path0 = (j + 1 == this.furo_from[i]) ? imgpath(id, true) : imgpath(id);
	}
	if(id == undefined) alert(i + "/" + j);
	var attr = { "src" : path0, 
		     "id" : "hand_" + id.toStrByteHex() };
	objarr.push($("<img>").attr(attr));
      }
    }

    var obj= $("#furo_" + this_pos);
    obj.html("");
    for(var n = 0; n < objarr.length; n++) {
      var i = !is_reverse ? n : objarr.length - n - 1;
      obj.append(objarr[i]);
      if(is_horizon) obj.append("<br>");
    }
    var j = 0;
    var objarr = [];
    for(var i = 0; i < this.sutehai.length; i++) {
      var id = this.sutehai[i];
      if(id == 0) continue;

      switch(this.sutehai_type[i]){
      case 1: 
	var attr = { "src" : imgpath(id), "id" : "disc_" + id.toStrByteHex(), "style" : "opacity:.4;" };
	break;
	continue;
      case 2:
	var attr = { "src" : imgpath(id, true), "id" : "disc_" + id.toStrByteHex() };
	break;
      default: 
	var attr = { "src" : imgpath(id), "id" : "disc_" + id.toStrByteHex() };
	break;
      }
      objarr.push($("<img>").attr(attr));
    }

    for(var j = 0; j < 3; j++) {
      var obj = $("#discard_" + this_pos + j);
      obj.html("");
      for(var i = 0; i < 6; i++) {
	n = j * 6 + (is_reverse ? 5 - i : i);
	if(n < objarr.length){
	  obj.append(objarr[n]);
	  if(is_horizon) obj.append("<br>");
	}
      }
    }
  } 
}

/////////////////////////////////////////////////////////////////////////////
var JangTable = function(){
  this.yama = 70;
  this.lingshang = 4;
  this.turn = 0;
  this.jp = [];
  this.haifu = [];
  this.dora = [];
  this.banked = 0;

  this.table_init = function(){
      /*
    var pos = [ "top", "left", "bottom", "right"];
    for(var n = 0; n < 4; n++) {
      var this_pos = pos[n];
      var is_horizon = (n % 2 == 1);

      $("#hand_" + this_pos)
      .css( is_horizon ? "width" :"height", "28px")
      .css(!is_horizon ? "width" :"height", "320px");

      for(var i = 0; i < 3; i++)
	$("#discard_" + this_pos + i)
	  .css(is_horizon ? "width" :"height", "28px")
	  .css(!is_horizon ? "width" :"height", (18 * 5 + 25) + "px");

      $("#call_" + this_pos)
	.css(is_horizon ? "width" :"height", "28px")
	.css(!is_horizon ? "width" :"height", "320px");

      $("#wind_" + this_pos)
	.css("width" , (18 * 4) + "px")
	.css("height", (18 * 2) + "px");

    }
      */
  }
  
  this.check_extra = function() {
    var JpInstance = this.jp;
   var cmd = [	 "##",
		 "1m","2m","3m","4m","5m","6m","7m","8m","9m",
		 "1s","2s","3s","4s","5s","6s","7s","8s","9s",
		 "1p","2p","3p","4p","5p","6p","7p","8p","9p",
		 "to","na","sh","pe","hk","ht","ch"];
    var t = [];
    for(var i = 0; i < 4; i++) {
      t = t.concat(JpInstance[i].tehai);
      var arr = JpInstance[i].tehai_furo;
      for(var j = 0; j < arr.length; j++) t = t.concat(arr[j]);
      var arr = JpInstance[i].sutehai;
      for(var j = 0; j < arr.length; j++) 
	if(!(JpInstance[i].sutehai_type[j] & DISCTYPE_STOLEN)) t.push(arr[j]);
    }
    t.sort(function(a,b){ return a-b; });
    var pre_id = 0;
    var mes_alert = "";
    var mes_alert_ex = "";
    for(var i=0; i <  t.length; i++) {
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


  this.deal_tiles = function(){
    var JpInstance = this.jp;
    /*
    $fp = fopen("haifu.dat", 'w');
    fclose($fp);
    */
    for(var i = 0; i < 2; i++){
      if(JpInstance[i * 2].token > 0 ) continue;
      token= rand(1, 0xffff);
      JpInstance[i * 2 + 0].token = token;
      JpInstance[i * 2 + 1].token = token;
      //echo i + ":<token=" + JpInstance[i*2].token + ">\n";
      break;
    }
    
    //  Shuffling tiles
    for(i=0; i<136; i++)
      this.yamahai[i] = i + 1; 
    
    for(i=0; i<300; i++) {
      r1 = rand(0, 136);
      r2 = rand(0, 136);
      if(r1 > r2)
	list(r1, r2) = [r2, r1]; 
      for(j=0; j < abs(r2 - r1); j++) { 
        list(this.yamahai[r1 + j], this.yamahai[j]) = 
          [this.yamahai[j], this.yamahai[r1 + j]]; 
      }
    }
    
    // Dealing tiles
    for(var i = 0; i < 4; i++){
      for(var j = 0; j < 13; j++)
	JpInstance[i].tehai[j] = this.yamahai.shift();
      unset(JpInstance[i].tehai[13]);
    }
    
    for(var i = 0; i < 4; i++){
      sort(JpInstance[i].tehai); 
      //this.make_haifu(i . "DEAL", JpInstance[i].tehai);
      //JpInstance[i].make_haifu("DEAL", JpInstance[i].tehai);
    }
    tile = this.yamahai.shift();  // 1st Drawing
    JpInstance[0].tehai.push(tile);
    //JpInstance[0].make_haifu("DRAW", tile);
    this.make_haifu("0DRAW_" + tile.toStrByteHex());

    this.save_jokyo();
  }

  this.make_haifu = function(str_haifu) {
    this.haifu.push(str_haifu);
  }

  this.dump_wangpai = function(){
    var cmd = [	 "back",
		 "1m","2m","3m","4m","5m","6m","7m","8m","9m",
		 "1s","2s","3s","4s","5s","6s","7s","8s","9s",
		 "1p","2p","3p","4p","5p","6p","7p","8p","9p",
		 "ton","nan","sha","pei","hak","hat","chu"];
    $("#deck").html("残" + this.yama);

    var obj = $("#wangpai");
    for(var i = 0; i < 7; i++) {
      var obj0 = obj.children("img").eq(i);
      if( 1 < i && i - 2 < this.dora.length ) {
	var cmd0 = cmd[id2num(this.dora[i - 2])];
	obj0.attr({"src" : "../kappa12/haiga/" + cmd0 + ".gif"});
      } else {
	obj0.attr({"src" : "../kappa12/haiga/back.gif"});
      }
    }
  }

  this.change_position = function() {
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
    /*
      for (var i = 0; i < JpInstance.length; i++) {
      JpInstance[i].dump_stat(jang_cond.turn, "");
      }*/
  };
    


  ////// [[Processing Commands]] //////
  this.eval_command = function(haifu){
    if(!haifu) return;
    var reg = haifu.match(/^([0-3x])([A-Z0]+)_([0-9a-f]+)$/);
    if(!reg) return alert("Invalid format:" + reg);
    var qplayer = reg[1] * 1;
    var op = reg[2];
    var qtarget = reg[3];
    var JpInstance = this.jp;
    var my_wind = 0;
    var news = ["T","N","S","P"];

    switch(op){
    case "DEAL":
      //JpInstance[qplayer].pos  = qplayer;
      this.change_position();
      for(var i = 0; i < 13; i++)
	JpInstance[qplayer].tehai.push(parseInt(qtarget.substr(i * 2, 2), 16));
      JpInstance[qplayer].tempaihan();
      //this.make_haifu(haifu);
      break;

    case "DRAW":
      this.turn = qplayer;
      JpInstance[qplayer].draw_tile(parseInt(qtarget, 16));
      for(var i = 0; i < 4; i++) JpInstance[i].bit_naki = 0;
      //this.dora.push(parseInt(qtarget, 16));
      //this.make_haifu(haifu);
      this.yama--;
      break;

    case "DORA":
      this.dora.push(parseInt(qtarget, 16));
      //this.make_haifu(haifu);
      break;

    case "DISC":
    case "DISCR":
       var turn = this.turn;
      var target = parseInt(qtarget, 16);
      var is_valid = JpInstance[turn].discard(qplayer, target, op==="DISCR");
      if(!is_valid) return alert("invalid target");
      if(op === "DISCR") this.banked++;
      //this.make_haifu(haifu); // todo: warning DISCR with no reach right

      for(var i = 0; i < 4; i++) // todo: remove player but me
	JpInstance[i].nakihan(turn, target);
      //this.turn_to_next();
      break;
    
    case "DECLC":
    case "DECLP":
    case "DECLK":
    case "DECLF":
      if(op === "DECLF") 
	JpInstance[qplayer].declare_hora(this.turn);
      else
      if(qplayer == this.turn) {
	if(op === "DECLK") {
	  var naki_type = JpInstance[qplayer].declare_kong(qtarget);
	  if(!naki_type) return alert("Invalid declare"); 
	  //naki_type = ANKAN; // [todo: consider KAKAN
	  //this.make_haifu(haifu);
	}
      } else {
	// specify the stolen tile
	var nakare = this.turn;
	var pos_discard = JpInstance[nakare].sutehai.length - 1;
	var nakihai = JpInstance[nakare].sutehai[pos_discard];

	// actual stealing/exposure
	JpInstance[qplayer].expose_tiles(this.turn, nakihai, op, qtarget);
	JpInstance[this.turn].sutehai_type[pos_discard] |= DISCTYPE_STOLEN;
	//this.make_haifu(haifu);
	this.turn = qplayer;
      }
    // all flags are canceled (in case)
    for(var i = 0; i < 4; i++){
      JpInstance[i].bit_naki = 0;
      JpInstance[i].is_1patsu = false;
    }
    if(op === "DECLK") this.lingshang--; // [todo: needs after kong flag? 
    break;

    case "HAND":
      JpInstance[qplayer].tehai = [];
      for(var i = 0; i < qtarget.length / 2; i++)
	JpInstance[qplayer].tehai.push(parseInt(qtarget.substr(i * 2, 2), 16));
      break;

    default:
      return alert("invalid command");
    }
    this.make_haifu(haifu);
  }

  /*
  this.turn_to_next = function(){
    var JpInstance = this.jp;

    for(var i = 0; i < 4; i++) if(JpInstance[i].bit_naki > 0) return;
    this.turn = (this.turn + 1) % 4;
    if( this.yamahai.length < 14 ){ 
      this.end_kyoku();
      return;
    } 
    target = this.yamahai.shift();
    JpInstance[this.turn].draw_tile(target);
    this.make_haifu(this.turn + "DRAW_" + target.toStrByteHex());
  }
  
  this.check_simultaneous = function(player){
    BIT_RON = 8;
    var JpInstance = this.jp;
    naki_type = JpInstance[player].rsv_naki["type"];
    nakare = this.turn;

    if(nakare == player) return false;

    for(i = 0; i < 4; i++){
      if(i == nakare || i == player) continue;
      if(naki_type < JpInstance[i].bit_naki) return true;
      if(naki_type == RONG && (JpInstance[i].bit_naki & BIT_RON)) return true;
      if(naki_type == 0) continue;
      JpInstance[i].bit_naki = 0;
      JpInstance[i].rsv_naki["type"] = 0;
    }
    return false;
  }
  */

  ////// [[End]] //////
  this.end_kyoku = function(){}
}

var id2num = function(id){ return Math.ceil(id / 4); }
