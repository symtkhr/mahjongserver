class Player17

  require "junk_check"
  include MahjongCheck
      
  #xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
  def initialize( socket , game_type )

    @game_type = game_type
    @socket = socket
    @logout = false

    send_command( "game_start;" + game_type )

  end
  #xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
  def new_hand( hand_item , color )
    
    if( color < 0 ) then
      @myitem = Array.new(34){|i| i }
    else
      @myitem = Array.new(9){|i| i + color * 9 } + Array.new(7){|i| i + 27 }
    end

    @hand_item = []
    @discard_item = []
    hand_item.sort.each do |item|
      if( @myitem.index( item ) ) then
        @hand_item.push( item )
      else
        @discard_item.push( item )
      end
    end

    @discards = []
    @overlap = false
    @hand = []
    @wait = []
    
    send_command( "make_hand;" + @hand_item.join(';') )

  end
  #xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
  def get_hand

    @hand = @hand_item.sort_by{ rand }.slice(0..12).sort

    if( hand = listen ) then
      @hand = hand.split(';').collect{|i| i.to_i}.sort
    end

    @hand.each do |i|
      index = @hand_item.index(i)
      return true   if( index == nil )
      @hand_item.delete_at( @hand_item.index(i) )
    end
    
    @wait = search_wait( @hand )

    case @game_type
    when "17"
      @discard_item = @hand_item
    when "16"
      @hand_item.each do |item|
        @discard_item.push( item )   if( item >= 27 )
      end
    end

    return false

  end
  #xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
  def send_hand
    
    send_command( "hand;" + @hand.join(';') )
    send_command( "discard_item;" + @discard_item.join(';') )

  end
  #xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
  def discard( safe_list )
    
    num = rand( @discard_item.size )
    @discard_item.each do |item|
      if( safe_list.index(item) ) then
        num = @discard_item.index(item)
        break
      end
    end

    if( not @logout ) then
      send_command( "turn" )
      if ( reply = listen ) then
        num = reply.to_i - 1
      end
    end
    
    discarded = @discard_item[num]
    @discards.push( discarded )
    @discard_item.delete_at( num )

    @overlap = true   if( @wait.index( discarded ) )

    return discarded

  end
  #xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
  def check(discarded,name)

    return false   if( @logout )

    if( ( not @overlap ) and @wait.index( discarded ) )
      if( send_command( "check;#{name};#{discarded.to_s}" ) ) then
        if( listen == "finish" )
          return @hand + [discarded]
        else
          @overlap = true
        end
      end
    end

    return false

  end
  #xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
  def confirm( final_hands )

    if( final_hands.size > 0 ) then
      final_hands.each_key do |name|
        send_command( "final_hands;" + "#{name};"+ final_hands[name].join(';') )
      end
    else
      send_command( "draw" )
    end

  end
  #xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
  def discards_of

    return  @discards.join(';')

  end
  #xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
  def close_game

    send_command( "continue" )

    return ( not @logout )

  end
  #xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
  def continue

    return true   if( @logout )

    return ( listen != "exit" )
    
  end
  #xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
  def send_command( command )
    
    return nil   if( @logout )
    
    begin
      @socket.puts( command )
    rescue
      @logout = true
      return nil
    end
    
    return true

  end
  #xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
  def listen

    return nil   if( @logout )
    
    if( message = @socket.gets ) then
      return message.strip
    else
      @logout = true
      return nil
    end

  end
  #xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
  def is_dead
    
    return @logout
    
  end
  #xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
  def kick
    
    send_command( "message;Your Program has Something Wrong." )
    send_command( "message;Conection Will Shutted." )
    @socket.close
    
    @logout = true
    
  end
  #xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
  def quit
    
    send_command( "quit" )
    @socket.close

    @logout = true

  end
  #xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
end

