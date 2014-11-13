<?php
define("DEBUG", false);

require_once("srv_jang0602.php.c");
if(DEBUG || true) {
  require_once("testcase1.php.c");
 } else {
  $jang_cond = new JongTable;
  $jang_cond->init_members();
  //$jang_cond->haifu = array();
 }
foreach($jang_cond->jp as $jp)
echo( $jp->token). "\n"; 

if(isset($argv[1]) && $argv[1] === "DEBUSOCK") debug_mode_s($argv);

function debug_mode_s($argv) {
  global $jang_cond;
  $sock_unit_test = array(
"q=haifu h=2DECLF_00 pindex=0",
"q=calc p=80_0_0 pindex=0",
"q=approval pindex=1",
"q=approval pindex=3",
"q=approval pindex=2",
"q=approval pindex=0",
);
  $sock_unit_test = array();

  $socks = new SocketHandler;
  $socks->jang_tables[0] = $jang_cond;
  $socks->is_in_unit_test = true;
  $socks->init_members();
  //$socks->jang_tables[0]->init_members();
  while(1) {
    if(0 < count($sock_unit_test)) 
      $std = array_shift($sock_unit_test);
    else 
      $std = get_stdin();

    if($std === "") continue;
    foreach(explode(" ", $std) as $argvj){
      list($key,$val) = explode("=", $argvj);
      $mes[$key] = $val;
    }
    $socks->srv_sockrecv_handler((object)$mes, 0);
    $table_inst = $socks->jang_tables[0];
    if(DEBUG) {
      echo "\n";
      var_dump($table_inst);
    }
    $table_inst->dump_stat();
    //foreach($table_inst->jp as $jp) $jp->dump_stat($table_inst->turn);
  }
}

$socks = new SocketHandler;
$socks->is_in_unit_test = true;
$socks->start_server();

class SocketHandler{
  var $srv_sock;
  var $cli_socks = array();
  var $existing_changed = array();
  var $meibo = array();
  var $jang_tables = array();
  var $host = 'localhost'; //host
  var $port = '9000'; //port
  var $users = array();
  var $is_in_unit_test = false;

  function init_members() {
    $tableInstance = new JongTable;
    for($i = 0; $i < 10; $i++) {
      $table = new JongTable;
      $table->init_members();
      array_push($this->jang_tables, $table);
    }
    if($this->is_in_unit_test) {
      global $jang_cond;
      $this->jang_tables[0] = $jang_cond;
      var_dump($this->jang_tables[0]);
    }
  }


  function init_server() {
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


  function start_server() {
    $null = NULL; //null var
    $this->init_members();
    $this->init_server();

    while (true) {
      //manage multiple connections
      $chgclients = $this->cli_socks;
      //$chgclients にソケットリソースが格納されて返る
      socket_select($chgclients, $null, $null, 0, 10);

      $this->check_new_connected_client($chgclients);

      //loop through all connected sockets      
      foreach ($chgclients as $sock) {	
	if($this->check_incoming_data($sock)) continue;
	$this->check_disconnected_client($sock);
      }
      continue;

      //check all timers flag
      foreach($this->jang_tables as &$table) {
	$size = count($table->haifu);
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
    socket_close($this->srv_sock);
  }

  //function check_new_socket
  function check_new_connected_client(&$chgclients) {
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
    

  function check_incoming_data($sock) {
    while(socket_recv($sock, $buf, 1024, 0) >= 1)
      {
	$received_text = $this->unmask($buf); //unmask data
	$got_msg = json_decode($received_text); //json decode 
	if(DEBUG || true) {
	  echo "<<Incoming Data>>";
	  var_dump($got_msg);
	}
	$this->handle_incoming_data($got_msg, $sock);
      
	//$this->srv_sockrecv_handler($got_msg, $sock);
	return true; //exit this loop
      }
    return false; // how's come here?
  }
   
  function check_disconnected_client($sock) {
    $buf = @socket_read($sock, 1024, PHP_NORMAL_READ);
    if ($buf !== false) return;
    // remove client for $this->cli_socks array
    $found_socket = array_search($sock, $this->cli_socks);
    socket_getpeername($sock, $ip);
    unset($this->cli_socks[$found_socket]);
    
    $uid = -1;
    foreach($this->users as $id => $user) {
      if ($user["sock"] != $sock) continue;
      $uid = $id;
      break;
    }

    echo $uid." is disconnected";

    if(isset($this->users[$uid])) {

      list($place, $num) = explode("_", $this->users[$uid]["status"], 2);
      if ($place === "TABLE") {
	$num += 0;
	foreach($this->jang_tables[$num]->jp as &$jp) {
	  if($jp->token != $uid) continue;
	  $jp->is_connected = false;
	  $response = array('type' => 'disconnect', "wind" => $jp->wind);
	  $this->send_message($response);
	  break;
	}
	var_dump($jp);
      } else {
	unset($this->users[$id]);
      }
    }

    //notify all users about disconnected connection
    $response = array('type'=>'system', 
		      'message'=>$ip.' disconnected',);
    $this->send_message($response);
  }


  function send_message($obj, $id = -1)
  {
    if(DEBUG || true) {
      echo "<<to ".$id.">>\n";
      var_dump($obj);
    }
    $msg = $this->mask(json_encode($obj));

    if($id < 0) {
      foreach($this->cli_socks as $sock) {
	@socket_write($sock, $msg, strlen($msg));
      }
    } else {
      @socket_write($this->users[$id]["sock"], $msg, strlen($msg));
    }
    return true;
  }


  //Unmask incoming framed message
  function unmask($text) {
    $length = ord($text[1]) & 127;
    if($length == 126) {
      $masks = substr($text, 4, 4);
      $data = substr($text, 8);
    }
    elseif($length == 127) {
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

  //Encode message for transfer to client.
  function mask($text)
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

  function handle_incoming_data($msg, $sock)
  {
    $this->srv_sockrecv_handler($msg, $sock);
  }


  function srv_sockrecv_handler($msg, $sock) {
    $jang_cond = $this->jang_tables[0];   
    $pre_size = 0;

    /* get_wind_from_token */
    $playerIndex = -1;
    if (isset($msg->pindex)) $playerIndex = $msg->pindex;
    foreach($jang_cond->jp as $i => $jp) {
      if ($jp->token != $msg->id) continue;
      $playerIndex = $i;
    }
    if ($playerIndex < 0 && $msg->q !== "login")  return alert("No existing player");

    switch($msg->q) {
    case "login":
      // TODO: playerが $jang_cond->jp[x]->token にいるかどうかの確認 */
      $token = rand(1, 0xffff);
      // TODO: token が重複しているかどうかの確認
      $this->users[$token] = Array("status"=>"LOBBY", "name"=>($msg->name));
      $rmsg = $this->mask(json_encode(array('type'=>'login', 'id'=>$token)));
      @socket_write($sock, $rmsg, strlen($rmsg));    
      $jang_cond->add_player($msg->name, $token);
      if(DEBUG)
	echo "<<".($jang_cond->jp_size) ." gatherring...\n";

      $this->users[$token]["status"] = sprintf("RESERVE_%04x", 0);
      if($jang_cond->jp_size < 4) return;
      if(DEBUG)
	var_dump($jang_cond->jp);
      $jang_cond->deal_tiles();

      foreach($jang_cond->jp as $i => $JpInst) 
      {
	$id = $JpInst->token;
	$this->users[$id]["status"] = sprintf("TABLE_%04x", 0);
	$msg = array( "q"=>"history", "id" => $id );
	$this->srv_sockrecv_handler((object)$msg, $this->users[$id]["sock"]);	
      }
      return;

    case "debug":
      $tokens = array();
      foreach($jang_cond->jp as $jp) {
	array_push($tokens, $jp->token);
      }
      $pack = array('type'=>'debug', 'tokens'=>implode(";",$tokens));
      $rmsg = $this->mask(json_encode($pack));
      @socket_write($sock, $rmsg, strlen($rmsg));

      return;
      
    case "calc":
      $point = $msg->p;
      $wind = $msg->wind;
      $pt = $jang_cond->reserve_payment($playerIndex, $wind, $point);
      if(!$pt) return;
      $json_obj = array('type' => 'layout',
			"op" => "payment", 
			'next' => $jang_cond->aspect,
			'point' => $pt);
      //$json_obj["point"] = $pt;
      foreach($jang_cond->jp as $jp)
	$this->send_message($json_obj, $jp->token); 
    
      return;

    case "approval":
      $jang_cond->jp[$playerIndex]->approval = true;
      for ($i = 0; $i < 4; $i++) if (!$jang_cond->jp[$i]->approval) return;
      for ($i = 0; $i < 4; $i++) $jang_cond->jp[$i]->approval = false;

      $jang_cond->commit_payment();
      $jang_cond->commit_continue();
      foreach($jang_cond->jp as $i => $JpInst) 
      {
	$id = $JpInst->token;
	$msg = array( "q"=>"history", "id" => $id );
	$this->srv_sockrecv_handler((object)$msg, $this->users[$id]["sock"]);	
      }
      return;

    case "history":
      if (!isset($msg->size)) $msg->size = 0;
      $id = $msg->id;
      $this->users[$id]["sock"] = $sock;
      $jang_cond->jp[$playerIndex]->is_connected = true;

      if ($jang_cond->jp_size < 4) return;

      $send_mes = array("type" => "table", 
			"q" => "renew",
			"aspect" => $jang_cond->aspect,
			"honba" => $jang_cond->honba,
			"banked" => $jang_cond->banked
			);
      $this->send_message((object)$send_mes, $id);

      foreach($jang_cond->jp as $i => $JpInst) 
      {
	$send_mes = array();
	$send_mes["type"] = "player";
	$send_mes["q"]    = "renew";
	$send_mes["wind"] = $JpInst->wind;
	$send_mes["pt"]   = $JpInst->pt;
	$send_mes["name"] = $JpInst->name;
	$send_mes["operable"] = ($i == $playerIndex);
	$this->send_message((object)$send_mes, $id);
      }
      
      $this->send_updated_haifu($pre_size, $playerIndex);
      return;
      $send_mes = array();
      /* 以下, case "haifu"とほぼ同内容 */
      for($i = $msg->size; $i < count($jang_cond->haifu); $i++)
      {
	$haifu = $jang_cond->haifu[$i];  
	if(DEBUG)
	  echo "\n sending " . $i . ": " . $haifu;
	$haifu = haifu_make_secret($haifu, $jang_cond->jp[$playerIndex]->wind);
	if(DEBUG)
	  echo "(" . $haifu .")";
	array_push($send_mes, $haifu);
      }

      $jp = &$jang_cond->jp[$playerIndex];

      if(1) {
	$json_obj = array('type'=>"haifu", 
			  'haifu' => implode(";", $send_mes));
	$this->send_message($json_obj, $id); 
	
	if(DEBUG) {
	  $json_obj = $this->jang_tables[0];
	  var_dump($json_obj);
	}
	
	$json_obj = array("type" => "layout", 
			  "op" => $jp->show_naki_form(true), 
			  "time" => 10);
	if (($j == $jang_cond->turn) && !$jang_cond->is_naki_ragging()) {
	  $json_obj["op"] = $jp->show_decl_form(true);
	var_dump($json_obj["op"]);
	}
	$this->send_message($json_obj, $jp->token);
      }
      $jang_cond->dump_stat();
      if(!$jang_cond->is_end) return;

      foreach($jang_cond->jp as $jp) {
	if (!$jp->is_hora) continue;
	$json_obj = array("type" => "player",
			  "q" => "update",
			  'wind' => $jp->wind,
			  "is_kaihua" => $jp->is_kaihua, 
			  'is_tenho' =>  $jp->is_tenho,
			  'is_reach' =>  $jp->is_reach,
			  'is_1patsu' => $jp->is_1patsu,
			  'changkong' => $jang_cong->jp[$jang_cond->turn]->changkong_stolen,
			  );
	$this->send_message($json_obj, -1); 
      }

      if($jang_cond->is_ryukyoku) {
	$pt = $jang_cond->reserve_payment_ryukyoku();
	$json_obj = array("type" => "layout",
			  "op" => "payment",
			  "point" => $pt, 
			  'next' => $jang_cond->aspect);
	for($i = 0; $i < 4; $i++)
	  //foreach($jang_cond->jp as &$jp)
	  $this->send_message($json_obj, $jang_cond->jp[$i]->token); 
      }
      return;
      
    case "haifu":
      if (isset($msg->h)) {
      
	$pre_size = count($jang_cond->haifu);
	$jang_cond->eval_command($msg->h, $playerIndex);
      
      }
      $this->send_updated_haifu($pre_size, -1);
      return;
      // send updated haifu to all
      $send_mes = array();
      for ($i = $pre_size; $i < count($jang_cond->haifu); $i++){
	array_push($send_mes, $jang_cond->haifu[$i]);
      }

      foreach($jang_cond->jp as $j => $jp) {
	$s_haifu = array();
	foreach($send_mes as $haifu) {      
	  $haifu = haifu_make_secret($haifu, $jp->wind);
	  array_push($s_haifu, $haifu);
	}
	$json_obj = array('type'=>"haifu", 
			  'haifu' => implode(";", $s_haifu));
	$this->send_message($json_obj, $jp->token);

	$json_obj = array("type" => "layout", 
			  "op" => $jp->show_naki_form(true), 
			  "time" => 10);
	if (($j == $jang_cond->turn) && !$jang_cond->is_naki_ragging()) {
	  $json_obj["op"] = $jp->show_decl_form(true);
	  var_dump($json_obj["op"]);
	}
	$this->send_message($json_obj, $jp->token);
      }

      $jang_cond->dump_stat();
      //if(!$jang_cond->is_end) return;

      $target = $jang_cond->jp[$jang_cond->turn]->changkong_stolen;
      foreach($jang_cond->jp as $jp) {
	if (!$jp->is_hora) continue;
	$json_obj = array("type" => "player",
			  "q" => "calc",
			  'wind' => $jp->wind,
			  "is_kaihua" => $jp->is_kaihua, 
			  'is_tenho' =>  $jp->is_tenho,
			  'is_reach' =>  $jp->is_reach,
			  'is_1patsu' => $jp->is_1patsu,
			  'changkong' => $target
			  );
	$this->send_message($json_obj, -1); 
      }

      if($jang_cond->is_ryukyoku) {
	$pt = $jang_cond->reserve_payment_ryukyoku();
	$json_obj = array("type" => "layout",
			  "op" => "payment",
			  "point" => $pt, 
			  'next' => $jang_cond->aspect);
	for($i = 0; $i < 4; $i++)
	  $this->send_message($json_obj, $jang_cond->jp[$i]->token); 
      }
      return;
      break;
    }
  }

  function send_updated_haifu($pre_size, $playerIndex) {
    $jang_cond = $this->jang_tables[0];
    $send_mes = array();
    for ($i = $pre_size; $i < count($jang_cond->haifu); $i++){
      array_push($send_mes, $jang_cond->haifu[$i]);
    }
    
    foreach($jang_cond->jp as $j => $jp) {
      if ($j != $playerIndex && $playerIndex != -1) continue;
      $s_haifu = array();
      foreach($send_mes as $haifu) {
	$haifu = haifu_make_secret($haifu, $jp->wind);
	  array_push($s_haifu, $haifu);
      }
      $json_obj = array('type'=>"haifu", 
			'haifu' => implode(";", $s_haifu));
      $this->send_message($json_obj, $jp->token);
      
      $json_obj = array("type" => "layout", 
			"op" => $jp->show_naki_form(true), 
			"time" => 10);
      if (($j == $jang_cond->turn) && !$jang_cond->is_naki_ragging()) {
	$json_obj["op"] = $jp->show_decl_form(true);
	// var_dump($json_obj["op"]);
      }
      $this->send_message($json_obj, $jp->token);
    }
    
    $jang_cond->dump_stat();
    //if(!$jang_cond->is_end) return;
    
    $target = $jang_cond->jp[$jang_cond->turn]->changkong_stolen;
    foreach($jang_cond->jp as $jp) {
      if (!$jp->is_hora) continue;
      $json_obj = array("type" => "player",
			"q" => "calc",
			'wind' => $jp->wind,
			"is_kaihua" => $jp->is_kaihua, 
			'is_tenho' =>  $jp->is_tenho,
			  'is_reach' =>  $jp->is_reach,
			'is_1patsu' => $jp->is_1patsu,
			'changkong' => $target
			);
      $this->send_message($json_obj, $playerIndex < 0 ? -1 : $jang_cond->jp[$playerIndex]->token); 
    }
    
    if($jang_cond->is_ryukyoku) {
      $pt = $jang_cond->reserve_payment_ryukyoku();
      $json_obj = array("type" => "layout",
			"op" => "payment",
			"point" => $pt, 
			'next' => $jang_cond->aspect);
      for($i = 0; $i < 4; $i++)
	$this->send_message($json_obj, $jang_cond->jp[$i]->token); 
      }
    return;
  }
}

