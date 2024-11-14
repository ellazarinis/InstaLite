package imdbindexer;

import org.apache.spark.sql.Dataset;
import org.apache.spark.sql.Row;
import org.apache.spark.sql.SparkSession;

/**
 * Uses a Spark Session to read in the CSV file.
 * Retains the header of the file, and uses it as the column values of the RDD
 */
public class CSVReader {
    public Dataset<Row> readCSVFileIntoDataFrame(SparkSession sparkSession, String filePath) {
        return sparkSession.read()
                .option("header", "true")
                .csv(filePath);
    }
}