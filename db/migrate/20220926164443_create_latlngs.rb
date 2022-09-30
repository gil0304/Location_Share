class CreateLatlngs < ActiveRecord::Migration[6.1]
  def change
    create_table :latlngs do |t|
      t.integer :user_id
      t.float :x
      t.float :y
      t.timestamps null: false
    end
  end
end
