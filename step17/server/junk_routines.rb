#------------------------------------------------------------------------------
def new_wall

  return Array.new(136){|i| i / 4 }.sort_by { rand }

end
#------------------------------------------------------------------------------
def new_walls
  
  walls = []
  for i in 0..2
    walls.push( Array.new(36){|j| j / 4 + i * 9 }.sort_by{ rand } )
  end
  walls.push( Array.new(28){|j| j / 4 + 27 }.sort_by{ rand } )
  
  return walls
  
end
#------------------------------------------------------------------------------
