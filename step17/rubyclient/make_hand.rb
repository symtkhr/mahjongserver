class MakeHand

  require "display"

  SPACE = " "*3
  BAR = "-"*80

  LINES = { "17" => [17,17] , "16" => [16,9] }

  #----------------------------------------------------------------------------
  def initialize(hand_item,game_type)

    @game_type = game_type

    @hand_item = hand_item.collect{|i| i.to_i }

    @selections = []

  end
  #----------------------------------------------------------------------------
  def make
    
    com = [""]
    message = "Make Your Hand."
    while( true )
      
      display(message)
      message = ""
      
      break   if( com.to_s.strip == "set" )
      
      print "> "
      com = STDIN.gets.split(' ')
      
      case com.shift
      when ""
        redo
      when "add"
        add(com)
      when "rm"
        remove(com)
      when "reset"
        reset()
      when "set"
        if( check )
          com = "set"
          message = "Please Wait..."
        else
          message = "The Number of Tiles is not Suitable."
        end
      else
        message =  "Invalid Command."
      end
      
    end
    
    return check

  end
  #----------------------------------------------------------------------------
  def display(message)
    
    hand =  @selections.collect{|i| @hand_item[i] }
    strings = []
    strings += Display.making_item( @hand_item , @selections , @game_type )
    strings += Display.to_string( hand , "  " )

    puts BAR
    puts
    puts SPACE + strings.shift
    puts SPACE + strings.shift
    puts
    puts SPACE + Array.new(LINES[@game_type][0]){|i| "  %2d" % (i+1) }.join("")
    puts
    puts BAR
    puts
    puts SPACE + strings.shift
    puts SPACE + strings.shift
    puts
    puts SPACE + Array.new(LINES[@game_type][1]){|i| "  %2d" % (i+LINES[@game_type][0]+1) }.join("")
    puts
    puts BAR
    puts "selected: "
    puts "          " + strings.shift
    puts "          " + strings.shift
    puts
    puts "          " +  Array.new(13){|i| "  %2d" % (i+1) }.join("")
    puts BAR
    puts message
    puts BAR
    
  end
  #----------------------------------------------------------------------------
  def add(command)

    @selections = ( @selections + get_list( command ) ).uniq.sort

  end
  #----------------------------------------------------------------------------
  def remove(command)

    get_list( command ).uniq.sort.reverse.each do |i|
      @selections.delete_at( i )
    end

  end
  #----------------------------------------------------------------------------
  def reset()

    @selections = []

  end
  #----------------------------------------------------------------------------
  def get_list( command )
    
    list = []

    command.each do |i|
      
      if( i =~ /\d-\d/ ) then
        from = i.split('-')[0].to_i - 1
        to = i.split('-')[1].to_i - 1
        
        for j in from..to
          list.push( j )
        end
      else
        list.push( i.to_i - 1 )
      end
    end

    return list & Array.new(@hand_item.size){ |i| i }

  end 
  #----------------------------------------------------------------------------
  def check()

    if( @selections.size == 13 ) then
      @hand = @selections
      return @selections.collect{|i| @hand_item[i]}.join(';')
    else
      return nil
    end

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
  def print_tiles(tiles,space)

    string = ""
    tiles.each do |tile|
      string += Display::TILE[tile.to_i] + space
    end

    return string

  end
  #----------------------------------------------------------------------------
end
