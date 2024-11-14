package javaBackend;

import org.quartz.*;
import org.quartz.impl.StdSchedulerFactory;

import static org.quartz.JobBuilder.*;
import static org.quartz.TriggerBuilder.*;
import static org.quartz.SimpleScheduleBuilder.*;

import javaBackend.local.ComputeRanksLivy;

public class SchedulerSetup {

    public static void scheduleJob() throws SchedulerException {
        JobDetail job = newJob(ComputeRanksLivyJob.class)
          .withIdentity("computeRanksJob", "group1")
          .build();

        // Trigger to run every hour
        Trigger trigger = newTrigger()
          .withIdentity("trigger1", "group1")
          .startNow()
          .withSchedule(simpleSchedule()
            .withIntervalInHours(1)
            .repeatForever())
          .build();

        Scheduler scheduler = new StdSchedulerFactory().getScheduler();
        scheduler.start();
        scheduler.scheduleJob(job, trigger);
    }

    public static class ComputeRanksLivyJob implements Job {
        public void execute(JobExecutionContext context) {
            String[] args = new String[]{"30", "25", "false"};
            try {
                ComputeRanksLivy.main(args);
            } catch (Exception e) {
                e.printStackTrace();
            }
        }
    }

    public static void main(String[] args) throws SchedulerException {
        scheduleJob();
    }
}
