class CreatePlans < ActiveRecord::Migration[6.1]
  def change
    create_table :plans do |t|
      t.integer :user_id
      t.string :body
      t.date :date
      t.timestamps null: false
    end
  end
end
