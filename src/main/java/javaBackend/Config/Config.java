package javaBackend.Config;

/**
 * Global configuration for NETS 2120 homeworks.
 *
 * @author zives
 */
public class Config {

    // For test drivers
    public static void setSocialPath(String path) {
        SOCIAL_NET_PATH = path;
    }

    /**
     * The path to the space-delimited social network data
     */
    public static String SOCIAL_NET_PATH = "s3a://penn-cis545-files/movie_friends.txt";
    //public static String SOCIAL_NET_PATH = "/nets2120/hw3-ms2-ellaz/src/main/java/edu/upenn/cis/nets2120/hw3/simple-example.txt";

    public static String LOCAL_SPARK = "local[*]";

    public static String JAR = "target/nets2120-project-kala-1.0-SNAPSHOT.jar";

    // these will be set via environment variables
    public static String ACCESS_KEY_ID = System.getenv("AWS_ACCESS_KEY_ID");
    public static String SECRET_ACCESS_KEY = System.getenv("AWS_SECRET_ACCESS_KEY");
    public static String SESSION_TOKEN = System.getenv("AUTH_TOKEN");
    // public static String DATABASE_CONNECTION = "jdbc:mysql://localhost/instalite";

    public static String DATABASE_CONNECTION = "jdbc:mysql://172.31.48.151:3306/instalite";
    public static String DATABASE_USERNAME = System.getenv("RDS_USER");
    public static String DATABASE_PASSWORD = System.getenv("RDS_PWD");
    /**
     * How many RDD partitions to use?
     */
    public static int PARTITIONS = 5;
}
