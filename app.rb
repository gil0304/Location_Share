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
    if current_user
        followings = current_user.followings
        followers = current_user.followers
        @friends = []
        followings.each do |following|
            followers.each do |follower|
                if following.id == follower.id
                    @friends.push(following.id)
                end
            end
        end
    end
end

get '/' do
    @maps = Map.all.order('id desc')
    
    if current_user
        @currentusericon = []
        @currentusericon.push({
            'icon' => current_user.img
        })
        @locations = []
        followings = current_user.followings
        followings.each do |following|
            if following.followings.find(current_user.id)
                map = Latlng.find_by(user_id: following.id)
                if map
                    x = map.x
                    y = map.y
                    @locations.push({
                        'id' => following.id,
                        'location' => {
                            'icon' => User.find(map.user_id).img,
                            'x' => x,
                            'y' => y
                        }
                     })
                end
            end
        end
    end
    
    
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
        redirect '/'
    end
    if User.exists?(login_id: params[:login_id])
        redirect '/'
    else
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

get '/signout' do
    session[:user] = nil
    redirect '/'
end

post '/post' do
    t = Time.now
    t += 60 * 60 * 9
    
    uri = URI("https://express.heartrails.com/api/json")
    uri.query = URI.encode_www_form({
        method: "getStations",
        x: params[:x],
        y: params[:y]
    })
    
    res = Net::HTTP.get_response(uri)
    json = JSON.parse(res.body)
    
    stations = json["response"]["station"]
    
    if Latlng.find_by(user_id: session[:user])
        latlng = Latlng.find_by(user_id: session[:user])
        latlng.update({
            x: params[:x],
            y: params[:y]
        })
    else
        Latlng.create(
            x: params[:x],
            y: params[:y],
            user_id: session[:user]
        )
    end
    
    map = Map.new(
        x: params[:x],
        y: params[:y],
        content: params[:content],
        station: stations[0]["name"],
        category: params[:category],
        user_id: session[:user],
        time: t.strftime("%Y/%m/%d %X")
    )
    map.save
    returned_json = {
        x: map.x,
        y: map.y,
        content: map.content,
        station: map.station,
        category: map.category,
        id: map.user_id,
        postimg: User.find(map.user_id).img,
        time: map.time
    }
    
    json returned_json
    
    
end

post "/search" do
    @keyword = User.find_by(login_id: params[:keyword])
    returned_json = {
        id: User.find_by(login_id: params[:keyword]).id,
        img: User.find_by(login_id: params[:keyword]).img,
        name: User.find_by(login_id: params[:keyword]).name
    }
    json returned_json
end

get '/search' do
    @recommendusers = []
    @currentuserfollowings = []
    followings = current_user.followings
    @users = User.all
    @users.each do |user|
        if user != current_user
            followingfollowings = user.followings
            followingfollowings.each do |followingfollowing|
                if @recommendusers.include?(followingfollowing.id)
                else
                    @recommendusers.push(followingfollowing.id)
                end
            end
        else
            followings.each do |following|
                @currentuserfollowings.push(following.id)
            end
        end
    end
    erb :search
end

get '/userhome/:id' do
    @maps = Map.all.order('id desc')
    @users = User.all
    @relationships = Relationship.all
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
        
        room = Room.new({
            
        })
        room.save
        
        MessageRelationship.create({
            room_id: room.id,
            user_id: User.find(params[:id]).id
        })
        
        MessageRelationship.create({
            room_id: room.id,
            user_id: current_user.id
        })
        
        returned_json = {
            following: true
        }
        
        json returned_json
    end
end
    
get '/message' do
    @messages = Message.all.order('id')
    room_in_user_id = User.find(params[:id]).id
    @rooms = MessageRelationship.find(user_id: room_in_user_id).room_id
    erb :message
end

post '/sendmessage' do
    message = Message.new({
        user_id: current_user.id,
        room_id: params[:id],
        body: params[:message]
    })
    message.save
    
    returned_json = {
        user_id: massage.user_id,
        room_id: message.room_id,
        body: message.body
    }
    
    json returned_json
end
