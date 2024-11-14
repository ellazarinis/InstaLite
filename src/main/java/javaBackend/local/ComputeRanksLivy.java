package javaBackend.local;

import java.io.File;
import java.io.FileOutputStream;
import java.io.FileWriter;
import java.io.IOException;
import java.io.PrintStream;
import java.net.URISyntaxException;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.concurrent.ExecutionException;
import java.util.stream.Collectors;

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

import javaBackend.Config.Config;
//import javaBackend.SparkJob;
import javaBackend.local.FetchingData;
import javaBackend.local.SocialRankJob;
//import edu.upenn.cis.nets2120.javaBackend.ComputeRanks;
import scala.Tuple2;

/**
 * The `ComputeRanksLivy` class is responsible for running a social network ranking job using Apache Livy.
 * It takes command line arguments to configure the job parameters and performs the following tasks:
 * 1. Runs a SocialRankJob with backlinks set to true and writes the output to a file named "socialrank-livy-backlinks.csv".
 * 2. Runs a SocialRankJob with backlinks set to false and writes the output to a file named "socialrank-livy-nobacklinks.csv".
 * 3. Compares the top-10 results from both runs and writes the comparison to a file named "socialrank-livy-results.txt".
 * <p>
 * The class uses the Apache Livy library to submit and execute the jobs on a Livy server.
 * It also uses the SparkJob class to run the SocialRankJob and obtain the results.
 * <p>
 * To run the job, the `LIVY_HOST` environment variable must be set. If not set, the program will exit with an error message.
 */
public class ComputeRanksLivy {
    static Logger logger = LogManager.getLogger(ComputeRanksLivy.class);

    public static void main(String[] args)
            throws IOException, URISyntaxException, InterruptedException, ExecutionException {
        boolean debug;

        double d_max;
        int i_max;

        // Check so we'll fatally exit if the environment isn't set
        if (System.getenv("AWS_ACCESS_KEY_ID") == null) {
            logger.error("AWS_ACCESS_KEY_ID not set -- update your .env and run source .env");
            System.exit(-1);
        }

        // Process command line arguments if given
        if (args.length == 1) {
            d_max = Double.parseDouble(args[0]);
            i_max = 25;
            debug = false;
        } else if (args.length == 2) {
            d_max = Double.parseDouble(args[0]);
            i_max = Integer.parseInt(args[1]);
            debug = false;
        } else if (args.length == 3) {
            d_max = Double.parseDouble(args[0]);
            i_max = Integer.parseInt(args[1]);
            debug = true;
        } else {
            d_max = 30;
            i_max = 25;
            debug = false;
        }


        // Below is a call to Apache Livy to run a SocialRankJob with backlinks = false.
        // This part is already done for you.
        SocialRankJob blJob = new SocialRankJob(d_max, i_max, 1000, true, false);
        List<MyPair<String, Double>> backlinksResult = blJob.mainLogic();
        System.out.println(backlinksResult.toString());
        FetchingData fetchData = new FetchingData();

        fetchData.sendResultsToDatabase(backlinksResult);



        // System.out.println("With backlinks: " + backlinksResult);
        // try (PrintStream out = new PrintStream(new FileOutputStream("usersRanked.csv"))) {
        //     for (MyPair<String, Double> item : backlinksResult) {
        //         if (item.getLeft().charAt(0) == 'u') {
        //             out.println(item.getLeft().substring(1, item.getLeft().length() - 1) + "," + item.getRight());
        //         }
        //     }
        // } catch (Exception e) {
        //     logger.error("Error writing to file1: " + e.getMessage());
        // }
        // System.out.println("Finished outputing to User CSV");

        // try (PrintStream out = new PrintStream(new FileOutputStream("postsRanked.csv"))) {
        //     for (MyPair<String, Double> item : backlinksResult) {
        //         if (item.getLeft().charAt(0) == 'p') {
        //             out.println(item.getLeft().substring(1, item.getLeft().length()) + "," + item.getRight());
        //         }
        //     }
        // } catch (Exception e) {
        //     logger.error("Error writing to file1: " + e.getMessage());
        // }
        // System.out.println("Finished outputing to Post CSV");

        // try (PrintStream out = new PrintStream(new FileOutputStream("hashtagsRanked.csv"))) {
        //     for (MyPair<String, Double> item : backlinksResult) {
        //         if (item.getLeft().charAt(0) == 'h') {
        //             out.println(item.getLeft().substring(1, item.getLeft().length()) + "," + item.getRight());
        //         }
        //     }
        // } catch (Exception e) {
        //     logger.error("Error writing to file1: " + e.getMessage());
        // }
        // System.out.println("Finished outputing to Hashtag CSV");
        

    }

}

