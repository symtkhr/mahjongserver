<?php

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
  var $rsv_pay = array(0, 0, 0);
  var $token;
  var $approval;
  var $is_houki = false;
  var $is_nagashi = true;//todo:流局時判定でもいいのでは?
  var $is_connected = true;
  var $is_yakunashi = false;
  var $changkong_stolen = -1;
  var $spare_time = 10;

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
  const DEFAULT_SPARE_TIME = 10;

  const HORA_ZEROHAN = 0xdead;
  const HORA_FURITEN = 0xbeef;
  const HORA_VARID = 1;

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
    $this->spare_time = self::DEFAULT_SPARE_TIME;
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
        return self::HORA_ZEROHAN;
      } else {
        $this->is_hora = true;
        return self::HORA_VARID;
      }
    }
    // Rong
    if (!($this->bit_naki & self::BIT_RON)) return false;
    if ($this->is_furiten) {
      $this->is_houki = true;
      $this->bit_naki = 0;
      return self::HORA_FURITEN;
    } 
    
    if (!$this->check_yaku(false, $is_yakunashi)) {
      $this->is_houki = true;
      $this->bit_naki = 0;
      return self::HORA_ZEROHAN;
    }

    $this->set_reservation(self::RONG, null);
    return self::HORA_VARID;
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

  function save_spare_time($time) {
    if ($time < 0) 
      $this->spare_time = 0;
    else if (self::DEFAULT_SPARE_TIME < $time) 
      $this->spare_time = self::DEFAULT_SPARE_TIME;
    else
      $this->spare_time = $time;
  }

  function show_decl_form($for_sock = true){
    $menu = array();
    $mai = array();
    $cmd_sort = "";

    if ($this->is_houki) return "DISC";

    // Check Tsumo Flag
    if ($this->is_tempai)
    {
      $hands_check = new FinCheck;
      if ($hands_check->agari_hantei($this->tehai)) {
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

    printf(      "%1s:<%04x>      %s | %s\n", 
                 $str_news[$this->wind],
                 $this->token, $str_te, $mes);
    printf( "%8s:%03d%1s %s | %s\n", 
            substr($this->name,0,8),
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
?>
