<?
require_once("srv_jang0602.php.c");

// �e�X�g�P�[�X<1>: �������t���O 
$fouth = array(
"0DEAL_060b0a10111226303a444d4f58",
"1DEAL_010203131c1e24292c3c3d3e4c",
"2DEAL_080c3132333f41475d62687273",
//"2DEAL_080c0d3132333f41475d62687a",
"3DEAL_0407152d2e3539454e50566a6f",
"0DRAW_34",
"0DISC_26",
//"1DRAW_5e",
"1DISC_4c",
"2DRAW_19",
//
"2DISC_19",
"3DRAW_5b",
"3DISC_04",
//*/
);

// �e�X�g�P�[�X<2>: �I������
$fouths = array(
 /*sending 0:*/ "0DEAL_01070c1b1c1e21233449667e86",
 /*sending 1:*/ "1DEAL_151725262e303340415a61646e",
 /*sending 2:*/ "2DEAL_0d0e1f2b2f323b4254575f637a",
 /*sending 3:*/ "3DEAL_08121a31354546476a6c747d81",
 /*sending 4:*/ "xDORA_55",
 /*sending 5:*/ "0DRAW_88",
 /*sending 6:*/ "0DISC_49",
 /*sending 7:*/ "1DRAW_27",
 /*sending 8:*/ "1DISC_6e",
 /*sending 9:*/ "2DRAW_19",
 /*sending 10:*/ "2DISC_7a",
 /*sending 11:*/ "3DRAW_7b",
 /*sending 12:*/ "3DISC_7b",
 /*sending 13:*/ "0DRAW_3d",
 /*sending 14:*/ "0DISC_66",
 /*sending 15:*/ "1DRAW_51",
 /*sending 16:*/ "1DISC_51",
 /*sending 17:*/ "2DRAW_06",
 /*sending 18:*/ "2DISC_06",
 /*sending 19:*/ "3DRAW_75",
 /*sending 20:*/ "3DISC_75",
 /*sending 21:*/ "0DRAW_48",
 /*sending 22:*/ "0DISC_48",
 /*sending 23:*/ "1DRAW_82",
 /*sending 24:*/ "1DISC_82",
 /*sending 25:*/ "2DRAW_7f",
 /*sending 26:*/ "2DISC_7f",
 /*sending 27:*/ "3DRAW_4b",
 /*sending 28:*/ "3DISC_7d",
 /*sending 29:*/ "0DRAW_6f",
 /*sending 30:*/ "0DISC_3d",
 /*sending 31:*/ "1DRAW_36",
 /*sending 32:*/ "1DISC_30",
 /*sending 33:*/ "2DRAW_80",
 /*sending 34:*/ "2DISC_80",
 /*sending 35:*/ "3DRAW_85",
 /*sending 36:*/ "3DISC_85",
 /*sending 37:*/ "0DECLP_8688",
 /*sending 38:*/ "0DISC_7e",
 /*sending 39:*/ "1DRAW_0b",
 /*sending 40:*/ "1DISC_0b",
 /*sending 41:*/ "2DRAW_28",
 /*sending 42:*/ "2DISC_28",
 /*sending 43:*/ "3DRAW_7c",
 /*sending 44:*/ "3DISC_7c",
 /*sending 45:*/ "0DRAW_18",
 /*sending 46:*/ "0DISC_6f",
 /*sending 47:*/ "1DRAW_13",
 /*sending 48:*/ "1DISC_13",
 /*sending 49:*/ "2DRAW_71",
 /*sending 50:*/ "2DISC_71",
 /*sending 51:*/ "3DRAW_78",
 /*sending 52:*/ "3DISC_74",
 /*sending 53:*/ "0DRAW_62",
 /*sending 54:*/ "0DISC_62",
 /*sending 55:*/ "1DRAW_2c",
 /*sending 56:*/ "1DISC_64",
 /*sending 57:*/ "2DRAW_77",
 /*sending 58:*/ "2DISC_77",
 /*sending 59:*/ "3DRAW_79",
 /*sending 60:*/ "3DISC_79",
 /*sending 61:*/ "0DRAW_3e",
 /*sending 62:*/ "0DISC_3e",
 /*sending 63:*/ "1DRAW_38",
 /*sending 64:*/ "1DISC_61",
 /*sending 65:*/ "2DRAW_83",
 /*sending 66:*/ "2DISC_83",
 /*sending 67:*/ "3DRAW_56",
 /*sending 68:*/ "3DISC_4b",
 /*sending 69:*/ "0DRAW_70",
 /*sending 70:*/ "0DISC_70",
 /*sending 71:*/ "1DRAW_0a",
 /*sending 72:*/ "1DISC_0a",
 /*sending 73:*/ "2DRAW_16",
 /*sending 74:*/ "2DISC_42",
 /*sending 75:*/ "3DRAW_1d",
 /*sending 76:*/ "3DISC_81",
 /*sending 77:*/ "0DRAW_4d",
 /*sending 78:*/ "0DISC_4d",
 /*sending 79:*/ "1DRAW_73",
 /*sending 80:*/ "1DISC_73",
 /*sending 81:*/ "2DRAW_09",
 /*sending 82:*/ "2DISC_3b",
 /*sending 83:*/ "3DRAW_20",
 /*sending 84:*/ "3DISC_78",
 /*sending 85:*/ "0DRAW_5b",
 /*sending 86:*/ "0DISC_34",
 /*sending 87:*/ "1DRAW_04",
 /*sending 88:*/ "1DISC_04",
 /*sending 89:*/ "2DRAW_72",
 /*sending 90:*/ "2DISC_72",
 /*sending 91:*/ "3DRAW_60",
 /*sending 92:*/ "3DISC_08",
 /*sending 93:*/ "0DRAW_4a",
 /*sending 94:*/ "0DISC_4a",
 /*sending 95:*/ "1DRAW_0f",
 /*sending 96:*/ "1DISC_0f",
 /*sending 97:*/ "2DRAW_76",
 /*sending 98:*/ "2DISC_76",
 /*sending 99:*/ "3DRAW_4f",
 /*sending 100:*/ "3DISC_6c",
 /*sending 101:*/ "0DRAW_6b",
 /*sending 102:*/ "0DISC_6b",
 /*sending 103:*/ "1DRAW_3c",
 /*sending 104:*/ "1DISC_5a",
 /*sending 105:*/ "2DECLC_5457",
 /*sending 106:*/ "2DISC_09",
 /*sending 107:*/ "3DRAW_67",
 /*sending 108:*/ "3DISC_6a",
 /*sending 109:*/ "0DRAW_3a",
 /*sending 110:*/ "0DISC_3a",
 /*sending 111:*/ "1DRAW_39",
 /*sending 112:*/ "1DISC_17",
 /*sending 113:*/ "2DRAW_84",
 /*sending 114:*/ "2DISC_84",
 /*sending 115:*/ "3DRAW_24",
 /*sending 116:*/ "3DISC_20",
 /*sending 117:*/ "0DECLC_1c21",
 /*sending 118:*/ "0DISC_5b",
 /*sending 119:*/ "1DRAW_14",
 /*sending 120:*/ "1DISC_14",
 /*sending 121:*/ "2DRAW_03",
 /*sending 122:*/ "2DISC_03",
 /*sending 123:*/ "3DRAW_59",
 /*sending 124:*/ "3DISC_67",
 /*sending 125:*/ "0DRAW_22",
	      );

// �e�X�g�P�[�X<3>: ��Ɲ���
$fouth = array(
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
//      "2DRAW_13",

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
//*
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
/*"2DRAW_61",
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
		     array("0DECLC_060a", "1DECLK_01", "2DECLF_0"),//�� �h
		     array("1DECLK_01", "0DECLC_060a", "2DECLF_0"), //�� �h
		     array("0DECL0_0", "1DECLK_01", "2DECLF_0"), //�� �h
		     array("1DECLK_01", "0DECL0_0", "2DECLF_0"), //�� �h
		     array("1DECLK_01", "2DECLF_0"      ), //�� �h
		     array("0DECLC_060a", "1DECL0_0", "2DECLF_0"), //�� �h
		     array("1DECL0_0", "0DECLC_060a", "2DECLF_0"), //�� �h
		     array("0DECL0_0", "1DECL0_0", "2DECLF_0"), //�� �h
		     array("1DECL0_0", "0DECL0_0", "2DECLF_0"), //�� �h
		     array("1DECL0_0", "2DECLF_0"      ), //�� �h
		     array("0DECLC_060a", "2DECLF_0"      ), //�� �h
		     array("0DECL0_0", "2DECLF_0"      ), //�� �h
		     array("2DECLF_0"            ), //�� �h
		     array("0DECLC_060a", "1DECLK_01", "2DECL0_0"), //�� ��
		     array("0DECLC_060a", "2DECL0_0", "1DECLK_01"), //�� ��
		     array("1DECLK_01", "0DECLC_060a", "2DECL0_0"), //�� ��
		     array("1DECLK_01", "2DECL0_0"), //�� ��
		     array("2DECL0_0", "0DECLC_060a", "1DECLK_01"), //�� ��
		     array("0DECL0_0", "1DECLK_01", "2DECL0_0"), //�� ��
		     array("0DECL0_0", "2DECL0_0", "1DECLK_01"), //�� ��
		     array("1DECLK_01", "0DECL0_0", "2DECL0_0"), //�� ��
		     array("2DECL0_0", "0DECL0_0", "1DECLK_01"), //�� ��
		     array("2DECL0_0", "1DECLK_01"      ), //�� ��
		     array("0DECLC_060a", "1DECL0_0", "2DECL0_0"), //�� �h
		     array("0DECLC_060a", "2DECL0_0", "1DECL0_0"), //�� �h
		     array("1DECL0_0", "0DECLC_060a", "2DECL0_0"), //�� �h
		     array("1DECL0_0", "2DECL0_0", "0DECLC_060a"), //�� �h
		     array("2DECL0_0", "0DECLC_060a", "1DECL0_0"), //�� �h
		     array("2DECL0_0", "1DECL0_0", "0DECLC_060a"), //�� �h
		     array("0DECL0_0", "1DECL0_0", "2DECL0_0"), //�� (����)
		     array("0DECL0_0", "2DECL0_0", "1DECL0_0"), //�� (����)
		     array("1DECL0_0", "0DECL0_0", "2DECL0_0"), //�� (����)
		     array("1DECL0_0", "2DECL0_0", "0DECL0_0"), //�� (����)
		     array("2DECL0_0", "0DECL0_0", "1DECL0_0"), //�� (����)
		     array("2DECL0_0", "1DECL0_0", "0DECL0_0"), //�� (����)
                     array(),
		     );
  //array_push($fouth,"DECK_".str_repeat("44", count($test_case)));

 } else {
  array_push($fouth,"DECK_4444");
  $test_case = array(array());
}
//var_dump($test_case);

//�e�X�g����
$jang_cond = new JongTable;
$jang_cond->init_members();
$jang_cond->aspect = 0;
$jang_cond->jp_size = 4;
$bandaid_name = array("Spr","Sum","Aut","Win");
$bandaid_pt = array(0,0,0,0);
for($i = 0; $i < 4; $i++){
  $jang_cond->jp[$i] = new JangPlayer;
  $jang_cond->jp[$i]->name = $bandaid_name[$i];
  $jang_cond->jp[$i]->token = rand(0, 0xffff);
  $jang_cond->jp[$i]->pt = $bandaid_pt[$i];
 }

if(1) {
  $jang_cond->init_aspects();
  load_haifu_s($fouth);
  make_random_haifu();

 } else {
  $last_haifu = end($fouth);
  if($unit_test) $jang_cond->is_loading = true;

  foreach($test_case as $i => $cmds) {
    $jang_cond->init_aspects();
    $foutg = array_merge($fouth, array("TEST"), $cmds);
    load_haifu_s($foutg);
    if (count($cmds) == 0) continue;
    printf("%02d: ", $i + 1);
    $n = array_search($last_haifu, $jang_cond->haifu);
    echo $jang_cond->haifu[$n + 1] . "\t<-\t";
    echo implode(" / ", $cmds);

    echo "\n";
  }
}

if($unit_test)
   cmd_debug();


function make_random_haifu() {
  global $jang_cond;
  if(0) {
    $jang_cond->start_game();
    $jang_cond->deal_tiles();
  }
  for($loop = 0; $loop < 14/*< 136 - 13 * 5 - 30*/; $loop++) {
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
  $is_test = false;

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
  if(count($jang_cond->yamahai) + count($jang_cond->wangpai) != 136) {
    sort($jang_cond->yamahai);
    print_r($jang_cond->yamahai);
    exit("Invalid haifu\n");
  }

  for($i = count($jang_cond->wangpai); $i < 14; $i++) {
    array_push($jang_cond->wangpai, 
	       array_pop($jang_cond->yamahai));
  }

  $jang_cond->deal_tiles(true);

  foreach($haifu as $i_st => $step){
    if($step==="TEST") $is_test = true;
    $reg = preg_match("/^([0-3x])(D[A-Z0]+)_([0-9a-f]+)$/",trim($step),$ref);
    if($reg != 1) continue;

    $wind = $ref[1] * 1;
    $playerIndex = ($wind + $jang_cond->aspect) % 4;
    $op = $ref[2];
    $target = $ref[3];
    
    switch($op){
    case "DRAW":
      for($i = 0; $i < 4; $i++) 
	if($jp[$i]->bit_naki > 0 && !$is_test)
	  $jang_cond->eval_command($jp[$i]->wind . "DECL0_0", $i);
      break;
    case "DECLC":
    case "DECLP":
    case "DECLK":
    case "DECLF":
      for($i = 0; $i < 4; $i++) 
	if($i != $playerIndex && $jp[$i]->bit_naki > 0 && !$is_test)
	  $jang_cond->eval_command($jp[$i]->wind . "DECL0_0", $i);
    /* through */
    case "DISC":
    case "DISCR":
    case "DECL0":
      $jang_cond->eval_command($step, $playerIndex);
      break;
    case "DEAL":
    case "DECK":
    default:
      break;
    }
    //if($i_st > 5) break;
  }

}

?>
