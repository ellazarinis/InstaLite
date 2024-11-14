const dbaccess = require('./db_access');
const config = require('../config.json'); // Load configuration

function sendQueryOrCommand(db, query, params = []) {
    return new Promise((resolve, reject) => {
      db.query(query, params, (err, results) => {
        if (err) {
          reject(err);
        } else {
          resolve(results);
        }
      });
    });
  }

// Typically, we would not need to run this function, as the tables are created once and then used.
// However, I have still commented in detail what each table contains for reference.
async function create_tables(db) {
    // Table 0: names
    // nconst: varchar(10), primary key
    // primaryName: varchar(255)
    var q0 = db.create_tables('CREATE TABLE IF NOT EXISTS names ( \
        nconst VARCHAR(10) PRIMARY KEY, \
        primaryName VARCHAR(255) \
    );')

    // Table 1: users
    // username (varchar(255), unique/cannot repeat, not null, primary key)
    // hashed_password (varchar(255)), 
    // hashtags (varchar(20)), 
    // has_profile_pic (one-hot encoded, 0 means not set, 1 is set),
    // privacy_controls (comma-seperated array of controls), 
    // linked_nconst (foreign key, varchar (10), ref. names' nconst),
    // bio (string)
    var q1 = db.create_tables('CREATE TABLE IF NOT EXISTS users ( \
        username VARCHAR(255) NOT NULL PRIMARY KEY, \
        birthday DATE, \
        email VARCHAR(255) NOT NULL, \
        hashed_password VARCHAR(255), \
        hashtags VARCHAR(255), \
        profile_pic VARCHAR(255), \
        num_followers INT, \
        num_following INT, \
        num_posts INT, \
        linked_nconst VARCHAR(10), \
        bio VARCHAR(255), \
        related_actors VARCHAR(255), \
        affiliation VARCHAR(255), \
        visibility VARCHAR(25), \
        FOREIGN KEY (linked_nconst) REFERENCES names(nconst) \
    );')

    // Table 2: recommendations
    // person (foreign key, int, ref. users' username)
    // recommendedation (foreign key, int, ref. users' username)
    // strength (int)
    var q2 = db.create_tables('CREATE TABLE IF NOT EXISTS recommendations ( \
        person VARCHAR(255), \
        recommendation VARCHAR(255), \
        strength int, \
        FOREIGN KEY (person) REFERENCES users(username), \
        FOREIGN KEY (recommendation) REFERENCES users(username) \
    );')

    // Table 3: requests
    // person (foreign key, int, ref. users' username)
    // requester (foreign key, int, ref. users' username)
    var q3 = db.create_tables('CREATE TABLE IF NOT EXISTS requests ( \
        person VARCHAR(255), \
        requester VARCHAR(255), \
        FOREIGN KEY (person) REFERENCES users(username), \
        FOREIGN KEY (requester) REFERENCES users(username) \
    );')
        
    // Table 4: friends
    // followed (foreign key, int, ref. users' username)
    // follower (foreign key, int, ref. users' username)
    var q3 = db.create_tables('CREATE TABLE IF NOT EXISTS friends ( \
        followed VARCHAR(255), \
        follower VARCHAR(255), \
        FOREIGN KEY (follower) REFERENCES users(username), \
        FOREIGN KEY (followed) REFERENCES users(username) \
    );')

    // Table 5: posts
    // post_id (int, primary key, auto_increment)
    // parent_id (int, foreign key, ref. posts' post_id)
    // author (varchar(255), foreign key, ref. users' username)
    // title (varchar(255))
    // content (varchar(255))
    // likes (varchar(255))
    // privacy_controls (varchar(255))
    var q4 = db.create_tables('CREATE TABLE IF NOT EXISTS posts ( \
        post_id INT NOT NULL AUTO_INCREMENT PRIMARY KEY, \
        parent_post INT, \
        post_type VARCHAR(25), \
        author VARCHAR(255), \
        title VARCHAR(255), \
        content VARCHAR(512), \
        hashtags VARCHAR(255), \
        likes VARCHAR(255), \
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, \
        origin_server VARCHAR(255) NOT NULL, \
        FOREIGN KEY (parent_post) REFERENCES posts(post_id), \
        FOREIGN KEY (author) REFERENCES users(username) \
    );')

    // Table 6: group_chats
    // group_id (int, primary key, auto_increment)
    // members (varchar(650), comma-seperated list of usernames)

    var q5 = db.create_tables( 'CREATE TABLE IF NOT EXISTS group_chats ( \
      group_id INT NOT NULL AUTO_INCREMENT PRIMARY KEY, \
      members VARCHAR(650) \
    );')

    // Table 7: chats
    // message (varchar(255))
    // from (varchar(255), foreign key, ref. users' username)
    // to (varchar(255), foreign key, ref. users' username)
    // timestamp (timestamp in utc, primary key)
    // group_id (int, foreign key, ref. groups' group_id)
    var q6 = db.create_tables('CREATE TABLE IF NOT EXISTS messages ( \
        message VARCHAR(500), \
        `from` VARCHAR(255), \
        `to` VARCHAR(255), \
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP PRIMARY KEY, \
        group_id INT, \
        FOREIGN KEY (`from`) REFERENCES users(username), \
        FOREIGN KEY (`to`) REFERENCES users(username), \
        FOREIGN KEY (group_id) REFERENCES group_chats(group_id) \
    );')

    // Table 8: reset_password
    // for forgot password functionality

    var q7 = db.create_tables( 'CREATE TABLE IF NOT EXISTS password_resets ( \
      id INT PRIMARY KEY AUTO_INCREMENT, \
      user_forgot VARCHAR(255), \
      reset_token VARCHAR(255), \
      expires_at TIMESTAMP, \
      FOREIGN KEY (user_forgot) REFERENCES users(username) \
    );')

    // Table 9: blocked_users

    var q8 = db.create_tables( 'CREATE TABLE IF NOT EXISTS blocked_users ( \
      blocker_id VARCHAR(255) NOT Null, \
      blocked_id VARCHAR(255) NOT Null, \
      PRIMARY KEY (blocker_id, blocked_id), \
      FOREIGN KEY (blocker_id) REFERENCES users(username), \
      FOREIGN KEY (blocked_id) REFERENCES users(username) \
    );')

    // Table 10: post_likes
    // post_id (int, ref. posts' post_id)
    // username (varchar(255), ref. users' username)

    var q9 = db.create_tables( 'CREATE TABLE IF NOT EXISTS post_likes ( \
      post_id INT, \
      username VARCHAR(255), \
      FOREIGN KEY (post_id) REFERENCES posts(post_id), \
      FOREIGN KEY (username) REFERENCES users(username) \
    );')

    // Table 11: user_rank
    // username (varchar(255), primary key, ref. users' username)
    // rank (double, default 0.0)
    var q10 = db.create_tables('CREATE TABLE IF NOT EXISTS user_rank ( \
      username VARCHAR(255) PRIMARY KEY, \
      ranking DOUBLE DEFAULT 0.0, \
      FOREIGN KEY (username) REFERENCES users(username) \
    );')

    // Table 12: post_rank
    // post_id (int, primary key, ref. posts' post_id)
    // rank (double, default 0.0)
    var q11 = db.create_tables('CREATE TABLE IF NOT EXISTS post_rank ( \
      post_id INT PRIMARY KEY, \
      ranking DOUBLE DEFAULT 0.0, \
      FOREIGN KEY (post_id) REFERENCES posts(post_id) \
    );')

    // Table 13: hashtag_rank
    // hashtag (varchar(255), primary key)
    // rank (double, default 0.0)
    var q12 = db.create_tables('CREATE TABLE IF NOT EXISTS hashtag_rank ( \
      hashtag VARCHAR(255) PRIMARY KEY, \
      ranking DOUBLE DEFAULT 0.0 \
    );')

    // Table 14: online_users
    // username (varchar(255), primary key, ref. users' username)
    
    var q13 = db.create_tables('CREATE TABLE IF NOT EXISTS online_users ( \
      username VARCHAR(255) PRIMARY KEY, \
      FOREIGN KEY (username) REFERENCES users(username) \
    );')

    // Table 15: notifications
    // notified (varchar(255), ref. users' username)
    // notifier (varchar(255), ref. users' username)

    var q14 = db.create_tables('CREATE TABLE IF NOT EXISTS notifications ( \
      notified VARCHAR(255), \
      notifier VARCHAR(265), \
      FOREIGN KEY (notified) REFERENCES users(username));')

    return await Promise.all([q0, q1, q2, q3, q4, q5, q6, q7, q8, q9, q10, q11, q12, q13, q14]);
}

// Database connection setup
const db = dbaccess.get_db_connection();
var result = create_tables(dbaccess);
console.log('Tables created');
const PORT = config.serverPort;