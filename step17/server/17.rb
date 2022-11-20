class Game17

  require "junk_routines"

  MAX_TURN = { "17" => 17 , "16" => 16 }

  #----------------------------------------------------------------------------
  def play( sockets , game_type )

    require "player_17"
    
    srand( Time.now.strftime("%s").to_i )

    @names = sockets.keys.sort_by{ rand }
    @players = Hash.new
    @names.each do |name|
      @players[name] = Player17.new( sockets[name] , game_type )
    end

    sleep(1)

    while( sockets.size > 0 )
      
      @names.push( @names.shift )

      case game_type
      when "17"
        wall = new_wall
        
        @players.each_value do |player|
          player.new_hand( Array.new(34){ wall.shift } , -1 )
        end
      when "16"
        walls = new_walls

        @names.each_index do |i|
          hand_item = []
          for j in 0..3
            if( i == j )
              hand_item += Array.new(16){ walls[j].shift }
            elsif( j == 3 )
              hand_item += Array.new(9){ walls[j].shift }
            else
              hand_item += Array.new(10){ walls[j].shift }
            end
          end
          @players[ @names[i] ].new_hand( hand_item , i )
        end
      end

      @names.each do |name|
        if( @players[name].get_hand ) then
          @players[name].kick
        end
      end
      
      final_hands = Hash.new
      safe_list = []

      ( @names * MAX_TURN[ game_type ] + [nil] ).each do |name_turn|

        commands = ["clear"]
        @names.each do |name|
          commands.push( "discard;#{name};" + @players[name].discards_of )
        end
        
        @players.each_value do |player|
          commands.each do |command|
            player.send_command( command )
          end
        end
        
        @players.each_value do |player|
          player.send_hand
        end
        
        break   if( not name_turn )
        
        discarded = @players[name_turn].discard( safe_list )
        
        @players.each_key do |name|
          final_hands[name] = @players[name].check(discarded,name_turn)
        end
        final_hands = final_hands.delete_if{|name,hand| not hand }
        
        if( final_hands.size != 0 )
          @players.each_value do |player|
            player.send_command( "finish" )
          end
          sleep(1)
          break
        end
        
        safe_list.push( discarded )
        safe_list.uniq!
        
      end
        
      
      @players.each_value do |player|
        player.confirm( final_hands )
      end
      
      sleep(3)
      
      @players.each_value do |player|
        player.close_game
      end
      continue = false
      @players.each_value do |player|
        continue = ( continue or ( not player.is_dead ) )
      end
      @players.each_value do |player|
        continue = ( continue and player.continue )
      end
      
      @names.each do |name|
        if( @players[name].is_dead ) then
          sockets.delete( name )
        end
      end
      
      break   if( not continue )
      
    end
    
    @players.each_value do |player|
      player.send_command( "clear" )
      player.send_command( "quit" )
    end
        
  end
  #----------------------------------------------------------------------------
end
