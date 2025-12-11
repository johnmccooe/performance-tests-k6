pipeline {
    // Pipeline runs on the main Jenkins node
    agent any 

    environment {
        K6_SCRIPT = 'basic_load_test.js'
        // NOTE: Replace with your actual InfluxDB host/port when you set that up
        INFLUXDB_HOST = 'http://your-influxdb-host:8086' 
    }

    stages {
        stage('Checkout Code') {
            steps {
                checkout scm 
            }
        }
        
        stage('Run Load Test (Protocol Level)') {
            // CRUCIAL: Defines the k6 Docker container as the agent for this stage
            agent {
                docker {
                    image 'grafana/k6:latest'
                    // -u 0:0 is the user flag to ensure the k6 container runs as root,
                    // inheriting the host's socket access and bypassing permissions.
                    args '-u 0:0 -v $PWD:$PWD -w $PWD' 
                }
            }
            steps {
                echo "Running k6 test: ${env.K6_SCRIPT}"
                // The shell command runs inside the k6 container
                sh "k6 run ${env.K6_SCRIPT} --out influxdb=${env.INFLUXDB_HOST}" 
            }
        }
        
        stage('Enforce Performance Thresholds') {
            steps {
                echo 'Thresholds checked. Pipeline success requires all k6 thresholds to pass.'
            }
        }
    }
}