const dbsingleton = require('../models/db_access.js');
const config = require('../config.json'); // Load configuration
// const configJava = require('/home/ubuntu/project-kala/routes/Config.json');
const configJava = require('../routes/Config.json');

const bcrypt = require('bcrypt'); 
const helper = require('../routes/route_helper.js');
const process = require('process');
require("dotenv").config();
const multer = require("multer");
const multerS3 = require("multer-s3");
const { OpenAIEmbeddings } = require("@langchain/openai");
const {OpenAIEmbeddingFunction} = require('chromadb');
const { formatDocumentsAsString } = require("langchain/util/document");
const {
    RunnableSequence,
    RunnablePassthrough,
  } = require("@langchain/core/runnables");
const { Chroma } = require("@langchain/community/vectorstores/chroma");
const { OpenAI, ChatOpenAI } = require("@langchain/openai");
const { PromptTemplate } = require("@langchain/core/prompts");
const { StringOutputParser } = require("@langchain/core/output_parsers");
const { Document } = require("langchain/document");

// const { OpenAI } = require("openai");
// const openai = new OpenAI({
//   apiKey: process.env['OPENAI_API_KEY'], // This is the default and can be omitted
// });
 
const {fromIni} = require('@aws-sdk/credential-provider-ini');

var vectorStore = null;

const imageComparingFunctions = require('../face-recognition/appFace.js');

const util = require('util');
const { xml } = require('cheerio');
const crypto = require('crypto'); // generate random token
const nodemailer = require('nodemailer'); // send email
const fetch = require('node-fetch');
const { Readable } = require('stream');



var path = require('path');
const { ChromaClient } = require("chromadb");
const fs = require('fs');
const tf = require('@tensorflow/tfjs-node');
const faceapi = require('@vladmandic/face-api');
const { EmbeddingDistance } = require('langchain/smith');
const aws = require('aws-sdk');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');

// kafka-client
const kafkaClient = require('../kafka-client/app');

const db = dbsingleton;

const PORT = config.serverPort;

const s3 = new S3Client({
  credentials: fromIni({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID, 
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY, 
    sessionToken: process.env.AUTH_TOKEN 
  }),
  region: "us-east-1",
})


const storage = multer.diskStorage({
  destination: function (req, file, cb) {
      cb(null, "routes")
  },
  filename: function (req, file, cb) {
      const parts = file.mimetype.split("/");
      const username = req.params.username;
      cb(null, `userPhoto.jpg`)
  }
})

 
const upload = multer({storage});


function imageToStream(filePath) {
  if (!filePath) {
      throw new Error('A file path must be provided');
  }

  // Ensure the file exists before creating a stream
  if (!fs.existsSync(filePath)) {
      throw new Error('File does not exist');
  }

  return fs.createReadStream(filePath);
}

async function uploadToFirstS3 (username, bucketName) {
  const uploadParams = {
    Bucket: bucketName,
    Key: username,
    Body: imageToStream("/home/ubuntu/project-kala/routes/userPhoto.jpg"),
    ContentType: 'image/jpg', 
  };
  const command = new PutObjectCommand(uploadParams);
  const response = await s3.send(command);
};

const faceClient = new ChromaClient();


async function indexImages() {
  
  await imageComparingFunctions.initializeFaceModels();
  const faceCollection = await faceClient.getOrCreateCollection({
    name: "face-api",
    embeddingFunction: null,
    metadata: { "hnsw:space": "l2" },
  });
  

  console.info("Looking for files");
  const promises = [];
  fs.readdir("images", (err, files) => {
    if (err) {
      console.error("Could not list the directory.", err);
      process.exit(1);
    }

    files.forEach((file, index) => {
      //console.info("Adding task for " + file + " to index.");
      promises.push(imageComparingFunctions.indexAllFaces(path.join("images", file), file, faceCollection));
    });

    console.info("Done adding promises, waiting for completion.");
    return Promise.all(promises)
      .then(() => {
        console.info("All images indexed.");
        return faceCollection;  
      })
      .catch((err) => {
        console.error("Error indexing images:", err);
      });
  });
}

var coll = indexImages();

async function compareImages() {
  const faceCollection = await faceClient.getOrCreateCollection({
    name: "face-api",
    embeddingFunction: null,
    metadata: { "hnsw:space": "l2" },
  });
  const search = '/home/ubuntu/project-kala/routes/userPhoto.jpg';
  console.log('\nTop-k indexed matches to ' + search + ':');
  
  var out = "[";
  //console.log('\nTop-k indexed matches to ' + search + ':');
  for (var item of await imageComparingFunctions.findTopKMatches(faceCollection, search, 5)) {
    for (var i = 0; i < item.ids[0].length; i++) {
      //console.log(item.ids[0][i] + " (Euclidean distance = " + Math.sqrt(item.distances[0][i]) + ") in " + item.documents[0][i]);
      const photo = `${item.ids[0][i]}`;
      const nconst = photo.replace(/\.jpg-1$/, "");
      out += nconst + ",";
    }
  }
  let items = out.replace(/[\[\]]/g, '').trim().split(',').filter(item => item !== '').map(item => item.trim());
  let cleanedStr = "[" + items + "]";
  //console.log(cleanedStr);
  return cleanedStr;
}

async function indexContent() {
  var response = [];
  var ids = [];
  try {
    const postResult = await db.send_sql(`SELECT * FROM posts;`);
    // const doc = new Document({ pageContent: "foo", metadata: { source: "1" } });

    postResult.map(x => {
        const embedding = x.post_id + " " + x.parent_post + " " + x.post_type + " " + x.author + " " + x.title + " " + x.content + " " + x.hashtags + " " + x.likes + " " + x.created_at;
        const id = "post-" + x.post_id;
        response.push(new Document({ pageContent: embedding, metadata: { source: id } }));
        ids.push(id);
      });

    const userResult = await db.send_sql(`SELECT * FROM users;`);
    userResult.map(x => {
        const embedding = x.username + " " + x.birthday + " " + x.hashtags + " " + x.linked_nconst + " " + x.bio + " " + x.related_actors + " " + x.affiliation;
        const id = "user-" + x.username;
        ids.push(id);
        response.push(new Document({ pageContent: embedding, metadata: { source: id } }));
      });

  } catch (error) {
    console.error(error);
    return;
  }

  // console.log(response);

  vectorStore = await Chroma.fromDocuments(response, new OpenAIEmbeddings({
    apiKey: process.env.OPENAI_API_KEY,
    batchSize: 512,
    model: "text-embedding-3-large"
  }), ids, {
    collectionName: "content-collection3",
    // url: 'http://localhost:8000',
    url: "http://172.31.48.151:8000", // Optional, will default to this value
    collectionMetadata: {
      "hnsw:space": "cosine",
    },
  });
}

var index = indexContent();

// // helper functions

function generateResetToken() {
  // Generate a random bytes buffer
  const buffer = crypto.randomBytes(20);

  // Convert the buffer to a hexadecimal string
  const token = buffer.toString('hex');

  // Return the generated token
  return token;
}


async function sendPasswordResetEmail(email, resetToken) {
  // Create a transporter using Gmail SMTP
  const transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
      user: 'kalaproject6@gmail.com',
      pass: 'loep bkpl orgv ocpw',
    },
  });

  // Create the email message
  const message = {
    from: 'kalaproject6@gmail.com',
    to: email,
    subject: 'Password Reset',
    // text: `Click the following link to reset your password: http://localhost/reset-password?token=${resetToken}`,
    // html: `<p>Click the following link to reset your password: http://localhost/reset-password?token=${resetToken}</p>`,
    text: `Click the following link to reset your password: http://184.73.140.196:5173/reset-password?token=${resetToken}`,
    html: `<p>Click the following link to reset your password: http://184.73.140.196:5173/reset-password?token=${resetToken}</p>`,
  };

  try {
    // Send the email

    const info = await transporter.sendMail(message);
    console.log('Password reset email sent: %s', info.messageId);
  } catch (error) {
    console.error('Error sending password reset email:', error);
    throw error;
  }
}


var getHelloWorld = function(req, res) {
    res.status(200).send({message: "Hello, world!"});
}

// GET /:username/profile
var getProfile = async function(req, res) {
  // ERROR handling
  const username = req.params.username;

  if (!username) {
    return res.status(400).send({error: 'No user given.'});
  }

  try {
    const result = await db.send_sql(
      `SELECT username, email, hashed_password, hashtags, profile_pic, num_followers, num_following, num_posts, visibility, linked_nconst, bio
       FROM users
       WHERE username = '${username}';`);

    if (result.length == 0) {
      return res.status(400).send({error: 'No user found.'});
    }
    const response = {
      results: {
        username: result[0].username,
        email: result[0].email,
        hashed_password: result[0].hashed_password,
        hashtags: result[0].hashtags,
        profile_pic: result[0].profile_pic,
        num_followers: result[0].num_followers,
        num_following: result[0].num_following,
        num_posts: result[0].num_posts,
        privacy_controls: result[0].visibility,
        linked_nconst: result[0].linked_nconst,
        bio: result[0].bio
      }
    };
    res.status(200).json(response);
  } catch (error) {
    res.status(500).json({error: 'Error querying database'});
  }
}

// GET /:username/friends
var getFriends = async function(req, res) {
  // ERROR handling
  const username = req.params.username;
  if (!username) {
    return res.status(400).send({error: 'No user found.'});
  }

  try {
    const resultFriends = await db.send_sql(
      `SELECT follower
       FROM friends
       WHERE followed = '${username}';`
    );
    
    // Prepare the response object
    const response = {
      results: {
        friends: resultFriends.map(x => x.follower)
      }
    };

    // Send the response
    return res.status(200).json(response);
  } catch (error) {
    return res.status(500).json({error: 'Error querying database'});
  }
}

var getUserData = async function(req, res) {
  // ERROR handling
  const username = req.params.username;
  if (!username) {
    return res.status(400).send({error: 'No user found.'});
  }

  try {
    const result = await db.send_sql(
      `SELECT username, profile_pic 
       FROM users
       WHERE username = '${username}';`);
    
    const response = {
      results: {
        username: result[0].username,
        profile_pic: result[0].profile_pic
      }
    };
    res.status(200).json(response);
  } catch (error) {
    res.status(500).json({error: 'Error querying database'});
  }
}

// GET /:username/posts
var getUserPosts = async function(req, res) {
  // ERROR HANDLING
  const username = req.params.username;
  try {
    // console.log('here');
    const result = await db.send_sql(
      `SELECT *
       FROM posts
       WHERE author = '${username}' AND parent_post IS NULL;`);
    // console.log('here2');
    const response = {
      results: result.map(x => ({
        post_id: x.post_id,
      }))
    };
    res.status(200).json(response);
  } catch (error) {
    res.status(500).json({error: 'Error querying database'});
  }
}

// GET /:post_id
var getPost = async function(req, res) {
  const post_id = req.params.post_id;
  try {
    const result = await db.send_sql(
      `SELECT *
       FROM posts
       WHERE post_id = '${post_id}';`);
    const comments = await db.send_sql(
      `SELECT *
       FROM posts
       WHERE parent_post = '${post_id}';`);

    if (result.length > 0 && comments.length > 0) {
      const response = {
        results: {
          post: {
            post_id: result[0].post_id,
            author: result[0].author,
            title: result[0].title,
            content: result[0].content,
            likes: result[0].likes,
            hashtags: result[0].hashtags,
            timestamp: result[0].created_at,
            post_type: result[0].post_type
          }, 
          comments: comments.map(x => ({
            author: x.author,
            content: x.content,
            post_id: x.post_id
          }))
        }
      };
      return res.status(200).json(response);
    } else if (result.length > 0) {
      const response = {
        results: {
          post: {
            post_id: result[0].post_id,
            author: result[0].author,
            title: result[0].title,
            content: result[0].content,
            likes: result[0].likes,
            hashtags: result[0].hashtags,
            timestamp: result[0].created_at,
            post_type: result[0].post_type
          }
        }
      };
      return res.status(200).json(response);
    }
    return res.status(404).json({error: 'No post found.'});
  } catch (error) {
    return res.status(500).json({error: 'Error querying database'});
  }
}

var getPosts = async function(req, res) {
  const limit = req.params.limit;
  const offset = req.params.offset;
  try {
    // const result = await db.send_sql(
    //   `SELECT * FROM posts LIMIT ${limit} OFFSET ${offset} `);
    const result = await db.send_sql(
      `SELECT * FROM posts JOIN post_rank ON posts.post_id = post_rank.post_id ORDER BY ranking DESC LIMIT ${limit} OFFSET ${offset} `);
    const response = {
      results: result.map(x => ({
        post_id: x.post_id,
      }))
    };
    res.status(200).json(response);
  } catch (error) {
    res.status(500).json({error: 'Error querying database'});
  }
}

var createPost = async function(req, res) {
  // // Logged in check
  var { username } = req.params;
  if (!username) {
    return res.status(403).json({error: "Not logged in."});
  }

  // Get title, content, parent_id, hashtags, and content_type from the request body
  const { title, content, parent_id, hashtags, content_type } = req.body;

  // Validate request parameters
  if ((content_type !== 'image' && (!content || !hashtags)) || (content_type === 'image' && (!title || !hashtags))) {
    return res.status(400).json({error: 'One or more of the required fields are empty. Please provide title, content, and content_type.'});
  }

  // Validate title and content
  if (content_type !== 'image' && (!helper.isOK(content)) || (content_type === 'image' && !helper.isOK(title))) {
    return res.status(400).json({error: "Title and content can only contain letters, numbers, spaces, and the following characters: .,?,_"});
  }

  try {
    // Insert post into posts table
    console.timeLog("trying to create post");

    async function insert_items(query, params = []) {
      result = await send_sql(query, params);
      return result.affectedRows;
  }
    const result = await db.send_sql(`
      INSERT INTO posts (parent_post, post_type, author, title, content, hashtags, likes, origin_server)
      VALUES (${parent_id}, '${content_type}', '${username}', '${title}', '${content}', '${hashtags}', 0, 'g10')
    `);
    console.log(result);
    const postId = result.insertId;

    // Create federated post object
    const federatedPost = {
      username: req.session.username,
      source_site: 'g10',
      post_uuid_within_site: postId,
      post_text: content,
      content_type: "text/html",
    };

    // Send federated post to Kafka
    await kafkaClient.sendFederatedPost(federatedPost);

    const resultPost = await db.send_sql(`
      SELECT * FROM posts WHERE post_id = '${postId}';
    `);

    var response = [];
    const ids = [resultPost[0].post_id];
    const embedding = resultPost[0].post_id + " " + resultPost[0].parent_post + " " + resultPost[0].post_type + " " + resultPost[0].author + " " + resultPost[0].title + " " + resultPost[0].content + " " + resultPost[0].hashtags + " " + resultPost[0].likes + " " + resultPost[0].created_at;
    const id = "post-" + resultPost[0].post_id;
    response.push(new Document({ pageContent: embedding, metadata: { source: id } }));

    vectorStore = await Chroma.fromDocuments(response, new OpenAIEmbeddings({
      apiKey: process.env.OPENAI_API_KEY,
      batchSize: 512,
      model: "text-embedding-3-large"
    }), ids,
    {
      collectionName: "content-collection3",
      url: "http://localhost:8000", // Optional, will default to this value

      // url: "http://172.31.48.151:8000", // Optional, will default to this value
      collectionMetadata: {
        "hnsw:space": "cosine",
      },
    });

    return res.status(201).json({message: 'Post created successfully.', post_id: postId});
  } catch (err) {
    console.error(err);
    return res.status(500).json({error: "Error creating post."});
  }
};

// GET /:username/actors
var getSimilarActors = async function(req, res) {
  const username = req.params.username;
  try {
    const result = db.send_sql(`SELECT profile_pic FROM users WHERE username = '${username}';`);

    const client = new ChromaClient();
    const chromaDbcoll = await client.getCollection({name: config.chromaDbName})
    const s3url = result[0].profile_pic.S;
    const imageID = s3url.split('/').pop().split("_")[0];
    const embeddingString = await getS3Object(config.s3BucketName, imageID);
    const embeddings = await chromaDbcoll.query({
      queryEmbeddings: JSON.parse(embeddingString),
      nResults: 5,
    });
    console.log("hello")
    const stringsArray = embeddings.documents[0].map(item => JSON.parse(item).path);

    res.json(stringsArray);
  } catch (error) {

  }
}

// POST /send-request
var postFriendRequest = async function(req, res) {
  const person = req.body.person;
  const requester = req.body.requester;

  try {
    const result = await db.send_sql(`SELECT * FROM requests WHERE person = '${person}' AND requester = '${requester}';`);
    if (result.length > 0) {
      return res.status(409).send({error: 'The friend request has already been sent.'});
    }
  } catch (error) {
    return res.status(500).json({error: 'Error querying database'});
  }
  try {
    const result = await db.send_sql(`INSERT INTO requests (person, requester) VALUES ('${person}', '${requester}');`);
    res.status(200).json({message: 'Request sent'});
  } catch (error) {
    return res.status(500).json({error: 'Error querying database'});
  }
}

var inviteToChat = async function(req, res) {
  const person = req.body.person;
  const requester = req.body.requester;

  try {
    await db.send_sql(`INSERT IGNORE INTO notifications (notified, notifier) VALUES ('${person}', '${requester}');`);
    return res.status(200).json({message: 'Invitation sent.'});
  } catch (error) {
    return res.status(500).json({error: 'Error querying database'});
  }
}

// GET /:username/:reqeuster/request-status
var getRequestStatus = async function(req, res) {
  const requester = req.params.requester;
  const username = req.params.username;
  try {
    var response = await db.send_sql(`SELECT * FROM requests WHERE person = '${username}' AND requester = '${requester}';`);
    if (response.length == 0) {
      response = await db.send_sql(`SELECT * FROM requests WHERE person = '${requester}' AND requester = '${username}';`);
      if (response.length == 0) {
        response = await db.send_sql(`SELECT * FROM friends WHERE followed = '${username}' AND follower = '${requester}';`);
        if (response.length == 0) {
          return res.status(200).json({status: 'Follow'});
        } else {
          return res.status(200).json({status: 'Following'});
        }
      }
      return res.status(200).json({status: 'Pending Request'})
      
    } else if (response.length == 1) {
      return res.status(200).json({status: 'Requested'});
    }
  } catch (error) {
    return res.status(500).json({error: 'Error querying database'});
  }
  return res.status(400).json({error: 'No status found.'});
}

// POST /delete-friend-request
var deleteFriendRequest = async function(req, res) {
  const person = req.body.person;
  const requester = req.body.requester;
  const accept = req.body.accept;
  // console.log(accept);
  
  try {
    await db.send_sql(`DELETE FROM requests WHERE person = '${person}' AND requester = '${requester}';`);
  } catch (error) {
    return res.status(500).json({error: 'Error querying database'});
  }
  if (accept) {
    try {
      var result = await db.send_sql(`SELECT * FROM users WHERE username = '${person}';`);
      db.send_sql(`UPDATE users SET num_followers = ${result[0].num_followers + 1} WHERE username = '${person}';`);
      result = await db.send_sql(`SELECT * FROM users WHERE username = '${requester}'`);
      db.send_sql(`UPDATE users SET num_followers = ${result[0].num_followers + 1} WHERE username = '${requester}';`);
      await db.send_sql(`INSERT INTO friends (follower, followed) VALUES ('${requester}', '${person}');`);
      await db.send_sql(`INSERT INTO friends (follower, followed) VALUES ('${person}', '${requester}');`);
      return res.status(200).json({'message': 'Request accepted.'});
    } catch (error) {
      return res.status(500).json({error: 'Error querying database'});
    }
    
  }
  return res.status(200).json({'message': 'Request rejected.'});
}

// POST /delete-follower
var deleteFollower = async function(req, res) {
  const person = req.body.person;
  const follower = req.body.follower;
  
  try {
    await db.send_sql(`DELETE FROM friends WHERE followed = '${person}' AND follower = '${follower}';`);
    await db.send_sql(`DELETE FROM friends WHERE followed = '${follower}' AND follower = '${person}';`);

    var result = await db.send_sql(`SELECT * FROM users WHERE username = '${person}';`);
    db.send_sql(`UPDATE users SET num_followers = '${result[0].num_followers - 1}' WHERE username = '${person}';`);

    result = await db.send_sql(`SELECT * FROM users WHERE username = '${follower}'`);
    db.send_sql(`UPDATE users SET num_followers = '${result[0].num_followers - 1}' WHERE username = '${follower}';`);
    
    return res.status(200).json({'message': 'Removed.'});
  } catch (error) {
    return res.status(500).json({error: 'Error querying database'});
  }
}

// // POST /delete-following
// var deleteFollowing = async function(req, res) {
//   const person = req.body.person;
//   const following = req.body.following;
  
//   try {
//     await db.send_sql(`DELETE FROM friends WHERE followed = '${following}' AND follower = '${person}';`);

//     var result = await db.send_sql(`SELECT * FROM users WHERE username = '${person}';`);
//     db.send_sql(`UPDATE users SET num_following = '${result[0].num_following - 1}' WHERE username = '${person}';`);
// num_following
//     result = await db.send_sql(`SELECT * FROM users WHERE username = '${following}'`);
//     db.send_sql(`UPDATE users SET num_followers = '${result[0].num_followers - 1}' WHERE username = '${follower}';`);

//     return res.status(200).json({'message': 'Removed.'});
//   } catch (error) {
//     return res.status(500).json({error: 'Error querying database'});
//   }
// }

// GET /:username/requests
var getRequests = async function(req, res) {
  const username = req.params.username;
  try {
    const result = await db.send_sql(`SELECT * FROM requests WHERE person = '${username}';`);
    // console.log(result);
    const response = {
      results: result.map(item => ({
          person: item.person,
          requester: item.requester
      }))
    };
    return res.status(200).json(response);
  } catch (error) {
    return res.status(500).json({error: 'Error querying database'});
  }
}

var postChanges = async function(req, res) {
  // const [req.body.newEmail, req.body.newPassword, req.body.newHashtags, req.body.newActor] = req.body;
  if (!req.body.newEmail && !req.body.newPassword && !req.body.newTagsString && !req.body.selectedActor) {
    return res.status(400).send({error: 'All fields are empty'});
  }
  if (!req.body.username) {
    return res.status(400).send({error: 'No username'});
  }
  try {
    if (req.body.newEmail) {
      // console.log("email");
      await db.send_sql(`UPDATE users SET email = '${req.body.newEmail}' WHERE username = '${req.body.username}';`);
      return res.status(200).json({message: 'Email changed.'});
    } else if (req.body.newPassword) {
      const encryptPasswordPromise = util.promisify(helper.encryptPassword);
      const new_hashed_password = await encryptPasswordPromise(req.body.newPassword);
      await db.send_sql(`UPDATE users SET hashed_password = '${new_hashed_password}' WHERE username = '${req.body.username}';`);
      return res.status(200).json({message: 'Password changed.'});
    } else if (req.body.newTagsString) {
      await db.send_sql(`UPDATE users SET hashtags = '${req.body.newTagsString}' WHERE username = '${req.body.username}';`);
      return res.status(200).json({message: req.body.newTagsString + ' changed.'});
    } else {
      await db.send_sql(`UPDATE users SET linked_nconst = '${req.body.selectedActor}' WHERE username = '${req.body.username}';`);
      return res.status(200).json({message: 'Actor changed.'});
    }
  } catch (error) {
    return res.status(500).json({error: 'Error querying database'});
  }
}

var postRegister = async function(req, res) {
  
  //Retrieves the body parameters
const {
    username, password, email, bio,
    hashtagList, birthday, affiliation
} = req.body;


//if one of them is empty return it
if (!username || !password || !email || !bio || !birthday || !affiliation) {
    return res.status(400).send({error: 'One or multiple fields is empty'});
}

if (!helper.isValidEmail(email)) {
  return res.status(400).json({error: 'The email you provided is invalid'});
}


if (!helper.isOK(username) || !helper.isOK(password)) {
  return res.status(400).send({error: 'Username or Password format is wrong'});
}
const hashtagArray = hashtagList.split(", ");

if (hashtagArray.length < 1) {
  return res.status(400).send({error: 'Hashtag not provided'});
}

//Checking if there exist any hashtag with more than 20 characters
const longHashtags = hashtagArray.filter(hashtag => hashtag && hashtag.length > 20);

if (longHashtags.length > 0) {
  return res.status(400).send({error: 'One or more hashtags exceed 20 characters'});
}

//Checking if the bio is more than 255
if (bio.length > 255) {
  return res.status(400).send({error: 'Bio has length more than 255 characters'});
}

const firstHashtagList = "[" + hashtagList + "]";

//Checking if the username already exists
try {
    const usernameInDb = await db.send_sql(`SELECT * FROM users WHERE username = '${username}'`);
    if (usernameInDb.length > 0) {
        return res.status(409).send({error: 'An account with this username already exists, please try again.'});
    }
} catch (err) {
    console.error(err);
    return res.status(500).json({error: 'Error querying database FIRST.'});
}

//Checking if the linked actor is valid

//for testing
//const act = await getFiveSimilarActorsOnSignUp();
//console.log(act);
//const actors = "[nm0000122,nm0000252,nm0000406,nm0000428,nm0000590]";

//uploading the user image to s3 bucket

const url = `https://imdb-users-profile-pics.s3.amazonaws.com/${username}`;
const actors = await compareImages();

//Salting the password and uploading data to the database
try {
    const encryptPasswordPromise = util.promisify(helper.encryptPassword);

    const hashed_password = await encryptPasswordPromise(password);
    try {
        await db.send_sql(`INSERT INTO users (username, birthday, hashed_password, email, hashtags, profile_pic, num_followers, num_following, num_posts, linked_nconst, bio, related_actors, affiliation, visibility) VALUES ('${username}', '${birthday}', '${hashed_password}', '${email}', '${firstHashtagList}', '${url}', ${0}, ${0}, ${0}, ${null}, '${bio}', '${actors}', '${affiliation}', 'NA')`);
        res.status(200).json({message: username});
    } catch (err) {
        console.error(err);
        return res.status(500).json({error: 'Error querying database.'});
    }

} catch (err) {
    console.error(err);
    return res.status(500).send({error: 'Error encrypting password.'});
}


};

  var postLogin = async function(req, res) {
      // TODO: check username and password and login
      const { username, password } = req.body;

      if (!username || !password) {
          return res.status(401).send({message: 'One or more of the fields you entered was empty, please try again.'});
      }
  
      try {
          // retrieve user from database
          const result = await db.send_sql(`SELECT * FROM users WHERE username = '${username}';`);
          if (result.length === 0) {
              // User not found
              res.status(500).send({error: "Error querying database."});
          }
          
          const user = result[0];
          hash = user.hashed_password;
  
          try {
              // Using the compare function of bcrypt with async/await
              const match = await bcrypt.compare(password, hash);
              if (match) {
                      // Store user ID in session
                  req.session.user_id = user.user_id;
                  // Passwords match
                  return res.status(200).send({ username });
              } else {
                  // Passwords do not match
                  return res.status(401).send({ error: "Username and/or password are invalid." });
              }
          } catch (err) {
              console.error(err);
              return res.status(500).json({ error: "Internal server error." });
          }
           
      } catch (err) {
          console.error(err);
          return res.status(500).json({error: "Error querying database."});
      }
  
  };
  

var postForgotPassword = async function (req, res) {
  const { username } = req.body;

  if (!username) {
    return res.status(400).send({ message: "Username is required." });
  }

  try {
    // Retrieve user from the database based on the username
    const result = await db.send_sql(`SELECT * FROM users WHERE username = "${username}"`);

    if (result.length === 0) {
      // User not found
      return res.status(500).send({ error: "User not found." });
    }

    const user = result[0];

    // Generate a unique password reset token
    const resetToken = generateResetToken(); // Implement this function to generate a unique token

    // Store the reset token and expiration timestamp in the password_resets table
    await db.send_sql(`INSERT INTO password_resets (user_forgot, reset_token, expires_at) VALUES ('${user.username}', '${resetToken}', DATE_ADD(NOW(), INTERVAL 1 HOUR))`);

    // Send password reset email to the user's email address
    await sendPasswordResetEmail(user.email, resetToken); // Implement this function to send the email

    return res.status(200).send({ message: "Password reset email sent." });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Error processing forgot password request." });
  }
};

var postResetPassword = async function (req, res) {
  const { newPassword } = req.body;
  const { token } = req.query;

  if (!token) {
    return res.status(400).send({ message: "Reset token is required." });
  }

  if (!newPassword) {
    return res.status(400).send({ message: "New password is required." });
  }

  try {
    // Retrieve the password reset record from the database
    const result = await db.send_sql(`SELECT * FROM password_resets WHERE reset_token = '${token}' AND expires_at > NOW()`);

    if (result.length === 0) {
      // Invalid or expired token
      return res.status(400).send({ error: "Invalid or expired reset token." });
    }

    const resetRecord = result[0];

    // Retrieve the user from the database based on the username
    const userResult = await db.send_sql(`SELECT * FROM users WHERE username = '${resetRecord.user_forgot}'`);
    console.log(userResult);
    if (userResult.length === 0) {
      // User not found
      return res.status(404).send({ error: "User not found." });
    }

    const user = userResult[0];

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update the user's password in the database
    await db.send_sql(`UPDATE users SET hashed_password = '${hashedPassword}' WHERE username = '${user.username}'`);

    // Delete the password reset record from the database
    await db.send_sql(`DELETE FROM password_resets WHERE reset_token = '${token}'`);

    return res.status(200).send({ message: "Password reset successfully." });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Error processing reset password request." });
  }
};


var getFiveActors = async function (req, res) {
  const username = req.params.username;
  if (!username) {
    return res.status(400).json({error: "Username is required"});
  }

  try {
    const actorResults = await db.send_sql(`SELECT related_actors FROM users WHERE username = '${username}'`);
    if (actorResults.length === 0) {
      return res.status(404).json({error: 'No account exists with the provided username.'});
    }

    const resultingActors = actorResults[0].related_actors.replace(/^\[|\]$/g, '').split(',').map(item => item.trim());
    if (!resultingActors || resultingActors.length < 5) {
      return res.status(400).json({error: 'Not enough related actors found.'});
    }

    const result = await db.send_sql(`SELECT * FROM names WHERE nconst IN ('${resultingActors[0]}', '${resultingActors[1]}', '${resultingActors[2]}', '${resultingActors[3]}', '${resultingActors[4]}')`);

    if (result.length === 0) {
        return res.status(404).json({error: 'No actors found for the provided identifiers.'});
    }

    const response = result.map(r => ({ nconst: r.nconst, primaryName: r.primaryName }));
    return res.status(200).json(response);
  } catch (err) {
    console.error('Database error:', err);
    return res.status(500).json({error: 'Internal server error during database query.'});
  }
};



var postUserActorPreference = async function (req, res) {
  const {username, nconst} = req.params;
  console.log(nconst);
  console.log(username);

  try {
    const results = await db.send_sql(`SELECT * FROM users WHERE username = '${username}'`);
    if (results === 0) {
      res.status(400).json({error: "No such user existing"});
      
    }
    console.log("reached here");
    
    db.send_sql(`UPDATE users SET linked_nconst = '${nconst}' WHERE username = '${username}'`);
    return res.status(200).json({username: username});
  } catch (error) {
    res.status(500).json({error: "Error querying the database."})
  }
}

var dropUser = async function (req, res) {
  const { username } = req.body;

  if (!username) {
    res.status(400).json({error: "No username inputted"});
  }

  try {
    const result = await db.send_sql(`SELECT * FROM users WHERE username = '${username}'`);
    if (result === 0) {
      res.status(409).json({error: "No such user existing"});
    }
    await db.send_sql(`DELETE FROM users WHERE username='${username}'`);
    res.status(200).json({message: "User deleted"});

  } catch (error) {
    res.status(500).json({error: "Error querying the database."});
  }
}

var updatePostLink = async function (req, res) {
  const { post_id } = req.params;

  try {
    await db.send_sql(`UPDATE posts SET content = 'https://instalite-posts-g10.s3.amazonaws.com/${post_id}' WHERE post_id = '${post_id}'`);
    res.status(200).json({message: "Post updated"});
  } catch (error) {
    res.status(500).json({error: "Error querying the database."});
  }
}
var updateLikes = async function (req, res) {
  const { post_id, username } = req.params;
  const { liked } = req.body;

  try {
    if (liked) {
      await db.send_sql(`INSERT INTO post_likes (post_id, username) VALUES ('${post_id}', '${username}')`);  
    } else {
      await db.send_sql(`DELETE FROM post_likes WHERE post_id = '${post_id}' AND username = '${username}'`);
    }

    const result = await db.send_sql(`SELECT COUNT(*) AS likeCount FROM post_likes WHERE post_id = '${post_id}'`);
    const likeCount = result[0].likeCount;
    await db.send_sql(`UPDATE posts SET likes = '${likeCount}' WHERE post_id = '${post_id}'`);
    res.status(200).json({ message: "Likes updated", likes: likeCount });
  } catch (error) {
    console.error('Error updating likes:', error);
    res.status(500).json({ error: "Error querying the database." });
  }
}

var getLiked = async function (req, res) {
  const { post_id, username } = req.params;

  try {
    const result = await db.send_sql(`SELECT * FROM post_likes WHERE post_id = '${post_id}' AND username = '${username}'`);
    if (result.length > 0) {
      res.status(200).json({message: "Liked"});
    } else {
      res.status(201).json({message: "Not liked"});
    }
  } catch (error) {
    res.status(500).json({error: "Error querying the database."});
  }
}

var getHashtagPosts = async function (req, res) {
  const { hashtag } = req.params;

  try {
    const result = await db.send_sql(`SELECT * FROM posts WHERE hashtags LIKE '%${hashtag}%'`);
    if (result.length === 0) {
      return res.status(404).json({error: "No posts found with the hashtag."});
    }
    result.sort((a, b) => a.created_at - b.created_at);
    return res.status(200).json({posts: result});
  } catch (error) {
    return res.status(500).json({error: "Error querying the database."});
  }
}

var deletePost = async function (req, res) {
  const { post_id } = req.params;
  try {
    await db.send_sql(`DELETE FROM posts WHERE post_id = '${post_id}'`);
    res.status(200).json({message: "Post deleted"});
  } catch (error) {
    res.status(500).json({error: "Error querying the database."});
  }
}

var setOnline = async function (req, res) {
  const { username } = req.params;

  try {
    await db.send_sql(`INSERT INTO online_users (username) VALUES ('${username}')`);
    res.status(200).json({message: "User is online"});
  } catch (error) {
    res.status(500).json({error: "Error querying the database."});
  }
}

var setOffline = async function (req, res) {
  const { username } = req.params;

  try {
    await db.send_sql(`DELETE FROM online_users WHERE username = '${username}'`);
    res.status(200).json({message: "User is offline"});
  } catch (error) {
    res.status(500).json({error: "Error querying the database."});
  }
}

var acceptChatInvite = async function (req, res) {
  const { invitee, inviter } = req.params;
  var members = "," + invitee + "," + inviter;

  try {
    // if notifier contains :, split it and add the new group chat id to the end
    if (!inviter.includes(":")) {
      await db.send_sql(`INSERT INTO group_chats (members) VALUES ('${members}')`);
      await db.send_sql(`DELETE FROM notifications WHERE notified = '${invitee}' AND notifier = '${inviter}'`);
    } else {
      var groupChatId = inviter.split(":")[1];
      await db.send_sql(`DELETE FROM notifications WHERE notified = '${invitee}' AND notifier = '${inviter}'`);
      var result = await db.send_sql(`SELECT members FROM group_chats WHERE group_id = '${groupChatId}'`);
      var newMembers = result[0].members + "," + invitee;
      await db.send_sql(`UPDATE group_chats SET members = '${newMembers}' WHERE group_id = '${groupChatId}'`);
    }
    res.status(200).json({message: "Chat created"});
  } catch (error) {
    res.status(500).json({error: "Error querying the database."});
  }
}

var rejectChatInvite = async function (req, res) {
  const { invitee, inviter } = req.params;

  try {
    await db.send_sql(`DELETE FROM notifications WHERE notified = '${invitee}' AND notifier = '${inviter}'`);
    res.status(200).json({message: "Chat invite rejected"});
  } catch (error) {
    res.status(500).json({error: "Error querying the database."});
  }
}

var getNotifications = async function (req, res) {
  const { username } = req.params;

  try {
    const result = await db.send_sql(`SELECT * FROM notifications WHERE notified = '${username}'`);
    if (result.length === 0) {
      return res.status(201).json({message: "No notifications found."});
    }

    const notifications = result.map(x => x.notifier);
    return res.status(200).json({notifications: notifications});
  } catch (error) {
    res.status(500).json({error: "Error querying the database."});
  }
}

var commentOnPost = async function (req, res) {
  var { username, on_post } = req.params;
  if (!username) {
    return res.status(403).json({error: "Not logged in."});
  }

  const { content } = req.body;

  // Validate request parameters
  if (!content) {
    return res.status(400).json({error: 'Content is empty.'});
  }

  // Validate title and content
  if ((!helper.isOK(content))) {
    return res.status(400).json({error: "Content can only contain letters, numbers, spaces, and the following characters: .,?,_"});
  }

  try {
    console.log(on_post + " " + content + " " + username)
    const result = await db.send_sql(`
      INSERT INTO posts (parent_post, post_type, author, title, content, hashtags, likes, origin_server)
      VALUES (${on_post}, 'text', '${username}', '', '${content}', '', 0, 'g10')
    `);
    
    return res.status(201).json({message: 'Comment created successfully.'});
  } catch (err) {
    console.error(err);
    return res.status(500).json({error: "Error creating comment."});
  }
};

var postFriendsOfFriends = async function (req, res) {
  const username = req.params.username;
  if (!username) {
    return res.status(400).json({error: "Username is required"});
  }

  try {
    const friends = await db.send_sql(`SELECT followed FROM friends WHERE follower = "${username}"`);
    if (friends.length === 0) {
      return res.status(200).json([]);
    }

    var recommendations = [];
    for (let friend of friends) {
      const friendsOfFriends = await db.send_sql(`SELECT followed FROM friends WHERE follower = "${friend.followed}" AND followed <> "${username}"`);
      for (let rec of friendsOfFriends) {
        if (!recommendations.includes(rec.followed)) {
          recommendations.push(rec.followed);
        }
      }
    }
    return res.status(200).json(recommendations);
    
  } catch (err) {
    console.error('Database error:', err);
    return res.status(500).json({error: 'Internal server error during database query.'});
  }
}



var getVectorStore = async function(req) {
  if (vectorStore == null) {
      vectorStore = await Chroma.fromExistingCollection(new OpenAIEmbeddings({
        apiKey: process.env.OPENAI_API_KEY,
        batchSize: 512,
        model: "text-embedding-3-small"
      }), {
          collectionName: "content-collection3",
          url: "http://localhost:8000", // Optional, will default to this value

          // url: "http://172.31.48.151:8000", // Optional, will default to this value
          });
  }
  return vectorStore;
}

var search = async function (req, res) {
  if (!req.body.question) {
    res.status(400).json({error: "No question entered"});
  }
  const vs = await getVectorStore();

  const results = await vs.similaritySearch(req.body.question, 10);
  console.log(results);
  const response = {
    results: results.map(x => ({
      id: x.metadata.source
    }))
  }
  return res.status(200).json(response);


  // const retriever = vs.asRetriever();

  // const prompt = PromptTemplate.fromTemplate(`This is the context: {context}. This is the question to answer based on the context: {question}.`);
  // const llm = new ChatOpenAI({ temperature: 0, model: 'gpt-3.5-turbo' }); // TODO: replace with your language model

  // const ragChain = RunnableSequence.from([
  //   {
  //     context: retriever.pipe(formatDocumentsAsString),
  //     question: new RunnablePassthrough(),
  //   },
  //   prompt,
  //   llm,
  //   new StringOutputParser(),
  // ]);

  // console.log(req.body.question);
  // console.log("UPDATED MODEL")

  // console.log();
  // result = await ragChain.invoke(req.body.question);
  // console.log(result);
  // res.status(200).json({message: result});
}



var postTrending = async function (req, res) {
  try {
    const hashtags = await db.send_sql(`SELECT hashtag FROM hashtag_rank ORDER BY ranking DESC LIMIT 3`);

    if (hashtags.length === 0) {
      return res.status(404).json({error: "No hashtags found."});
    }

    const post_ids = [];
    for (let hashtag of hashtags) {
      
      const posts = await db.send_sql(`SELECT post_id FROM posts WHERE hashtags LIKE '%${hashtag.hashtag}%' ORDER BY likes DESC LIMIT 3`);
      if (posts.length === 0) {
        continue;  
      }
      for (let post of posts) {
        
        post_ids.push(post.post_id);
      }
    }

    if (post_ids.length === 0) {
      return res.status(404).json({error: "No posts found for top hashtags."}); 
    }

    
    res.status(200).json(post_ids);
  } catch (err) {
    console.error('Database error:', err);
    return res.status(500).json({error: 'Internal server error during database query.'});
  }
}


var getOnline = async function (req, res) {
  const { username } = req.params;

  try {
    const result = await db.send_sql(`SELECT * FROM online_users WHERE username = '${username}'`);
    
    if (result.length === 0) {
      return res.status(200).json({message: "User is offline"});
    }
    return res.status(201).json({message: "User is online"});
  } catch (error) {
    return res.status(500).json({error: "Error querying database"});
  }
}

var routes = {
    get_helloworld: getHelloWorld,
    get_profile: getProfile,
    get_userdata: getUserData,
    get_friends: getFriends,
    post_signup: postRegister,
    get_user_posts: getUserPosts,
    get_post: getPost,
    get_posts: getPosts,
    post_forgot_password: postForgotPassword,
    post_reset_password: postResetPassword,
    post_login: postLogin,
    delete_friend_request: deleteFriendRequest,
    delete_follower: deleteFollower,
    // delete_following: deleteFollowing,
    get_requests: getRequests,
    post_user_actor_preference: postUserActorPreference,
    get_five_actors: getFiveActors,
    get_request_status: getRequestStatus,
    post_request: postFriendRequest,
    post_changes: postChanges,
    update_post_link: updatePostLink,
    update_likes: updateLikes,
    get_liked: getLiked,
    get_hashtag_posts: getHashtagPosts,
    create_post: createPost,
    post_drop_user: dropUser,
    delete_post: deletePost,
    set_online: setOnline,
    set_offline: setOffline,
    accept_chat_invite: acceptChatInvite,
    reject_chat_invite: rejectChatInvite,
    get_notifications: getNotifications,
    invite_to_chat: inviteToChat,
    comment_on_post: commentOnPost,
    get_online: getOnline,
    upload,
    uploadToFirstS3,
    compareImages,
    postFriendsOfFriends: postFriendsOfFriends,
    post_search: search,
    postTrending: postTrending
};


module.exports = routes;
