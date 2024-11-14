package imdbindexer.config;

public class Config {
    public static final String CHROMA_CLIENT_PORT = "8000";
    public static final String CHROMA_DB_FOLDER_NAME = "chroma_db";
    public static final String CHROMA_DB_PATH = "chroma_db/";
    public static final String AWS_REGION = "us-east-1";
    public static final String CSV_FILE_PATH = "input/actor_embeddings.csv";
    public static final String S3_BUCKET_NAME = "imdb-embeddings";
    public static final String S3_BUCKET_NAME_USERS = "imdb-users-profile-pics";
    public static final String DYNAMO_TABLE_NAME = "imdb-data";
    public static final String CHROMA_DB_NAME = "imdb-photos";
    public static final String CHROMA_BUCKET_NAME = "imdb-chroma";
    public static final String SPARK_APP_NAME = "ImageIndexingApp";
}