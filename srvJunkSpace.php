<?php

require_once("JongTable.php");
require_once("JangPlayer.php");
require_once("JongCommon.php");
require_once("SocketHandler.php");

define("DEBUG", false);
if(isset($argv[1]) && $argv[1] === "DEBUSOCK") debug_mode_s($argv);
     
$socks = new SocketHandler;
$socks->is_in_unit_test = false;
$socks->start_server();
     
exit;
     
function debug_mode_s($argv) {
  $jang_cond = new JongTable;
  $jang_cond->init_members();
  
  foreach($jang_cond->jp as $jp)
    echo( $jp->token). "\n"; 
  
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


?>
