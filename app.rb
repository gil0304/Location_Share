require 'bundler/setup'
Bundler.require
require 'sinatra/reloader' if development?
require './models.rb'
require 'dotenv/load'

require 'open-uri'
require 'net/http'
require 'json'

enable :sessions

before do
    Dotenv.load
    Cloudinary.config do |config|
        config.cloud_name = ENV["CLOUD_NAME"]
        config.api_key = ENV["CLOUDINARY_API_KEY"]
        config.api_secret = ENV["CLOUDINARY_API_SECRET"]
    end
    def current_user
        User.find_by(id: session[:user])
    end
end

get '/' do
    @maps = Map.all.order('id desc')
    erb :index
end

get '/signup' do
    erb :signup
end

post '/signup' do
    img_url = ''
    if params[:file]
        img = params[:file]
        tempfile = img[:tempfile]
        upload = Cloudinary::Uploader.upload(tempfile.path)
        img_url = upload["url"]
    else
        img_url = "https://lit-music-sns-standard.herokuapp.com/assets/img/default_icon.png"
    end
    
    user = User.create(
        name: params[:name],
        login_id: params[:login_id],
        img: img_url,
        password: params[:password]
        )
    if user.persisted?
        session[:user] = user.id
    end
    redirect '/'
end

get '/signin' do
    erb :signin
end

post '/signin' do
    user = User.find_by(login_id: params[:login_id])
    if user && user.authenticate(params[:password])
        session[:user] = user.id
    else
        redirect '/'
    end
    redirect '/'
end

post '/post' do
    uri = URI("https://express.heartrails.com/api/json")
    uri.query = URI.encode_www_form({
        method: "getStations",
        x: params[:x],
        y: params[:y]
    })
    
    res = Net::HTTP.get_response(uri)
    json = JSON.parse(res.body)
    
    # while !json["response"]["station"]
    #     sleep 1
    #     p "zzz"
    #     p Net::HTTP.get_response(uri)
    #     p JSON.parse(Net::HTTP.get_response(uri))
    # end
    
    stations = json["response"]["station"]
    
    
    map = Map.new(
        x: params[:x],
        y: params[:y],
        content: params[:content],
        station: stations[0]["name"],
        category: params[:category],
        user_id: session[:user],
        time: Time.at(Time.now, in: "+09:00")
    )
    map.save
    
    returned_json = {
        x: map.x,
        y: map.y,
        content: map.content,
        station: map.station,
        category: map.category,
        postimg: User.find(map.user_id).img,
        time: map.time
        
    }
    
    json returned_json
    
    
end

get "/search" do
    keyword = params[:keyword]
    @keyword = User.find_by(login_id: keyword)
    erb :search
end

get '/userhome/:id' do
    @maps = Map.all
    @myuser = User.find(params[:id])
    @maps.each do |map|
        if @myuser["id"] == User.find(map.user_id).id
            @mymaps = map
        end
    end
    erb :userhome
end

post '/follow' do
    
    find = Relationship.find_by(followed_id: params[:id], follower_id: current_user.id)
    if find
        find.destroy
        returned_json = {
            following: false
        }
        json returned_json
    else
        relationship = Relationship.new({
            followed_id: params[:id],
            follower_id: current_user.id
        })
        relationship.save
        
        returned_json = {
            following: true
        }
        
        json returned_json
    end
end
    