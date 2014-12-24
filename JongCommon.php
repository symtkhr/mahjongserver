<?php

// this is for CML debug
if(isset($argv[1]) && $argv[1] === "unit") {
  $jang_cond = NULL;
  $jang_cond = new JongTable;
  
  

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
      //require_once("testcase1.php.c");
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
  //debug_mode($argv);

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

function haifu_make_secret($haifu, $wind, $washizu = false) {
  if ($wind == -1) return $haifu;
  if (!preg_match("/^([0-3])(DRAW|DEAL)_([0-9a-f]+)/", $haifu, $ref)) return $haifu;
  if ($ref[0] * 1 == $wind) return $haifu;
  $haifu = array_shift(explode("_", $haifu)) . "_";
  $hidden_size = 0;
  for ($i = 0; $i < strlen($ref[3]); $i += 2) {
    $id = hexdec(substr($ref[3], $i, 2));
    if ($id % 4 != 3 && $washizu) 
      $haifu .= sprintf("%02x", $id);
    else
      $hidden_size++;
  }
  $haifu .= str_repeat("00", $hidden_size);

  return $haifu;
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
