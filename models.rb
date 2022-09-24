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
    has_many :user_groups;
    has_many :user_group_users, through: :user_groups, source: :user
    has_many :plans;
end

class Map < ActiveRecord::Base
    belongs_to :user
end

class Relationship < ActiveRecord::Base
    belongs_to :follower, class_name: "User"
    belongs_to :followed, class_name: "User"
end