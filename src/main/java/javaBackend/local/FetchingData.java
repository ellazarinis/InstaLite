package javaBackend.local;

import java.io.File;
import java.io.IOException;
import java.io.PrintWriter;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.SQLException;
import java.sql.Statement;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.util.*;

import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
import org.apache.spark.api.java.JavaPairRDD;
import org.apache.spark.api.java.JavaSparkContext;
import org.apache.spark.sql.SparkSession;

import javaBackend.Config.Config;
import javaBackend.engine.SparkConnector;
import scala.Tuple2;

public class FetchingData {
    static Logger logger = LogManager.getLogger(FetchingData.class);

    /**
     * Connection to Apache Spark
     */
    SparkSession spark;
    JavaSparkContext context;

    public void FriendsOfFriendsSpark() {
        System.setProperty("file.encoding", "UTF-8");
    }

    /**
     * Initialize the database connection.
     *
     * @throws InterruptedException User presses Ctrl-C
     */
    public void initialize() throws InterruptedException {
        logger.info("Connecting to Spark...");

        spark = SparkConnector.getSparkConnection();
        context = SparkConnector.getSparkContext();

        logger.debug("Connected!");
    }

    /**
     * Fetch the social network from mysql using a JDBC connection, and create a (followed, follower) edge graph
     *
     * @return JavaPairRDD: (followed: String, follower: String) The social network
     */
    public JavaPairRDD<String, String> getSocialNetwork() {
        try {
            logger.info("Connecting to database...");
            Connection connection = null;

            try {
                connection = DriverManager.getConnection(Config.DATABASE_CONNECTION, Config.DATABASE_USERNAME,
                        Config.DATABASE_PASSWORD);
            } catch (SQLException e) {
                logger.error("Connection to database failed: " + e.getMessage(), e);
                logger.error("Please make sure the RDS server is correct, the tunnel is enabled, and you have run the mysql command to create the database.");
                System.exit(1);
            }

            if (connection == null) {
                logger.error("Failed to make connection - Connection is null");
                System.exit(1);
            }

            logger.info("Successfully connected to database!");
            // TODO: After connecting successfully, use SQL queries to get the first 10000
            //  rows of the friends table you created when sorting the `followed` column in
            //  ASC order. Then parallelize the data you get and return a JavaPairRDD object.
            Statement stmt = connection.createStatement();
            String sql = "SELECT followed, follower FROM friends";
            ResultSet resultSet = stmt.executeQuery(sql);
            List<Tuple2<String, String>> edgesList = new ArrayList<>();
            while (resultSet.next()) {
                Tuple2<String, String> edges = new Tuple2<>("u" + resultSet.getString("followed").toLowerCase(), "u" + resultSet.getString("follower").toLowerCase());
                if (!edgesList.contains(edges)) {
                    edgesList.add(edges);
                }
            }

            stmt = connection.createStatement();
            sql = "SELECT author, post_id, hashtags FROM posts WHERE parent_post IS NULL";
            resultSet = stmt.executeQuery(sql);
            while (resultSet.next()) {
                System.out.println("reached Here 2");
                String username = "u" + resultSet.getString("author").toLowerCase();
                String post_id = "p" + resultSet.getString("post_id").toLowerCase();
                Tuple2<String, String> edges = new Tuple2<>(username, post_id);
                if (!edgesList.contains(edges)) {
                    edgesList.add(edges);
                }
                edges = new Tuple2<>(post_id, username);
                if (!edgesList.contains(edges)) {
                    edgesList.add(edges);
                }
                if (resultSet.getString("hashtags") != null) {
                    String[] hashtags = resultSet.getString("hashtags").substring(1, resultSet.getString("hashtags").length() - 1).split("\\s*,\\s*");
                    for (int i = 0; i < hashtags.length; i++) {
                        String hashtag = "h" + hashtags[i].toLowerCase();
                        edges = new Tuple2<>(username, hashtag);
                        if (!edgesList.contains(edges)) {
                            edgesList.add(edges);
                        }
                        edges = new Tuple2<>(post_id, hashtag);
                        if (!edgesList.contains(edges)) {
                            edgesList.add(edges);
                        }
                        edges = new Tuple2<>(hashtag, post_id);
                        if (!edgesList.contains(edges)) {
                            edgesList.add(edges);
                        }
                        edges = new Tuple2<>(hashtag, username);
                        if (!edgesList.contains(edges)) {
                            edgesList.add(edges);
                        }

                    }
                }
                

            }

            System.out.println("reached 2");
            stmt = connection.createStatement();
            sql = "SELECT username, hashtags FROM users";
            resultSet = stmt.executeQuery(sql);
            while (resultSet.next()) {
                String username = "u" + resultSet.getString("username").toLowerCase();
                if (resultSet.getString("hashtags") != null) {
                    String[] hashtags = resultSet.getString("hashtags").substring(1, resultSet.getString("hashtags").length() - 1).split("\\s*,\\s*");
                    for (int i = 0; i < hashtags.length; i++) {
                        String hashtag = "h" + hashtags[i].toLowerCase();
                        Tuple2<String, String> edges = new Tuple2<>(username, hashtag);
                        if (!edgesList.contains(edges)) {
                            edgesList.add(edges);
                        }
                        edges = new Tuple2<>(hashtag, username);
                        if (!edgesList.contains(edges)) {
                            edgesList.add(edges);
                        }
                    }
                }
                
            }

        
            System.out.println(edgesList);

            return context.parallelizePairs(edgesList);
            


        } catch (Exception e) {
            logger.error("SQL error occurred: " + e.getMessage(), e);
        }
        // Return a default value if the method cannot return a valid result
        return context.emptyRDD().mapToPair(x -> new Tuple2<>("", ""));
    }

     /**
     * Send recommendation results back to the database
     *
     * @param recommendations List: (followed: String, follower: String)
     *                        The list of recommendations to send back to the database
     */
    public void sendResultsToDatabase(List<MyPair<String, Double>> ranks) {
        try (Connection connection = DriverManager.getConnection(Config.DATABASE_CONNECTION, Config.DATABASE_USERNAME,
                Config.DATABASE_PASSWORD)) {
            // TODO: Write your recommendations data back to imdbdatabase.

            String insertSql = ""; 
            Statement stmt = connection.createStatement();
            insertSql = "DELETE FROM user_rank";
            stmt.executeUpdate(insertSql);
            insertSql = "DELETE FROM post_rank";
            stmt.executeUpdate(insertSql);
            insertSql = "DELETE FROM hashtag_rank";
            stmt.executeUpdate(insertSql);

            for (MyPair<String, Double> rank : ranks) {
                System.out.println(rank.toString());
                String key = rank.getLeft();
                Double value = rank.getRight();
                if (key.charAt(0) == 'u') {
                    String username = key.substring(1, key.length());
                    insertSql = "INSERT INTO user_rank (username, ranking) VALUES ('" + username + "','" + value +"')";
                    stmt.executeUpdate(insertSql);

                } else if (key.charAt(0) == 'p') {
                    String post_id = key.substring(1, key.length());
                    insertSql = "INSERT INTO post_rank (post_id, ranking) VALUES ('" + post_id + "','" + value +"')";
                    stmt.executeUpdate(insertSql);

                } else if (key.charAt(0) == 'h') {
                    String hashtag = key.substring(1, key.length());
                    insertSql = "INSERT INTO hashtag_rank (hashtag, ranking) VALUES ('" + hashtag + "','" + value +"')";
                    stmt.executeUpdate(insertSql);
                }
                
            }
            

        } catch (SQLException e) {
            logger.error("Error sending recommendations to database: " + e.getMessage(), e);
        }
    }


}