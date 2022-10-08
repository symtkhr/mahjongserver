<?
require_once("srv_jang0602.php.c");

// ƒeƒXƒgƒP[ƒX: žÈ˜a
$fouth = array( //<<<EOT
"0DEAL_060c0a10121426333e454d4f50", 
"1DEAL_050c131c1e24292c3c3d3f4348", 
"2DEAL_0c0f3132333f41475d62687273", 
"3DEAL_171a2d2e35393d4e5156767780", 
"0DRAW_67", 
"0DISC_67", 
"1DRAW_38", 
"1DISC_13", 
"0DECLP_1412", 
"0DISC_26", 
"1DRAW_75", 
"1DISC_75", 
"3DECLP_7677", 
"3DISC_80", 
"0DRAW_11", 
"0DECLK_11", 
"DECK_4444444444444444444444444444444444444444444444444444444444444444444444444444444");

$test_case = array(
array("2DECL0_0", "3DECL0_0"), //¨ 0DRAW_—äã
array("2DECLF_0", "3DECL0_0"), //¨ ‰h2
array("2DECL0_0", "3DECLF_0"), //¨ ‰h3
array("2DECLF_0", "3DECLF_0"), //¨ ‰h2E‰h3
array("3DECL0_0", "2DECL0_0"), //¨ 0DRAW_—äã
array("3DECLF_0", "2DECL0_0"), //¨ ‰h3
array("3DECL0_0", "2DECLF_0"), //¨ ‰h2
array("3DECLF_0", "2DECLF_0"), //¨ ‰h2E‰h3
);
//$test_case = array();
var_dump($test_case);

foreach($test_case as $i=>$cmds) {
    $jang_cond = new JongTable;
    load_haifu_v($fouth, $i==0);
    printf("%02d: ", $i + 1);
    foreach($cmds as $cmd){
      echo "<".$cmd.">";
      $jang_cond->eval_command($cmd);
    }
    echo "\n";
}
cmd_debug();

function load_haifu_v($haifu, $is_shown = false) {
  global $jang_cond;
  $jang_cond->is_loading = true;
    $JpInstance =& $jang_cond->jp;

    $news = array("T","N","S","P");

  foreach($haifu as $step){
      $reg = preg_match("/^([0-3])(D[A-Z]+)_([0-9a-f]+)$/",trim($step),$ref);
      if($reg != 1) { 
            if(preg_match("/^DECK_([0-9a-f]+)$/", $step, $ref))
	    	for($i=0; $i < strlen($ref[1]); $i+=2)
	 	 array_push($jang_cond->yamahai, hexdec(substr($ref[1], $i, 2)));
	continue;
      }

      $player = $ref[1] * 1;
      $op = $ref[2];
      $target = $ref[3];
      if($is_shown)
        echo "**".$step."**\n";

      switch($op){

      case "DEAL":
	$JpInstance[$player] = new JangPlayer;
	$JpInstance[$player]->wind = $player;
	$JpInstance[$player]->name = $news[$player];

	for($i = 0; $i < 13; $i++)
	  array_push($JpInstance[$player]->tehai, hexdec(substr($target, $i*2, 2)));
	$JpInstance[$player]->tempaihan();
	break;

      case "DRAW":
        for($i = 0; $i < 4; $i++) 
	       if($i != $player && $JpInstance[$i]->bit_naki > 0)
	          $jang_cond->eval_command($i . "DECL0_0");
        $jang_cond->turn = $player;
	$JpInstance[$player]->draw_tile(hexdec($target));
	break;

      case "DECLC":
      case "DECLP":
      case "DECLK":
      case "DECLF":
        for($i = 0; $i < 4; $i++) 
	       if($i != $player && $JpInstance[$i]->bit_naki > 0)
	          $jang_cond->eval_command($i . "DECL0_0");
      /* through */
            
      default:
         $jang_cond->eval_command($step);       
	 break;
      }

      
  }
  $jang_cond->is_loading = false;

}
?>