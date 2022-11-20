Array.prototype.index = function(value){
  for (var i = 0; i < this.length; i++)
    if (this[i] == value) return i;
  return -1;
};
Array.prototype.clone = function(){
  var res=[];
  for (var i = 0; i < this.length; i++){ res.push(this[i]); }
  return res;
};
Array.prototype.diff = function(arr){
  for (var i = arr.length; i > 0; i--){ 
    var c = this.index(arr[i - 1]);
    if(c >= 0) this.splice(c, 1);
  }
  return this;
};
Array.prototype.last = function() {
  return this[this.length - 1];
}
Number.prototype.toStrByteHex = function(){
  var s = this.toString(16);
  return (this < 0x10) ? ("0" + s) : s;
}
var posname = [ "top", "left", "bottom", "right"];
var ePos = [];
for (var i = 0; i < posname.length; i++) ePos[posname[i]] = i;
var id2num = function(id){ return Math.ceil(id / 4); }

var CHI   = 1;
var PONG  = 2;
var DMK   = 3;
var KAKAN = 4;
var ANKAN = 5;
var RONG  = 6;
var DISCTYPE_STOLEN = 1;
var DISCTYPE_REACH  = 2;

var exit = function(str){
  $("#message").html(str);
  stop_by_undefined_call();
}

var JangPlayer = function(){
  this.name = "";
  this.wind = 0;
  this.pt = 0;
  this.operable = false;
  this.pos = -1;
  this.tehai = [];
  this.tehai_furo = [];
  this.typfuro = [];
  this.furo_from = [];
  this.sutehai = [];
  this.sutehai_type = [];
  this.is_reach  = 0;
  this.is_1patsu = false; 
  this.tempai_target = [];
  this.is_furiten = false;
  this.is_hora = false;
  this.is_connect = true;
  this.is_houki = false;
  this.bit_naki = 0;
  this.dora = [];
  this.token;

  this.draw_tile = function(tile){
    if(this.tehai.length % 3 != 1) exit("tahai or shohai");
    this.tehai.push(tile);
  }

  this.discard = function(target, op) {
    if (this.tehai.index(target) < 0){
      if (this.tehai.index(0) < 0) exit("invalid discard");
      this.tehai.diff([0]);
    } else { 
      this.tehai.diff([target]);
    }
    this.tehai.sort(function(a, b){ return a - b; });
    this.sutehai.push(target);
    if (op.indexOf("R") > 0) this.is_reach = 1;
    if (op.indexOf("R0") > 0) this.is_houki = 1;
    this.sutehai_type.push(op.indexOf("R") > 0 ? DISCTYPE_REACH : 0);

    return true;
  }

  this.haifu2target = function(q) {
    var targets = [];
    for(var i = 0; i < q.length / 2; i++){
      var target = parseInt(q.substr(i * 2, 2), 16);
      if (this.tehai.index(target) < 0){
        if (this.tehai.index(0) < 0) return false;
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

    if (typefuro == DMK) {
      var gaito = [];
      var furohai = 4 * Math.ceil(nakihai / 4);
      for (var i = 0; i < 4; i++) gaito.push(furohai - i);
    } else {
      var gaito = [nakihai];
      for (var i = 0; i < target.length; i++) gaito.push(target[i]);
    }
    this.tehai = this.tehai.diff(gaito);
    this.tehai_furo.push(gaito);
    this.furo_from.push((this.wind - turn + 4) % 4);
    return true;
  }

  this.declare_chombo = function(qtarget) {
    this.is_houki = true;
    return;
  }

  this.declare_hora = function(turn){
    this.is_hora = true;
    this.tempai_target = [];
    return true;
  }

  this.declare_own_kong = function(target){
    var tehai = this.tehai;
    var nakihai = id2num(parseInt(target, 16));

    var gaito = [];
    for (var i = 0; i < this.tehai.length; i++) {
      var id = this.tehai[i];
      if (id2num(id) == nakihai) gaito.push(id);
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
      var furo_ments = [];
      for (var i = 0; i < 4; i++) 
        furo_ments.push(id2num(parseInt(target, 16)) * 4 - i);
      var len = this.tehai.length;
      this.tehai = this.tehai.diff(furo_ments);
      while(len - this.tehai.length < 1) this.tehai = this.tehai.diff([0]);   
      this.tehai_furo[gaito_furo] = furo_ments;
      this.typfuro[gaito_furo] = KAKAN;
      this.tehai.sort((a, b) => (a-b));
      return KAKAN;
    }
    else 
    { // AnKong
      if(gaito.length != 4 && this.tehai.index(0) < 0) return false;
      var furo_ments = [];
      for (var i = 0; i < 4; i++) 
        furo_ments.push(id2num(parseInt(target, 16)) * 4 - i);
      var len = this.tehai.length;
      this.tehai = this.tehai.diff(furo_ments);
      while(len - this.tehai.length < 4) this.tehai = this.tehai.diff([0]);   
      this.tehai_furo.push(furo_ments);
      this.furo_from.push(0);
      this.typfuro.push(ANKAN);
      return ANKAN;
    }
  }

  this.find_target = function(op, sutenum) {
    if (op.match(/DECLP/)) 
      return this.find_pong_target(sutenum);
    if (op.match(/DECLC/))
      return this.find_chi_target(sutenum);
    if (op.match(/DECLK/))
      return this.find_kong_target();
    
  }

  this.find_kong_target = function() {
    var mai = [];
    var targets = [];
    for (var i = 0; i < 34; i++) mai.push(0);
    for (var i = 0; i < this.tehai.length; i++) {
      mai[id2num(this.tehai[i]) - 1]++;
    }
    for (var i = 0; i < 34; i++)
      if (mai[i] == 4) targets.push(i * 4 + 1);
    for (var i = 0; i < this.tehai_furo.length; i++) {
      if (this.typfuro[i] != PONG) continue;
      var nakinum = id2num(this.tehai_furo[i][0]) - 1;
      if (mai[nakinum] == 1) targets.push(nakinum * 4 + 1);
    }
    return targets;
  }

  this.find_pong_target = function(sutenum) {
    var targets = [];
    for (var i = 0; i < this.tehai.length; i++) {
      var target = this.tehai[i];
      if (sutenum == id2num(target)) targets.push(target);
    }
    //console.log(targets);
    return targets;
  }
  
  this.find_chi_target = function(sutenum) {
    var targets = [];
    var diff = [-2, -1, 1, 2];
    var neighbors = [[], [], [], []];
    if ((sutenum < 1) || (27 < sutenum)) return [];
    for (var i = 0; i < this.tehai.length; i++) {
      var target = this.tehai[i];
      for (var j = 0; j < diff.length; j++) {
	var head = (sutenum - 1) % 9 + diff[j] + 1;
	if ((head < 1) || (9 < head)) continue;
	if (sutenum + diff[j] == id2num(target)) neighbors[j].push(target);
      }
    }
    if (neighbors[1].length == 0) neighbors[0] = [];
    if (neighbors[2].length == 0) neighbors[3] = [];
    
    for (var i = 0; i < neighbors.length; i++) {
      targets = targets.concat(neighbors[i]);
    }
    //console.log(targets);
    return targets;
  }

  this.show_kong_tile_selection = function(targets) {
    for (var i = 0; i < targets.length; i++) {
      for (var j = 0; j < 4; j++) {
	var id = targets[i] - j;
	var jq_id = this.wind + "hand_" + id.toStrByteHex();
	$("#" + jq_id).css("border", "2px solid blue");
      }
    }
  }

  this.show_expose_tile_selection = function(targets) {
    for (var i = 0; i < targets.length; i++) {
      var id = targets[i];
      var jq_id = this.wind + "hand_" + id.toStrByteHex();
      $("#" + jq_id).css("border", "2px solid blue").click(function(){
	  if ($(this).hasClass("ex_selected"))
	    $(this).css("border-color", "blue").removeClass("ex_selected");
	  else
	    $(this).css("border-color", "red").addClass("ex_selected");
	});
    }
  };
};
