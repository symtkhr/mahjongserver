<? 

class JongTable {
  var $yamahai = array();
  var $wangpai = array();
  var $turn = 0;
  var $jp = array();
  var $jp_size = 0;
  var $aspect = -1;
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
  var $tileset_query = "";
  const LAST_ASPECT = 7;

  function dump_stat()
  {
    printf("asp=%d-%d; ", $this->aspect, $this->honba);
    printf("yama=%d; ", count($this->yamahai));
    printf("dora=%s; ", implode(" ", $this->wangpai));
    printf("banked=%d; ", $this->banked);
    echo "\n";
    foreach($this->jp as $i => $jp) $jp->dump_stat($i == $this->turn);
  }

  function init_members()
  {
    for ($i = 0; $i < 4; $i++) $this->jp[$i] = new JangPlayer;
    $this->banked = 0;
    $this->init_aspects();
  }

  function init_aspects()
  {
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

  function commit_payment()
  {
    foreach($this->jp as &$jp){
      for ($i = 0; $i < 3; $i++)
        $jp->pt += $jp->rsv_pay[$i];
      $jp->rsv_pay = array(0, 0, 0);
    }
  }

  function reserve_payment($player, $wind, $payments)
  {
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

  function reserve_payment_ryukyoku()
  {
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
      return true;
    }

    $this->aspect++;
    if (!$this->is_ryukyoku) $this->honba = 0;
    if ($this->check_finish_table($renchang)) return $this->gameover();
    $this->inplay = true;
    $this->deal_tiles();
    return true;
  }

  function gameover()
  {
    $this->aspect = -1;
    $this->inplay = false;
    return false;
  }

  // 順位づけのメソッド
  function make_rank()
  {
    foreach ($this->jp as &$jp) {
      //$jp->pt
    }
  }


  function check_finish_table()
  {
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
        if ($jp->wind == 0) continue;
        if ($parent_pt <= $jp->pt) return false; 
      }
      return true;
    }
    return false;
  }

  function tileset($needle = false)
  {
    if ($needle) {
       return in_array($needle, explode(";", $this->tileset_query));
    } else {
       return $this->tileset_query;
    }
  }


  function add_player($name, $id)
  {
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

  function start_game()
  {   
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

  function deal_tiles($TSUMIKOMI = false)
  {
    if (!$TSUMIKOMI) {
      //全メンバの変数をリセットすべき?
      $this->init_aspects();
      //洗牌
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

  function open_dora()
  {
    while ($this->dora - 1 < 4 - $this->lingshang) {
      $this->make_haifu(sprintf("xDORA_%02x", $this->wangpai[$this->dora]));
      $this->dora++;
    }
  }

  function make_haifu($str_haifu)
  {
    if ($this->is_loading || $this->is_unittest) {} 
    else {
      $fp = fopen("haifu.dat","a+");
      echo "[".$str_haifu."]";
      fputs($fp, $str_haifu."\n");
      fclose($fp);
    }
    array_push($this->haifu, $str_haifu);
  }

  function make_haifu_hand($player)
  {
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

  function payment($token, $child, $parent)
  {
    $player = -1;
    foreach ($this->jp as $playerIndex => &$jp)
      if ($jp->token == $token) $player = $playerIndex;
    if ($player < 0) return alert("Unknown token");
    if ($this->turn != $player) {
      $this->jp[$this->turn]->pt -= $child;
    }
  }


  function discard_process($qwind, $qtarget, $is_reach = false)
  {
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

  function hora_process($playerIndex, $is_yakunashi)
  {
    $jp =& $this->jp[$playerIndex];
    if ($jp->is_houki) return alert("Abnegated hora");

    // Tsumo
    if ($playerIndex == $this->turn) {
      $haifu = $jp->reserve_hora(true, $is_yakunashi);
      if ($haifu === false) return alert("Invalid hora");
      $this->make_haifu(($jp->wind) . $haifu);
      if (!preg_match("/^DECLF0/", $haifu)) {
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

  function kong_process($playerIndex, $qtarget)
  {
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

  function check_changkong($target)
  {
    $is_wait_changkong = false;

    $turnwind = $this->jp[$this->turn]->wind; // player who called kong 
    foreach ($this->jp as &$jp) $jp->nakihan($turnwind, $target, true);
    foreach ($this->jp as &$jp) {
      if ($jp->bit_naki & JangPlayer::BIT_RON) { 
        $jp->bit_naki = JangPlayer::BIT_RON;
        //echo "<<Flag Changkong>>";
        $is_wait_changkong = true;
        $this->jp[$this->turn]->changkong_stolen = $target;
      } else {
        $jp->bit_naki = 0;
      }
    }
    return ($is_wait_changkong);
  }

  function draw_lingshang($naki_type)
  {
    $jp =& $this->jp[$this->turn];
    $target = array_shift($this->yamahai);
    $jp->draw_tile($target);
    $this->make_haifu(sprintf("%dDRAW_%02x", $jp->wind, $target));
    $this->lingshang--;
    $jp->is_kaihua = true;
    if ($naki_type == JangPlayer::ANKAN) $this->open_dora();
  }

  function pong_process($playerIndex, $qtarget)
  {
    if ($playerIndex == $this->turn) return;
    $nakihai = end($this->jp[$this->turn]->sutehai);
    $jp =& $this->jp[$playerIndex];
    if (!$jp->reserve_pong($nakihai, $qtarget)) return alert("Invalid pong");
    if ($this->check_simultaneous($playerIndex)) return;
    if (!$this->exec_naki($nakihai)) $this->turn_to_next();
  }

  function chi_process($playerIndex, $qtarget)
  {
    if ($playerIndex == $this->turn) return;
    $nakihai = end($this->jp[$this->turn]->sutehai);
    $jp =& $this->jp[$playerIndex];
    if (!$jp->reserve_chi($nakihai, $qtarget)) return alert("Invalid chi");
    if ($this->check_simultaneous($playerIndex)) return;
    if (!$this->exec_naki($nakihai)) $this->turn_to_next();
  }

  function pass_process($playerIndex)
  {
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

  function flags_cancelled_by_naki()
  {
    foreach($this->jp as &$jp){
      $jp->bit_naki = 0;
      $jp->rsv_naki = array("type" => 0, "target" => array());
      $jp->is_1patsu = false;
      $jp->is_tenho = false;
      $jp->changkong_stolen = -1;
    }
  }

  function exec_naki($nakihai)
  {
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

  function eval_command($haifu, $playerIndex = -1)
  {
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

  function is_naki_ragging()
  {
    foreach($this->jp as &$jp)
      if ($jp->bit_naki > 0) return true;
    return false;       
  }

  function turn_to_next()
  {
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
		      echo "connection check";
    if ($JpInstance[$this->turn]->is_connected) return;
    $this->check_timeout(false);
      
  }
    
    
  function turn_to_next_aspect()
  {
      
      
  }
    
  function check_simultaneous($playerIndex)
  {
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

  function check_timeout($is_connect)
  {
    echo "check_timeout\n";
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
      $jp = &$this->jp[$this->turn];
      $this->pause_since = 0;
      $target = end($jp->tehai); // last drawn tile
      $qtarget = sprintf("%02x", $target);
      $this->discard_process($jp->wind, $qtarget);
    }
    return true;
  }
  
  ////// [[End]] //////
  function end_kyoku()
  {
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

  function go_next_kyoku()
  {
    $this->save_jokyo();
    $fp = fopen("jokyo.dat","w");
    fclose($fp);
    $jang_cond = new JongTable;
    $jang_cond->set_values();
    die;
  }
  
  ////// [[Save all situation]] //////
  function save_jokyo()
  {
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

?>
