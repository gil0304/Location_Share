class MessageRelationships < ActiveRecord::Migration[6.1]
  def change
    create_table :message_relationships do |t|
      t.integer :user_id
      t.integer :room_id
    end
  end
end
