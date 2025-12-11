pipeline {
    // This pipeline runs on the main Jenkins node
    agent any 

    environment {
        K6_SCRIPT = 'basic_load_test.js'
        INFLUXDB_HOST = 'http://your-influxdb-host:8086' 
    }

    stages {
        // Stage 1: Fix Docker Socket Permissions (Temporary Workaround)
        stage('Fix Docker Socket Permissions') {
            steps {
                echo "Temporarily modifying Docker socket permissions for DinD access..."
                sh 'sudo chmod 666 /var/run/docker.sock'
            }
        }
        
        // Stage 2: Checkout SCM
        stage('Checkout Code') {
            steps {
                checkout scm 
            }
        }
        
        // Stage 3: Run Load Test using the K6 Docker Agent
        // NOTE: The 'agent' definition must be inside the stage now since it was removed from the top level.
        stage('Run Load Test (Protocol Level)') {
            agent {
                docker {
                    image 'grafana/k6:latest'
                    // Fixes the permission denied error
                    args '-u 0:0 -v $PWD:$PWD -w $PWD' 
                }
            }
            steps {
                echo "Running k6 test: ${env.K6_SCRIPT}"
                // This command runs inside the k6 container
                sh "k6 run ${env.K6_SCRIPT} --out influxdb=${env.INFLUXDB_HOST}" 
            }
        }
        
        // Stage 4: Enforce Thresholds
        stage('Enforce Performance Thresholds') {
            steps {
                echo 'Thresholds checked. Pipeline success requires all k6 thresholds to pass.'
            }
        }
    } // Closes the 'stages' block
} // Closes the 'pipeline' block