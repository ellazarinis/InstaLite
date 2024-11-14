const express = require('express');
const { Kafka, CompressionTypes, CompressionCodecs, Partitioners } = require('kafkajs');
const SnappyCodec = require('kafkajs-snappy');
var config = require('./config.json');

const db = require('../models/db_access.js');

CompressionCodecs[CompressionTypes.Snappy] = SnappyCodec;

const app = express();
const kafka = new Kafka({
    clientId: 'my-app',
    brokers: config.bootstrapServers
});


const consumer = kafka.consumer({ groupId: config.groupId });
const producer = kafka.producer({ createPartitioner: Partitioners.LegacyPartitioner });

// const federatedPosts = [];
// const tweets = [];

const processFederatedPost = async (message) => {
    console.log('Received message value:', message.value.toString());

    let post;
    if (message.value.toString() === '[object Object]') {
        // message value is wird Javascript object
        //post = message.value;
    } else {
        try {
            post = JSON.parse(message.value.toString());
        } catch (error) {
            console.error('Error parsing JSON:', error);
            console.error('Received message value:', message.value.toString());
            return; // skip if parsing fails
        }
    }
    
    const { username, source_site, post_uuid_within_site, post_text, content_type } = post;
    
    if (source_site === "g10"){
        return; // skip posts from our own site
    }
    const externalUserId = `${source_site}:${username}`;
  
    try {

    // Check if the external user exists in the users table
    const userResult = await db.send_sql(`SELECT * FROM users WHERE username = '${externalUserId}'`);

    if (userResult.length === 0) {
      // External user doesn't exist, create a new user
      await db.send_sql(`
        INSERT INTO users (username, email, hashed_password, hashtags, profile_pic, num_followers, num_following, num_posts, linked_nconst, bio, related_actors, affiliation, visibility)
        VALUES ('${externalUserId}', '', '', NULL, '', 0, 0, 0, NULL, '', '', '', '')
      `);
      console.log('External user created:', externalUserId);
    }
    // await db.insert_items(`
    //   INSERT INTO posts (author, content, origin_server, post_type)
    //   VALUES ( ? , ? , ? , 'html')
    // `, [externalUserId, post_text, source_site]);
      await db.send_sql(
        `INSERT INTO posts (author, content, origin_server, post_type)
         VALUES ('${externalUserId}', '${post_text}', '${source_site}', 'html')`
      );
      console.log('Federated post stored successfully');
    } catch (error) {
      console.error('Error storing federated post:', error);
    }
  };

  

const processTweet = async (message) => {
    console.log('Received message value:', message.value);
    let tweet;
    try {
        tweet = JSON.parse(message.value.toString());
    } catch (error) {
        console.error('Error parsing tweet JSON:', error);
        console.error('Received message value:', message.value.toString());
        return; // skip if parsing fails
    }
    

    const { id, author_id, text, hashtags} = tweet;

    const sanitizedText = text.replace(/'/g, ''); // Remove all single quotes from the tweet text

    // const formattedHashtags = hashtags.map(hashtag => `#${hashtag}`).join(', ');

    const tweetHashtags = sanitizedText.match(/#\w+/g) || []; // Extract hashtags from the tweet text

    const formattedHashtags = [...new Set([...hashtags, ...tweetHashtags])].map(hashtag => `#${hashtag}`).join(', ');
    const twitterUserId = `twitter:${author_id}`;
  
    try {
        // Check if the external user exists in the users table
        const userResult = await db.send_sql(`SELECT * FROM users WHERE username = '${twitterUserId}'`);

        if (userResult.length === 0) {
            // External user doesn't exist, create a new user
            await db.send_sql(`
            INSERT INTO users (username, email, hashed_password, hashtags, profile_pic, num_followers, num_following, num_posts, linked_nconst, bio, related_actors, affiliation, visibility)
            VALUES ('${twitterUserId}', '', '', '${formattedHashtags}', '', 0, 0, 0, NULL, '', '', '', '')
            `);
            console.log('External user created:', externalUserId);
        }
      await db.send_sql(
        `INSERT INTO posts (author, content, origin_server, post_type)
         VALUES ('${twitterUserId}', '${sanitizedText}', 'twitter', 'html')`,
      );
      console.log('Tweet stored successfully');
    } catch (error) {
      console.error('Error storing tweet:', error);
    }
  };

const sendFederatedPost = async (post) => {
    await producer.connect();
    await producer.send({
      topic: "FederatedPosts",
      messages: [{ value: JSON.stringify(post) }],
    });
    console.log('Federated post sent');
    await producer.disconnect();
  };

// app.get('/', (req, res) => {
//     res.send(JSON.stringify(kafka_messages));
// });

const run = async () => {
    await consumer.connect();
  
    await consumer.subscribe({ topic: "FederatedPosts", fromBeginning: true });
    await consumer.subscribe({ topic: "Twitter-Kafka", fromBeginning: true });
  
    await consumer.run({
      eachMessage: async ({ topic, message }) => {
        if (topic === "FederatedPosts") {
            console.log("federated post received");
          await processFederatedPost(message);
        } else if (topic === "Twitter-Kafka") {
            console.log("tweet received");
          await processTweet(message);
        }
      },
    });
  };

run().catch(console.error);

module.exports = {
    sendFederatedPost,
  };