class CreateMaps < ActiveRecord::Migration[6.1]
  def change
    create_table :maps do |t|
      t.float :x
      t.float :y
      t.integer :user_id
      t.string :content
      t.string :station
      t.string :category
      t.string :time
      t.timestamps null: false
    end
  end
end
