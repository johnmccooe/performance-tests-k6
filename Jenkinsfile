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
                
                script {
                    // 1. ISOLATE AND COPY: Mounts the Jenkins workspace to a temporary /src directory 
                    // and copies all contents into a persistent Docker Volume named 'k6_data'.
                    // This bypasses the flaky direct host-to-container volume mount.
                    sh "docker run --rm -v ${WORKSPACE}:/src -v k6_data:/data busybox cp -r /src/. /data"
                    
                    // 2. EXECUTE: Mounts the reliable 'k6_data' volume directly into the k6 
                    // container's native working directory (/home/k6).
                    sh "docker run --rm -v k6_data:/home/k6 -w /home/k6 grafana/k6:latest run /home/k6/${env.K6_SCRIPT} --out influxdb=${env.INFLUXDB_HOST}"
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