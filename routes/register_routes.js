const routes = require('./routes.js');
// const configJava = require('/home/ubuntu/project-kala/routes/Config.json');
const configJava = require('../routes/Config.json');

module.exports = {
    register_routes
}

function register_routes(app) {
    app.get('/hello', routes.get_helloworld);
    app.post('/login', routes.post_login);
    app.post('/signup', routes.post_signup);
    app.post("/saveimage/:username", routes.upload.single("image"), async (req, res) => {
        if (!req.file) {
            return res.status(400).send('No file uploaded.');
        }
        const username = req.params.username;
        await routes.uploadToFirstS3(username, configJava.S3_BUCKET_NAME_USERS);        
        //await routes.compareImages();
        return res.status(200).json({message: req.body.username});
    });
    app.post("/savepost/:post_id", routes.upload.single("image"), async (req, res) => {
        if (!req.file) {
            return res.status(400).send('No file uploaded.');
        }
        const post_id = req.params.post_id;
        await routes.uploadToFirstS3(post_id, configJava.S3_BUCKET_POSTS);        
        //await routes.compareImages();
        return res.status(200).json({message: req.body.post_id});
    });
    app.post('/dropUser', routes.post_drop_user);
    app.post('/updatePostLink/:post_id', routes.update_post_link);
    app.post('/deleteInvalidPost/:post_id', routes.delete_post);
    app.post('/forgot-password', routes.post_forgot_password);
    app.post('/reset-password', routes.post_reset_password);
    app.get('/:username/profile', routes.get_profile);
    app.get('/:username/userdata', routes.get_userdata);
    app.get('/:username/friends', routes.get_friends);
    app.post('/setonline/:username', routes.set_online);
    app.post('/setoffline/:username', routes.set_offline);
    app.get('/notifications/:username', routes.get_notifications);
    app.post('/accept-chat-invite/:invitee/:inviter', routes.accept_chat_invite);
    app.post('/reject-chat-invite/:invitee/:inviter', routes.reject_chat_invite);
    app.get('/:username/posts', routes.get_user_posts);
    app.get('/p/:post_id', routes.get_post);
    app.get('/feed/:limit/:offset', routes.get_posts);
    app.post('/p/:post_id/updateLikes/:username', routes.update_likes);
    app.get('/p/:post_id/liked/:username', routes.get_liked);
    app.get('/h/:hashtag/', routes.get_hashtag_posts);
    app.post('/delete-friend-request', routes.delete_friend_request);
    app.post('/delete-follower', routes.delete_follower);
    // app.post('/delete-following', routes.delete_following);
    app.get('/:username/requests', routes.get_requests);
    app.get('/:username/:requester/request-status', routes.get_request_status);
    app.post('/send-request', routes.post_request);
    app.post('/invite-to-chat', routes.invite_to_chat);
    app.get('/:username/actors', routes.get_five_actors);
    app.post('/userActorPreference/:username/:nconst', routes.post_user_actor_preference);
    app.post('/confirm-changes', routes.post_changes);
    app.post('/:username/createPost', routes.create_post); 
    app.post('/search', routes.post_search);
    app.post('/:username/addComment/:on_post/', routes.comment_on_post);
    app.post('/friendsOfFriends/:username', routes.postFriendsOfFriends);
    app.post('/trending', routes.postTrending);
    
    app.get('/getonline/:username', routes.get_online);
}