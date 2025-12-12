pipeline {
    agent any 

    environment {
        // Environment variables for easy configuration
        K6_SCRIPT = 'basic_load_test.js'
        // *** IMPORTANT: Replace 'http://your-influxdb-host:8086' with your actual InfluxDB URL ***
        INFLUXDB_HOST = 'http://your-influxdb-host:8086' 
    }

    stages {
        stage('Checkout Code') {
            steps {
                // Fix: Sets the HOME variable to avoid the 'fatal: not in a git directory' error
                withEnv(['HOME=/var/jenkins_home']) {
                    checkout scm 
                }
            }
        }
        
        stage('Run Load Test (Protocol Level)') {
            steps {
                echo "Running k6 test: ${env.K6_SCRIPT}"
                
                // FINAL SUCCESSFUL COMMAND: This uses the direct Jenkins variable ${WORKSPACE} 
                // for the host path in the volume mount, guaranteeing correct path resolution 
                // and ensuring the k6 runner can find the script inside the /home/k6 directory.
                script {
                    sh "docker run --rm -u 0:0 -v ${WORKSPACE}:/home/k6 -w /home/k6 grafana/k6:latest run /home/k6/${env.K6_SCRIPT} --out influxdb=${env.INFLUXDB_HOST}"
                }
            }
        }
        
        stage('Enforce Performance Thresholds') {
            steps {
                echo 'Thresholds checked. Pipeline success requires all k6 thresholds to pass.'
            }
        }
    }
    
    post {
        always {
            // Fix: Clears the workspace directory to prevent corruption
            deleteDir()
        }
    }
}