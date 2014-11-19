<? 

/* 
 使用法:
 $_PHP_SELF DEBUG sb=init
*/

$jang_cond = NULL;
$jang_cond = new JongTable;
// this is for CML debug
if(isset($argv[1]) && $argv[1] === "DEBUG") debug_mode($argv);

function debug_mode($argv) {
  global $jang_cond;
  foreach($argv as $i=>$argvj){
    if($i==0) continue;
    list($key,$val) = explode("=", $argvj);
    $_GET[$key] = str_replace('\s'," ",$val);
  }
  //if(!isset($_GET["sb"])){ exit("the arg sb should be necessary\n"); }
  //if($_GET["sb"]==="unit")   unit_test(); else
  {
    $jang_cond = new JongTable;
    //$jang_cond->load_haifu();
    for ($i = 0; $i < 4; $i++) $jang_cond->jp[$i] = new JangPlayer; 
    require_once("testcase1.php.c");
    if($_GET["q"]==="init"){
      $jang_cond->deal_tiles(); 
    }
  }
  cmd_debug();
}


function  cmd_debug() {
  global $jang_cond;
  while(1) {
    foreach(explode(" ", get_stdin()) as $argvj){
      list($key,$val) = explode("=", $argvj);
      $_GET[$key] = $val;
    }
    $jang_cond->eval_command($_GET["h"], $_GET["idx"] * 1);
    $jang_cond->dump_stat();
  }
}

function haifu_make_secret($haifu, $wind) {
  if ($wind == -1) return $haifu;
  if (!preg_match("/^([0-3])(DRAW|DEAL)_([0-9a-f]+)/", $haifu, $ref)) return $haifu;
  if ($ref[0] * 1 == $wind) return $haifu;
  $haifu = array_shift(explode("_", $haifu)) . "_";
  for ($i = 0; $i < strlen($ref[3]); $i += 2) {
    $id = hexdec(substr($ref[3], $i, 2));
    if ($id % 4 == 3) $id = 0;
    $haifu .= sprintf("%02x", $id);
  }
  return $haifu;
}

//////////////////////////////////////////////
class JangPlayer {
  var $name;
  var $wind = -1;
  var $pt = 0;
  var $tehai = array();
  var $tehai_furo = array();
  var $typfuro = array();
  var $sutehai = array();
  var $sutehai_type = array();
  var $is_reach  = 0;
  var $is_1patsu = false; 
  var $is_tempai = false;
  var $is_furiten = false;
  var $is_hora = false;
  var $is_kaihua = false;
  var $is_tenho = true;
  var $bit_naki = 0;
  var $rsv_naki = array("type" => 0, "target" => array());
  var $rsv_pay = 0;
  var $token;
  var $approval;
  var $is_houki = false;
  var $is_nagashi = true;//todo:流局時判定でもいいのでは?
  var $is_connected = true;
  var $is_yakunashi = false;
  var $changkong_stolen = -1;

  const BIT_RON = 8;
  const BIT_KAN = 4;
  const BIT_PON = 2;
  const BIT_CHI = 1;
  const CHI =   1;
  const PONG =  2;
  const DMK =   3;
  const KAKAN = 4;
  const ANKAN = 5;
  const RONG =  6;
  const DISCTYPE_STOLEN = 1;
  const DISCTYPE_REACH =  2;

  function init_members($wind) {
    $this->wind = $wind;
    $this->tehai = array();
    $this->tehai_furo = array();
    $this->typfuro = array();
    $this->sutehai = array();
    $this->sutehai_type = array();
    $this->is_reach  = 0;
    $this->is_1patsu = false; 
    $this->is_tempai = false;
    $this->is_furiten = false;
    $this->is_hora = false;
    $this->is_kaihua = false;
    $this->is_tenho = true;
    $this->is_houki = false;
    $this->is_nagashi = true;
    $this->bit_naki = 0;
    $this->rsv_naki = array("type"=>0, "target"=>array());
  }

  function draw_tile($tile) {
    if (count($this->tehai) % 3 != 1) exit("tahai or shohai");
    array_push($this->tehai, $tile);
    if (!$this->is_reach) $this->is_furiten = false;
  }

  function discard($turnwind, $target, $is_call_reach) {
    if ($turnwind != $this->wind) return false;

    $tehai = $this->tehai;

    // validiation check for $target
    if ($target <= 0 || 136 < $target) return false;
    $pos_discard = array_search($target, $tehai);
    if ($pos_discard === FALSE) return false;
    $is_tsumogiri = (end($this->tehai) == $target); 
    if (!$is_tsumogiri && $this->is_reach) return false;
    
    // normal update of tehai & sutehai 
    $this->tehai = array_diff($tehai, array($target));
    array_push($this->sutehai, $target);
    array_push($this->sutehai_type, 0);
    
    if (!is_yao(id2num($target))) $this->is_nagashi = false;

    $this->tempaihan();

    // 1patsu should be erased if already reached
    if ($this->is_reach){
      $is_valid_call = false;
      $this->is_1patsu = false;
    }
    // apply reach
    else if ($is_call_reach){
      $is_valid_call = $this->declare_reach();
      if (!$this->is_tempai) $this->is_houki = true;
    } else {
      $is_valid_call = false;
    }

    $this->is_tenho = false;

    $cmd = "DISC";
    if ($is_tsumogiri) $cmd .= "T";
    if ($is_valid_call) 
      return $cmd . (($this->is_tempai) ? "R" : "R0");
    else
      return $cmd;
  }

  function declare_reach(){
    // validiation check for reach
    if ($this->is_reach) return false;
    if (!$this->is_menzen()) return false;

    $this->is_reach = ($this->is_tenho) ? 2 : 1;
    $this->is_1patsu = true;
    $this->sutehai_type[count($this->sutehai_type)-1] = self::DISCTYPE_REACH;
    return true;
  }

  function nakihan($turnwind, $sutehai, $is_only_rong = false){
    if ($this->wind == $turnwind) return;
    if (!$this->is_connected) return;

    $this->bit_naki = 0;
    if ($this->is_houki) return;

    $mai = array();
    $sutenum = id2num($sutehai);

    // Get the number of tiles
    for ($i = 0; $i <= 34; $i++) $mai[$i] = 0;
    foreach($this->tehai as $id) $mai[id2num($id)]++;

    // Check Rong Flag
    if ($this->is_tempai) {
      $test_hand = $this->tehai;
      array_push($test_hand, $sutehai);
      $hand_check = new FinCheck;
      if ($hand_check->agari_hantei($test_hand) ) 
	$this->bit_naki |= self::BIT_RON;
    }
    if ($is_only_rong) return;

    // Check Kong/Pong Flag
    if (!$this->is_reach) {
      if ($mai[$sutenum] == 3) $this->bit_naki |= self::BIT_KAN | self::BIT_PON;
      if ($mai[$sutenum] == 2) $this->bit_naki |= self::BIT_PON;
    }

    // Check Chie Flag 
    if ($this->wind == ($turnwind + 1) % 4) {
      if ($sutenum > 27 || $this->is_reach) return; // 字牌,立直者除く
      // 嵌張チー[1,9]除く
      if ($sutenum % 9 > 1 && $mai[$sutenum + 1] && $mai[$sutenum - 1])
	$this->bit_naki |= self::BIT_CHI;  
      // 下目チー[8,9]除く
      if (($sutenum - 1) % 9 < 7 && $mai[$sutenum + 1] && $mai[$sutenum + 2])
	$this->bit_naki |= self::BIT_CHI; 
      // 上目チー[1,2]除く
      if (($sutenum - 1) % 9 > 1 && $mai[$sutenum - 2] && $mai[$sutenum - 1])
	$this->bit_naki |= self::BIT_CHI;
    }
  }

  function tempaihan(){
    $hands_check = new FinCheck;
    $this->is_tempai = ( $hands_check->tenpai_hantei($this->tehai) );
    if (!$this->is_tempai) {
      $this->is_tenho = false;
    } else {
      foreach($this->sutehai as $sutehai){
	if ($this->is_furiten) break;
	foreach($this->is_tempai as $machi){
	  if ($machi != id2num($sutehai)) continue;
	  $this->is_furiten = true;
	  break;
	}
      }
    }
  }

  /*
  function declaration_reserve($decl, $q, $disc, $is_me=false){
    self::BIT_RON = 8;
    self::BIT_KAN = 4;
    self::BIT_PON = 2;
    self::BIT_CHI = 1;

    switch($decl) {
    case "DECL0":
      if ($this->bit_naki & self::BIT_RON) $this->is_furiten = true;
      $this->bit_naki = 0;
      return true;
    case "DECLC":
      if (!($this->bit_naki & self::BIT_CHI)) return false;
      return $this->declare_chi($disc, $q); //, $naki_type);
    case "DECLP":
      if (!($this->bit_naki & self::BIT_PON)) return false;
      return $this->declare_pong($disc, $q);
    case "DECLK":
      if (!($this->bit_naki & self::BIT_KAN)) return false;
      return $this->declare_kong($disc, false); //($is_me ? $q : $disc, $is_me);
    case "DECLF":
      if (!($this->bit_naki & self::BIT_RON)) return false;
      return $this->declare_hora($is_me);
    }
    return false;
  }
  */
  function set_reservation($naki_type, $target) {
    $this->bit_naki = 0;
    $this->rsv_naki["type"] = $naki_type;
    $this->rsv_naki["target"] = $target;
  }

  function expose_tiles($nakihai) { 
    $tehai = $this->tehai;
    $target = $this->rsv_naki["target"];
    $typefuro = $this->rsv_naki["type"];

    array_push($this->typfuro, $typefuro);

    if ($typefuro == self::DMK){
      $gaito = array();
      $furohai = 4 * ceil($nakihai / 4);
      for ($i = 0; $i < 4; $i++) array_push($gaito, $furohai - $i); 
    } else {
      $gaito = array($nakihai);
      for ($i = 0; $i < 2; $i++) array_push($gaito, $target[$i]); 
    }
    $this->tehai = array_diff($this->tehai, $gaito);
    array_push($this->tehai_furo, $gaito);

    return true;
  }

  function delare_tsumo(){
    $turn = $this->wind;
    $hands_check = new FinCheck;
    if (!$hands_check->agari_hantei($this->tehai) ) return false;
    $this->is_hora = true;
    return true;
  }

  function reserve_hora($is_me, $is_yakunashi){
    $turn = $this->wind;

    // Tsumo
    if ($is_me) {
      $hands_check = new FinCheck;
      if (!$hands_check->agari_hantei($this->tehai)) return false;
      if (!$this->check_yaku(true, $is_yakunashi)) {
	$this->is_houki = true;
	return "DECLF0_bad";
      } else {
	$this->is_hora = true;
	return "DECLF_0";
      }
    }
    // Rong
    if (!($this->bit_naki & self::BIT_RON)) return false;
    if ($this->is_furiten) {
      $this->is_houki = true;
      $haifu = "DECLF0_f";
      $this->bit_naki = 0;
    } else if (!$this->check_yaku(false, $is_yakunashi)) {
      $this->is_houki = true;
      $this->bit_naki = 0;
      $haifu = "DECLF0_bad";
    } else {
      $this->set_reservation(self::RONG, null);
      $haifu = "";
    }
    return $haifu;
  }

  function is_menzen() {
    foreach($this->typfuro as $typfuro) {
      if ($typfuro != self::ANKAN && $typfuro != 0) return false;
    }
    return true;
  }

  function check_yaku($is_tsumo, $is_yakunashi) {
    if (!$is_yakunashi) return true;
    // 状況役:   
    if ($this->is_tenho) return true;
    if ($this->is_reach) return true;
    if ($this->is_kaihua) return true;
    if ($is_tsumo && $this->is_menzen()) return true;
    return false;

    // 以下2つはJangTableで判定?
    if ($is_haitei) return true;
    if (!$is_tsumo && $is_changkong) return true;
    return false;
  }

  function reserve_kong($target, $is_me){
    if (!($this->bit_naki & self::BIT_KAN) && !$is_me) return false;
    
    $tehai = $this->tehai;
    $nakihai = id2num($target);

    $gaito = array();
    foreach($this->tehai as $i => $id){ 
      if (id2num($id) == $nakihai){ array_push($gaito, $id); }
    }

    // DaiMingKong
    if (count($gaito) == 3 && !$is_me){
      $this->set_reservation(self::DMK, $gaito);
      return self::DMK;
    }
    
    // KaKong
    if (count($gaito) == 1 && $is_me){
      $gaito_furo = -1;
      foreach($this->tehai_furo as $i => $furo){
        $nakihai1 = id2num($furo[0]);
        $nakihai2 = id2num($furo[1]);
        if ($nakihai1 == $nakihai2 && $nakihai1 == $nakihai){
          $gaito_furo = $i;
          break;
        }
      }
      if ($gaito_furo == -1) return false;
      array_push($this->tehai_furo[$gaito_furo], $gaito[0]);
      $this->tehai = array_diff($this->tehai, $this->tehai_furo[$gaito_furo]);
      $this->typfuro[$gaito_furo] = self::KAKAN;
      $this->tempaihan();
      return self::KAKAN;
    }
    
    // AnKong
    if (count($gaito) == 4 && $is_me){
      $furo_ments = array();
      $this->tehai = array_diff($this->tehai, $gaito);
      array_push($this->tehai_furo, $gaito);
      array_push($this->typfuro, self::ANKAN);
      $this->tempaihan();
      return self::ANKAN;
    }
    return false;
  }

  function reserve_pong($disc, $q){
    if (!($this->bit_naki & self::BIT_PON)) return false;
    $targets = array();
    
    for ($i = 0; $i < 2; $i++){
      $target = hexdec(substr($q, $i * 2, 2));
      if (FALSE === array_search($target, $this->tehai)) return false;
      if (id2num($target) != id2num($disc)) return false;
      array_push($targets, $target);
    }
    
    $this->set_reservation(self::PONG, $targets); 
    return true;
  }
  
  function reserve_chi($disc, $q){
    if (!($this->bit_naki & self::BIT_CHI)) return false;
    $targets = array();
    $ments = array(id2num($disc));

    for ($i = 0; $i < 2; $i++){
      $target = hexdec(substr($q, $i * 2, 2));
      if (FALSE === array_search($target, $this->tehai)) return false;
      array_push($targets, $target);
      array_push($ments, id2num($target));
    }
    sort($ments);
    if (($ments[0] - 1) % 9 > 7 || $ments[0] > 27) return false;
    if ($ments[0] + 1 != $ments[1] || $ments[1] + 1 != $ments[2]) return false;

    $this->set_reservation(self::CHI, $targets); 
    return true;
  }
  /*
    function make_haifu($op, $target){
    $fp = fopen("haifu.dat","a+");
    $fout = sprintf("%01d%s_", $this->wind, $op);
    if (!is_array($target)) 
    $fout .= sprintf("%02x", $target);
    else 
    foreach($target as $targetj) $fout .= sprintf("%02x",$targetj);
    echo "[".$fout."]";
    //fputs($fp, $fout."\n");
    fclose($fp);
    }
  */
  function make_rsv_haifu(){
    switch($this->rsv_naki["type"]) {
    case self::DMK:  $op = "K"; break;
    case self::CHI:  $op = "C"; break;
    case self::RONG: $op = "F"; break;
    case self::PONG: $op = "P"; break;
    default: return false;
    }

    $haifu = sprintf("%01dDECL%s_", $this->wind, $op);
    if (is_array($this->rsv_naki["target"])) 
      foreach($this->rsv_naki["target"] as $targetj) 
	$haifu .= sprintf("%02x", $targetj);
    else $haifu .= "0";//sprintf("%02x", $target);
    return $haifu;
  }
  ////// [[Show Cutting Notice]] //////
  function show_naki_form($for_sock = true){
    if ($this->bit_naki == 0){ return; }
    
    $menu_all = array("DECLC","DECLP","DECLK","DECLF");
    $news = array("T","N","S","P");
    $menu = array();
    
    for ($i = 0; $i < count($menu_all); $i++){
      if ($this->bit_naki >> $i & 0x01 ){ // Check each bit
        array_push($menu, $menu_all[$i]);
      }
    }
    if (count($menu) == 0) return;
    if (!$for_sock) {
      $mes = "<decl = DECL0";
      for ($i = 0; $i < count($menu); $i++){ $mes .= ", ". $menu[$i]; }
      $mes .= ">";
      return $mes;
    }

    array_push($menu, "DECL0");
    return implode(";", $menu);
    
  }

  ////// [[Show Declaration Notice]] //////
  function show_decl_form($for_sock = true){
    $menu = array();
    $mai = array();
    $cmd_sort = "";

    // Check Tsumo Flag
    if ( $this->is_tempai ){
      $hands_check = new FinCheck;
      if ( $hands_check->agari_hantei($this->tehai) ){
        array_push($menu, "DECLF");
      }
    }
    // Get the number of tiles
    foreach($this->tehai as $hai){
      @$mai[id2num($hai)]++;
    }
    // Check AnKan Flag
    if (!$this->is_reach) {
      foreach( $mai as $i => $himai )
	if ($himai == 4 && $i > 0){
	  array_push($menu, sprintf("DECLK_%02x", $i*4));
	}
      // Check KaKan Flag
      foreach($this->tehai_furo as $furo){
	$nakihai1 = id2num($furo[0]);
	if (!isset($nakihai1)) break;
	$nakihai2 = id2num($furo[1]);
	if ($nakihai1 == $nakihai2 && @$mai[$nakihai1] > 0 && $nakihai1 > 0){
	  array_push($menu, sprintf("DECLK_%02x", $nakihai1 * 4));
	}
      }
    }

    if (!$for_sock) {
      if (count($menu) == 0) return;
      $mes = "<Cmd> ";
      for ($j = 0; $j < count($menu); $j++){ $mes .= $j . ":" . $menu[$j] . " "; }
      return $mes;
    }

    array_push($menu, "DISC");
    return implode(";", $menu);
  }
  
  ////// [[Show Situation Notice]] //////
  function dump_stat($is_order){
    $str_te = "";
    $num_te = "";
    $str_st = "";
    $str_news = array("T", "N", "S", "P");
    $cmd = array(
		 "dummycommand",
		 "1m","2m","3m","4m","5m","6m","7m","8m","9m",
		 "1p","2p","3p","4p","5p","6p","7p","8p","9p",
		 "1s","2s","3s","4s","5s","6s","7s","8s","9s",
		 "to","na","sh","pe","hk","ht","ch");
    
    foreach ($this->tehai as $i=>$id){
      $str_te .= ($id==0) ? "_ " : sprintf("%s ", $cmd[id2num($id)]);
      $num_te .= ($id==0) ? "_ " : sprintf( "%02x ", $id);
    }

    foreach ($this->tehai_furo as $i=>$furo){
      $str_te .= " / ";
      $num_te .= " / ";
      foreach($furo as $id){
	$str_te .= ($id == 0) ? "" : sprintf("%s",  $cmd[id2num($id)]);
	$num_te .= ($id == 0) ? "" : sprintf("%02x", $id);
      }
    }
    $mes  = ($this->bit_naki)      ? $this->show_naki_form() : "";
    $mes .= ($is_order) ? $this->show_decl_form() : "";

    $str_flag  = $this->is_reach   ? "[rch]" : "";
    $str_flag .= $this->is_1patsu  ? "[1pt]" : "";
    $str_flag .= $this->is_tempai  ? "[tmp".implode("/",$this->is_tempai)."]" : "";
    $str_flag .= $this->is_furiten ? "[fri]" : "";
    $str_flag .= $this->is_hora    ? "[fin]" : "";
    $str_flag .= $this->is_kaihua  ? "[rin]" : "";
    $str_flag .= $this->is_tenho   ? "[prf]" : "";
    $str_flag .= $this->approval   ? "[app]" : "";
    $str_flag .= $this->is_houki   ? "[dis]" : "";
    $str_flag .= $this->is_nagashi ? "[ngs]" : "";

    for ($i = 0; $i < 3; $i++)
      if ($this->rsv_pay[$i] != 0) $str_flag .= "[rsvp".$this->rsv_pay[$i]."]";
    $str_flag .= $this->rsv_naki["type"] > 0 ? 
      "[rsv".$this->rsv_naki["type"]."]" : "";

    printf(      "%1s:<%04x> %s | %s\n", 
		 $str_news[$this->wind],
		 $this->token, $str_te, $mes);
    printf( "%3s:%03d%1s %s | %s\n", 
	    $this->name,
	    $this->pt,
	    $is_order ? "*" : " ", $num_te, $str_flag);

    echo "   [";
    foreach($this->sutehai as $i => $id) {
      if ($id == 0) continue;
      printf($this->sutehai_type[$i]==1 ? "(%s)" :
	     ($this->sutehai_type[$i]==2 ? "%s#" : "%s "),
	     $cmd[id2num($id)]);
    }
    echo "]\n";
  } 
}

/////////////////////////////////////////////////////////////////////////////
class JongTable {
  var $yamahai = array();
  var $wangpai = array();
  var $turn = 0;
  var $jp = array();
  var $jp_size = 0;
  var $aspect = 0;
  var $dora = 0;
  var $honba = 0;
  var $haifu = array();
  var $is_loading;
  var $is_unittest;
  var $pause_since;
  var $is_ryukyoku = false;
  var $is_end = false;
  var $lingshang = 4;
  var $banked = 0;
  var $inplay = false;
  const LAST_ASPECT = 8;

  function dump_stat() {
    printf("asp=%d-%d; ", $this->aspect, $this->honba);
    printf("yama=%d; ", count($this->yamahai));
    printf("dora=%s; ", implode(" ", $this->wangpai));
    printf("banked=%d; ", $this->banked);
    echo "\n";
    foreach($this->jp as $i => $jp) $jp->dump_stat($i == $this->turn);
  }

  function init_members() {
    for ($i = 0; $i < 4; $i++) $this->jp[$i] = new JangPlayer;
    $this->banked = 0;
    $this->init_aspects();
  }

  function init_aspects() {
    $this->yamahai = array();
    $this->wangpai = array();
    $this->turn = $this->aspect % 4;
    $this->haifu = array();
    $this->is_ryukyoku = false;
    $this->is_end = false;
    $this->pause_since = microtime(true);
    $this->lingshang = 4;
    $this->dora = 0;
    foreach ($this->jp as $playerIndex => &$jp) {
      $wind = ($playerIndex + 4 - $this->turn) % 4;
      $jp->init_members($wind);
    }
  }

  function commit_payment() {
    foreach($this->jp as &$jp){
      for ($i = 0; $i < 3; $i++)
	$jp->pt += $jp->rsv_pay[$i];
      $jp->rsv_pay = array(0, 0, 0);
    }
  }

  function reserve_payment($player, $wind, $payments) {
    echo "(".$player."declared finish!)\n";
    if (($this->jp[$player]->wind != $wind) || (!$this->jp[$player]->is_hora))
      return alert("Not finshed!");
    foreach ($this->jp as &$jp) $jp->rsv_pay = array(0, 0, 0);
    $this->jp[$player]->rsv_pay[0] = $payments[0] / 100;
    $this->jp[$player]->rsv_pay[1] = $this->honba * 3;
    $this->jp[$player]->rsv_pay[2] = $this->banked;
    $this->banked = 0;
    
    if ($this->turn != $player) {
      /* case: RONG */
      $this->jp[$this->turn]->rsv_pay[0] = -$payments[0] / 100;
      $this->jp[$this->turn]->rsv_pay[1] = -$this->honba * 3;
    } else {
      /* case: TSUMO */
      foreach($this->jp as $i => &$jp){
	if ($i == $player) continue;
	$jp->rsv_pay[0] = 
	  (($jp->wind == 0) ? -$payments[2] : -$payments[1]) / 100;
	$jp->rsv_pay[1] = -$this->honba;
      }
    }

    // case: common_get
    foreach($this->jp as $i => &$jp) {
      if ($i == $player) continue;
      if ($jp->is_reach) { 
	$jp->rsv_pay[2] = -10;
	$this->jp[$player]->rsv_pay[2] += 10;
      }
    }
    $ret_array = array();
    foreach($this->jp as &$jp)
      $ret_array = array_merge($ret_array, $jp->rsv_pay);
    return $ret_array;
  }

  function reserve_payment_ryukyoku() {
    foreach ($this->jp as &$jp) $jp->rsv_pay = array(0, 0, 0);
    // 流し満貫精算
    foreach ($this->jp as $i => &$jp) {
      if ($jp->is_nagashi){
	$pay_nagashi = true;
	$jp->rsv_pay[0] += ($jp->wind != 0) ? 80 : 120;
	for ($j = 0; $j < 4; $j++) {
	  if ($j == $i) continue; 
	  $this->jp[$j]->rsv_pay[0] += 
	    ($jp->wind == 0 || $this->jp[$j]->wind == 0) ? -40 : -20;
	}
      }
    }
    // 聴牌者確認
    $win = 0;
    foreach ($this->jp as &$jp) {
      if ($jp->is_tempai) $win++;
      if ($jp->is_reach) {
	$jp->rsv_pay[2] = -10;
	$this->banked += 10;
      }
    }
    // 聴牌料精算
    if (!$pay_nagashi) {  
      $gain = array(0, 30, 15, 10, 0);
      foreach ($this->jp as &$jp) 
	$jp->rsv_pay[0] = 
	  ($jp->is_tempai) ? $gain[$win]: -$gain[4 - $win];
    }
    // 返り値生成
    $ret_array = array();
    foreach ($this->jp as &$jp) 
      $ret_array = array_merge($ret_array, $jp->rsv_pay);
    
    return $ret_array;
  }
  
  function commit_continue() {
    $this->honba++;
    foreach ($this->jp as &$jp) {
      if ($jp->wind != 0) continue;
      $is_renchang = $jp->is_hora;
      $is_renchang |= ($this->is_ryukyoku && $jp->is_tempai);
      if (!$is_renchang) continue;
      if ($this->check_finish_table($renchang)) return $this->gameover();
      $this->deal_tiles();
      return;
    }
    $this->aspect++;
    if (!$this->is_ryukyoku) $this->honba = 0;
    if ($this->check_finish_table($renchang)) return $this->gameover();
    $this->inplay = true;
    $this->deal_tiles();
  }

  function gameover() {
    $jang_cond->aspect = -1;
  }

  // 順位づけのメソッド
  function make_rank() {
    foreach ($this->jp as &$jp) {
      //$jp->pt
    }
  }


  function check_finish_table() {
    $is_hako = false;
    $is_top = false;
    foreach ($this->jp as &$jp) {
      if ($jp->pt < -250) $is_hako = true;
      if (50 <= $jp->pt) $is_top = true;
    }
    if ($is_hako) return true;
    if (self::LAST_ASPECT < $this->aspect/* && $is_top */) return true;
    // 和了やめ
    if (self::LAST_ASPECT == $this->aspect) {
      foreach ($this->jp as &$jp) {
	if ($jp->wind == 0) $parent_pt = $jp->pt;
      }
      foreach ($this->jp as &$jp) {
	if ($jp->wind != 0) continue;
	if ($parent_pt <= $jp->pt) return false; 
      }
      return true;
    }
    return false;
  }

  /*
    function load_haifu(){
    $JpInstance =& $this->jp;

    $bin_jokyo = trim(file_get_contents("haifu.dat"));
    if (!$bin_jokyo) return;
    $data = explode("\n",$bin_jokyo);

    $news = array("T","N","S","P");

    foreach($data as $j=>$step){
    $reg = preg_match("/^([0-3])(D[A-Z]+)_([0-9a-f]+)$/",trim($step),$ref);
    if ($reg != 1) continue;
    $player = $ref[1] * 1;
    $op = $ref[2];
    $target = $ref[3];

    switch($op){
    case "DEAL":
    $JpInstance[$player] = new JangPlayer;
    $JpInstance[$player]->wind = $player;
    $JpInstance[$player]->name = $news[$player];

    for ($i=0; $i<13; $i++)
    array_push($JpInstance[$player]->tehai, hexdec(substr($target, $i*2, 2)));
    break;
    case "DRAW":
    $draw_tile = hexdec($target);
    array_push($JpInstance[$player]->tehai, $draw_tile);
    break;
    case "DISCR":
    case "DISC":
    // normal update of tehai & sutehai 
    $JpInstance[$player]->tehai = array_diff($JpInstance[$player]->tehai, array(hexdec($target)));
    array_push($JpInstance[$player]->sutehai, hexdec($target));
    array_push($JpInstance[$player]->sutehai_type, 0);

    // 1patsu should be erased if already reached
    if ($JpInstance[$player]->is_reach){
    $JpInstance[$player]->is_1patsu = false;
    break;
    }
    // apply reach
    if ($op==="DISCR"){
    $JpInstance[$player]->is_1patsu = true;
    $JpInstance[$player]->is_reach = true;
    $JpInstance[$player]->sutehai_type[count($JpInstance[$player]->sutehai_type)-1] = self::DISCTYPE_REACH;
    }
    break;
    case "DECLC":
    case "DECLP":
    case "DECLK":
    // specify the stolen tile
    $nakare = $pre_player;
    $pos_discard = count($JpInstance[$nakare]->sutehai) - 1;
    $nakihai = $JpInstance[$nakare]->sutehai[$pos_discard];

    // make ments including the stolen tile
    if ($op==="DECLK"){
    $gaito = array();
    $furohai = 4 * ceil(hexdec(substr($target, 0, 2)) / 4);
    for ($i=0; $i<4; $i++) array_push($gaito, $furohai-$i); 
    } else {
    $gaito = array($nakihai);
    for ($i=0; $i<2; $i++) array_push($gaito, hexdec(substr($target, $i*2, 2))); 
    array_push($gaito, 0);
    }
    $JpInstance[$player]->tehai = array_diff($JpInstance[$player]->tehai, $gaito);
	
    //here should be kakan consideration(maikka)
    $is_kakan = false;
    if ($nakare==$player) {
    foreach($JpInstance[$player]->tehai_furo as $i=>$ments){
    if (id2num($ments[0])!=id2num($gaito[0])) continue;
    $JpInstance[$player]->tehai_furo[$i] = $gaito;
    $is_kakan = true;
    break;
    }
    }
    if (!$is_kakan) {
    array_push($JpInstance[$player]->tehai_furo, $gaito);
    array_push($JpInstance[$player]->typfuro, $nakare == $player ? self::ANKAN:1);
    }
	
    if ($nakare != $player)
    $JpInstance[$nakare]->sutehai_type[$pos_discard] |= self::DISCTYPE_STOLEN;
    //here should be setting typefuro? -> perhaps unnecessary (except is_menzen)
    for ($i=0; $i<4; $i++) $JpInstance[$i]->is_1patsu = false;
    break;
    case "DECLF":
    break;
    default:
    break;
    }
    $pre_player = $player;
    }
    $this->turn = $player;

    // tempai check
    for ($i=0; $i<4; $i++) $JpInstance[$i]->tempaihan();

    // nakihan should be called if the DISCarding is the newest haifu
    if (preg_match("/^[0-3]DISC/",end($data))){
    for ($i=0;$i<4;$i++){ $JpInstance[$i]->nakihan($this->turn, hexdec($target)); }
    }

    $bin_jokyo = trim(file_get_contents("jokyo.dat"));
    if (!$bin_jokyo) return;
    $data = explode("\n",$bin_jokyo);

    foreach($data as $j=>$step){
    if (preg_match("/^([0-3])RSRV([0-9])_([0-9a-f]+)$/", trim($step), $ref)){
    $JpInstance[$ref[1] * 1]->rsv_naki["type"] = $ref[2] * 1;
    $JpInstance[$ref[1] * 1]->bit_naki = 0;
    for ($i=0; $i < strlen($ref[3]); $i+=2)
    array_push($JpInstance[$ref[1] * 1]->rsv_naki["target"], hexdec(substr($ref[3], $i, 2)));
    }
    if (preg_match("/^([0-3])TOKEN_([0-9a-f]+)$/", $step, $ref))
    $JpInstance[$ref[1] * 1]->token = hexdec($ref[2]);
    if (preg_match("/^DECK_([0-9a-f]+)$/", $step, $ref))
    for ($i=0; $i < strlen($ref[1]); $i+=2)
    array_push($this->yamahai, hexdec(substr($ref[1], $i, 2)));
    }
    //todo: nukemore_check
    }

    function load_haifuN(){
    $JpInstance =& $this->jp;
    define("DISCTYPE_STOLEN", 1);
    define("DISCTYPE_REACH", 2);

    $bin_jokyo = trim(file_get_contents("haifu.dat"));
    if (!$bin_jokyo) return;
    $data = explode("\n",$bin_jokyo);

    $news = array("T","N","S","P");

    foreach($data as $j=>$step){
    $reg = preg_match("/^([0-3])(D[A-Z]+)_([0-9a-f]+)$/",$step,$ref);
    if ($reg != 1) continue;
    $player = $ref[1] * 1;
    $op = $ref[2];
    $target = $ref[3];

    switch($op){
    case "DEAL":
    $JpInstance[$player] = new JangPlayer;
    $JpInstance[$player]->wind = $player;
    $JpInstance[$player]->name = $news[$player];

    for ($i=0; $i<13; $i++)
    array_push($JpInstance[$player]->tehai, hexdec(substr($target, $i*2, 2)));
    break;
    case "DRAW":
    $JpInstance[$player]->draw_tile(hexdec($target), true);
    break;
    case "DISCR":
    case "DISC":
    $JpInstance[$player]->discard($player, hexdec($target), $op==="DISCR", true);
    break;
    case "DECLC":
    case "DECLP":
    case "DECLK":
    if ($player == $this->turn){
    if ($op === "DECLK") $JpInstance[$turn]->decl_kong(hexdec($target), true);
    if ($op === "DECLF") $JpInstance[$turn]->decl_hora(true);
    } else {
    $JpInstance[$player]->expose_tiles($this->turn, $target, true);
    $JpInstance[$this->turn]->sutehai_type[$pos_discard] |= self::DISCTYPE_STOLEN;
    $this->turn = $player;
    }
    for ($i=0; $i<4; $i++) $JpInstance[$i]->is_1patsu = false;
    break;
    case "DECLF":
    break;
    default:
    break;
    }
    $pre_player = $player;
    }
    $this->turn = $player;

    // tempai check
    for ($i=0; $i<4; $i++) $JpInstance[$i]->tempaihan();

    // nakihan should be called if the DISCarding is the newest haifu
    if (preg_match("/^[0-3]DISC/",end($data))){
    for ($i=0;$i<4;$i++){ $JpInstance[$i]->nakihan($this->turn, hexdec($target)); }
    }

    $bin_jokyo = trim(file_get_contents("jokyo.dat"));
    if (!$bin_jokyo) return;
    $data = explode("\n",$bin_jokyo);

    foreach($data as $j=>$step){
    if (preg_match("/^([0-3])RSRV([0-9])_([0-9a-f]+)$/", $step, $ref)){
    $JpInstance[$ref[1] * 1]->rsv_naki["type"] = $ref[2] * 1;
    for ($i=0; $i < strlen($ref[3]); $i+=2)
    array_push($JpInstance[$ref[1] * 1]->rsv_naki["target"], hexdec(substr($ref[1], $i, 2)));
    }
    if (preg_match("/^([0-3])TOKEN_([0-9a-f]+)$/", $step, $ref))
    $JpInstance[$ref[1] * 1]->token = hexdec($ref[2]);
    if (preg_match("/^DECK_([0-9a-f]+)$/", $step, $ref))
    for ($i=0; $i < strlen($ref[1]); $i+=2)
    array_push($this->yamahai, hexdec(substr($ref[1], $i, 2)));
    }
    //todo: nukemore_check
    }

  */
  function add_player($name, $id) {
    if (4 <= $this->jp_size) return alert("This table is full");
    if (count($this->jp) < 4) $this->init_members();
    $order = rand(0, 4 - 1 - $this->jp_size);
    for ($i = 0; $i < 4; $i++) {
      if (0 < $this->jp[$i]->token) continue;
      if ($order == 0) {
	$this->jp[$i]->name = $name;
	$this->jp[$i]->token = $id;
	$this->jp_size++;
	break; 
      }
      $order--;
    }
  }

  function start_game() {   
    if (count($this->jp) != 4) return alert("Lack of member");

    return;

    /* wind shuffle */
    $tk = array();
    foreach($this->jp as $jp) array_push($tk, $jp->token);
    for ($i = count($this->jp) - 1; $i > 0; $i--) {
      $j = rand(0, $i);
      $tmp = $tk[$i];  $tk[$i] = $tk[$j];  $tk[$j] = $tmp; // swap
    }

    /* reset all players */
    for ($wind = 0; $wind < 4; $wind++){
      $this->jp[$wind] = new JangPlayer;
      $this->jp[$wind]->wind = $wind;
      $this->jp[$wind]->name = $tk[$wind];
      $this->jp[$wind]->token = $tk[$wind];
    }

  }

  function deal_tiles($TSUMIKOMI = false){
    if (!$TSUMIKOMI) {
      //全メンバの変数をリセットすべき?
      $this->init_aspects();
      //  Shuffling tiles
      for ($i = 0; $i < 136; $i++)
	$this->yamahai[$i] = $i + 1; 
      
      for ($i = 0; $i < 300; $i++) {
	$r1 = rand(0, 136);
	$r2 = rand(0, 136);
	if ($r1 > $r2)
	  list($r1, $r2) = array($r2, $r1); 
	for ($j = 0; $j < abs($r2 - $r1); $j++) { 
	  list($this->yamahai[$r1 + $j], $this->yamahai[$j]) = 
	    array($this->yamahai[$j], $this->yamahai[$r1 + $j]); 
	}
      }
      for ($i = 0; $i < 14; $i++) 
	$this->wangpai[$i] = array_shift($this->yamahai);
    }

    $JpInstance =& $this->jp;    

    // Dealing tiles
    foreach ($this->jp as &$jp) {
      for ($j = 0; $j < 13; $j++)
	$jp->tehai[$j] = array_shift($this->yamahai);

      sort($jp->tehai); 
      $jp->tempaihan();

      $str_haifu = $jp->wind . "DEAL_";
      foreach($jp->tehai as $id) $str_haifu .= sprintf("%02x", $id);
      $this->make_haifu($str_haifu);
    }

    $this->open_dora();
    $tile = array_shift($this->yamahai);  // 1st Drawing
    array_push($JpInstance[$this->turn]->tehai, $tile);

    $this->make_haifu(sprintf("0DRAW_%02x", $tile));
    $this->save_jokyo();
  }

  function open_dora() {
    while ($this->dora - 1 < 4 - $this->lingshang) {
      $this->make_haifu(sprintf("xDORA_%02x", $this->wangpai[$this->dora]));
      $this->dora++;
    }
  }

  function make_haifu($str_haifu) {
    if ($this->is_loading || $this->is_unittest) {} 
    else {
      $fp = fopen("haifu.dat","a+");
      echo "[".$str_haifu."]";
      fputs($fp, $str_haifu."\n");
      fclose($fp);
    }
    array_push($this->haifu, $str_haifu);
  }

  function make_haifu_hand($player) {
    $tehai = $this->jp[$player]->tehai;
    if ($this->turn == $player) $tsumohai = array_pop($tehai);
    sort($tehai); 
    if ($this->turn == $player) array_push($tehai, $tsumohai);
    $wind = $this->jp[$player]->wind;

    if ($this->jp[$player]->is_reach) {
      $str_haifu = sprintf("%1dDORA_", $wind);
      for ($i = 0; $i < $this->dora; $i++) {
	$str_haifu .= sprintf("%02x", $this->wangpai[$this->dora + $i]);
      }
      $this->make_haifu($str_haifu);
    }
    $str_haifu = sprintf("%1dHAND_", $wind);
    foreach($tehai as $id) $str_haifu .= sprintf("%02x", $id);
    $this->make_haifu($str_haifu);
  }

  function payment($token, $child, $parent) {
    $player = -1;
    foreach ($this->jp as $playerIndex => &$jp)
      if ($jp->token == $token) $player = $playerIndex;
    if ($player < 0) return alert("Unknown token");
    if ($this->turn != $player) {
      $this->jp[$this->turn]->pt -= $child;
    }
  }


  function discard_process($qwind, $qtarget, $is_reach = false) {
    if ($this->is_naki_ragging()) return alert("waiting for rag");
    $jp =& $this->jp[$this->turn];
    $target = hexdec($qtarget);
    $op_rev = $jp->discard($qwind, $target, 
			   $is_reach && count($this->yamahai) >= 4);
    if (!$op_rev) return alert(":invalid target");
    $haifu = sprintf("%d%s_%s", $qwind, $op_rev, $qtarget);
    $this->make_haifu($haifu);
        
    if ($jp->is_kaihua) {
      $jp->is_kaihua = false;
      $this->open_dora();
    }
    foreach ($this->jp as &$other_jp)
      $other_jp->nakihan($jp->wind, $target, count($this->yamahai) <= 0);
    $this->turn_to_next();
  }

  function hora_process($playerIndex, $is_yakunashi) {
    $jp =& $this->jp[$playerIndex];
    if ($jp->is_houki) return alert("Abnegated hora");

    // Tsumo
    if ($playerIndex == $this->turn) {
      $haifu = $jp->reserve_hora(true, $is_yakunashi);
      if ($haifu === false) return alert("Invalid hora");
      $this->make_haifu(($jp->wind) . $haifu);
      if ($haifu === "DECLF0") { 
	$this->make_haifu_hand($this->turn);
	$this->is_end = true;
      }
    } else {
    // Rong
      $haifu = $jp->reserve_hora(false, $is_yakunashi);
      if ($haifu === false) return alert("Invalid hora");
      if ($haifu !== "") $this->make_haifu(($jp->wind) . $haifu);
      if ($this->check_simultaneous($playerIndex)) return;
      $nakihai = end($this->jp[$this->turn]->sutehai);
      if (!$this->exec_naki($nakihai)) $this->turn_to_next(); // come here when goron
    }
    
    if ($this->is_end) {
      $this->make_haifu("END");
      return;
    }
  }

  function kong_process($playerIndex, $qtarget) {
    $jp =& $this->jp[$playerIndex];
    if ($jp->is_houki) return alert("Abnegated kong");
    if (count($this->yamahai) <= 0) return alert("Invalid to kong last draw");

    // Ankong or kakong
    if ($playerIndex == $this->turn) {
      $naki_type = $jp->reserve_kong(hexdec($qtarget), true);
      if (!$naki_type) return alert("Invalid to kong"); 
      $this->make_haifu($jp->wind . "DECLK_" . $qtarget);
      if (($naki_type == JangPlayer::KAKAN) && 
	  $this->check_changkong(hexdec($qtarget))) return;
      $this->flags_cancelled_by_naki();
      $this->draw_lingshang($naki_type);
    } else { 
    // Daimingkong
      $nakihai = end($this->jp[$this->turn]->sutehai);
      if (!$jp->reserve_kong($nakihai, false)) return alert("Invalid kong");
      if ($this->check_simultaneous($playerIndex)) return;
      if (!$this->exec_naki($nakihai)) $this->turn_to_next();
    }
  }

  function check_changkong($target) {
    $is_wait_changkong = false;

    $turnwind = $this->jp[$this->turn]->wind; // player who called kong 
    foreach ($this->jp as &$jp) $jp->nakihan($turnwind, $target, true);
    foreach ($this->jp as &$jp) {
      if ($jp->bit_naki & JangPlayer::BIT_RON) { 
	$jp->bit_naki = JangPlayer::BIT_RON;
	echo "<<Flag Changkong>>";
	$is_wait_changkong = true;
	$this->jp[$this->turn]->changkong_stolen = $target;
      } else {
	$jp->bit_naki = 0;
      }
    }
    return ($is_wait_changkong);
  }

  function draw_lingshang($naki_type) {
    $jp =& $this->jp[$this->turn];
    $target = array_shift($this->yamahai);
    $jp->draw_tile($target);
    $this->make_haifu(sprintf("%dDRAW_%02x", $jp->wind, $target));
    $this->lingshang--;
    $jp->is_kaihua = true;
    if ($naki_type == JangPlayer::ANKAN) $this->open_dora();
  }

  function pong_process($playerIndex, $qtarget) {
    if ($playerIndex == $this->turn) return;
    $nakihai = end($this->jp[$this->turn]->sutehai);
    $jp =& $this->jp[$playerIndex];
    if (!$jp->reserve_pong($nakihai, $qtarget)) return alert("Invalid pong");
    if ($this->check_simultaneous($playerIndex)) return;
    if (!$this->exec_naki($nakihai)) $this->turn_to_next();
  }

  function chi_process($playerIndex, $qtarget) {
    if ($playerIndex == $this->turn) return;
    $nakihai = end($this->jp[$this->turn]->sutehai);
    $jp =& $this->jp[$playerIndex];
    if (!$jp->reserve_chi($nakihai, $qtarget)) return alert("Invalid chi");
    if ($this->check_simultaneous($playerIndex)) return;
    if (!$this->exec_naki($nakihai)) $this->turn_to_next();
  }

  function pass_process($playerIndex) {
    if ($playerIndex == $this->turn) return;
    $jp =& $this->jp[$playerIndex];
    if ($jp->bit_naki & JangPlayer::BIT_RON) $jp->is_furiten = true;
    $jp->bit_naki = 0;
    if ($this->check_simultaneous($playerIndex)) return;
    $nakihai = end($this->jp[$this->turn]->sutehai);
    if ($this->exec_naki($nakihai)) return;
    if ($this->jp[$this->turn]->changkong_stolen < 0) {
      $this->turn_to_next();
    } else {
      $this->flags_cancelled_by_naki();
      $this->draw_lingshang(JangPlayer::KAKAN);
    }
  }

  function flags_cancelled_by_naki() {
    foreach($this->jp as &$jp){
      $jp->bit_naki = 0;
      $jp->rsv_naki = array("type" => 0, "target" => array());
      $jp->is_1patsu = false;
      $jp->is_tenho = false;
      $jp->changkong_stolen = -1;
    }
  }

  function exec_naki($nakihai) {
    $stolen_jp =& $this->jp[$this->turn];

    foreach ($this->jp as $i => &$jp) {
      $naki_type = $jp->rsv_naki["type"];
      $haifu = $jp->make_rsv_haifu();
      if ($naki_type == 0) continue;
      $jp->expose_tiles($nakihai); // declaration_commit()
      $this->make_haifu($haifu);

      if ($naki_type == JangPlayer::RONG) {
	$jp->is_hora = true;
	if ($stolen_jp->is_1patsu && $stolen_jp->is_reach)
	  $stolen_jp->is_reach = false;  // 通らず対策
	$this->make_haifu_hand($i);
	$this->is_end = true;
	continue;

      } else {

	array_push($stolen_jp->sutehai_type, 
                array_pop($stolen_jp->sutehai_type) | JangPlayer::DISCTYPE_STOLEN);
	$stolen_jp->is_nagashi = false; 
	$this->turn = $i;
	$this->flags_cancelled_by_naki();
	if ($naki_type == JangPlayer::DMK) $this->draw_lingshang($naki_type);
	return true;
      }
    }
    return ($this->is_end);
  }

  function eval_command($haifu, $playerIndex = -1){
    if ($this->is_end) return alert("already end");
    $reg = preg_match("/^([0-3])(D[A-Z0]+)_([0-9a-f]+)$/", trim($haifu), $ref);
    if ($reg != 1) return alert($haifu.":Invalid format");
    $qwind = $ref[1] * 1;
    $op = $ref[2];
    $qtarget = $ref[3];

    $JpInstance =& $this->jp;
    
    if ($JpInstance[$playerIndex]->wind != $qwind) 
      return alert("haifu_wind_mismatch");

    switch($op){

    case "DISC":
    case "DISCR":
      $this->discard_process($qwind, $qtarget, $op === "DISCR");
      break;
            
    case "DECL0":
      $this->pass_process($playerIndex);
      break;

    case "DECLC":
      $this->chi_process($playerIndex, $qtarget);
      break;

    case "DECLP":
      $this->pong_process($playerIndex, $qtarget);
      break;

    case "DECLK":
      $this->kong_process($playerIndex, $qtarget);
      break;

    case "DECLF":
    case "DECLF0":
      $this->hora_process($playerIndex, $op === "DECLF0");
      break;

    default:
      return alert("invalid command");
    }
    $this->save_jokyo();
  }

  function is_naki_ragging() {
    foreach($this->jp as &$jp)
      if ($jp->bit_naki > 0) return true;
    return false;       
  }

  function turn_to_next(){
    $JpInstance =& $this->jp;
    for ($i = 0; $i < 4; $i++) if ($JpInstance[$i]->bit_naki > 0) return;
    if (count($this->yamahai) <= 0){ 
      $this->end_kyoku();
      return;
    } 
    $this->turn = ($this->turn + 1) % 4;
    $this->pause_since = microtime(true);
    $target = array_shift($this->yamahai);
    $JpInstance[$this->turn]->draw_tile($target);
    $this->make_haifu(sprintf("%dDRAW_%02x", 
			      $JpInstance[$this->turn]->wind, $target));
    if ($JpInstance[$this->turn]->is_connected) return;
    $this->check_timeout(false);
      
  }
    
    
  function turn_to_next_aspect() {
      
      
  }
    
  function check_simultaneous($playerIndex){
    $naki_type = $this->jp[$playerIndex]->rsv_naki["type"];
    $nakare = $this->turn;
      
    if ($nakare == $playerIndex) return false;
      
    $ret = false;
      
    foreach($this->jp as $i => &$other_jp) {
      if ($i == $nakare || $i == $playerIndex) continue;
      if ($naki_type == JangPlayer::RONG) {
	if ($other_jp->bit_naki & JangPlayer::BIT_RON) {
	  if ((4 + $i - $nakare) % 4 < (4 + $playerIndex - $nakare) % 4) {
	    //if the other player is_kamicha(頭跳ね)
	    $ret = true;
	    continue;
	  }
	}
      } else if (($naki_type < $other_jp->bit_naki)) {
	$ret = true; 
	continue;
      }
      //if ($ret) continue;
      if ($naki_type == 0) continue;
      $other_jp->bit_naki = 0;
      $other_jp->rsv_naki["type"] = 0;
    }
    return $ret;
  }

  function check_timeout($is_connect){
    if ($this->jp_size < 4) return false;
    $TIME_LIMIT = 15;
    if ($this->pause_since == 0) return false;
    if (microtime(true) - $this->pause_since < $TIME_LIMIT && $is_connect) { 
      return false; 
    }
    echo (microtime(true) - $this->pause_since) . " elapsed\n";

    // wait for next
    if ($this->is_end) {
      /*todo: next step */
      return false;
    }

    // wait for ragging
    if ($this->is_naki_ragging()) {

      for ($i = 0; $i < 4; $i++) $this->jp[$i]->bit_naki = 0;
      $this->turn_to_next();
      return true;

    } else {
      // wait for discard
      $jp &= $this->jp[$this->turn];
      $this->pause_since = 0;
      $target = end($jp->tehai); // last drawn tile
      $qtarget = sprintf("%02x", $target);
      $this->discard_process($jp->wind, $qtarget);
    }
    return true;
  }
  
  ////// [[End]] //////
  function end_kyoku(){
    for ($i = 0; $i < 4; $i++) {
      if ($this->jp[$i]->is_tempai) $this->make_haifu_hand($i);
    }
    $this->make_haifu("END");
    $this->is_ryukyoku = true;
    return;
    $player_hoju = $this->turn;
    //$player_hora = $this->my_turn;
    $this->save_jokyo();
    $fp = fopen("jokyo.dat","w");
    fclose($fp);
    print'GO NEXT';
    die;
  }

  function go_next_kyoku(){
    $this->save_jokyo();
    $fp = fopen("jokyo.dat","w");
    fclose($fp);
    $jang_cond = new JongTable;
    $jang_cond->set_values();
    die;
  }
  
  ////// [[Save all situation]] //////
  function save_jokyo(){
    $JpInstance = $this->jp;
    $is_ragging = false;

    $fp = fopen("jokyo.dat","w");
    for ($i = 0; $i < 4; $i++)
      fputs($fp, sprintf("%1dTOKEN_%04x\n", $i, $JpInstance[$i]->token));
    for ($i = 0; $i < 4; $i++)
      if ($JpInstance[$i]->bit_naki > 0) $is_ragging = true;
    if ($is_ragging){
      for ($i = 0; $i < 4; $i++){
	$fout = sprintf("%1dRSRV%1d_", $i, $JpInstance[$i]->rsv_naki["type"]);
	if ($JpInstance[$i]->rsv_naki["target"] !== null)
	  foreach($JpInstance[$i]->rsv_naki["target"] as $target)
	    $fout .= sprintf("%02x", $target);
	$fout .= "\n";
	fputs($fp, $fout);
      }
    }
    
    $fout = "DECK_";
    foreach($this->yamahai as $yamahai) $fout .= sprintf("%02x", $yamahai);
    fputs($fp, $fout."\n");
    fclose($fp);
  }
}

// TempCheck
class FinCheck {
  var $mai = array();
  var $te  = array();
  var $allmai = 0;
  
  // get the number of my tiles
  function set_values($te = false){
    if ($te) $this->te = unset0($te);
    $this->mai = array_fill(0, 35, 0);
    $this->allmai = 0;
    foreach($this->te as $i => $val){
      if ($val > 0) $this->mai[id2num($val)]++;
      $this->allmai++;
    }
  }

  // tempai or not
  function tenpai_hantei($te = false){
    if ($te) $this->set_values($te);
    $aghi = array();
    
    for ($i = 1; $i <= 34; $i++){
      $this->set_values();
      if ($this->mai[$i] >= 4) continue;
      $this->mai[$i]++;
      if ($this->agari_hantei()) array_push($aghi, $i);
    }
    return count($aghi) > 0 ? $aghi : false;
  }

  // agari or not
  function agari_hantei($te = false){
    if ($te) $this->set_values($te);
    
    // 7pairs || 13orphans
    $i = 1;
    $kks_flag = $toi_flag = false;
    if ($this->allmai >= 13){
      $kks_flag = true;
      $toi_flag = true;
    }
    while ($toi_flag || $kks_flag){
      if ($this->mai[$i] != 0 && $this->mai[$i] != 2)   $toi_flag = false; 
      if (($i % 9 <= 1 || $i >= 28) && $this->mai[$i] == 0) $kks_flag = false; 
      if (($i % 9 >  1 && $i <  28) && $this->mai[$i]  > 0) $kks_flag = false; 
      if ($i >= 34) break; 
      $i++;
    }
    if ($toi_flag || $kks_flag) return true;

    // Normal hands
    for ($i = 1; $i <= 34; $i++){
      if ($this->mai[$i] < 2) continue;  // the eyes
      $this->mai[$i] -= 2;
      if ($this->get_ments(0)) return true;
      $this->mai[$i] += 2;
    }
    return false;
  }
  
  // devide in ments
  function get_ments($i){
    while ($this->mai[$i] == 0){ 
      if ($i >= 33) return true;
      $i++;
    }
    if ($this->mai[$i] == 3){  // 刻子
      $this->mai[$i] -= 3;
      if ($this->get_ments($i)) return true;
      $this->mai[$i] += 3;
    }
    if (($i < 28) && (($i - 1) % 9 < 7) &&
	$this->mai[$i + 1] > 0 && $this->mai[$i + 2] > 0)// 順子
    {
      $this->mai[$i]--; $this->mai[$i+1]--; $this->mai[$i+2]--;
      if ($this->get_ments($i)) return true;
      $this->mai[$i]++; $this->mai[$i+1]++; $this->mai[$i+2]++;
    }
    return false;
  }
}

// Chat Data
function add_comment($name,$mssg){
  $mssg = preg_replace("/^(;|；)/","",$mssg);
  $mssg .= gmdate(' (y-m-d G:i)', time() + 60 * 60 * 9);
  $lines = array();
  $fp = @fopen("log.dat", "r+") or die("Cannot open log.dat");
  for ($i = 1; $i <200; $i++){ array_push($lines, fgets($fp)); }
  $number = array_shift(explode("\t", $lines[0], 2)) + 1;
  $line = implode("\t", array($number, $name, $mssg));
  array_unshift($lines, $line . "\n");
  rewind($fp);
  fputs($fp, implode("", $lines));
  ftruncate($fp, ftell($fp));
  fclose($fp);
  return $lines;
}
function read_comment(){
  return;
  $lines = array();
  $fp = @fopen("log.dat", "r") or die("Cannot open log.dat");
  for ($i = 1; $i < 200; $i++){ array_push($lines, fgets($fp)); }
  fclose($fp);
  return $lines;
}

function id2num($id){
  return 1 + floor(($id - 1) / 4);
}

function is_yao($num) {
  if ($num > 27) return true;
  if ($num % 9 == 0) return true;
  if ($num % 9 == 1) return true;
  return false;
}

function alert($message) {
  echo " <<".$message.">>\n";
  return false;
}

function get_stdin()
{
  echo ">>";
  $stdin = fopen("php://stdin", "r");
  $line = trim(fgets($stdin, 64));
  fclose($stdin);
  return $line;
}

// 配列のゼロをunsetする
function unset0($array){
  foreach($array as $j=>$tmp){
    if ($array[$j]==0){ unset($array[$j]); }
  }
  return $array;
}
