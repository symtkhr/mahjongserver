<?php

class SocketHandler
{
  private $srv_sock;
  private $cli_socks = array();
  private $host = 'localhost'; //host
  private $port = '9000'; //port
  //private $existing_changed = array();
  //private $meibo = array();
  private $jangso;

  private function init_members() 
  {
    $this->jangso = new JongHouse();
    //$tableInstance = new JongTable;
    /*
    for ($i = 0; $i < 10; $i++) {
      $table = new JongTable;
      $table->init_members();
      array_push($this->jang_tables, $table);
    }
    */
    if ($this->is_in_unit_test) {
      global $jang_cond;
      $this->jang_tables[0] = $jang_cond;
      var_dump($this->jang_tables[0]);
    }
  }


  private function init_server() 
  {
    //Create TCP/IP sream socket
    $socket = socket_create(AF_INET, SOCK_STREAM, SOL_TCP);
    //reuseable port
    socket_set_option($socket, SOL_SOCKET, SO_REUSEADDR, 1);
    
    //bind socket to specified host
    socket_bind($socket, 0, $this->port);
    
    //listen to port
    socket_listen($socket);
    $this->cli_socks = array($socket);
    $this->srv_sock = $socket;
  }


  public function start_server() 
  {
    $null = NULL; //null var
    $this->init_members();
    $this->init_server();

    while (true)
    {
      //manage multiple connections
      $chgclients = $this->cli_socks;
      //$chgclients にソケットリソースが格納されて返る
      socket_select($chgclients, $null, $null, 0, 10);

      $this->check_new_connected_client($chgclients);

      //loop through all connected sockets      
      foreach ($chgclients as $sock)
      {	
        if ($this->check_incoming_data($sock)) continue;
        $this->check_disconnected_client($sock);
      }
      // $this->check_all_timers_flag();
    }
    socket_close($this->srv_sock);
  }

  private function check_all_timers_flag()
  {
    foreach($this->jang_tables as &$table) {
      $size = $table->haifu->length();
      if(!$table->check_timeout(true)) continue;
      //以下,惜しい!
      foreach($table->jp as $i => $JpInst) 
      {
	$id = $JpInst->token;
	$this->users[$id]["status"] = sprintf("TABLE_%04x", 0);
	$msg = array( "q"=>"history", "id" => $id, "size" => $size );
	$this->srv_sockrecv_handler((object)$msg, $this->users[$id]["sock"]);	
      }
    }
  }
  
  //function check_new_socket
  private function check_new_connected_client(&$chgclients) 
  {
    if (!in_array($this->srv_sock, $chgclients)) return;
    $socket_new = socket_accept($this->srv_sock); //accept new socket
    $this->cli_socks[] = $socket_new; //add socket to client array
    
    $header = socket_read($socket_new, 1024); //read data sent by the socket
    //websocket handshake
    $this->perform_handshaking($header, $socket_new, $this->host, $this->port); 

    if(0) {    
      socket_getpeername($socket_new, $ip); //get ip address of connected socket
      $response = array('type'=>'system', 'message'=>$ip.' connected'); //prepare json data
      $this->send_message($response); //notify all users about new connection
    }

    //make room for new socket
    $found_socket = array_search($this->srv_sock, $chgclients);
    unset($chgclients[$found_socket]);
  }

  //handshake new client.
  function perform_handshaking($receved_header,$client_conn, $host, $port)
  {
    $headers = array();
    $lines = preg_split("/\r\n/", $receved_header);
    foreach($lines as $line)
    {
      $line = chop($line);
      if(preg_match('/\A(\S+): (.*)\z/', $line, $matches))
      {
        $headers[$matches[1]] = $matches[2];
      }
    }
  
    $secKey = $headers['Sec-WebSocket-Key'];
    $secAccept = base64_encode(pack('H*', sha1($secKey . '258EAFA5-E914-47DA-95CA-C5AB0DC85B11')));
    //hand shaking header
    $upgrade  = "HTTP/1.1 101 Web Socket Protocol Handshake\r\n" .
      "Upgrade: websocket\r\n" .
      "Connection: Upgrade\r\n" .
      "WebSocket-Origin: $host\r\n" .
      "WebSocket-Location: ws://$host:$port/demodatte/shout.php\r\n".
      "Sec-WebSocket-Accept:$secAccept\r\n\r\n";
    socket_write($client_conn,$upgrade,strlen($upgrade));
  }

  private function check_disconnected_client($sock) 
  {
    $buf = @socket_read($sock, 1024, PHP_NORMAL_READ);
    if ($buf !== false) return;
    // remove client for $this->cli_socks array
    $found_socket = array_search($sock, $this->cli_socks);
    socket_getpeername($sock, $ip);
    unset($this->cli_socks[$found_socket]);
    $this->jangso->disconnect_user($sock);

    //notify all users about disconnected connection
    $response = array('type'=>'system', 
                      'message'=>$ip.' disconnected',);
    $this->send_message($response);

  }

  private function check_incoming_data($sock) 
  {
    if (0 < socket_recv($sock, $buf, 1024, 0))
    {
      $received_text = $this->unmask($buf); //unmask data
      $got_msg = json_decode($received_text); //json decode 
      if(DEBUG || true) {
        echo "<<Incoming Data>>";
        var_dump($got_msg);
      }
      $this->jangso->srv_sockrecv_handler($got_msg, $sock);
      while($this->jangso->has_next_buff())
      {
	$obj = $this->jangso->next_buff();
	//var_dump($obj);
	$this->send_message($obj->res, $obj->socks);
      }
      return true; //exit this loop
    }
    return false; // how's come here?
  }
   
  //Encode message for transfer to client.
  private function mask($text)
  {
    $b1 = 0x80 | (0x1 & 0x0f);
    $length = strlen($text);
  
    if($length <= 125)
      $header = pack('CC', $b1, $length);
    else if(125 < $length && $length < 65536)
      $header = pack('CCn', $b1, 126, $length);
    else if($length >= 65536)
      $header = pack('CCNN', $b1, 127, $length);
    return $header.$text;
  }

  public function send_message($obj, $socks = -1)
  {
    if(DEBUG || true) {
      echo "<<to ".implode(",", $socks).">>\n";
      var_dump($obj);
    }
    $msg = $this->mask(json_encode($obj));

    if (!is_array($socks)) {
      //todo:荘内全員に配布されるので卓内に改める必要あり
      foreach($this->cli_socks as $sock) {
        @socket_write($sock, $msg, strlen($msg));
      }
    } else {
      foreach($socks as $sock)
	@socket_write($sock, $msg, strlen($msg));
    }
    return true;
  }

  //Unmask incoming framed message
  private function unmask($text) 
  {
    $length = ord($text[1]) & 127;
    if ($length == 126) {
      $masks = substr($text, 4, 4);
      $data = substr($text, 8);
    }
    elseif ($length == 127) {
      $masks = substr($text, 10, 4);
      $data = substr($text, 14);
    }
    else {
      $masks = substr($text, 2, 4);
      $data = substr($text, 6);
    }
    $text = "";
    for ($i = 0; $i < strlen($data); ++$i) {
      $text .= $data[$i] ^ $masks[$i%4];
    }
    return $text;
  }


}

//////////////////////////////////////////
class JongHouse
{
  private $jang_tables = array();
  private $users = array();
  private $reservers = array();
  public $is_in_unit_test = false;
  private $sock;
  private $buff = array();

  /*
  function __construct($sock) 
  {
    //$this->sock = new SocketHandler;
  }
  */
  public function has_next_buff()
  {
    return count($this->buff);
  }

  public function next_buff()
  {
    return array_shift($this->buff);
  }

  public function srv_sockrecv_handler($msg, $sock) 
  {
    switch ($msg->q)
    {
    case "login":
      $this->login_process($msg, $sock);
      return;

    case "reserve":
      $this->reserve_process($msg);
      return;

    case "unreserve":
      $this->unreserve_process($msg);
      return;

    case "history":
      $this->history_process($msg, $sock);
      return;
      
    case "approval":
      $this->approval_process($msg);
      return;

    case "haifu":
      $this->haifu_process($msg);
      return;

    case "calc":
      $this->calc_process($msg);
      return;


    case "debug":
      $jang_cond = $this->jang_tables[0];
      $tokens = array();
      foreach($jang_cond->jp as $jp) array_push($tokens, $jp->token);
      $obj->socks = array($sock);
      $obj->res = (object)array('type'=>'debug', 'tokens'=>implode(";", $tokens));
      array_push($this->buff, $obj);

      //$this->stock_buff($sock, $rmsg);
      return;
    }
  }

  public function disconnect_user($sock)
  {
    $uid = -1;
    foreach($this->users as $id => $user) {
      if ($user["sock"] != $sock) continue;
      $uid = $id;
      break;
    }
    echo $uid." is disconnected";
    
    if (!isset($this->users[$uid])) return;

    list($place, $num) = explode("_", $this->users[$uid]["status"], 2);
    if ($place !== "TABLE") {
      unset($this->users[$id]);
      return;
    }
    
    // 試合中に落ちた場合
    $num += 0;
    $tokens = array();
    foreach($this->jang_tables[$num]->jp as &$jp) 
    {
      if ($jp->token != $uid) { 
	array_push($tokens, $jp->token);
	continue;
      }
      $jp->is_connected = false;
      // $this->jang_tables[$num]->check_timeout(false);
      echo	  ">>disconnected:\n";
      var_dump($jp);
      $response = array('type' => 'disconnect', "wind" => $jp->wind);
    }
    $this->stock_buff($response, $tokens);

  }

  private function stock_buff($response, $tokens)
  {
    $obj = null;
    $obj->socks = array();
    if (is_array($tokens)) {
      foreach($tokens as $token) array_push($obj->socks, $this->token2sock($token));
    } else {
      array_push($obj->socks, $this->token2sock($tokens));
    }
    $obj->res = (object)$response;
    array_push($this->buff, $obj);
  }

  private function token2sock($token)
  {
    return $this->users[$token]["sock"];
  }

  private function login_process($msg, $sock)
  {
    // TODO: playerが $jang_cond->jp[x]->token にいるかどうかの確認 
    $token = rand(1, 0xffff);
    // TODO: token が重複しているかどうかの確認
    $this->users[$token] = Array("status" => "LOBBY", 
				 "name" => ($msg->name),
				 "sock" => $sock,
				 "reserved" => Array()
				 );
    $rmsg = array('type' => 'login', 'id' => $token);
    $this->stock_buff($rmsg, $token);
  }

  private function unreserve_process($msg)
  {
    $token = $msg->id;
    $this->users[$token]["reserved"] = Array();
    foreach($this->reservers as $table_id => $rsv) {
      $this->reservers[$table_id] = array_diff($rsv, array($token));
    }
    //var_dump($this->reservers);
    $rmsg = array('type' => 'waiting', "table" => false, 'id' => $token);
    $this->stock_buff($rmsg, $token);
  }

  //超分かりにくい
  //$this->reservers = {"table_id" => [playerId, playerId, ...],
  //                    "table_id" => [playerId, playerId, ...], }
  private function reserve_process($msg)
  {
    $token = $msg->id;
    $userdata = $this->users[$msg->id];
    $table_id = $msg->table_id;

    array_push($this->users[$token]["reserved"], $table_id);
    $this->reservers[$table_id][] = $token;

    $del_rsv = array();
    foreach ($this->reservers[$table_id] as $token)
    {
      if (in_array($table_id, $this->users[$token]["reserved"])) continue;
      array_push($del_rsv, $token);
    }
    $this->reservers[$table_id] = array_diff($this->reservers[$table_id], $del_rsv);
    if (count($this->reservers[$table_id]) < 4) 
    {
      $rmsg = null;
      $rmsg->type = 'waiting';
      $rmsg->table = $msg->table_id;
      $rmsg->id = $token;
      $this->stock_buff($rmsg, $token);
      return;
    }

    // 雀卓の生成
    $table_no = count($this->jang_tables);
    $this->jang_tables[$table_no] = new JongTable($table_id);
    $jang_cond = $this->jang_tables[$table_no];

    // 雀士の追加
    foreach ($this->reservers[$table_id] as $token) {
      $jang_cond->add_player($this->users[$token]["name"], $token);
      if (4 <= $jang_cond->jp_size()) break;
    }
    foreach ($jang_cond->jp as $i => $JpInst) 
    {
      $id = $JpInst->token;
      $this->users[$id]["status"] = sprintf("TABLE_%04x", $table_no);
      $this->users[$id]["reserved"] = Array();
      $rmsg = array('type' => 'gathered', 'id' => $id);
      $this->stock_buff($rmsg, $id);
    }
  }

  private function haifu_process($msg) 
  {
    if (!isset($msg->h)) return;

    $jang_cond = $this->belonging_table($msg->id);
    if (!$jang_cond) return;

    $playerIndex = (isset($msg->pindex)) ? $msg->pindex : 
      $jang_cond->get_player_index($msg->id);

    $jang_cond->jp[$playerIndex]->save_spare_time($msg->time);
    $pre_size = $jang_cond->haifu->length();
    $jang_cond->eval_command($msg->h, $playerIndex);
    $this->send_updated_haifu($pre_size, -1, $jang_cond);
  }

  private function history_process($msg, $sock) 
  {
    $jang_cond = $this->belonging_table($msg->id);
    if (!$jang_cond || ($jang_cond->jp_size() < 4))
    { 
      $rmsg = array('type' => 'to_gate', 'id' => $msg->id);
      $this->stock_buff($rmsg, $msg->id);
      return;
    }

    // 再接続ソケットの登録
    $playerIndex = (isset($msg->pindex)) ? $msg->pindex : 
      $jang_cond->get_player_index($msg->id);
    $id = $msg->id;
    $this->users[$id]["sock"] = $sock;
    $jang_cond->jp[$playerIndex]->is_connected = true;
    
    // 卓オブジェクトの送付
    $rmsg = null;
    $rmsg->type = "table";
    $rmsg->q = "renew";
    $rmsg->aspect = $jang_cond->aspect->aspect;
    $rmsg->honba = $jang_cond->aspect->honba;
    $rmsg->banked = $jang_cond->aspect->banked;
    $rmsg->tileset = $jang_cond->tileset();
    $this->stock_buff($rmsg, $id);
    
    // 雀士オブジェクトの送付
    foreach($jang_cond->jp as $i => $JpInst) 
    {
      $rmsg = null;
      $rmsg->type = "player";
      $rmsg->q    = "renew";
      $rmsg->wind = $JpInst->wind;
      $rmsg->pt   = $JpInst->pt;
      $rmsg->name = $JpInst->name;
      $rmsg->operable = ($i == $playerIndex);
      $this->stock_buff($rmsg, $id);
    }
    
    $this->send_updated_haifu(0, $playerIndex, $jang_cond);
  }

  private function calc_process($msg)
  {
    $jang_cond = $this->belonging_table($msg->id);
    $playerIndex = (isset($msg->pindex)) ? $msg->pindex : 
      $jang_cond->get_player_index($msg->id);
    if (!$jang_cond->point_calling($playerIndex, $msg->wind, $msg->p)) return;

    $rmsg = null;
    $rmsg->type = 'layout';
    $rmsg->op = "payment";
    $rmsg->next = $jang_cond->aspect->aspect;
    $rmsg->point = $jang_cond->return_point();
    $this->stock_buff($rmsg, $this->all_tokens($jang_cond)); 
  }

  private function approval_process($msg) 
  {
    $jang_cond = $this->belonging_table($msg->id);
    if (!$jang_cond) return;

    $playerIndex = (isset($msg->pindex)) ? $msg->pindex : 
      $jang_cond->get_player_index($msg->id);

    $jang_cond->jp[$playerIndex]->approval = true;
    foreach ($jang_cond->jp as $jp) if (!$jp->approval) return;
    foreach ($jang_cond->jp as $jp) $jp->approval = false;
    
    // 次局遷移
    $jang_cond->commit_payment();
    if ($jang_cond->commit_continue())
    {
      foreach($jang_cond->jp as $JpInst) 
      {
	$id = $JpInst->token;
	$this->history_process((object)array("id" => $id), 
			       $this->users[$id]["sock"]);
	//$this->srv_sockrecv_handler((object)$msg, $this->users[$id]["sock"]);	
      }
      return;
    }

    // 試合終了
    foreach($jang_cond->jp as $i => $JpInst) 
    {
      $rmsg = null;
      $rmsg->type = "player";
      $rmsg->q    = "renew";
      $rmsg->wind = $JpInst->wind;
      $rmsg->pt   = $JpInst->pt;
      $rmsg->name = $JpInst->name;
      $this->stock_buff($rmsg, $this->all_tokens($jang_cond));
    }
    $rmsg = array('type' => 'layout',"op" => "finish");
    $this->stock_buff($rmsg, $this->all_tokens($jang_cond));
    $jang_cond->init_members();
  }

  private function send_updated_haifu($pre_size, $playerIndex, $jang_cond) 
  {
    // 試合前後
    if (!$jang_cond->is_inplay()) {
      $rmsg = null;
      $rmsg->type = "layout";
      $rmsg->op = "approval";
      $rmsg->next = $jang_cond->aspect->aspect;
      $this->stock_buff($rmsg, $this->all_tokens($jang_cond));
      return;
    }

    // 試合中
    $haifu_subset = $jang_cond->haifu->slice($pre_size);
    if (0 < count($haifu_subset)) 
    {
      foreach($jang_cond->jp as $j => $jp) 
      {
	if (($j != $playerIndex) && ($playerIndex != -1)) continue;
	$s_haifu = array();
	foreach($haifu_subset as $haifu)
	{
	  $haifu = haifu_make_secret($haifu, $jp->wind, 
				     $jang_cond->tileset("transp"));
	  array_push($s_haifu, $haifu);
	}
	$rmsg = null;
	$rmsg->type = "haifu";
	$rmsg->haifu = implode(";", $s_haifu);
	$this->stock_buff($rmsg, $jp->token);
	
	$rmsg = null;
	$rmsg->type = "layout"; 
	$rmsg->time = $jp->spare_time;
	$rmsg->op = (($j == $jang_cond->turn) && !$jang_cond->is_naki_ragging())
	  ? $jp->show_decl_form(true) : $jp->show_naki_form(true);
	$this->stock_buff($rmsg, $jp->token);
      }
    }
    
    $jang_cond->dump_stat();
    
    // 和了時
    $target = $jang_cond->jp[$jang_cond->turn]->changkong_stolen;
    foreach($jang_cond->jp as $jp) {
      if (!$jp->is_hora) continue;
      $rmsg = null;
      $rmsg->type  = "player";
      $rmsg->q = "calc";
      $rmsg->wind = $jp->wind;
      $rmsg->is_kaihua = $jp->is_kaihua; 
      $rmsg->is_tenho  = $jp->is_tenho;
      $rmsg->is_reach  = $jp->is_reach;
      $rmsg->is_1patsu = $jp->is_1patsu;
      $rmsg->changkong = $target;
      $this->stock_buff($rmsg, $playerIndex < 0 ? 
			$this->all_tokens($jang_cond) :
			$jang_cond->jp[$playerIndex]->token);
    }
    
    // 流局時
    if ($jang_cond->aspect->is_ryukyoku) 
    {
      $calls = array();
      foreach($jang_cond->jp as $jp) {
        if ($jp->is_nagashi)
          $calls[$jp->wind] = "nagashi";
        else if ($jp->is_tempai)
          $calls[$jp->wind] = "tempai";
        else 
          $calls[$jp->wind] = "";
      }

      $rmsg->type = "layout";
      $rmsg->op = "payment";
      $rmsg->point = $jang_cond->reserve_payment_ryukyoku();
      $rmsg->next = $jang_cond->aspect->aspect;
      $rmsg->call = (array)$calls;
      $this->stock_buff($rmsg, $this->all_tokens($jang_cond)); 
    }
    return;
  }

  private function all_tokens(JongTable $table)
  {
    $tokens = array();
    foreach ($table->jp as $jp) array_push($tokens, $jp->token); 
    return $tokens;
  }

  private function belonging_table($uid)
  {
    if ($this->is_in_unit_test) return $this->jang_tables[0];
    if (!isset($this->users[$uid])) return false;
    if (preg_match("/TABLE_[0-9a-f]+/", $this->users[$uid]["status"] )) 
    {
      $tableIndex = hexdec(array_pop(explode("_", $this->users[$uid]["status"])));
      $ret = $this->jang_tables[$tableIndex];
      if (isset($ret)) return $ret;
    }

    $rmsg->type = 'to_lobby';
    $rmsg->id = $uid;
    $rmsg->name = $this->users[$uid]["name"];
    $this->stock_buff($rmsg, $uid);

    return false;
  }
}

