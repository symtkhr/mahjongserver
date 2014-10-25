<?
require_once("srv_jang0602.php.c");

// ƒeƒXƒgƒP[ƒX: 
$fouth = array(
"0DEAL_060b0a10111226303a444d4f58",
"1DEAL_010203131c1e24292c3c3d3e4c",
"2DEAL_080c3132333f41475d62687273",
"3DEAL_0407152d2e3539454e50566a6f",
"0DRAW_34",
"0DISC_26",
"1DRAW_5e",
"1DISC_4c",
"2DRAW_19",
//*
"2DISC_19",
"3DRAW_5b",
"3DISC_04",

);

$fouth_s = array(
"0DEAL_0c121426333e454d4f506b6f88",
"1DEAL_0407133b4a5460626471747d7f",
"2DEAL_1632383a3f4046525c5d697284",
"3DEAL_05222d2e3547515658797a8087",
"xDORA_57",

"0DRAW_0d",
"0DISC_88",
"1DRAW_82",
"1DISC_04",
"2DRAW_63",
"2DISC_84",
"3DRAW_17",
"3DISC_47",
"0DRAW_0a",
"0DISC_6f",
"1DRAW_55",
"1DISC_07",
"2DRAW_75",
"2DISC_75",
"3DRAW_39",
"3DISC_80",

"0DRAW_06",
"0DISC_6b",
"1DRAW_81",
"1DISC_13",
"0DECLP_1412",
"0DISC_26",
"1DRAW_7c",
"1DISC_7c",
"3DECLP_797a",
"3DISC_87",
"0DRAW_67",
"0DISC_67",
"1DRAW_70",
"1DISC_3b",
"2DRAW_73",
"2DISC_69",
"3DRAW_85",
"3DISC_85",
"0DRAW_34",
"0DISC_3e",
"1DRAW_59",
"1DISC_4a",
"2DRAW_41",
"2DISC_32",
"0DECLP_3334",
"0DISC_0d",
"1DRAW_7e",
"1DISC_70",
"2DRAW_1b",
"2DISCR_52",
"3DRAW_0f",
"3DISC_22",
"0DRAW_4e",
"0DECLK_4e",
"xDORA_03",
"0DRAW_36",
"0DISC_06",
"1DRAW_23",
"1DISC_23",
      "2DRAW_13",
/*
"2DRAW_7b",
"2DISC_7b",
"3DRAW_3d",
"3DISC_58",
"0DRAW_53",
"0DISC_53",
"1DRAW_2a",
"1DISC_2a",
"2DRAW_5a",
"2DISC_5a",
"3DECLC_5156",
"3DISC_05",
"0DRAW_31",
/*
"0DECLK_31",

"0DRAW_0b",
"0DISC_45",
"xDORA_6e",
"1DRAW_1c",
"1DISC_1c",
"2DRAW_09",
"2DISC_09",

"0DECLK_0c",
"0DRAW_21",
"0DISC_36",
"xDORA_28",
"1DRAW_68",
"1DISC_64",
"2DRAW_61",
"2DISC_61",
"3DRAW_78",
"3DISC_78",
"0DRAW_11",
"0DECLK_11",
"0DRAW_24"
*/	       );


/*
$fp = fopen("haifu.dat","w");
fwrite($fp, $fouth);
fclose($fp);
$fp = fopen("jokyo.dat","w");
fwrite($fp, $foutj);
fclose($fp);
*/

$unit_test = ($argv[1] === "unit");
if($unit_test) {
  $test_case = array(
		     array("0DECLC_060a", "1DECLK_01", "2DECLF_0"),//¨ ‰h
		     array("1DECLK_01", "0DECLC_060a", "2DECLF_0"), //¨ ‰h
		     array("0DECL0_0", "1DECLK_01", "2DECLF_0"), //¨ ‰h
		     array("1DECLK_01", "0DECL0_0", "2DECLF_0"), //¨ ‰h
		     array("1DECLK_01", "2DECLF_0"      ), //¨ ‰h
		     array("0DECLC_060a", "1DECL0_0", "2DECLF_0"), //¨ ‰h
		     array("1DECL0_0", "0DECLC_060a", "2DECLF_0"), //¨ ‰h
		     array("0DECL0_0", "1DECL0_0", "2DECLF_0"), //¨ ‰h
		     array("1DECL0_0", "0DECL0_0", "2DECLF_0"), //¨ ‰h
		     array("1DECL0_0", "2DECLF_0"      ), //¨ ‰h
		     array("0DECLC_060a", "2DECLF_0"      ), //¨ ‰h
		     array("0DECL0_0", "2DECLF_0"      ), //¨ ‰h
		     array("2DECLF_0"            ), //¨ ‰h
		     array("0DECLC_060a", "1DECLK_01", "2DECL0_0"), //¨ žÈ
		     array("0DECLC_060a", "2DECL0_0", "1DECLK_01"), //¨ žÈ
		     array("1DECLK_01", "0DECLC_060a", "2DECL0_0"), //¨ žÈ
		     array("1DECLK_01", "2DECL0_0"), //¨ žÈ
		     array("2DECL0_0", "0DECLC_060a", "1DECLK_01"), //¨ žÈ
		     array("0DECL0_0", "1DECLK_01", "2DECL0_0"), //¨ žÈ
		     array("0DECL0_0", "2DECL0_0", "1DECLK_01"), //¨ žÈ
		     array("1DECLK_01", "0DECL0_0", "2DECL0_0"), //¨ žÈ
		     array("2DECL0_0", "0DECL0_0", "1DECLK_01"), //¨ žÈ
		     array("2DECL0_0", "1DECLK_01"      ), //¨ žÈ
		     array("0DECLC_060a", "1DECL0_0", "2DECL0_0"), //¨ ‹h
		     array("0DECLC_060a", "2DECL0_0", "1DECL0_0"), //¨ ‹h
		     array("1DECL0_0", "0DECLC_060a", "2DECL0_0"), //¨ ‹h
		     array("1DECL0_0", "2DECL0_0", "0DECLC_060a"), //¨ ‹h
		     array("2DECL0_0", "0DECLC_060a", "1DECL0_0"), //¨ ‹h
		     array("2DECL0_0", "1DECL0_0", "0DECLC_060a"), //¨ ‹h
		     array("0DECL0_0", "1DECL0_0", "2DECL0_0"), //¨ (ŽŸ„)
		     array("0DECL0_0", "2DECL0_0", "1DECL0_0"), //¨ (ŽŸ„)
		     array("1DECL0_0", "0DECL0_0", "2DECL0_0"), //¨ (ŽŸ„)
		     array("1DECL0_0", "2DECL0_0", "0DECL0_0"), //¨ (ŽŸ„)
		     array("2DECL0_0", "0DECL0_0", "1DECL0_0"), //¨ (ŽŸ„)
		     array("2DECL0_0", "1DECL0_0", "0DECL0_0"), //¨ (ŽŸ„)
                     array(),
		     );
  array_push($fouth,"DECK_".str_repeat("44", count($test_case)));
  // $test_case = array(array());
 } else {
  array_push($fouth,"DECK_4444");
  $test_case = array(array());
}
//var_dump($test_case);

$jang_cond = new JongTable;
$jang_cond->init_members();
$jang_cond->aspect = 0;
$bandaid_name = array("Spr","Sum","Aut","Win");
for($i=0; $i<4;$i++){
  $jang_cond->jp[$i] = new JangPlayer;
  $jang_cond->jp[$i]->name = $bandaid_name[$i];
  $jang_cond->jp[$i]->token = rand(0, 0xffff);
 }
$jang_cond->jp_size = 4;

if(0) {
  $jang_cond->init_aspects();
  load_haifu_s($fouth, $i==0);
  //cmd_debug();
  //var_dump($jang_cond->yamahai);
  //exit;
 } else

if(0) {

  foreach($test_case as $i=>$cmds) {
    $jang_cond->init_aspects();
    if($unit_test) $jang_cond->is_loading = true;
    load_haifu_v($fouth, $i==0);
    if($unit_test) $jang_cond->is_loading = false;
    printf("%02d: ", $i + 1);
    foreach($cmds as $cmd){
      echo "<".$cmd.">";
      $wind = substr($cmd, 0, 1) * 1;
      $playerIndex = ($wind + $jang_cond->aspect) % 4;
      $jang_cond->eval_command($cmd, $playerIndex);
    }
    echo "\n";
  }
} else {
  $jang_cond->init_aspects();
  load_haifu_s($fouth, $i==0);
  print_r($jang_cond->yamahai);

  make_random_haifu();
}
//$jang_cond->haifu = $fouth;
//var_dump($jang_cond->haifu);
//var_dump($jang_cond->jp);
if($unit_test)
   cmd_debug();


function make_random_haifu() {
  global $jang_cond;
  if(0) {
    $jang_cond->start_game();
    $jang_cond->deal_tiles();
  }
  for($loop = 0; $loop < 136 - 13 * 5 - 10; $loop++) {
    $turn = $jang_cond->turn;
    $wind = $jang_cond->jp[$turn]->wind;
    $tehai = $jang_cond->jp[$turn]->tehai;

    $jang_cond->eval_command(
			     sprintf("%dDISC_%02x", $wind, end($tehai)), $turn);
    
    for($i = 0; $i < 4; $i++) 
      if ($jang_cond->jp[$i]->bit_naki > 0)
	$jang_cond->eval_command($jang_cond->jp[$i]->wind . "DECL0_0", $i);

    if(count($jang_cond->yamahai) <= 0) break;
  }

}
/*
function load_haifu_v($haifu, $is_shown = false) {
  global $jang_cond;
  $JpInstance =& $jang_cond->jp;

  foreach($haifu as $step){
    $reg = preg_match("/^([0-3x])(D[A-Z]+)_([0-9a-f]+)$/",trim($step),$ref);
    if($reg != 1) { 
      if(preg_match("/^DECK_([0-9a-f]+)$/", $step, $ref))
	for($i=0; $i < strlen($ref[1]); $i+=2)
	  array_push($jang_cond->yamahai, hexdec(substr($ref[1], $i, 2)));
      continue;
    }

    $wind = $ref[1] * 1;
    $playerIndex = ($wind + $jang_cond->aspect) % 4;
    $op = $ref[2];
    $target = $ref[3];
    if($is_shown)
      echo "**".$step."**\n";

    switch($op){

    case "DEAL":
      //$playerIndex = $wind;
      //$playerIndex = ($jang_cond->aspect + $wind) % 4;
      //$JpInstance[$playerIndex] = new JangPlayer;
      //$jang_cond->init_members();
      //$JpInstance[$playerIndex]->wind = $wind;

      for($i = 0; $i < 13; $i++)
	array_push($JpInstance[$playerIndex]->tehai, hexdec(substr($target, $i*2, 2)));
      $JpInstance[$playerIndex]->tempaihan();
      $jang_cond->make_haifu($step);
      break;

    case "DRAW":
      for($i = 0; $i < 4; $i++) 
	$JpInstance[$i]->bit_naki = 0;
      //if($i != $playerIndex && $JpInstance[$i]->bit_naki > 0)
      //  $jang_cond->eval_command($JpInstance[$i]->wind . "DECL0_0", $i);

      $jang_cond->turn = $playerIndex;
      $JpInstance[$playerIndex]->draw_tile(hexdec($target));
      $jang_cond->make_haifu($step);
      break;

    case "DECLC":
    case "DECLP":
    case "DECLK":
    case "DECLF":
      for($i = 0; $i < 4; $i++) 
	if($i != $playerIndex && $JpInstance[$i]->bit_naki > 0)
	  $jang_cond->eval_command($JpInstance[$i]->wind . "DECL0_0", $i);
    // through 
            
    default:
      $jang_cond->eval_command($step, $playerIndex);
      if($op ==="DECLK") {
	if(end($JpInstance[$playerIndex]->tehai) == NULL) {
	  array_pop($JpInstance[$playerIndex]->tehai);
	  array_pop($jang_cond->haifu);
	}
      } else if(end($jang_cond->haifu) === "END") {
	array_pop($jang_cond->haifu);
	$jang_cond->is_ryukyoku = false;
      }
      break;
    }
    //break;
      
  }

}
*/

function load_haifu_s($haifu, $is_shown = false) {
  global $jang_cond;
  $jp =& $jang_cond->jp;

  foreach($haifu as $step){
    $reg = preg_match("/^([0-3x])(D[A-Z]+)_([0-9a-f]+)$/",trim($step),$ref);
    if($reg != 1) continue;

    $op = $ref[2];
    $target = $ref[3];
    
    switch($op){
    case "DEAL":
    case "DRAW":
    case "DECK":
      for($i = 0; $i < strlen($target); $i += 2)
	array_push($jang_cond->yamahai, hexdec(substr($target, $i, 2)));
       break;
    case "DORA":
      array_push($jang_cond->wangpai, hexdec($target));
      break;
    }
  }

  $testarray = array_merge($jang_cond->yamahai, $jang_cond->wangpai);
  sort($testarray);
  array_push($testarray, 137);
  $pre_id = 0;
  foreach($testarray as $id) {
    //echo ($pre_id + 1 ) . "to". $id."\n";
    for($i = $pre_id + 1; $i < $id; $i++) {
      if($i <= 136) array_push($jang_cond->yamahai, $i);
    }
    $pre_id = $id;
  }
  if(count($jang_cond->yamahai) != 136) {
    sort($jang_cond->yamahai);
    print_r($jang_cond->yamahai);
    exit("Invalid haifu\n");
  }

  for($i = count($jang_cond->wangpai); $i < 14; $i++) {
    array_push($jang_cond->wangpai, 
	       array_pop($jang_cond->yamahai));
  }

  $jang_cond->deal_tiles(true);

  foreach($haifu as $step){
    $reg = preg_match("/^([0-3x])(D[A-Z]+)_([0-9a-f]+)$/",trim($step),$ref);
    if($reg != 1) continue;

    $wind = $ref[1] * 1;
    $playerIndex = ($wind + $jang_cond->aspect) % 4;
    $op = $ref[2];
    $target = $ref[3];
    
    switch($op){
    case "DRAW":
      for($i = 0; $i < 4; $i++) 
	if($jp[$i]->bit_naki > 0)
	  $jang_cond->eval_command($jp[$i]->wind . "DECL0_0", $i);
      break;
    case "DECLC":
    case "DECLP":
    case "DECLK":
    case "DECLF":
      for($i = 0; $i < 4; $i++) 
	if($i != $playerIndex && $jp[$i]->bit_naki > 0)
	  $jang_cond->eval_command($jp[$i]->wind . "DECL0_0", $i);
    /* through */
    case "DISC":
    case "DISCR":
      $jang_cond->eval_command($step, $playerIndex);
      break;
    case "DEAL":
    case "DECK":
    default:
      break;
    }
  }

}

?>
