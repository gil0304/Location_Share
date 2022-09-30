require 'bundler/setup'
Bundler.require

ActiveRecord::Base.establish_connection

class User < ActiveRecord::Base
    has_secure_password
    has_many :maps
    belongs_to :group
    has_many :relationships, class_name: "Relationship", foreign_key: "follower_id"
    has_many :reverse_of_relationships, class_name: "Relationship", foreign_key: "followed_id"
    has_many :followings, through: :relationships, source: :followed
    has_many :followers, through: :reverse_of_relationships, source: :follower
    has_many :message_relationships
    has_many :rooms, through: :message_relationships
    has_many :messages
    has_many :plans;
    has_many :latlngs;
end

class Map < ActiveRecord::Base
    belongs_to :user
end

class Relationship < ActiveRecord::Base
    belongs_to :follower, class_name: "User"
    belongs_to :followed, class_name: "User"
end

class Message < ActiveRecord::Base
    belongs_to :user
    belongs_to :room
end

class Room < ActiveRecord::Base
    has_many :message_relationships
    has_many :users, through: :message_relationships
    has_many :messages
    
    def self.find_room(own, target)
        
        login_user = User.find_by(login_id: own)
        
        if login_user.rooms
            rooms = login_user.rooms
        else
            return false
        end
        
        rooms.each do |room|
            room.users.each do |user|
                if user.login_id == target
                    return room
                end
            end
        end
        
        return false
        
    end
    
    def self.new_room(own, target)
       
        room = Room.new
        room.save
       
        MessageRelationship.create([
           {
               user_id: User.find_by(login_id: own).id,
               room_id: room.id
           },{
               user_id: User.find_by(login_id: target).id,
               room_id: room.id
           }
        ])
        
        return room
        
    end
end

class MessageRelationship < ActiveRecord::Base
    belongs_to :user
    belongs_to :room
end

class Latlng < ActiveRecord::Base
    belongs_to :user
end