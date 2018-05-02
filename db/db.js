const Sequelize = require('sequelize');

// connecting to database
var conn = new Sequelize(null, null, null, {
    dialect: 'sqlite',
    storage: './db/todos.sqlite'
});

var User = conn.define('user', {
    id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
    username: {
        type: Sequelize.STRING, unique: true, allowNull: false,
        validate: {
            len: {
                args: [4, 10],
                msg: "Username must be between 4 and 10 characters long"
            },
            isAlpha: {
                msg: "Only characters A-Z and a-z allowed for username"
            }
        }
    },
    email: {
        type: Sequelize.STRING, unique: true, allowNull: false, validate: {
            isEmail: true
        }
    },
    avatar: {type: Sequelize.STRING, allowNull: true, defaultValue: 'avatar.jpg'},
    password: { type: Sequelize.STRING, allowNull: false }
});

var Todo = conn.define('todo', {
    id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
    user_id: { type: Sequelize.INTEGER, allowNull: false },
    description: { type: Sequelize.STRING, allowNull: false },
    isComplete: {type: Sequelize.BOOLEAN, defaultValue: false}
}, { timestamps: true, paranoid: false });

User.hasMany(Todo, { foreignKey: 'user_id' });
Todo.belongsTo(User, { foreignKey: 'user_id' });

module.exports.db = conn;
module.exports.User = User;
module.exports.Todo = Todo;