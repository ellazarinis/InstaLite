package imdbindexer;

import org.apache.spark.api.java.JavaRDD;
import org.apache.spark.SparkConf;
import org.apache.spark.api.java.JavaSparkContext;
import org.apache.spark.sql.Dataset;
import org.apache.spark.sql.Row;
import org.apache.spark.sql.SparkSession;
import org.apache.spark.sql.types.DataTypes;
import org.apache.spark.sql.types.StructType;
import imdbindexer.config.Config;

public class Indexer {
    public static void main(String[] args) {
        // Setting up the Spark configuration
        SparkConf sparkConf = new SparkConf()
                .setAppName(Config.SPARK_APP_NAME)
                .setMaster("local[*]"); // Set the master URL, "local[*]" for local mode

        // Using the Spark configuration to read in the CSV and initialize DBs
        try (JavaSparkContext sparkContext = new JavaSparkContext(sparkConf)) {
            // Creating the SparkSession
            SparkSession sparkSession = SparkSession.builder().appName(Config.SPARK_APP_NAME).getOrCreate();

            // Instantiate CSVReader
            CSVReader csvReader = new CSVReader();
            // Specify the path to your large CSV file
            String csvFilePath = Config.CSV_FILE_PATH;
            // Read CSV file into Spark DataFrame
            Dataset<Row> csvDataFrame = csvReader.readCSVFileIntoDataFrame(sparkSession, csvFilePath);
            // Convert DataFrame to RDD
            JavaRDD<Row> initialRDD = csvDataFrame.javaRDD();

            // Setting up the S3 buckets to store embeddings
            // Update and persist the RDD with S3 paths
            final String bucketName = Config.S3_BUCKET_NAME; /* Make sure that you have an S3 bucket defined with this name!! */
            JavaRDD<Row> updatedEmbeddingsRDD = initialRDD.mapPartitions(partition ->
                    S3Setup.processAndUploadToS3(partition, bucketName)
            );

            // Redefine schema with new S3 paths and add to dataset
            StructType schema = new StructType()
                    .add("nconst", DataTypes.StringType, false)
                    .add("primaryName", DataTypes.StringType, true)
                    .add("path", DataTypes.StringType, false)
                    .add("embedding", DataTypes.StringType, false)
                    .add("embeddingPath", DataTypes.StringType, false);
            Dataset<Row> embeddingsDF = sparkSession.createDataFrame(updatedEmbeddingsRDD, schema);

            // Create RDD from dataset
            JavaRDD<Row> finalRDD = embeddingsDF.javaRDD();

            // Setting up the ChromaDB
            // Use RDD to populate ChromaDB
            final String collectionName = Config.CHROMA_DB_NAME;
            finalRDD.foreachPartition(partition ->
                    ChromaDBSetup.writeDataToChromaDB(partition, collectionName));

            // Replicating the ChromaDB to S3 for persistence in the cloud :)
            final String chromaBucketName = Config.CHROMA_BUCKET_NAME;
            ChromaDBToS3.uploadToS3(chromaBucketName);
        }
    }
}