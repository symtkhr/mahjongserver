# -*- coding: euc-jp -*-
class DisplayMethods

  BAR = "-"*80
  NUM = ["一","二","三","四","五","六","七","八","九","東","南","西","北","白","發","中"]
  TYPE = ["萬","索","筒","　"]

  LINES = { "17" => [16,33] , "16" => [15,24] }

  #----------------------------------------------------------------------------
  def making_item( hand_item , selections , game_type )

    strings = ["","","",""]

    num , type = convert( hand_item )

    for i in 0..( LINES[game_type][0] )
      if( selections.index(i) ) then
        strings[0] += "    "
        strings[1] += "    "
      else
        strings[0] += "  #{NUM[ num[i] + hand_item[i] / 27 * 9 ]}"
        strings[1] += "  #{TYPE[ type[i] ]}"
      end
    end

    for i in ( LINES[game_type][0] +1 )..( LINES[game_type][1] )
      if( selections.index(i) ) then
        strings[2] += "    "
        strings[3] += "    "
      else
        strings[2] += "  #{NUM[ num[i] + hand_item[i] / 27 * 9 ]}"
        strings[3] += "  #{TYPE[ type[i] ]}"
      end
    end

    return strings

  end
  #----------------------------------------------------------------------------
  def discard(name,tiles)

    strings = to_string(tiles," ")

    puts BAR
    puts "   #{name}'s discards" 
    strings.each do |string|
      puts "          " + string
    end

  end
  #----------------------------------------------------------------------------
  def hand( tiles )

    puts BAR
    puts "   Hand:   "
    strings = to_string( tiles , " ")
    strings.each do |string|
      puts "          " + string
    end

  end
  #----------------------------------------------------------------------------
  def discard_item( tiles )

    nremain = tiles.size

    if( nremain > 23 ) then

      puts BAR
      puts "   Item:   " + Array.new(nremain){|i| "%2d" % [i+1] }.join("")
      
      strings = to_string( tiles , "" )
      
      strings.each do |string|
        puts "           " + string
      end
      puts BAR
      
    else

      puts BAR
      puts "   Item:   " + Array.new(nremain){|i| "%2d" % [i+1] }.join(" ")
      
      strings = to_string( tiles , " " )
      
      strings.each do |string|
        puts "          " + string
      end
      puts BAR
      
    end

  end
  #----------------------------------------------------------------------------
  def check( name , discarded )

    puts BAR
    puts "from #{name.ljust(10)}:   " + to_char( discarded )[0]
    puts " "*19 +  to_char( discarded )[1]
    puts BAR

  end
  #----------------------------------------------------------------------------
  def final_hand( hand )

    name = hand.shift
    discarded = hand.pop.to_i

    strings = to_string( hand , " ")

    puts BAR
    puts "#{name}'s hand :"
    puts "          " + strings.shift + "  |  " + to_char( discarded )[0]
    puts "          " + strings.shift + "  |  " + to_char( discarded )[1]
    puts BAR

  end
  #----------------------------------------------------------------------------
  def ron

puts <<RON

                      ＿＿＿＿      ＿
                     /       /            /        /  /
                    /       /            /        /  /
                   /       /           ／        /  /
                  /       /          ／         /  /
                  ￣￣￣￣         ￣          o  o
RON

  end
  #----------------------------------------------------------------------------
  def convert( tiles )

    num = []
    type = []

    tiles.each do |i|
      tile = i.to_i
      num.push( tile % 9 )
      type.push( tile / 9 )
    end

    return num,type

  end
  #----------------------------------------------------------------------------
  def to_string( tiles , spacer )

    num = []
    type = []

    tiles.each do |i|
      tile = i.to_i
      num.push( tile % 9 )
      type.push( tile / 9 )
    end

    strings = ["",""]

    tiles.each_index do |i|

      strings[0] += spacer + NUM[ num[i] + to_i( tiles )[i] / 27 * 9 ]
      strings[1] += spacer + TYPE[ type[i] ]

    end

    return strings
  
  end
  #----------------------------------------------------------------------------
  def to_char( tile )

    return [ NUM[ tile % 9 + tile / 27 * 9 ] , TYPE[ tile / 9 ] ]

  end
  #----------------------------------------------------------------------------
  def print_numbers(from,to,space)

    string = ""
    for i in from..to
      string += "%2d#{space}" % i
    end

    return string
    
  end
  #----------------------------------------------------------------------------
  def to_i( array )

    return array.collect{|i| i.to_i }
    
  end
  #----------------------------------------------------------------------------
end

Display = DisplayMethods.new
