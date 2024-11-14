package imdbindexer;

import org.apache.spark.sql.Row;
import tech.amikos.chromadb.Client;
import tech.amikos.chromadb.Collection;
import imdbindexer.config.Config;
import java.util.*;

/**
 * TODO: Populate the ChromaDB with the IMDB data.
 * Before this step, make sure that the backend server has been set up (https://docs.trychroma.com/getting-started).
 * Folder Name: chroma_db (create under the root directory)
 */
public class ChromaDBSetup {
    public static void writeDataToChromaDB(Iterator<Row> partition, String collectionName) {
        try {
            // Initializing the ChromaDB client
            // Client client = new Client("http://localhost:" + Config.CHROMA_CLIENT_PORT);
            Client client = new Client("http://172.31.48.151:" + Config.CHROMA_CLIENT_PORT);

            // Creating the collection
            Map<String, String> metadata = new HashMap<>();
            metadata.put("embedding_function", "ResNet-18");
            Collection collection = client.createCollection(collectionName, metadata, true, null);

            // Add RDD data to collection
            // Embeddings: type - List<List<Float>>
            // Documents: type - List<String> (should contain JSON string with image path and actor's ID)
            // Ids: type - List<String>

            List<List<Float>> embeddingsList = new ArrayList<>();
            List<String> documentsList = new ArrayList<>();
            List<String> idsList = new ArrayList<>();

            /* TODO: Iterate over the partitions to populate embeddingsList, documentsList, and idsList */
            while (partition.hasNext()) {
                Row row = partition.next();

                // Process Embeddings
                List<Float> embedding = new ArrayList<>();
                
                String embeddingStr = row.getAs("embedding");
                String[] parts = embeddingStr.substring(1, embeddingStr.length() - 1).split(", ");
                for (String part : parts) {
                    embedding.add(Float.parseFloat(part));
                }
                embeddingsList.add(embedding);
                // Process Documents
                String path = row.getAs("path");
                String id = row.getAs("nconst");
                documentsList.add("{\"path\":\"" + path + "\",\"id\":\"" + id + "\"}");

                // Process Ids
                idsList.add(id);
            }
            collection.add(embeddingsList, null, documentsList, idsList);
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}