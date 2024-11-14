package javaBackend.local;

import java.io.IOException;
import java.util.HashSet;
import java.util.LinkedList;
import java.util.List;
import java.util.Set;
import java.util.*;

import org.apache.livy.JobContext;
import org.apache.spark.api.java.JavaPairRDD;
import org.apache.spark.api.java.JavaRDD;

import javaBackend.Config.Config;
import javaBackend.local.FetchingData;
import javaBackend.local.MyPair;
import javaBackend.SparkJob;
import scala.Tuple2;

public class SocialRankJob extends SparkJob<List<MyPair<String, Double>>> {
    /**
     *
     */
    //private static final long serialVersionUID = 1L;

    private boolean useBacklinks;
    // Convergence condition variables
    protected double d_max; // largest change in a node's rank from iteration i to iteration i+1
    protected int i_max; // max number of iterations

    //private String source;

    int max_answers = 1000;

    public SocialRankJob(double d_max, int i_max, int answers, boolean useBacklinks, boolean debug) {
        super(true, true, debug);
        this.useBacklinks = useBacklinks;
        this.d_max = d_max;
        this.i_max = i_max;
        this.max_answers = answers;
    }

    /**
     * Fetch the social network from the S3 path, and create a (followed, follower)
     * edge graph
     *
     * @param filePath
     * @return JavaPairRDD: (followed: String, follower: String)
     */
    // protected JavaPairRDD<String, String> getSocialNetwork(String filePath) {
    //     JavaRDD<String> file = context.textFile(filePath, Config.PARTITIONS);

    //     JavaPairRDD<String, String> output = file.mapToPair(line -> {
    //         String[] separated = line.split("[ \\t]+");
    //         return new Tuple2<>(separated[0], separated[1]);
    //     });
    //     System.out.println("Reached here social path");

    //     return output.distinct();
        
    // }

    /**
     * Retrieves the sinks from the given network.
     *
     * @param network the input network represented as a JavaPairRDD
     * @return a JavaRDD containing the nodes with no outgoing edges (sinks)
     */
    protected JavaRDD<String> getSinks(JavaPairRDD<String, String> network) {
        JavaRDD<String> allNodes = network.keys().distinct().union(network.values()).distinct();

        JavaRDD<String> outgoingEdgesNodes = network.keys().distinct();

        System.out.println("Reached here get sinks");

        return allNodes.subtract(outgoingEdgesNodes);
        
    }

    /**
     * Main functionality in the program: read and process the social network
     * Runs the SocialRankJob and returns a list of the top 10 nodes with the highest SocialRank values.
     *
     * @param debug a boolean indicating whether to enable debug mode
     * @return a list of MyPair objects representing the top 10 nodes with their corresponding SocialRank values
     * @throws IOException          if there is an error reading the social network file
     * @throws InterruptedException if the execution is interrupted
     */
    public List<MyPair<String, Double>> run(boolean debug) throws IOException, InterruptedException {
        System.out.println("Running");

        FetchingData fetchData = new FetchingData();
        // Load the social network, aka. the edges (followed, follower)
        fetchData.initialize();
        JavaPairRDD<String, String> edgeRDD = fetchData.getSocialNetwork();
        if (edgeRDD == null) {
            System.out.println("THIS IS NULL WTF");
        }
        System.out.println("=============================" + edgeRDD.toString() + "========================================");
    
        // Find the sinks in edgeRDD as PairRDD
        JavaRDD<String> sinks = getSinks(edgeRDD);
        System.out.println("There are " + sinks.count() + " sinks");

        List<String> sinkList = sinks.collect();
        HashSet<String> sinkSet = new HashSet<>(sinkList);
        
        //backlink edges
        JavaPairRDD<String, String> backlinkEdges = edgeRDD
            .filter(line -> sinkSet.contains(line._2()))
            .mapToPair(line -> new Tuple2<>(line._2(), line._1()))
            .distinct(); 

        //adding backlinks
        JavaPairRDD<String, String> network = edgeRDD.union(backlinkEdges);
        
        System.out.println("Added " + backlinkEdges.count() + " backlinks");

        JavaPairRDD<String, Tuple2<String,String>> firstIterRDD = network.mapToPair(line->{
            String from = line._1;
            String to = line._2;
            String edgeType = "";
            char nodeFrom = from.charAt(0);
            char nodeTo = to.charAt(0);
            if (nodeFrom == 'h') {
                edgeType = "normal";
            } else if (nodeFrom == 'p') {
                edgeType = "normal";
            } else {//source is node user
                if (nodeTo == 'h') {
                    edgeType = "hashEdge";
                } else if (nodeTo == 'p') {
                    edgeType = "postEdge";
                } else {//tgt is user node
                    edgeType = "userEdge";
                }
            } 
            return new Tuple2<>(from, new Tuple2<>(to, edgeType));

        });

        //ranks of each node
        JavaPairRDD<String, Double> ranks = network.keys().distinct().mapToPair(node -> new Tuple2<>(node, 1.0));

        //how many outgoing edges each node has (used for 2nd iter onwards)
        JavaPairRDD<String, Integer> outgoingEdgesCounts = network.mapValues(value -> 1).reduceByKey(Integer::sum);
        Map<String, Integer> nodeOutgoingEdges = new HashMap<>(outgoingEdgesCounts.collectAsMap());

        JavaPairRDD<Tuple2<String, String>, Integer> outgoingedgesUserNodes = firstIterRDD.flatMapToPair(line->{
            String node = line._1;
            String edgeType = line._2._2(); 
            if (node.charAt(0) == 'u') {
                return Collections.singletonList(new Tuple2<>(new Tuple2<>(node, edgeType), 1)).iterator();
            } else {
                return Collections.<Tuple2<Tuple2<String, String>, Integer>>emptyList().iterator();
            }
            
        }).reduceByKey(Integer::sum);
        Map<Tuple2<String, String>, Integer> nodeOutgoingEdgesFirstIter = new HashMap<>(outgoingedgesUserNodes.collectAsMap());

        double decayFactor = 0.85;
        boolean converged = false;
        int iteration = 0;
        Map<String, Double> oldValues = ranks.collectAsMap();
        Map<String, Double> newValues = ranks.collectAsMap();

        while (!converged && iteration < i_max) {
            oldValues = newValues;

            if (iteration == 0) {
                JavaPairRDD<String, Double> newRanks = firstIterRDD
                .join(ranks)
                .flatMapToPair(tuple -> {
                    String node = tuple._1; // Node is the key of the pair: from
                    Tuple2<Tuple2<String,String>, Double> joinedValues = tuple._2; // joinedValues :<to,edgeType>,rank
                    Tuple2<String, String> stuff = joinedValues._1();
                    Double rank = joinedValues._2(); // rank is the second element of joinedValues
                    String followed = stuff._1(); //node that is being pointed to
                    String edgeType = stuff._2();
                    
                    if (followed.length() > 0) {
                        if (node.charAt(0) == 'u') {
                            if (followed.charAt(0) == 'h') {
                                System.out.println("" + edgeType.equals("hashEdge"));
                                return Collections.singletonList(new Tuple2<>(followed, (double) decayFactor * 0.3 / nodeOutgoingEdgesFirstIter.getOrDefault(new Tuple2<>(node, edgeType), 1))).iterator();
                            } else if (followed.charAt(0) == 'p') {
                                System.out.println("" + edgeType.equals("postEdge"));
                                return Collections.singletonList(new Tuple2<>(followed, (double) decayFactor * 0.4 / nodeOutgoingEdgesFirstIter.getOrDefault(new Tuple2<>(node, edgeType), 1))).iterator();
                            } else {
                                System.out.println("" + edgeType.equals("userEdge"));
                                return Collections.singletonList(new Tuple2<>(followed, (double) decayFactor * 0.3 / nodeOutgoingEdgesFirstIter.getOrDefault(new Tuple2<>(node, edgeType), 1))).iterator();
                            }
                        } else {
                            return Collections.singletonList(new Tuple2<>(followed, (double) decayFactor * 1 / nodeOutgoingEdges.getOrDefault(node, 1))).iterator();
                        }
                    } else {
                        return Collections.<Tuple2<String, Double>>emptyList().iterator();
                    }
                })
                .reduceByKey(Double::sum)
                .mapValues(rank -> rank + 1 - decayFactor);

            
                ranks = newRanks;
                newValues = ranks.collectAsMap();
            } else {
                JavaPairRDD<String, Double> newRanks = network
                .join(ranks)
                .flatMapToPair(tuple -> {
                    String node = tuple._1; // Node is the key of the pair
                    Tuple2<String, Double> joinedValues = tuple._2; // joinedValues is the value of the pair, which is a tuple
                    String followed = joinedValues._1(); // follower is the first element of joinedValues
                    Double rank = joinedValues._2(); // rank is the second element of joinedValues
                    
                    if (followed.length() > 0) {
                        return Collections.singletonList(new Tuple2<>(followed, (double) decayFactor * rank / nodeOutgoingEdges.getOrDefault(node, 1))).iterator();
                    } else {
                        return Collections.<Tuple2<String, Double>>emptyList().iterator();
                    }
                })
                .reduceByKey(Double::sum)
                .mapValues(rank -> rank + 1 - decayFactor);

            
                ranks = newRanks;
                newValues = ranks.collectAsMap();
            }

            double max = 0.0;

            for (String entry : oldValues.keySet()) {
                if (oldValues.containsKey(entry) && newValues.containsKey(entry)) {
                    if (Math.abs(oldValues.get(entry) - newValues.get(entry)) >= max) {//max of the difference should be below d max
                        max = Math.abs(oldValues.get(entry) - newValues.get(entry));
                    }
                }
            }

            if (max < d_max) {
                converged = true;
            }
            
            iteration++;
        }

        
        JavaPairRDD<String, Double> joined = network.join(ranks).mapToPair(tuple -> new Tuple2<>(tuple._1(), tuple._2()._2())).distinct().sortByKey(true); //sorting by rank

        JavaPairRDD<Double, String> reversedPairRDD = joined.mapToPair(tuple -> new Tuple2<>(tuple._2(), tuple._1()));


        /**************
         * DO WE NEED TO TAKE MORE RESULTS HERE?
         */

        List<Tuple2<String, Double>> correctList = new ArrayList<>(10);
        correctList = reversedPairRDD.mapToPair(tuple -> new Tuple2<>(tuple._2(), tuple._1())).collect();
        List<MyPair<String, Double>> myPairList = new ArrayList<>(10);
        for (Tuple2<String, Double> entry : correctList) {
            myPairList.add(new MyPair<>(entry._1(), entry._2()));
        }
        
        if (debug == true) {
            for (MyPair<String, Double> node : myPairList) {
                if (node != null) {
                    String line = node.getLeft() + " " + node.getRight() + "\n";
                System.out.println(line); 
                }
                
            }
        }
        
        return myPairList; 

    }

    @Override
    public List<MyPair<String, Double>> call(JobContext arg0) throws Exception {
        initialize();
        return run(false);
    }

}
