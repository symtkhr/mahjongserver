<?
require_once("srv_jang0602.php.c");

// ƒeƒXƒgƒP[ƒX: 
$fouth = array(
"0DEAL_060c0a10111226333e444d4e58",
"1DEAL_010302111c1e24292c3c3d3f4c",
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
$jang_cond->aspect = 7;
$bandaid_name = array("Spr","Sum","Aut","Win");
for($i=0; $i<4;$i++){
  $jang_cond->jp[$i] = new JangPlayer;
  $jang_cond->jp[$i]->name = $bandaid_name[$i];
  $jang_cond->jp[$i]->token = rand(0, 0xffff);
 }
$jang_cond->jp_size = 4;

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
//$jang_cond->haifu = $fouth;
//var_dump($jang_cond->haifu);
//var_dump($jang_cond->jp);
if($unit_test)
   cmd_debug();



function load_haifu_v($haifu, $is_shown = false) {
  global $jang_cond;
  $JpInstance =& $jang_cond->jp;

  foreach($haifu as $step){
    $reg = preg_match("/^([0-3])(D[A-Z]+)_([0-9a-f]+)$/",trim($step),$ref);
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
	if($i != $playerIndex && $JpInstance[$i]->bit_naki > 0)
	  $jang_cond->eval_command($i . "DECL0_0", $i);
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
	  $jang_cond->eval_command($i . "DECL0_0", $i);
    /* through */
            
    default:
      $jang_cond->eval_command($step, $playerIndex);
      break;
    }
    //break;
      
  }

}
?>
