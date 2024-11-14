package imdbindexer;

import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;
import software.amazon.awssdk.services.s3.model.S3Exception;

import imdbindexer.config.Config;

import java.io.File;

/**
 * Class used to upload chroma db files to S3
 */
public class ChromaDBToS3 {
    private static final S3Client s3 = S3Client.builder()
            .region(Region.US_EAST_1) // Replace YOUR_REGION_HERE with your actual region, e.g., Region.US_EAST_1
            .build();

    public static void uploadToS3(String s3Bucket) {
        // Upload the entire folder as a single object to S3
        String localFolderPath = Config.CHROMA_DB_FOLDER_NAME; // the folder name that contains the chroma db
        File folder = new File(localFolderPath);

        if (folder.isDirectory()) {
            // Specify the object key (path within S3 bucket)
            String key = Config.CHROMA_DB_PATH;

            // Upload each file in the directory to S3
            uploadFilesRecursively(s3Bucket, key, folder);
        } else {
            System.err.println("Specified path is not a directory.");
        }
    }

    private static void uploadFilesRecursively(String bucketName, String prefix, File directory) {
        File[] files = directory.listFiles();

        if (files != null) {
            for (File file : files) {
                if (file.isDirectory()) {
                    // Recursively upload files in subdirectories
                    String subdirectoryPrefix = prefix + file.getName() + "/";
                    uploadFilesRecursively(bucketName, subdirectoryPrefix, file);
                } else {
                    // Upload each file to S3
                    String objectKey = prefix + file.getName();
                    try {
                        s3.putObject(PutObjectRequest.builder()
                                .bucket(bucketName)
                                .key(objectKey)
                                .build(), file.toPath());
                    } catch (S3Exception e) {
                        // Handle the S3 exception, log it and propagate it
                        System.err.println("Error uploading to S3: " + e.getMessage());
                        throw e;
                    }
                }
            }
        }
    }
}