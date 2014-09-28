<?php

  //define("DEBUG", true);

require_once("srv_jang0602.php.c");
if(DEBUG) {
  require_once("testcase1.php.c");
 } else {
  $jang_cond = new JongTable;
  $jang_cond->init_members();
  //$jang_cond->haifu = array();
 }

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
  $socks->jang_tables[0]->init_members();
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
    echo "\n";
    //var_dump($table_inst);
    $table_inst->dump_stat();
    //foreach($table_inst->jp as $jp) $jp->dump_stat($table_inst->turn);
  }
}

$socks = new SocketHandler;
$socks->is_debug = true;
$socks->start_server();

class SocketHandler{
  var $srv_sock;
  var $cli_socks = array();
  var $existing_changed = array();
  var $meibo = array();
  var $jang_tables = array();
  var $host = 'logcalhost'; //host
  var $port = '9000'; //port
  var $is_debug = false;

  function init_members() {
    $tableInstance = new JongTable;
    for($i = 0; $i < 10; $i++) {
      $table = new JongTable;
      $table->init_members();
      array_push($this->jang_tables, $table);
    }
    if($this->is_debug) {
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
	if(DEBUG) {
	  echo "<<Incomming Data>>";
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
    
    //notify all users about disconnected connection
    $response = array('type'=>'system', 
		      'message'=>$ip.' disconnected');
    $this->send_message($response);
  }


  function send_message($obj, $id = -1)
  {
    if(DEBUG) {
      echo "to ".$id.": ";
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
      echo "<<".($jang_cond->jp_size) ." gatherring...\n";

      if($jang_cond->jp_size < 4) return;
      var_dump($jang_cond->jp);
      $jang_cond->deal_tiles();

      foreach($jang_cond->jp as $i => $JpInst) 
      {
	$id = $JpInst->token;
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

      //foreach($tokens as $token) $this->meibo[$token] = true;

      return;
      
    case "init":
      //$jang_cond->start_game();
      $jang_cond->deal_tiles();
      return;

    case "calc":
      $point = explode("_", $msg->p);
      $jang_cond->reserve_payment($playerIndex, $point);
      $json_obj = array("type"=>"approval", 
			'point'=> $msg->p, 
			'next'=> $jang_cond->aspect);
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
      if ($jang_cond->jp_size < 4) return;

      $send_mes = array();
      foreach($jang_cond->jp as $i => $JpInst) 
      {
	$send_mes["type"] = "player";
	$send_mes["wind"]  = $JpInst->wind;
	$send_mes["point"] = $JpInst->pt;
	$send_mes["name"]  = $JpInst->name;
	$send_mes["is_yourself"] = ($i == $playerIndex);
	$this->send_message((object)$send_mes, $id);
      }
      $send_mes = array("type"=>"aspect", 
			"aspect"=>$jang_cond->aspect, "hon"=>$jang_cond->honba);
      $this->send_message((object)$send_mes, $id);
      $send_mes = array();
      /* 以下, case "haifu"とほぼ同内容 */
      for($i = $msg->size; $i < count($jang_cond->haifu); $i++)
      {
	$haifu = $jang_cond->haifu[$i];  
	echo "\n sending " . $i . ": " . $haifu;
	$haifu = haifu_make_secret($haifu, $jang_cond->jp[$playerIndex]->wind);
	echo "(" . $haifu .")";
	array_push($send_mes, $haifu);
      }

      $json_obj = array('type'=>"haifu", 'haifu' => implode(";", $send_mes));
      $this->send_message($json_obj, $id); 
      return;

    case "haifu":
      if (isset($msg->h)) {
      
	$pre_size = count($jang_cond->haifu);
	$jang_cond->eval_command($msg->h, $playerIndex);
      
      }

      /* send updated haifu to all */
      $send_mes = array();
      for ($i = $pre_size; $i < count($jang_cond->haifu); $i++){
	array_push($send_mes, $jang_cond->haifu[$i]);
      }

      echo "sendtoall\n";

      for ($j = 0; $j < 4; $j++) {
	$s_haifu = array();

	foreach($send_mes as $i => $haifu) {
	  $haifu = haifu_make_secret($haifu, $jang_cond->jp[$j]->wind);
	  array_push($s_haifu, $haifu);
	}
	$json_obj = array('type'=>"haifu", 'haifu' => implode(";", $s_haifu));
	$this->send_message($json_obj, $jang_cond->jp[$j]->token);
      }
      $jang_cond->dump_stat();

      return;
      break;
    }


  }


}
