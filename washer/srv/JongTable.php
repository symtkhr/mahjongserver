<?php

//局遷移クラス
class AspectTransition {
  var $aspect = -1;
  var $honba = 0;
  var $banked = 0; // これってここか? → PointManager
  var $inplay = false;
  var $is_ryukyoku = false;
  private $last_aspect = 7;
  private $is_renchang = false;

  function __construct($last_aspect) 
  {
    $this->last_aspect = $last_aspect;
  }

  public function turn_to_next($jp_obj)
  {
    $this->honba++;
    $this->check_renchang($jp_obj);

    if (!$this->is_renchang) {
      $this->aspect++;
      if (!$this->is_ryukyoku) $this->honba = 0;
    }
    
    if ($this->check_gameover($jp_obj)) 
    {
      $this->aspect = -1;
      $this->inplay = false;
      return false;
    } 
    else 
    {
      $this->inplay = true;
      return true;
    }
  }

  private function check_renchang($jp_obj)
  {
    $this->is_renchang = false;
    foreach ($jp_obj as $jp) {
      if ($jp->wind != 0) continue;
      $this->is_renchang = ($jp->is_hora || ($this->is_ryukyoku && $jp->is_tempai));
      if ($this->is_renchang) return;
    }
  }

  private function check_gameover($jp_obj)  {
    // 箱割れ
    if ($this->check_hako($jp_obj)) return true;

    // オーラス終了
    if ($this->last_aspect < $this->aspect) return true;

    // オーラス和了やめ
    if ($this->check_agari_yame($jp_obj)) return true;

    return false;
  }

  private function check_hako($jp_obj)
  {
    foreach ($jp_obj as $jp) {
      if ($jp->pt < -250) return true;
    }
    return false;
  }

  private function check_agari_yame($jp_obj)
  {
    // オーラス連荘でない
    if ($this->last_aspect != $this->aspect) return false;
    if (!$this->is_renchang) return false;

    // 親が3万点未満
    foreach ($jp_obj as $jp) if ($jp->wind == 0) $parent_pt = $jp->pt;
    if ($parent_pt < 50) return false;

    // 親が1位でない
    foreach ($jp_obj as $jp) {
      if (($jp->wind != 0) && ($parent_pt <= $jp->pt)) return false; 
    }

    return true;
  }

}

///////////////////////////////////////////////////////
class JongLog {
  //牌譜クラス
  private $haifu = array();

  //デバッグクラス
  var $is_loading;
  var $is_unittest;

  public function slice($from)
  {
    $subset = array();
    for ($i = $from; $i < count($this->haifu); $i++){
      array_push($subset, $this->haifu[$i]);
    }
    return $subset;
  }

  public function length()
  {
    return count($this->haifu);
  }

  private function make($str_haifu)
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

  public function make_hand(JangPlayer $jp)
  {
    $str_haifu = sprintf("%1dHAND_", $jp->wind);
    foreach($jp->tehai as $id) $str_haifu .= sprintf("%02x", $id);
    $this->make($str_haifu);
  }

  public function make_deal($wind, $tehai)
  {
    $str_haifu = sprintf("%1dDEAL_", $wind);
    foreach($tehai as $id) $str_haifu .= sprintf("%02x", $id);
    $this->make($str_haifu);
  }

  public function make_op($op, $wind, $tile)
  {
    if ($wind < 0) {
      $this->make(sprintf("x%s_%02x", $op, $tile));
    } else {
      $this->make(sprintf("%d%s_%02x", $wind, $op, $tile));
    }
  }

  public function make_ops($op, $wind, $tilearray)
  {
    $str_haifu = "";
    foreach($tilearray as $id) $str_haifu .= sprintf("%02x", $id);
    $this->make(sprintf("%d%s_%s", $wind, $op, $str_haifu));
  }

  public function make_end()
  {
    $this->make("END");
  }

  public function make_steal($wind, $rsv_naki)
  {
    switch($rsv_naki["type"]) {
    case JangPlayer::DMK:  $op = "K"; break;
    case JangPlayer::CHI:  $op = "C"; break;
    case JangPlayer::RONG: $op = "F"; break;
    case JangPlayer::PONG: $op = "P"; break;
    default: return false;
    }

    $haifu = sprintf("%01dDECL%s_", $wind, $op);
    if (is_array($rsv_naki["target"])) 
      foreach($rsv_naki["target"] as $targetj) 
        $haifu .= sprintf("%02x", $targetj);
    else
      $haifu .= "0";
    $this->make($haifu);
  }

  public function make_hora($wind, $hora_type)
  {
    switch ($hora_type) 
    {
    case JangPlayer::HORA_FURITEN:
      $this->make(sprintf("%dDECLF0_f", $wind));
      break;
    case JangPlayer::HORA_ZEROHAN:
      $this->make(sprintf("%dDECLF0_bad", $wind));
      break;
    case JangPlayer::HORA_VARID:
      $this->make(sprintf("%dDECLF_0", $wind));
      break;
    default:
      break;
    }
  }
}

///////////////////////////////////////////////////////
class PointBox
{
  private $rsv_pay;
  private $jp;
  public $banked;
  private $aspect;

  private function init_rsv_pay() 
  {
    $this->rsv_pay = (object)array("hands"=>0, "honba"=>0, "banked"=>0);
  }

  public function point_calling($jp, $point)
  {
    if ($this->is_all_finishers_reserved()) return true;
    $this->reserve_payment($jp, $point);
    if (!$this->is_all_finishers_reserved()) return false;
    $this->reserve_kyotaku();
    return true;
  }

  public function commit_payment()
  {
    foreach ($this->jp as $jp) {
      $jp->pt += $jp->rsv_pay->hands;
      $jp->pt += $jp->rsv_pay->honba;
      $jp->pt += $jp->rsv_pay->banked;
      $jp->pt->init_rsv_pay();
    }
  }

  private function is_all_finishers_reserved()
  {
    foreach($this->jp as $jp) {
      if ($jp->is_hora && ($jp->rsv_pay->hands == 0)) return false;
    }
    return true;
  }

  private function reserve_payment($jp, $payments)
  {
    $honba = $aspect->honba; //* aspect

    if (DEBUG) {
      echo "(" . $jp->wind . "declared finish!)\n";
    }
    if (!$jp->is_hora)
      return alert("Not finshed!");

    if (0 < $jp->rsv_pay->hands) {
      return alert("Already got");
    }

    //foreach ($this->jp as &$jp) $jp->rsv_pay = array(0, 0, 0);
    $jp->rsv_pay->hands = $payments[0] / 100;
    $jp->rsv_pay->honba = $honba * 3;
    
    if (!$jp->is_turn()) {
      /* case: RONG */
      $this->jp[$this->turn]->rsv_pay->hands -= $payments[0] / 100; //* turn
      $this->jp[$this->turn]->rsv_pay->honba -= $honba * 3;
    }
    else 
    {
      /* case: TSUMO */
      foreach ($this->jp as $other_jp) //* jp
      {
        if ($other_jp->wind == $jp->wind) continue;
        $other_jp->rsv_pay->hands = 
          (($other_jp->wind == 0) ? -$payments[2] : -$payments[1]) / 100;
        $other_jp->rsv_pay->honba = -$honba;
      }
    }
    return;
    /*
    // case: common_get
    if ($this->jp[$player]->is_kamicha())
    {
      $this->jp[$player]->rsv_pay[2] = $this->aspect->banked;
      $this->aspect->banked = 0;
      foreach ($this->jp as $i => &$jp)
      {
	if ($jp->is_hora) continue;
	if ($jp->is_reach) 
	{ 
	  $jp->rsv_pay[2] = -10;
	  $this->jp[$player]->rsv_pay[2] += 10;
	}
      }
    }
    return;
    */
  }

  //上家取り
  private function uppermost_finisher()
  {
    $player = -1;
    for ($i = 0; $i < 4; $i++)
    {
      $player = ($this->turn + $i) % 4;
      if ($this->jp[$player]->is_hora) break;
    }
    if ($player < 0) return null;
    return $this->jp[$player];
  }

  private function reserve_kyotaku()
  {
    $kamicha = $this->uppermost_finisher();
    if (!$kamicha) return alert("nobody calls hora");

    $kamicha->rsv_pay->banked = $this->banked;
    $this->banked = 0;

    foreach ($this->jp as $jp)
    {
      if ($jp->is_hora) continue; //※ダブロン下家でも立直棒は本人に戻る
      if ($jp->is_reach) 
      { 
	$jp->rsv_pay->banked = -10;
	$kamicha->rsv_pay->banked += 10;
      }
    }
  }

  public function return_point()
  {
    $ret_array = array();
    foreach($this->jp as $jp)
      $ret_array = array_merge($ret_array, $jp->rsv_pay);
    return $ret_array;
  }

  public function reserve_payment_ryukyoku()
  {
    foreach ($this->jp as $jp) $jp->pt->init_rsv_pay();
    // 流し満貫精算
    foreach ($this->jp as $i => $jp) {
      if ($jp->is_nagashi) {
        $pay_nagashi = true;
        $jp->rsv_pay->hands += ($jp->wind != 0) ? 80 : 120;
        for ($j = 0; $j < 4; $j++) {
          if ($j == $i) continue; 
          $this->jp[$j]->rsv_pay->hands += 
            ($jp->wind == 0 || $this->jp[$j]->wind == 0) ? -40 : -20;
        }
      }
    }
    // 聴牌者確認
    $win = 0;
    foreach ($this->jp as $jp) {
      if ($jp->is_tempai) $win++;
      if ($jp->is_reach) {
        $jp->rsv_pay->banked = -10;
        $this->banked += 10;
      }
    }
    // 聴牌料精算
    if (!$pay_nagashi) {  
      $gain = array(0, 30, 15, 10, 0);
      foreach ($this->jp as $jp) 
        $jp->rsv_pay->hands = 
          ($jp->is_tempai) ? $gain[$win]: -$gain[4 - $win];
    }
    return $this->return_point();
  }
}

///////////////////////////////////////////////////////
class TileWall 
{
  public $yamahai = array();
  public $wangpai = array();
  private $dora = 0;
  private $lingshang = 4;
  private $tileset_query = "";

  private function init_aspects()
  {
    $this->yamahai = array();
    $this->wangpai = array();
    $this->lingshang = 4;
    $this->dora = 0;
  }

  private function shuffle_tiles()
  {
    //全メンバの変数をリセットすべき?
    $this->init_aspects();
    //洗牌
    for ($i = 0; $i < 136; $i++)
      $this->yamahai[$i] = $i + 1; 
    
    for ($i = 0; $i < 3000; $i++) {
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

  public function deal_tiles($TSUMIKOMI = false)
  {
    if (!$TSUMIKOMI) {
      $this->shuffle_tiles();
    }
    
    // Dealing tiles
    foreach ($this->jp as $jp) {
      $tile = array();
      for ($j = 0; $j < 13; $j++) $tile[$j] = array_shift($this->yamahai);
      
      $jp->deal($tile);         //* jp
      $haifu->make_deal($jp->wind, $jp->tehai);   //* haifu
    }

    $this->open_dora();
    $tile = array_shift($this->yamahai);  // 1st Drawing
    array_push($this->jp[$this->turn]->tehai, $tile); //* jp, turn
    $this->haifu->make_op("DRAW", 0, $tile);          //* haifu
  }

  public function open_dora()
  {
    while ($this->dora - 1 < 4 - $this->lingshang) {
      $this->haifu->make_op("DORA", -1, $this->wangpai[$this->dora]); //* haifu
      $this->dora++;
    }
  }

  public function draw_lingshang($jp, $naki_type) //* 引数変化
  {
    $target = array_shift($this->yamahai);
    $jp->draw_tile($target);                          
    $this->haifu->make_op("DRAW", $jp->wind, $target); //* haifu
    $this->lingshang--;
    $jp->is_kaihua = true;
    if ($naki_type == JangPlayer::ANKAN) $this->open_dora();
  }

}


///////////////////////////////////////////////////////
class JongTable {
  //山牌クラス
  private $yamahai = array();
  private $wangpai = array();
  private $dora = 0;
  private $lingshang = 4;
  private $tileset_query = "";

  //面子クラス
  var $turn = 0;
  var $jp = array();
  private $is_end = false;
  var $pause_since;

  //局遷移クラス
  public $aspect;

  //牌譜クラス
  public $haifu;

  function __construct($table_id) 
  {
    $this->tileset_query = $table_id;
    $this->aspect = new AspectTransition($this->tileset("east") ? 3 : 7);
  }

  // todo:継承クラス化 SpeakingJongTable extends JongTable
  function dump_stat()
  {
    printf("asp=%d-%d; ", $this->aspect->aspect, $this->aspect->honba);
    printf("yama=%d; ", count($this->yamahai));
    printf("dora=%s; ", implode(" ", $this->wangpai));
    printf("banked=%d; ", $this->aspect->banked);
    echo "\n";
    foreach($this->jp as $i => $jp) $jp->dump_stat($i == $this->turn);
  }

  function init_members()
  {
    for ($i = 0; $i < 4; $i++) $this->jp[$i] = new JangPlayer;
    $this->aspect->banked = 0;
    $this->init_aspects();
  }

  // class AspectTrans
  public function commit_continue()
  {
    $ret = $this->aspect->turn_to_next($this->jp);
    if ($ret) $this->deal_tiles();
    return $ret;
  }

  public function is_inplay()
  {
    return $this->aspect->inplay;
  }

  private function init_aspects()
  {
    $this->yamahai = array();
    $this->wangpai = array();
    $this->turn = $this->aspect->aspect % 4;
    $this->haifu = new JongLog;
    $this->aspect->is_ryukyoku = false;
    $this->is_end = false;
    $this->pause_since = microtime(true);
    $this->lingshang = 4;
    $this->dora = 0;
    foreach ($this->jp as $playerIndex => &$jp) {
      $wind = ($playerIndex + 4 - $this->turn) % 4;
      $jp->init_members($wind);
    }
  }

  // class PointManager
  public function point_calling($playerIndex, $wind, $point)
  {
    if ($this->is_all_finishers_reserved()) return true;
    $this->reserve_payment($playerIndex, $wind, $point);
    if (!$this->is_all_finishers_reserved()) return false;
    $this->reserve_kyotaku();
    return true;
  }

  // class PointManager
  public function commit_payment()
  {
    foreach($this->jp as $jp){
      for ($i = 0; $i < 3; $i++)
        $jp->pt += $jp->rsv_pay[$i];
      $jp->rsv_pay = array(0, 0, 0);
    }
  }

  // class PointManager
  private function is_all_finishers_reserved()
  {
    foreach($this->jp as $jp) {
      if ($jp->is_hora && ($jp->rsv_pay[0] == 0)) return false;
    }
    return true;
  }

  // class PointManager
  private function reserve_payment($player, $wind, $payments)
  {
    if (DEBUG) {
      echo "(" . $player . "declared finish!)\n";
    }
    if (($this->jp[$player]->wind != $wind) || (!$this->jp[$player]->is_hora))
      return alert("Not finshed!");

    if (0 < $this->jp[$player]->rsv_pay[0]) {
      return alert("Already got");
    }

    //foreach ($this->jp as &$jp) $jp->rsv_pay = array(0, 0, 0);
    $this->jp[$player]->rsv_pay[0] = $payments[0] / 100;
    $this->jp[$player]->rsv_pay[1] = $this->aspect->honba * 3;
    
    if ($this->turn != $player) {
      /* case: RONG */
      $this->jp[$this->turn]->rsv_pay[0] -= $payments[0] / 100;
      $this->jp[$this->turn]->rsv_pay[1] -= $this->aspect->honba * 3;
    }
    else 
    {
      /* case: TSUMO */
      foreach ($this->jp as $i => &$jp)
      {
        if ($i == $player) continue;
        $jp->rsv_pay[0] = 
          (($jp->wind == 0) ? -$payments[2] : -$payments[1]) / 100;
        $jp->rsv_pay[1] = -$this->aspect->honba;
      }
    }
    return;
    /*
    // case: common_get
    if ($this->jp[$player]->is_kamicha())
    {
      $this->jp[$player]->rsv_pay[2] = $this->aspect->banked;
      $this->aspect->banked = 0;
      foreach ($this->jp as $i => &$jp)
      {
	if ($jp->is_hora) continue;
	if ($jp->is_reach) 
	{ 
	  $jp->rsv_pay[2] = -10;
	  $this->jp[$player]->rsv_pay[2] += 10;
	}
      }
    }
    return;
    */
  }

  // class PointManager
  private function reserve_kyotaku()
  {
    $player = -1;
    for ($i = 0; $i < 4; $i++)
    {
      $player = ($this->turn + $i) % 4;
      if ($this->jp[$player]->is_hora) break;
    }
    if ($player < 0) return alert("nobody calls hora");

    $this->jp[$player]->rsv_pay[2] = $this->aspect->banked;
    $this->aspect->banked = 0;

    foreach ($this->jp as $i => &$jp)
    {
      if ($jp->is_hora) continue;
      if ($jp->is_reach) 
      { 
	$jp->rsv_pay[2] = -10;
	$this->jp[$player]->rsv_pay[2] += 10;
      }
    }
  }

  // class PointManager
  public function return_point()
  {
    $ret_array = array();
    foreach($this->jp as $jp)
      $ret_array = array_merge($ret_array, $jp->rsv_pay);
    return $ret_array;
  }

  // class PointManager
  public function reserve_payment_ryukyoku()
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
        $this->aspect->banked += 10;
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
  
  function tileset($needle = false)
  {
    if ($needle) {
      return in_array($needle, explode(";", $this->tileset_query));
    } else {
      return $this->tileset_query;
    }
  }

  // class PlayerHanlder
  public function jp_size() 
  {
    $jp_size = 0;
    foreach ($this->jp as $jp) 
      if (0 < $jp->token) $jp_size++;
    return $jp_size;
  }

  // class PlayerHanlder
  public function add_player($name, $id)
  {
    if (count($this->jp) < 4) $this->init_members();
    $jp_size = $this->jp_size();
    if (4 <= $jp_size) return alert("This table is full");

    $order = rand(0, 4 - 1 - $jp_size);
    for ($i = 0; $i < 4; $i++) {
      if (0 < $this->jp[$i]->token) continue;
      if ($order == 0) {
        $this->jp[$i]->name = $name;
        $this->jp[$i]->token = $id;
        break; 
      }
      $order--;
    }

  }
  /*
  unused function start_game()
  {   
    if (count($this->jp) != 4) return alert("Lack of member");

    return;

    // wind shuffle 
    $tk = array();
    foreach($this->jp as $jp) array_push($tk, $jp->token);
    for ($i = count($this->jp) - 1; $i > 0; $i--) {
      $j = rand(0, $i);
      $tmp = $tk[$i];  $tk[$i] = $tk[$j];  $tk[$j] = $tmp; // swap
    }

    // reset all players 
    for ($wind = 0; $wind < 4; $wind++){
      $this->jp[$wind] = new JangPlayer;
      $this->jp[$wind]->wind = $wind;
      $this->jp[$wind]->name = $tk[$wind];
      $this->jp[$wind]->token = $tk[$wind];
    }

  }
  */
  // TileWall
  public function deal_tiles($TSUMIKOMI = false)
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
    

    
    // Dealing tiles
    foreach ($this->jp as $jp) {
      $tile = array();
      for ($j = 0; $j < 13; $j++) $tile[$j] = array_shift($this->yamahai);
      
      $jp->deal($tile);
      $this->haifu->make_deal($jp->wind, $jp->tehai);
    }

    $this->open_dora();
    $tile = array_shift($this->yamahai);  // 1st Drawing
    array_push($this->jp[$this->turn]->tehai, $tile);

    $this->haifu->make_op("DRAW", 0, $tile);
    $this->save_jokyo();
  }

  //class: TileWall
  private function open_dora()
  {
    while ($this->dora - 1 < 4 - $this->lingshang) {
      $this->haifu->make_op("DORA", -1, $this->wangpai[$this->dora]);
      $this->dora++;
    }
  }


  /*
  unused function payment($token, $child, $parent)
  {
    $player = -1;
    foreach ($this->jp as $playerIndex => $jp)
      if ($jp->token == $token) $player = $playerIndex;
    if ($player < 0) return alert("Unknown token");
    if ($this->turn != $player) {
      $this->jp[$this->turn]->pt -= $child;
    }
  }
  */

  //class: 捨牌
  private function discard_process($qwind, $qtarget, $is_reach = false)
  {
    if ($this->is_naki_ragging()) return alert("waiting for rag");
    $jp =& $this->jp[$this->turn];
    $target = hexdec($qtarget);
    $op_rev = $jp->discard($qwind, $target, 
                           $is_reach && (4 <= count($this->yamahai)));
    if (!$op_rev) return alert(":invalid target");
    $this->haifu->make_op($op_rev, $qwind, $target);

    if ($jp->is_kaihua) {
      $jp->is_kaihua = false;
      $this->open_dora();
    }
    foreach ($this->jp as $other_jp)
      $other_jp->nakihan($jp->wind, $target, count($this->yamahai) <= 0);
    $this->turn_to_next();
  }

  //class: 捨牌 || 手牌
  private function hora_process($playerIndex, $is_yakunashi)
  {
    $jp =& $this->jp[$playerIndex];
    if ($jp->is_houki) return alert("Abnegated hora");

    // Tsumo
    if ($playerIndex == $this->turn) 
    {
      $hora_type = $jp->reserve_hora(true, $is_yakunashi);
      if ($hora_type === false) return alert("Invalid hora");
      $this->haifu->make_hora($jp->wind, $hora_type);
      if ($hora_type == JangPlayer::HORA_VARID) {
	$this->open_hand($this->turn, true);
      }
    } 
    else 
    {
    // Rong
      $hora_type = $jp->reserve_hora(false, $is_yakunashi);
      if ($hora_type === false) return alert("Invalid hora");
      if ($hora_type != JangPlayer::HORA_VARID) {
	$this->haifu->make_hora($jp->wind, $hora_type);
      }
      if ($this->check_simultaneous($playerIndex)) return;
      if (!$this->exec_naki()) $this->turn_to_next(); // come here when goron
    }
    
    if ($this->is_end) {
      $this->haifu->make_end();
      return;
    }
  }

  //手牌
  private function open_hand($playerIndex, $is_tsumo = false)
  {
    $jp = $this->jp[$playerIndex];
    $jp->tehai_sort($is_tsumo);
    $this->open_ura($playerIndex);
    $this->haifu->make_hand($jp);
    $this->is_end = true;
  }

  //TileWall
  private function open_ura($playerIndex)
  {
    $jp = $this->jp[$playerIndex];
    if ($jp->is_reach && $jp->is_hora) 
    {
      /*
	$str_haifu = sprintf("%1dDORA_", $jp->wind);
      for ($i = 0; $i < $this->dora; $i++) {
        $str_haifu .= sprintf("%02x", $this->wangpai[$this->dora + $i]);
      }
      */
      $ura = array_splice($this->wangpai, $this->dora, $this->dora * 2 - 1);
      $this->haifu->make_ops("DORA", $jp->wind, $ura);
    }
  }

  //捨牌 || 手牌
  private function kong_process($playerIndex, $qtarget)
  {
    $jp =& $this->jp[$playerIndex];
    if ($jp->is_houki) return alert("Abnegated kong");
    if (count($this->yamahai) <= 0) return alert("Invalid to kong last draw");

    // Ankong or kakong
    if ($playerIndex == $this->turn) {
      $naki_type = $jp->reserve_kong(hexdec($qtarget), true);
      if (!$naki_type) return alert("Invalid to kong"); 
      $this->haifu->make_op("DECLK", $jp->wind, hexdec($qtarget));
      if (($naki_type == JangPlayer::KAKAN) && 
          $this->check_changkong(hexdec($qtarget))) return;
      $this->flags_cancelled_by_naki();
      $this->draw_lingshang($naki_type);
    } else { 
    // Daimingkong
      if (!$jp->reserve_kong($this->jp[$this->turn]->last_discard(), false))
	return alert("Invalid kong");
      if ($this->check_simultaneous($playerIndex)) return;
      if (!$this->exec_naki()) $this->turn_to_next();
    }
  }

  //class: 捨牌
  private function check_changkong($target)
  {
    $is_wait_changkong = false;
    foreach ($this->jp as $jp)
      $is_wait_changkong |= $jp->changkonghan($target, $this->jp[$this->turn]);
    return ($is_wait_changkong);
  }

  //class: TileWall
  private function draw_lingshang($naki_type)
  {
    $jp =& $this->jp[$this->turn];
    $target = array_shift($this->yamahai);
    $jp->draw_tile($target);
    $this->haifu->make_op("DRAW", $jp->wind, $target);
    $this->lingshang--;
    $jp->is_kaihua = true;
    if ($naki_type == JangPlayer::ANKAN) $this->open_dora();
  }

  //class: 捨牌
  private function pong_process($playerIndex, $qtarget)
  {
    if ($playerIndex == $this->turn) return;
    $jp =& $this->jp[$playerIndex];
    if (!$jp->reserve_pong($this->jp[$this->turn]->last_discard(), $qtarget)) 
      return alert("Invalid pong");
    if ($this->check_simultaneous($playerIndex)) return;
    if (!$this->exec_naki()) $this->turn_to_next();
  }

  //class: 捨牌
  private function chi_process($playerIndex, $qtarget)
  {
    if ($playerIndex == $this->turn) return;
    $jp =& $this->jp[$playerIndex];
    if (!$jp->reserve_chi($this->jp[$this->turn]->last_discard(), $qtarget)) 
      return alert("Invalid chi");
    if ($this->check_simultaneous($playerIndex)) return;
    if (!$this->exec_naki()) $this->turn_to_next();
  }

  //class: 捨牌
  private function pass_process($playerIndex)
  {
    if ($playerIndex == $this->turn) return alert("Invalid pass");
    $jp =& $this->jp[$playerIndex];
    if (!$jp->pass_naki()) return alert("Invalid pass");
    if ($this->check_simultaneous($playerIndex)) return;
    if ($this->exec_naki()) return;
    if ($this->jp[$this->turn]->changkong_stolen < 0) {
      $this->turn_to_next();
    } else {
      $this->flags_cancelled_by_naki();
      $this->draw_lingshang(JangPlayer::KAKAN);
    }
  }

  //class: 捨牌
  private function flags_cancelled_by_naki()
  {
    foreach ($this->jp as $jp)
      $jp->init_flags_after_naki();
  }

  //class: 捨牌
  private function exec_naki()
  {
    $stolen_jp =& $this->jp[$this->turn];

    echo "TEST:"; 
    var_dump($this->jp[2]->rsv_naki);
    var_dump($this->jp[3]->rsv_naki);
    echo "==============\n";

    foreach ($this->jp as $i => $jp) {
      $naki_type = $jp->rsv_naki["type"];
      if ($naki_type == 0) continue;
      $jp->expose_tiles($stolen_jp->last_discard());
      $this->haifu->make_steal($jp->wind, $jp->rsv_naki);

      if ($naki_type == JangPlayer::RONG) {
        $jp->is_hora = true;
        $stolen_jp->cancel_tohraba_reach();
	$this->open_hand($i);
        continue;
      }

      $stolen_jp->provide_sutehai();
      $this->turn = $i;
      $this->flags_cancelled_by_naki();
      if ($naki_type == JangPlayer::DMK) $this->draw_lingshang($naki_type);
      return true;
    }
    return ($this->is_end);
  }

  //class: JongLog?
  public function eval_command($haifu, $playerIndex = -1)
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

  //class:捨牌
  function is_naki_ragging()
  {
    foreach($this->jp as $jp)
      if (0 < $jp->bit_naki) return true;
    return false;
  }

  //class: Turn
  private function turn_to_next()
  {
    if ($this->is_naki_ragging() || $this->check_ryukyoku()) return;

    $this->turn = ($this->turn + 1) % 4;
    $this->pause_since = microtime(true);
    $target = array_shift($this->yamahai);
    $this->jp[$this->turn]->draw_tile($target);
    $this->haifu->make_op("DRAW", $this->jp[$this->turn]->wind, $target);
    //echo "connection check\n";
    if ($this->jp[$this->turn]->is_connected) return;
    $this->check_timeout(false);
  }

  //class: Turn
  private function check_ryukyoku()
  {
    if (0 < count($this->yamahai)) return false;

    foreach ($this->jp as $playerIndex => $jp) {
      if ($jp->is_tempai) $this->open_hand($playerIndex);
    }
    $this->aspect->is_ryukyoku = true;
    $this->haifu->make_end();
    return true;
  }

    
  /*    
  unused function turn_to_next_aspect()
  {
      
      
  }
  */

  //class: 捨牌
  private function check_simultaneous($playerIndex)
  {
    //$naki_type = $this->jp[$playerIndex]->rsv_naki["type"];
    $nakare = $this->turn;
    if ($nakare == $playerIndex) return false;
      
    $is_waiting = false;
      
    foreach ($this->jp as $rival_jp) {
      switch($this->jp[$playerIndex]->prior_to($rival_jp, 
					       $this->jp[$this->turn], 
					       $this->tileset("wron"))) 
      {
      case "PRIOR":
	$rival_jp->negate_naki();
	continue;
      case "WAIT":
	$is_waiting = true;
	continue;
      case "NONE":
	continue;
      }
    }

      /*
    foreach ($this->jp as $i => $rival_jp) {
      if ($i == $nakare || $i == $playerIndex) continue;
      if ($naki_type == JangPlayer::RONG) 
      {
	if ($this->tileset("wron") && 
	    $rival_jp->rsv_naki["type"] == JangPlayer::RONG)
	  //二家和確定
	  continue;
        if ($rival_jp->bit_naki & JangPlayer::BIT_RON) {
	  if ($this->tileset("wron")) {
	    //二家和フラグ待ち
	    $is_waiting = true;
	    continue;
	  }
	  else if ((4 + $i - $nakare) % 4 < (4 + $playerIndex - $nakare) % 4) 
	  {
	    //上家待ち
	    $is_waiting = true;
            continue;
          }
	  //和了確定(二家和 or 頭跳ね)
        }
	//単独和了確定
      } else if ($naki_type < $rival_jp->bit_naki) {
	//優先他家待ち
        $is_waiting = true; 
        continue;
      }
      if ($naki_type == 0) continue;

      $rival_jp->bit_naki = 0;
      $rival_jp->rsv_naki["type"] = 0;

    }
      */
    return $is_waiting;
  }

  // class: timer::
  function check_timeout($is_connect)
  {
    echo "check_timeout\n";
    if ($this->jp_size() < 4) return false;
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
      
      foreach ($this->jp as $jp) $jp->pass_naki();
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
  
  // todo:継承クラス化 SpeakingJongTable extends JongTable
  private function save_jokyo()
  {
    $fp = fopen("jokyo.dat","w");
    foreach ($this->jp as $i => $jp)
      fputs($fp, sprintf("%1dTOKEN_%04x\n", $i, $jp->token));
    if ($this->is_naki_ragging()) {
      foreach ($this->jp as $i => $jp) {
        $fout = sprintf("%1dRSRV%1d_", $i, $jp->rsv_naki["type"]);
        if ($jp->rsv_naki["target"] !== null)
          foreach($jp->rsv_naki["target"] as $target)
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

  // class PlayerHanlder
  public function get_player_index($token)
  {
    foreach ($this->jp as $playerIndex => $jp) {
      if ($jp->token == $token) return $playerIndex;
    }
    return -1;
  }

}

?>
