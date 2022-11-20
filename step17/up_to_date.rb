#!/usr/local/bin/ruby

FILES = ["server/server.rb","client/client.rb"]
FLAG = "LAST_MODIFIED = "

puts date = Time.now.strftime('"%Y/%m/%d %a %H:%M:%S %Z"').upcase

FILES.each do |file|

  system("cp #{file} #{file}~")

  output = open( file , 'w' )

  open( file+"~" ).each do |line|
    output.puts line.sub( /^(#{FLAG}).*/ , FLAG + date)
  end

  output.close

end

